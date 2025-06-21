const SUPABASE_URL = "https://ymfmlqzwnzmtuvuhavbt.supabase.co"; // SUBSTITUA PELA SUA PROJECT URL DO SUPABASE
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZm1scXp3bnptdHV2dWhhdmJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTM4ODksImV4cCI6MjA2NTQ2OTg4OX0.eimoL0JlSCxHAnrfl5WwwiOnvJznBxh-FFQYl7NSKFk";

// --- Inicialização do Supabase Client ---
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

let petsArray = []; // Vai armazenar os pets carregados do Supabase
let localUsuarioAtual = null; // Objeto do usuário Supabase
const RAIO_FILTRO_KM = 100; // Constante para filtro de raio (se usar no futuro)
let currentPetId = null; // Variável global para armazenar o ID do pet do chat ativo
let userMarker = null;
let userLocationCoords = { lat: -25.4284, lng: -49.2733 }

// --- Elementos do DOM ---
const cadastroBtn = document.getElementById("cadastroPetBtn");
const modalCadastro = document.getElementById("modalCadastro");
const fecharCadastro = document.getElementById("fecharModal");
const loginBtn = document.getElementById("loginBtn");
const modalLogin = document.getElementById("modalLogin");
const fecharLogin = document.getElementById("fecharLogin");
const loginForm = document.getElementById("loginForm");
const emailLogin = document.getElementById("emailLogin");
const senhaLogin = document.getElementById("senhaLogin");
const cadastroClienteBtn = document.getElementById("cadastroClienteBtn");
const modalCadastroCliente = document.getElementById("modalCadastroCliente");
const fecharCadastroCliente = document.getElementById("fecharCadastroCliente");
const cadastroClienteForm = document.getElementById("cadastroClienteForm");
const emailCliente = document.getElementById("emailCliente");
const senhaCliente = document.getElementById("senhaCliente");
const confirmaSenhaCliente = document.getElementById("confirmaSenhaCliente");
const logoutBtn = document.getElementById("logoutBtn");
const usuarioLogadoDisplay = document.getElementById("usuarioLogadoDisplay");

// --- Elementos do formulário de cadastro de pet ---
const petForm = document.getElementById("petForm");
const petNome = document.getElementById("nome");
const petEspecie = document.getElementById("especie");
const petIdade = document.getElementById("idade");
const petDescricao = document.getElementById("descricao");
const petFotoInput = document.getElementById("petFoto");
const petCEP = document.getElementById("cep"); // Campo CEP
const enderecoAutomaticoDiv = document.getElementById("enderecoAutomatico"); // Div para exibir o endereço automático
const petNumero = document.getElementById("numero"); // Campo Número (novo)

let enderecoCompletoViaCEP = null; // Variável para armazenar o endereço completo do ViaCEP

// --- Elementos do Chat ---
const modalChat = document.getElementById("modalChat");
const fecharChat = document.getElementById("fecharChat");
const chatPetNome = document.getElementById("chatPetNome");
const chatMessages = document.getElementById("chatMessages");
const chatMessageInput = document.getElementById("chatMessageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const verConversasBtn = document.getElementById("verConversasBtn");
const modalHistorico = document.getElementById("modalHistorico");
const fecharHistorico = document.getElementById("fecharHistorico");
const historicoMensagensContainer = document.getElementById("historicoMensagensContainer");


// --- Mapa ---
const map = L.map('map').setView([-25.4284, -49.2733], 12); // Curitiba, PR
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
let markers = []; // Array para armazenar os marcadores do mapa

// --- Funções de Modal ---
cadastroBtn.addEventListener("click", () => {
    modalCadastro.classList.remove("hidden");
    modalCadastro.classList.add("active");
});

fecharCadastro.addEventListener("click", () => {
    modalCadastro.classList.remove("active");
    modalCadastro.classList.add("hidden");
    petForm.reset(); // Limpa o formulário ao fechar
    enderecoAutomaticoDiv.innerHTML = '<p style="margin: 0;">Aguardando CEP...</p>'; // Reseta a mensagem do endereço
    enderecoCompletoViaCEP = null; // Limpa a variável
});

loginBtn.addEventListener("click", () => {
    modalLogin.classList.remove("hidden");
    modalLogin.classList.add("active");
});

fecharLogin.addEventListener("click", () => {
    modalLogin.classList.remove("active");
    modalLogin.classList.add("hidden");
    loginForm.reset();
});

cadastroClienteBtn.addEventListener("click", () => {
    modalCadastroCliente.classList.remove("hidden");
    modalCadastroCliente.classList.add("active");
});

fecharCadastroCliente.addEventListener("click", () => {
    modalCadastroCliente.classList.remove("active");
    modalCadastroCliente.classList.add("hidden");
    cadastroClienteForm.reset();
});

// --- Funções de Autenticação ---
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailLogin.value;
    const senha = senhaLogin.value;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: senha,
    });

    if (error) {
        alert("Erro no login: " + error.message);
        console.error("Erro no login:", error.message);
    } else {
        alert("Login realizado com sucesso!");
        modalLogin.classList.remove("active");
        modalLogin.classList.add("hidden");
        loginForm.reset();
        await verificarLogin(); // Atualiza a UI após o login
    }
});

cadastroClienteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailCliente.value;
    const senha = senhaCliente.value;
    const confirmaSenha = confirmaSenhaCliente.value;

    if (senha !== confirmaSenha) {
        alert("As senhas não coincidem!");
        return;
    }

    const { error } = await supabaseClient.auth.signUp({
        email: email,
        password: senha,
    });

    if (error) {
        alert("Erro no cadastro: " + error.message);
        console.error("Erro no cadastro:", error.message);
    } else {
        alert("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.");
        modalCadastroCliente.classList.remove("active");
        modalCadastroCliente.classList.add("hidden");
        cadastroClienteForm.reset();
    }
});

logoutBtn.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        alert("Erro ao sair: " + error.message);
        console.error("Erro ao sair:", error.message);
    } else {
        alert("Deslogado com sucesso!");
        await verificarLogin(); // Atualiza a UI após o logout
    }
});

// Verifica o estado de login e atualiza a UI
async function verificarLogin() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    localUsuarioAtual = user;

    let isAdmin = false;
    // Substitua 'SEU_EMAIL_ADMIN@EXEMPLO.COM' pelo seu email de administrador real
    if (user && user.email === "SEU_EMAIL_ADMIN@EXEMPLO.COM") { // <--- ALERTA: MUDAR ESTE EMAIL!
        isAdmin = true;
        localStorage.setItem("logadoAdmin", "true");
    } else {
        localStorage.removeItem("logadoAdmin");
    }

    if (user) {
        document.getElementById("cadastroClienteBtn").style.display = "none";
        document.getElementById("loginBtn").style.display = "none";
        document.getElementById("logoutBtn").style.display = "block";
        document.getElementById("verConversasBtn").style.display = "block"; // Mostrar botão de conversas

        usuarioLogadoDisplay.textContent = `Olá, ${user.email.split('@')[0]}${isAdmin ? ' (Admin)' : ''}!`;
        usuarioLogadoDisplay.style.display = "block";

        // Tornar o botão de cadastro de pet visível para qualquer usuário logado
        cadastroBtn.style.display = "block";

        // Obter a localização do usuário e centralizar o mapa
        obterLocalizacaoUsuario();
    } else {
        document.getElementById("cadastroClienteBtn").style.display = "block";
        document.getElementById("loginBtn").style.display = "block";
        document.getElementById("logoutBtn").style.display = "none";
        document.getElementById("verConversasBtn").style.display = "none";
        usuarioLogadoDisplay.style.display = "none";
        cadastroBtn.style.display = "none"; // Esconde o botão se ninguém estiver logado
    }

    renderizarPets();
}

// Função para obter a localização do usuário e centralizar o mapa
function obterLocalizacaoUsuario() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                // ATUALIZA A LOCALIZAÇÃO DO USUÁRIO
                userLocationCoords = { lat: latitude, lng: longitude };

                const userIcon = L.icon({
                    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });

                map.setView([latitude, longitude], 13);

                if (userMarker) {
                    userMarker.remove();
                }

                userMarker = L.marker([latitude, longitude], { icon: userIcon }).addTo(map)
                    .bindPopup("Você está aqui!")
                    .openPopup();

                // Após obter a localização, renderize os pets (agora com filtro)
                renderizarPets();
            },
            function(error) {
                console.error("Erro ao obter a localização:", error);
                alert("Não foi possível obter sua localização. O mapa será centralizado em Curitiba.");
                // Mantém a localização padrão de Curitiba em userLocationCoords
                map.setView([-25.4284, -49.2733], 12);
                L.marker([-25.4284, -49.2733]).addTo(map).bindPopup("Curitiba (Localização padrão)").openPopup();
                // Renderiza os pets mesmo sem a localização do usuário (eles não serão filtrados por raio)
                renderizarPets();
            }
        );
    } else {
        console.error("Geolocalização não suportada neste navegador.");
        alert("Geolocalização não suportada. O mapa será centralizado em Curitiba.");
        // Mantém a localização padrão de Curitiba em userLocationCoords
        map.setView([-25.4284, -49.2733], 12);
        L.marker([-25.4284, -49.2733]).addTo(map).bindPopup("Curitiba (Localização padrão)").openPopup();
        // Renderiza os pets mesmo sem a localização do usuário (eles não serão filtrados por raio)
        renderizarPets();
    }
}

