const SUPABASE_URL = "https://ymfmlqzwnzmtuvuhavbt.supabase.co"; // SUBSTITUA PELA SUA PROJECT URL DO SUPABASE
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZm1scXp3bnptdHV2dWhhdmJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTM4ODksImV4cCI6MjA2NTQ2OTg4OX0.eimoL0JlSCxHAnrfl5WwwiOnvJznBxh-FFQYl7NSKFk";

// --- Inicialização do Supabase Client ---
// Garante que 'supabase' está disponível globalmente antes de usá-lo.
// Se você está incluindo a biblioteca Supabase via CDN, ela já deve estar disponível.
// Caso contrário, você precisaria importar de outra forma (ex: import { createClient } from '@supabase/supabase-js').
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

let petsArray = []; // Vai armazenar os pets carregados do Supabase
let localUsuarioAtual = null; // Objeto do usuário Supabase
const RAIO_FILTRO_KM = 300; // Constante para filtro de raio (se usar no futuro)
let currentPetId = null; // Variável global para armazenar o ID do pet do chat ativo

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
    if (user && user.email === "SEU_EMAIL_ADMIN@EXEMPLO.COM") {
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


async function renderizarPets() {
    const { data: pets, error } = await supabaseClient
        .from('pets')
        .select('*');

    if (error) {
        console.error("Erro ao carregar pets:", error.message);
        return;
    }

    petsArray = pets; // Atualiza o array global de pets
    const listaPetsDiv = document.getElementById("listaPets");
    listaPetsDiv.innerHTML = ''; // Limpa a lista existente

    // Renderizar pets na lista
    if (pets.length === 0) {
        listaPetsDiv.innerHTML = '<p>Nenhum pet disponível para adoção ainda.</p>';
    } else {
        pets.forEach(pet => {
            const petCard = document.createElement('div');
            petCard.classList.add('pet-card');
            petCard.innerHTML = `
                <img src="${pet.foto_url || 'placeholder.jpg'}" alt="${pet.nome}">
                <h4>${pet.nome}</h4>
                <p>Espécie: ${pet.especie}</p>
                <p>Idade: ${pet.idade} anos</p>
                <p>Localização: ${pet.localizacao}</p>
                <p>${pet.descricao}</p>
                <button class="iniciar-chat-btn" data-pet-id="${pet.id}" ${localUsuarioAtual && localUsuarioAtual.email === pet.dono_email ? 'disabled' : ''}>${localUsuarioAtual && localUsuarioAtual.email === pet.dono_email ? 'É seu Pet' : 'Interessado?'}</button>
            `;
            listaPetsDiv.appendChild(petCard);
        });
    }

    // Adicionar event listeners para os botões de chat
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
            chatPetNome.textContent = `Chat com ${petsArray.find(p => p.id == currentPetId).nome}`;
            modalChat.classList.remove("hidden");
            modalChat.classList.add("active");
        });
    });

    renderizarPetsNoMapa(pets); // Atualiza os marcadores no mapa
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

    const { error } = await supabaseClient
        .from('mensagens_chat')
        .insert({
            pet_id: currentPetId,
            remetente_email: localUsuarioAtual.email,
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
            // Verifica se a mensagem é do usuário logado ou do pet owner/interessado
            if (msg.remetente_email === localUsuarioAtual.email) {
                messageDiv.classList.add('sent');
                messageDiv.textContent = `Você: ${msg.conteudo}`;
            } else {
                messageDiv.classList.add('received');
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
        const isAdmin = (usuarioLogadoEmail === "SEU_EMAIL_ADMIN@EXEMPLO.COM"); // Verificação de admin

        // Buscar todos os pets para os quais o usuário logado é o dono OU onde há conversas com o usuário
        const { data: petsDoUsuario, error: petsError } = await supabaseClient
            .from('pets')
            .select('id, nome, dono_email')
            // Adicionado .filter para buscar pets onde o dono é o usuário logado OU onde há mensagens do usuário logado
            .or(`dono_email.eq.${usuarioLogadoEmail},mensagens_chat.remetente_email.eq.${usuarioLogadoEmail}`);


        if (petsError) throw petsError;

        if (petsDoUsuario.length === 0 && !isAdmin) {
            historicoMensagensContainer.innerHTML = '<p>Você não tem pets cadastrados nem conversas iniciadas.</p>';
        } else {
            // Filtrar pets únicos se a busca por mensagens trouxer duplicatas
            const petsUnicos = Array.from(new Set(petsDoUsuario.map(pet => pet.id)))
                                    .map(id => petsDoUsuario.find(pet => pet.id === id));

            for (const pet of petsUnicos) {
                const { data: mensagens, error: mensagensError } = await supabaseClient
                    .from('mensagens_chat')
                    .select('*')
                    .eq('pet_id', pet.id)
                    .order('created_at', { ascending: true });

                if (mensagensError) throw mensagensError;

                const bloco = document.createElement("div");
                bloco.classList.add("historico-bloco");
                bloco.innerHTML = `<h3>Conversas sobre: ${pet.nome}</h3>`;

                if (mensagens.length > 0) {
                    const conversasAgrupadas = {};

                    mensagens.forEach(msg => {
                        let participanteChave;
                        // Determina a chave do participante para agrupar as conversas
                        if (msg.remetente_email === pet.dono_email) {
                            participanteChave = msg.remetente_email === usuarioLogadoEmail ? "Você (Dono)" : msg.remetente_email;
                        } else {
                            participanteChave = msg.remetente_email === usuarioLogadoEmail ? "Você (Interessado)" : msg.remetente_email;
                        }

                        // Agrupa mensagens por conversante
                        if (!conversasAgrupadas[participanteChave]) {
                            conversasAgrupadas[participanteChave] = [];
                        }
                        conversasAgrupadas[participanteChave].push(msg);
                    });

                    // Renderiza cada grupo de conversa
                    for (const remetente in conversasAgrupadas) {
                        const msgs = conversasAgrupadas[remetente];
                        const subBloco = document.createElement("div");
                        subBloco.classList.add("conversa-individual"); // Adiciona classe para estilização
                        subBloco.innerHTML = `<h4>${remetente.includes("Você") ? remetente : remetente.split('@')[0]}</h4>`; // Mostra "Você" ou o nome do e-mail
                        const lista = document.createElement("ul");
                        msgs.forEach(msg => {
                            const linha = document.createElement("li");
                            linha.innerHTML = `[${new Date(msg.created_at).toLocaleString()}]: ${msg.conteudo}`;
                            lista.appendChild(linha);
                        });
                        subBloco.appendChild(lista);

                        // Botão Responder - apenas se não for a própria conversa do usuário logado (ex: interessado falando com dono)
                        // ou se for o admin
                        if (remetente !== "Você (Dono)" && remetente !== "Você (Interessado)") {
                            const responderBtn = document.createElement("button");
                            responderBtn.classList.add("responder-btn");
                            responderBtn.textContent = "Responder";
                            responderBtn.dataset.petId = pet.id;
                            responderBtn.dataset.remetenteParaResponder = remetente; // Email do outro participante
                            responderBtn.addEventListener("click", (e) => {
                                const targetPetId = e.target.dataset.petId;
                                // Abre o modal de chat para o pet e carrega as mensagens
                                currentPetId = targetPetId;
                                chatPetNome.textContent = `Chat com ${petsArray.find(p => p.id == currentPetId).nome}`;
                                carregarMensagens(targetPetId);
                                modalHistorico.classList.remove("active");
                                modalHistorico.classList.add("hidden");
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
        } else if (payload.new && (payload.new.remetente_email === localUsuarioAtual.email ||
                                   petsArray.some(p => p.id === payload.new.pet_id && p.dono_email === localUsuarioAtual.email))) {
            // Se o modal do histórico estiver aberto, atualize-o
            if (modalHistorico.classList.contains("active")) {
                verConversasBtn.click(); // Simula o clique no botão para recarregar o histórico
            }
        }
    })
    .subscribe();