// --- Funções de Pets ---
petForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = petNome.value;
    const especie = petEspecie.value;
    const idade = parseInt(petIdade.value);
    const descricao = petDescricao.value;
    const cep = petCEP.value;
    const numero = petNumero.value; // NOVO: Captura o número

    if (!localUsuarioAtual) {
        alert("Você precisa estar logado para cadastrar um pet.");
        return;
    }

    if (!enderecoCompletoViaCEP) {
        alert("Por favor, digite um CEP válido e aguarde o preenchimento automático do endereço.");
        return;
    }

    // Combine o endereço do ViaCEP com o número para a geocodificação
    const enderecoParaGeocodificacao = `${enderecoCompletoViaCEP}, ${numero}`;
    const fotoFile = petFotoInput.files[0];

    const { lat, lng } = await obterCoordenadasDaLocalizacao(enderecoParaGeocodificacao);

    if (!lat || !lng) {
        alert("Não foi possível obter as coordenadas para o endereço fornecido. Por favor, tente novamente com um endereço mais preciso.");
        return;
    }

    // Upload da imagem para o Supabase Storage
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !userData?.user) {
        alert("Você precisa estar logado para enviar a foto.");
        console.error("Erro ao obter usuário:", userError);
        return;
    }

    const userId = userData.user.id;

    // Garante que o diretório é específico do usuário para evitar colisões
    const filePath = `${userId}/${Date.now()}-${fotoFile.name}`;

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('pet-fotos')
        .upload(filePath, fotoFile, {
            cacheControl: '3600',
            upsert: false,
        });

    let fotoUrl = null;
    if (uploadError) {
        console.error("Erro ao fazer upload da foto:", uploadError.message);
        alert("Erro ao fazer upload da foto do pet. " + uploadError.message);
        return;
    } else {
        // Obter a URL pública da imagem
        const { data: publicUrlData } = supabaseClient.storage
            .from('pet-fotos')
            .getPublicUrl(uploadData.path);
        fotoUrl = publicUrlData.publicUrl;
    }

    // Inserir os dados do pet no Supabase
    const { data: petInsertData, error: petInsertError } = await supabaseClient
        .from('pets')
        .insert([
            {
                nome: nome,
                especie: especie,
                idade: idade,
                descricao: descricao,
                localizacao: enderecoParaGeocodificacao, // Armazena o endereço completo
                latitude: lat,
                longitude: lng,
                foto_url: fotoUrl,
                dono_email: localUsuarioAtual.email // Adiciona o email do dono
            }
        ]);

    if (petInsertError) { // Variável 'error' agora é 'petInsertError'
        alert("Erro ao cadastrar pet: " + petInsertError.message);
        console.error("Erro ao cadastrar pet:", petInsertError.message);
    } else {
        alert("Pet cadastrado com sucesso!");
        petForm.reset();
        modalCadastro.classList.remove("active");
        modalCadastro.classList.add("hidden");
        enderecoAutomaticoDiv.innerHTML = '<p style="margin: 0;">Aguardando CEP...</p>'; // Reseta a mensagem do endereço
        enderecoCompletoViaCEP = null; // Limpa a variável
        renderizarPets(); // Atualiza a lista e o mapa
    }
});


// Event listener para o campo CEP
petCEP.addEventListener('blur', async () => {
    const cep = petCEP.value.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (cep.length === 8) { // Verifica se tem 8 dígitos
        await buscarEnderecoPorCEP(cep);
    } else {
        enderecoAutomaticoDiv.innerHTML = '<p style="margin: 0; color: red;">CEP inválido.</p>';
        enderecoCompletoViaCEP = null;
    }
});

// Opcional: formata o CEP enquanto digita
petCEP.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (value.length > 5) {
        value = value.substring(0, 5) + '-' + value.substring(5, 8);
    }
    e.target.value = value;
});

async function buscarEnderecoPorCEP(cep) {
    enderecoAutomaticoDiv.innerHTML = '<p style="margin: 0;">Buscando endereço...</p>';
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            enderecoAutomaticoDiv.innerHTML = '<p style="margin: 0; color: red;">CEP não encontrado.</p>';
            enderecoCompletoViaCEP = null;
        } else {
            const rua = data.logradouro || '';
            const bairro = data.bairro || '';
            const cidade = data.localidade || '';
            const estado = data.uf || '';

            const enderecoFormatado = `${rua}, ${bairro}, ${cidade} - ${estado}`;
            enderecoAutomaticoDiv.innerHTML = `<p style="margin: 0;">${enderecoFormatado}</p>`;
            enderecoCompletoViaCEP = enderecoFormatado; // Armazena para uso posterior
        }
    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        enderecoAutomaticoDiv.innerHTML = '<p style="margin: 0; color: red;">Erro ao buscar CEP. Tente novamente.</p>';
        enderecoCompletoViaCEP = null;
    }
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em quilômetros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c; // Distância em km
    return distancia;
}

async function renderizarPets() {
    const petsListContainer = document.getElementById("listaPetsContainer");
    if (!petsListContainer) {
        console.error("Elemento 'listaPetsContainer' não encontrado.");
        return;
    }
    petsListContainer.innerHTML = '';

    console.log("Tentando carregar pets do Supabase...");
    const { data: pets, error } = await supabaseClient.from("pets").select("*");
    console.log("Resposta da consulta de pets:", { data: pets, error });

    if (error) {
        console.error("ERRO DETALHADO AO CARREGAR PETS:", error.message, error.details, error.hint, error.code, error);
        petsListContainer.innerHTML = "<p>Erro ao carregar pets.</p>";
        return;
    }

    // --- Lógica de Filtro por Raio ---
    let petsFiltrados = [];
    if (userLocationCoords && userLocationCoords.lat && userLocationCoords.lng) {
        petsFiltrados = pets.filter(pet => {
            if (pet.latitude && pet.longitude) {
                const distancia = calcularDistancia(
                    userLocationCoords.lat,
                    userLocationCoords.lng,
                    pet.latitude,
                    pet.longitude
                );
                return distancia <= RAIO_FILTRO_KM;
            }
            return false; // Se o pet não tiver lat/lng, não o inclua no filtro
        });
        console.log(`Pets filtrados em ${RAIO_FILTRO_KM}km:`, petsFiltrados.length);
    } else {
        // Se a localização do usuário não estiver disponível, exibe todos os pets ou uma mensagem
        console.log("Localização do usuário não disponível para filtro de raio. Exibindo todos os pets.");
        petsFiltrados = pets; // Ou você pode decidir não mostrar nenhum se não houver localização
    }
    // --- Fim da Lógica de Filtro por Raio ---

    // CORREÇÃO AQUI: Garante que petsArray sempre tenha os pets filtrados
    petsArray = petsFiltrados; 

    if (petsFiltrados.length === 0) {
        petsListContainer.innerHTML = '<p>Nenhum pet disponível para adoção dentro de 100km da sua localização ou nenhum pet cadastrado ainda.</p>';
    } else {
        petsFiltrados.forEach(pet => { // Itera sobre petsFiltrados
            const petCard = document.createElement('div');
            petCard.classList.add('pet-card');

            let buttonsHtml = `
                <button class="iniciar-chat-btn" data-pet-id="${pet.id}" ${localUsuarioAtual && localUsuarioAtual.email === pet.dono_email ? 'disabled' : ''}>${localUsuarioAtual && localUsuarioAtual.email === pet.dono_email ? 'É seu Pet' : 'Interessado?'}</button>
            `;

            if (localUsuarioAtual && localUsuarioAtual.email === pet.dono_email) {
                buttonsHtml += `<button class="delete-pet-btn" data-pet-id="${pet.id}">Excluir Pet</button>`;
            }

            petCard.innerHTML = `
                <img src="${pet.foto_url || 'placeholder.jpg'}" alt="${pet.nome}">
                <h4>${pet.nome}</h4>
                <p>Espécie: ${pet.especie}</p>
                <p>Idade: ${pet.idade} anos</p>
                <p>Localização: ${pet.localizacao}</p>
                <p>${pet.descricao}</p>
                <div class="pet-card-buttons">
                    ${buttonsHtml}
                </div>
            `;
            petsListContainer.appendChild(petCard);
        });
    }

    // Adicionar event listeners para os botões de chat (código existente...)
    document.querySelectorAll('.iniciar-chat-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            if (!localUsuarioAtual) {
                alert("Você precisa estar logado para iniciar uma conversa.");
                modalLogin.classList.remove("hidden");
                modalLogin.classList.add("active");
                return;
            }
            currentPetId = event.target.dataset.petId;
            // Carregar mensagens existentes para este pet
            await carregarMensagens(currentPetId);
            // Certifica-se de encontrar o pet correto no petsArray atualizado
            const selectedPet = petsArray.find(p => p.id == currentPetId);
            chatPetNome.textContent = `Chat com ${selectedPet ? selectedPet.nome : 'Pet Desconhecido'}`;
            modalChat.classList.remove("hidden");
            modalChat.classList.add("active");
        });
    });

    // Adicionar event listeners para os botões de exclusão (código existente...)
    document.querySelectorAll('.delete-pet-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const petIdToDelete = event.target.dataset.petId;
            if (confirm("Tem certeza que deseja excluir este pet? Esta ação não pode ser desfeita.")) {
                await excluirPet(petIdToDelete);
            }
        });
    });

    // CORREÇÃO AQUI: Passa apenas os pets filtrados para renderizar no mapa
    renderizarPetsNoMapa(petsFiltrados);
}

// Renderiza pets no mapa
function renderizarPetsNoMapa(pets) {
    if (!map) {
        console.error("Mapa não inicializado. Não é possível adicionar marcadores");
        return;
    }

    // Remove marcadores antigos
    markers.forEach(marker => marker.remove());
    markers = [];

    pets.forEach(pet => {
        if (pet.latitude && pet.longitude) {
            const marker = L.marker([pet.latitude, pet.longitude]).addTo(map);
            marker.bindPopup(`<b>${pet.nome} (${pet.especie})</b><br>${pet.localizacao}`).openPopup();
            markers.push(marker);
        }
    });
}

// Simula a obtenção de coordenadas de uma localização (substitua por API de geocodificação real)
async function obterCoordenadasDaLocalizacao(localizacao) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(localizacao)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (error) {
        console.error("Erro ao obter coordenadas:", error);
    }
    // Retorna coordenadas padrão se a localização não for encontrada (ex: Curitiba)
    return { lat: -25.4284, lng: -49.2733 };
}

// --- Funções de Chat ---
fecharChat.addEventListener("click", () => {
    modalChat.classList.remove("active");
    modalChat.classList.add("hidden");
    chatMessages.innerHTML = ''; // Limpa as mensagens ao fechar
    chatMessageInput.value = ''; // Limpa o input
    currentPetId = null; // Reseta o ID do pet do chat
});

sendMessageBtn.addEventListener("click", enviarMensagem);
chatMessageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        enviarMensagem();
    }
});

async function enviarMensagem() {
    const conteudo = chatMessageInput.value.trim();
    if (!conteudo || !currentPetId || !localUsuarioAtual) return;

    // Encontre o pet para obter o email do dono
    const petSelecionado = petsArray.find(p => p.id === currentPetId);
    if (!petSelecionado) {
        alert("Erro: Pet não encontrado para enviar a mensagem.");
        return;
    }

    // O destinatário é o dono do pet. Se o usuário logado for o dono,
    // o destinatário será o remetente da *última* mensagem recebida,
    // ou seja, a pessoa interessada. Isso requer uma busca para achar o 'outro lado' da conversa.
    let destinatarioEmail = petSelecionado.dono_email;
    if (localUsuarioAtual.email === petSelecionado.dono_email) {
        // Se o dono está respondendo, o destinatário é o interessado.
        // Precisamos encontrar o interessado que enviou a última mensagem para este pet.
        const { data: ultimasMensagens, error: ultimasMensagensError } = await supabaseClient
            .from('mensagens_chat')
            .select('remetente_email')
            .eq('pet_id', currentPetId)
            .neq('remetente_email', localUsuarioAtual.email) // Não é o próprio dono
            .order('created_at', { ascending: false })
            .limit(1);

        if (ultimasMensagensError) {
            console.error("Erro ao buscar último remetente para resposta:", ultimasMensagensError);
            alert("Erro ao identificar destinatário da resposta.");
            return;
        }

        if (ultimasMensagens && ultimasMensagens.length > 0) {
            destinatarioEmail = ultimasMensagens[0].remetente_email;
        } else {
             // Caso não haja mensagens prévias de interessados, e o dono está iniciando
             // uma conversa com "alguém", ou seja, não tem um "destinatário" claro ainda.
             // Isso pode ser um problema de UX ou um caso de uso que precisa ser pensado.
             // Por enquanto, vamos assumir que ele está tentando responder a alguém.
             // Se este caso de 'destinatarioEmail' ficar nulo aqui for comum e problemático,
             // precisaríamos de outra forma de iniciar a conversa do lado do dono.
            console.warn("Dono tentando enviar mensagem sem um destinatário interessado prévio.");
            alert("Não foi possível identificar um destinatário para esta conversa. Tente iniciar a conversa como interessado primeiro.");
            return;
        }
    }


    const { error } = await supabaseClient
        .from('mensagens_chat')
        .insert({
            pet_id: currentPetId,
            remetente_email: localUsuarioAtual.email,
            destinatario_email: destinatarioEmail, // Adiciona o destinatário
            conteudo: conteudo
        });

    if (error) {
        alert("Erro ao enviar mensagem: " + error.message);
        console.error("Erro ao enviar mensagem:", error);
    } else {
        chatMessageInput.value = ''; // Limpa o input
        await carregarMensagens(currentPetId); // Recarrega as mensagens para mostrar a nova
    }
}

async function carregarMensagens(petId) {
    chatMessages.innerHTML = ''; // Limpa mensagens anteriores

    const { data: mensagens, error } = await supabaseClient
        .from('mensagens_chat')
        .select('*')
        .eq('pet_id', petId)
        .or(`remetente_email.eq.${localUsuarioAtual.email},destinatario_email.eq.${localUsuarioAtual.email}`) // Filtra mensagens onde sou remetente OU destinatário
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Erro ao carregar mensagens:", error.message);
        return;
    }

    if (mensagens.length === 0) {
        chatMessages.innerHTML = '<p class="info-message">Nenhuma mensagem ainda. Seja o primeiro a enviar!</p>';
    } else {
        mensagens.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message');
            // Verifica se a mensagem foi enviada pelo usuário logado
            if (msg.remetente_email === localUsuarioAtual.email) {
                messageDiv.classList.add('sent');
                // Se o remetente for o usuário logado, mostre "Você" e o destinatário
                const destinatarioNome = msg.destinatario_email ? msg.destinatario_email.split('@')[0] : 'Desconhecido';
                messageDiv.textContent = `Você para ${destinatarioNome}: ${msg.conteudo}`;
            } else {
                messageDiv.classList.add('received');
                // Se o remetente NÃO for o usuário logado, mostre o nome do remetente
                const remetenteNome = msg.remetente_email.split('@')[0];
                messageDiv.textContent = `${remetenteNome}: ${msg.conteudo}`;
            }
            chatMessages.appendChild(messageDiv);
        });
        // Rola para a última mensagem
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// --- Histórico de Conversas ---
verConversasBtn.addEventListener("click", async () => {
    if (!localUsuarioAtual) {
        alert("Você precisa estar logado para ver o histórico de conversas.");
        return;
    }

    try {
        const historicoMensagensContainer = document.getElementById("historicoMensagensContainer");
        historicoMensagensContainer.innerHTML = ''; // Limpa o histórico

        const usuarioLogadoEmail = localUsuarioAtual.email;
        const isAdmin = (usuarioLogadoEmail === "SEU_EMAIL_ADMIN@EXEMPLO.COM"); // Verificação de admin (ALERTA: MUDAR ESTE EMAIL!)

        // 1. Buscar pet_ids das mensagens onde o usuário logado é o remetente OU destinatário
        const { data: mensagensDoUsuario, error: mensagensError } = await supabaseClient
            .from('mensagens_chat')
            .select('pet_id, remetente_email, destinatario_email')
            .or(`remetente_email.eq.${usuarioLogadoEmail},destinatario_email.eq.${usuarioLogadoEmail}`);
            
        if (mensagensError) throw mensagensError;

        // Extrair IDs únicos dos pets envolvidos nas conversas do usuário logado
        const petIdsEnvolvidos = [...new Set(mensagensDoUsuario.map(msg => msg.pet_id))];

        let petsComConversas = [];
        if (petIdsEnvolvidos.length > 0) {
            const { data: petsFromMessages, error: petsFromMessagesError } = await supabaseClient
                .from('pets')
                .select('id, nome, dono_email')
                .in('id', petIdsEnvolvidos);
            if (petsFromMessagesError) throw petsFromMessagesError;
            petsComConversas = petsFromMessages;
        }

        const petsUnicos = petsComConversas; // Já são únicos pelo filtro acima

        if (petsUnicos.length === 0 && !isAdmin) {
            historicoMensagensContainer.innerHTML = '<p>Você não tem pets cadastrados nem conversas iniciadas.</p>';
        } else {
            for (const pet of petsUnicos) {
                // Obter todas as mensagens para este pet onde o usuário logado é remetente ou destinatário
                const { data: mensagensDoPet, error: mensagensDoPetError } = await supabaseClient
                    .from('mensagens_chat')
                    .select('*')
                    .eq('pet_id', pet.id)
                    .or(`remetente_email.eq.${usuarioLogadoEmail},destinatario_email.eq.${usuarioLogadoEmail}`)
                    .order('created_at', { ascending: true });

                if (mensagensDoPetError) throw mensagensDoPetError;

                const bloco = document.createElement("div");
                bloco.classList.add("historico-bloco");
                bloco.innerHTML = `<h3>Conversas sobre: ${pet.nome}</h3>`;

                if (mensagensDoPet.length > 0) {
                    const conversasAgrupadas = {};

                    mensagensDoPet.forEach(msg => {
                        let participanteChave;
                        // Se a mensagem foi enviada pelo usuário logado
                        if (msg.remetente_email === usuarioLogadoEmail) {
                            // A conversa é com o destinatário da mensagem
                            participanteChave = msg.destinatario_email;
                        } else {
                            // A mensagem foi recebida, então a conversa é com o remetente da mensagem
                            participanteChave = msg.remetente_email;
                        }
                        
                        // Agrupa mensagens pelo "outro lado" da conversa
                        if (!conversasAgrupadas[participanteChave]) {
                            conversasAgrupadas[participanteChave] = [];
                        }
                        conversasAgrupadas[participanteChave].push(msg);
                    });

                    // Renderiza cada grupo de conversa
                    for (const outroParticipanteEmail in conversasAgrupadas) {
                        const msgs = conversasAgrupadas[outroParticipanteEmail];
                        const subBloco = document.createElement("div");
                        subBloco.classList.add("conversa-individual");
                        
                        let tituloConversa = outroParticipanteEmail.split('@')[0];
                        if (pet.dono_email === outroParticipanteEmail) {
                             tituloConversa = `${outroParticipanteEmail.split('@')[0]} (Dono do Pet)`;
                        } else if (usuarioLogadoEmail === outroParticipanteEmail) {
                            // Este caso não deveria acontecer com a lógica acima, mas para segurança
                            tituloConversa = "Você (Erro na Agrupamento)"; 
                        } else {
                            tituloConversa = `${outroParticipanteEmail.split('@')[0]} (Interessado)`;
                        }

                        subBloco.innerHTML = `<h4>Conversa com: ${tituloConversa}</h4>`;
                        const lista = document.createElement("ul");
                        
                        msgs.forEach(msg => {
                            const linha = document.createElement("li");
                            const dataHora = new Date(msg.created_at).toLocaleString();
                            let remetenteDisplay = msg.remetente_email === usuarioLogadoEmail ? "Você" : msg.remetente_email.split('@')[0];
                            linha.innerHTML = `[${dataHora}] <strong>${remetenteDisplay}:</strong> ${msg.conteudo}`;
                            lista.appendChild(linha);
                        });
                        subBloco.appendChild(lista);

                        // Botão Responder - sempre que não for a própria pessoa
                        if (outroParticipanteEmail !== usuarioLogadoEmail) {
                            const responderBtn = document.createElement("button");
                            responderBtn.classList.add("responder-btn");
                            responderBtn.textContent = "Responder";
                            responderBtn.dataset.petId = pet.id;
                            responderBtn.dataset.destinatarioParaResponder = outroParticipanteEmail; // Email do outro participante
                            responderBtn.addEventListener("click", (e) => {
                                const targetPetId = e.target.dataset.petId;
                                // Abre o modal de chat para o pet e carrega as mensagens
                                currentPetId = targetPetId;
                                chatPetNome.textContent = `Chat com ${petsArray.find(p => p.id == currentPetId).nome}`;
                                carregarMensagens(targetPetId); // Carrega a conversa específica
                                modalHistorico.classList.add("hidden");
                                modalHistorico.classList.remove("active");
                                modalChat.classList.remove("hidden");
                                modalChat.classList.add("active");
                            });
                            subBloco.appendChild(responderBtn);
                        }
                        bloco.appendChild(subBloco);
                    }
                    historicoMensagensContainer.appendChild(bloco);
                } else {
                    const bloco = document.createElement("div");
                    bloco.classList.add("historico-bloco");
                    bloco.innerHTML = `<h3>Conversas sobre: ${pet.nome}</h3><p>Nenhuma mensagem ainda.</p>`;
                    historicoMensagensContainer.appendChild(bloco);
                }
            }
        }

        modalHistorico.classList.remove("hidden");
        modalHistorico.classList.add("active");

    } catch (error) {
        console.error("Erro ao carregar histórico de conversas:", error);
        alert("Ocorreu um erro ao carregar o histórico de conversas.");
    }
});


fecharHistorico.addEventListener("click", () => {
    modalHistorico.classList.remove("active");
    modalHistorico.classList.add("hidden");
});


// Função de exclusão de pet
async function excluirPet(petId) {
    try {
        // Excluir mensagens relacionadas ao pet (se a sua tabela `mensagens_chat` não tiver ON DELETE CASCADE configurado para `pet_id`)
        // Caso contrário, o banco de dados cuidará disso automaticamente.
        const { error: deleteMessagesError } = await supabaseClient
            .from('mensagens_chat')
            .delete()
            .eq('pet_id', petId);

        if (deleteMessagesError) {
            console.error("Erro ao excluir mensagens do pet:", deleteMessagesError.message);
            // Continua mesmo se houver erro nas mensagens, tentando excluir o pet
        }

        // Primeiro, obtenha a URL da imagem do pet para excluí-la do Storage
        const { data: petData, error: fetchPetError } = await supabaseClient
            .from('pets')
            .select('foto_url')
            .eq('id', petId)
            .single();

        if (fetchPetError) {
            console.error("Erro ao buscar URL da foto do pet para exclusão:", fetchPetError.message);
            // Continua mesmo se não conseguir a URL, para tentar excluir o registro do pet
        }

        // Em seguida, exclua o registro do pet na tabela 'pets'
        const { error: petError } = await supabaseClient
            .from('pets')
            .delete()
            .eq('id', petId);

        if (petError) {
            throw new Error(`Erro ao excluir o pet: ${petError.message}`);
        }

        // Se a foto_url foi obtida, exclua-a do Supabase Storage
        if (petData && petData.foto_url) {
            const filePath = petData.foto_url.split('/').pop(); // Extrai o nome do arquivo do URL
            // Precisamos do caminho completo dentro do bucket.
            // Se o filePath inclui o ID do usuário (como em `${userId}/${Date.now()}-${fotoFile.name}`),
            // então você precisaria reconstruir esse caminho ou garantir que a URL pública seja o caminho completo do arquivo.
            // Para simplicidade, assumindo que `filePath` é o caminho dentro do bucket 'pet-fotos'
            const { error: deleteStorageError } = await supabaseClient.storage
                .from('pet-fotos')
                .remove([`${localUsuarioAtual.id}/${filePath}`]); // Ajuste para o caminho real do seu storage

            if (deleteStorageError) {
                console.error("Erro ao excluir foto do storage:", deleteStorageError.message);
                // Não impede a exclusão do pet, mas registra o erro
            }
        }

        alert("Pet e suas mensagens excluídos com sucesso!");
        renderizarPets(); // Re-renderiza a lista de pets para remover o pet excluído

        // Ajustes de UI caso o chat ou histórico estivessem abertos para este pet
        if (currentPetId === petId) {
            modalChat.classList.add("hidden");
            modalChat.classList.remove("active");
            currentPetId = null; // Limpa o ID do pet atual
        }
        if (modalHistorico.classList.contains("active")) {
            verConversasBtn.click(); // Simula o clique para recarregar o histórico
        }

    } catch (error) {
        console.error("Erro geral ao excluir pet:", error);
        alert("Ocorreu um erro ao excluir o pet. Verifique o console para mais detalhes.");
    }
}


// --- Inicialização ---
// A ordem é importante:
// 1. Verificar login (para ajustar UI)
// 2. Assinar mudanças em tempo real (para pets e mensagens)
verificarLogin();

// Assina mudanças na tabela 'pets' em tempo real
supabaseClient
    .channel('pets_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pets' }, payload => {
        console.log('Change received!', payload);
        renderizarPets(); // Re-renderiza pets sempre que houver uma mudança
    })
    .subscribe();

// Assina mudanças na tabela 'mensagens_chat' em tempo real
supabaseClient
    .channel('mensagens_chat_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens_chat' }, payload => {
        console.log('Mensagem de chat recebida!', payload);
        // Se a mensagem for para o pet do chat atual, recarregue as mensagens
        if (currentPetId && payload.new && payload.new.pet_id == currentPetId) {
            carregarMensagens(currentPetId);
        } else if (localUsuarioAtual && payload.new && (payload.new.remetente_email === localUsuarioAtual.email ||
                                   petsArray.some(p => p.id === payload.new.pet_id && p.dono_email === localUsuarioAtual.email))) {
            // Se o modal do histórico estiver aberto, atualize-o
            if (modalHistorico.classList.contains("active")) {
                verConversasBtn.click(); // Simula o clique no botão para recarregar o histórico
            }
        }
    })
    .subscribe();