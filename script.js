const SUPABASE_URL = "https://ymfmlqzwnzmtuvuhavbt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZm1scXp3bnptdHV2dWhhdmJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg5Mzg4OSwiZXhwIjoyMDY1NDY5ODg5fQ.7CP9ysj_k0GG2YVeD3Fs_BWe9aXkyaO4i-L8k6ghWmg";

// --- Inicialização do Supabase Client (melhor prática) ---
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

let petsArray = []; // Vai armazenar os pets carregados do Supabase
let localUsuarioAtual = null;
const RAIO_FILTRO_KM = 300;

// --- Modal de Cadastro de Pet ---
const cadastroBtn = document.getElementById("cadastroPetBtn");
const modalCadastro = document.getElementById("modalCadastro");
const fecharCadastro = document.getElementById("fecharModal");

cadastroBtn.addEventListener("click", () => {
    modalCadastro.classList.remove("hidden");
    modalCadastro.classList.add("active");
});

fecharCadastro.addEventListener("click", () => {
    modalCadastro.classList.remove("active");
    modalCadastro.classList.add("hidden");
});

// --- Modal de Login (para Admin e Clientes) ---
const loginBtn = document.getElementById("loginBtn");
const modalLogin = document.getElementById("modalLogin");
const fecharLogin = document.getElementById("fecharLogin");
const loginForm = document.getElementById("loginForm");

loginBtn.addEventListener("click", async () => { // Adicionado 'async'
    if (localStorage.getItem("logadoAdmin") || localStorage.getItem("logadoCliente")) {
        // Lógica de logout para Supabase (assumindo que você usará auth.signOut)
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error("Erro ao fazer logout:", error.message);
            alert("Erro ao fazer logout.");
        } else {
            localStorage.removeItem("logadoAdmin");
            localStorage.removeItem("logadoCliente");
            localStorage.removeItem("clienteLogadoEmail");
            atualizarEstadoLogin();
            alert("Logout realizado com sucesso!");
        }
    } else {
        modalLogin.classList.remove("hidden");
        modalLogin.classList.add("active");
    }
});

fecharLogin.addEventListener("click", () => {
    modalLogin.classList.remove("active");
    modalLogin.classList.add("hidden");
});

loginForm.addEventListener("submit", async (e) => { // Adicionado 'async'
    e.preventDefault();

    const email = loginForm.email.value;
    const senha = loginForm.senha.value;

    // Login de Administrador (ainda hardcoded, considere usar o Supabase Auth para admins também)
    if (email === "usuario@email.com" && senha === "1234") {
        localStorage.setItem("logadoAdmin", "true");
        localStorage.removeItem("logadoCliente");
        localStorage.removeItem("clienteLogadoEmail");
        modalLogin.classList.remove("active");
        modalLogin.classList.add("hidden");
        atualizarEstadoLogin();
        alert("Login de administrador realizado com sucesso!");
        return;
    }

    // Login de Cliente via Supabase Auth
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: senha,
    });

    if (error) {
        alert("Credenciais inválidas ou erro ao fazer login: " + error.message);
    } else {
        localStorage.setItem("logadoCliente", "true");
        localStorage.setItem("clienteLogadoEmail", data.user.email);
        localStorage.removeItem("logadoAdmin");
        modalLogin.classList.remove("active");
        modalLogin.classList.add("hidden");
        atualizarEstadoLogin();
        alert(`Bem-vindo(a), ${data.user.email}!`); // Supabase não retorna 'nome' por padrão no auth
    }
});

// --- Lógica para o Modal de Cadastro de Cliente ---
const cadastroClienteBtn = document.getElementById("cadastroClienteBtn");
const modalCadastroCliente = document.getElementById("modalCadastroCliente");
const fecharCadastroCliente = document.getElementById("fecharCadastroCliente");
const formCadastroCliente = document.getElementById("formCadastroCliente");

cadastroClienteBtn.addEventListener("click", () => {
    modalCadastroCliente.classList.remove("hidden");
    modalCadastroCliente.classList.add("active");
});

fecharCadastroCliente.addEventListener("click", () => {
    modalCadastroCliente.classList.remove("active");
    modalCadastroCliente.classList.add("hidden");
});

formCadastroCliente.addEventListener("submit", async (e) => { // Adicionado 'async'
    e.preventDefault();

    const nome = document.getElementById("nomeCliente").value;
    const email = document.getElementById("emailCliente").value;
    const senha = document.getElementById("senhaCliente").value;
    const confirmaSenha = document.getElementById("confirmaSenhaCliente").value;

    if (senha !== confirmaSenha) {
        alert("As senhas não coincidem! Por favor, digite a mesma senha nos dois campos.");
        return;
    }
    if (senha.length < 6) { // Supabase Auth geralmente exige 6 caracteres mínimos
        alert("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    // Cadastro de Cliente via Supabase Auth
    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: senha,
        options: {
            data: {
                nome: nome // Envia o nome como metadata do usuário, se necessário
            }
        }
    });

    if (error) {
        alert("Erro ao cadastrar: " + error.message);
    } else {
        // Se o Supabase Auth for configurado para confirmação de e-mail, pode ser necessário alertar o usuário
        if (data.user && data.user.identities && data.user.identities.length > 0) {
            alert("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.");
        } else {
            alert("Cadastro realizado com sucesso! Agora você pode fazer login.");
        }
        formCadastroCliente.reset();
        modalCadastroCliente.classList.remove("active");
        modalCadastroCliente.classList.add("hidden");
    }
});

// --- Função para atualizar o estado do botão de login/cadastro ---
async function atualizarEstadoLogin() {
    const { data: { user } } = await supabaseClient.auth.getUser(); // Obtém o usuário logado via Supabase Auth

    if (localStorage.getItem("logadoAdmin")) { // Lógica de admin hardcoded
        loginBtn.textContent = "Sair";
        cadastroBtn.style.display = "inline-block"; // Botão de cadastro de pet
        cadastroClienteBtn.style.display = "none"; // Botão de cadastro de cliente
    } else if (user) { // Usuário logado via Supabase Auth
        localStorage.setItem("logadoCliente", "true");
        localStorage.setItem("clienteLogadoEmail", user.email); // Armazena o e-mail do usuário logado
        // Tenta pegar o nome dos metadados do usuário, se foi salvo
        const userName = user.user_metadata && user.user_metadata.nome ? user.user_metadata.nome.split(' ')[0] : 'Cliente';
        loginBtn.textContent = `Olá, ${userName} (Sair)`;
        cadastroBtn.style.display = "inline-block"; // Cliente também pode cadastrar pet
        cadastroClienteBtn.style.display = "none";
    } else { // Ninguém logado
        localStorage.removeItem("logadoAdmin");
        localStorage.removeItem("logadoCliente");
        localStorage.removeItem("clienteLogadoEmail");
        loginBtn.textContent = "Entrar";
        cadastroBtn.style.display = "none"; // Esconde o botão de cadastro de pet se não estiver logado
        cadastroClienteBtn.style.display = "inline-block"; // Mostra o botão de cadastro de cliente
    }
}

// --- Configuração do Mapa Leaflet ---
const mapa = L.map('map').setView([-25.4284, -49.2733], 12); // Curitiba, PR

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © OpenStreetMap contributors'
}).addTo(mapa);

// --- Função para calcular distância entre dois pontos (Haversine) ---
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em quilômetros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;
    return distancia;
}

// --- Gerenciamento de Pets Salvos no Supabase ---
async function buscarPetsDoSupabase() {
    try {
        const { data, error } = await supabaseClient
            .from('pets') // Nome da sua tabela de pets no Supabase
            .select('*');

        if (error) {
            throw new Error("Erro ao buscar pets no Supabase: " + error.message);
        }
        return data.map(pet => ({
            ...pet,
            local: pet.local ? pet.local.split(',').map(Number) : null // Converte a string "lat,lon" de volta para array [lat, lon]
        }));
    } catch (err) {
        console.error(err);
        alert("Erro ao carregar pets do banco de dados.");
        return [];
    }
}

// --- Geolocalização e Inicialização do Mapa com Filtro ---
async function initializeMapAndPets() { // Transformado em async
    try {
        petsArray = await buscarPetsDoSupabase(); // Carrega os pets do Supabase

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                localUsuarioAtual = [pos.coords.latitude, pos.coords.longitude];
                mapa.setView(localUsuarioAtual, 9);

                const petsFiltrados = filtrarPetsPorRaio(petsArray, localUsuarioAtual, RAIO_FILTRO_KM);
                atualizarMarcadoresMapa(petsFiltrados, localUsuarioAtual);
                atualizarListaPets(petsFiltrados);

            }, () => {
                alert("Não foi possível obter sua localização. Exibindo pets em um raio de Curitiba.");
                localUsuarioAtual = [-25.4284, -49.2733];
                mapa.setView(localUsuarioAtual, 9);

                const petsFiltrados = filtrarPetsPorRaio(petsArray, localUsuarioAtual, RAIO_FILTRO_KM);
                atualizarMarcadoresMapa(petsFiltrados, localUsuarioAtual);
                atualizarListaPets(petsFiltrados);
            });
        } else {
            alert("Geolocalização não suportada pelo navegador. Exibindo pets em um raio de Curitiba.");
            localUsuarioAtual = [-25.4284, -49.2733];
            mapa.setView(localUsuarioAtual, 9);

            const petsFiltrados = filtrarPetsPorRaio(petsArray, localUsuarioAtual, RAIO_FILTRO_KM);
            atualizarMarcadoresMapa(petsFiltrados, localUsuarioAtual);
            atualizarListaPets(petsFiltrados);
        }
    } catch (error) {
        console.error("Erro na inicialização do mapa e pets:", error);
        alert("Ocorreu um erro ao carregar os dados. Tente novamente.");
    }
    atualizarEstadoLogin(); // Garante que o estado do login seja atualizado após carregar pets
}

// Chamar a função de inicialização
initializeMapAndPets();


// --- Função: Filtrar pets por raio de distância ---
function filtrarPetsPorRaio(pets, userLocation, raioKm) {
    if (!userLocation) return pets;

    return pets.filter(pet => {
        if (!pet.local || pet.local.length !== 2) {
            console.warn(`Pet ${pet.nome} não possui coordenadas válidas para cálculo de distância.`);
            return false;
        }
        const distancia = calcularDistancia(userLocation[0], userLocation[1], pet.local[0], pet.local[1]);
        return distancia <= raioKm;
    });
}

// --- Função para geocodificar o endereço usando Nominatim ---
async function geocodeAddress(rua, numero, bairro, cidade, estado, cep) {
    const query = `${numero} ${rua}, ${bairro}, ${cidade}, ${estado}, ${cep}, Brasil`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&email=renankotovciz001@gmail.com`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.length > 0) {
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        } else {
            console.warn("Endereço não encontrado pela geocodificação:", query);
            return null;
        }
    } catch (error) {
        console.error("Erro ao geocodificar o endereço:", error);
        return null;
    }
}

// --- Função para atualizar os marcadores no mapa ---
function atualizarMarcadoresMapa(currentPetsArray, userLocation) {
    mapa.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
            mapa.removeLayer(layer);
        }
    });

    if (userLocation) {
        L.marker(userLocation)
            .addTo(mapa)
            .bindPopup("Você está aqui")
            .openPopup();
    }

    currentPetsArray.forEach((pet) => {
        if (pet.local && pet.local.length === 2) {
            let popupText = `<strong>${pet.nome}</strong><br>${pet.especie}`;
            if (pet.idade !== undefined && pet.idade !== null) {
                popupText += `<br>Idade: ${pet.idade} anos`;
            }

            if (userLocation) {
                const distancia = calcularDistancia(userLocation[0], userLocation[1], pet.local[0], pet.local[1]);
                popupText += `<br>${distancia.toFixed(2)} km de você`;
            }

            L.circle(pet.local, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.3,
                radius: 500 // Raio do círculo em metros (500m)
            })
                .addTo(mapa)
                .bindPopup(popupText);
        } else {
            console.warn(`Pet ${pet.nome} não possui coordenadas válidas para exibição no mapa.`);
        }
    });
}

// --- Referências aos campos de endereço no modal de cadastro de pet ---
const cepInput = document.getElementById("cepPet");
const ruaInput = document.getElementById("ruaPet");
const numeroInput = document.getElementById("numeroPet");
const bairroInput = document.getElementById("bairroPet");
const cidadeInput = document.getElementById("cidadePet");
const estadoInput = document.getElementById("estadoPet");

// --- FUNÇÃO PARA PREENCHER ENDEREÇO PELO CEP ---
cepInput.addEventListener("blur", async () => {
    let cep = cepInput.value.replace(/\D/g, '');

    if (cep.length === 8) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                ruaInput.value = data.logradouro;
                bairroInput.value = data.bairro;
                cidadeInput.value = data.localidade;
                estadoInput.value = data.uf;
            } else {
                alert("CEP não encontrado. Por favor, verifique e digite novamente.");
                limparCamposEndereco();
            }
        } catch (error) {
            console.error("Erro ao consultar ViaCEP:", error);
            alert("Erro ao consultar o CEP. Tente novamente mais tarde.");
            limparCamposEndereco();
        }
    } else if (cep.length > 0) {
        alert("Por favor, digite um CEP válido com 8 dígitos.");
        limparCamposEndereco();
    } else {
        limparCamposEndereco();
    }
});

// Função auxiliar para limpar os campos de endereço
function limparCamposEndereco() {
    ruaInput.value = "";
    bairroInput.value = "";
    cidadeInput.value = "";
    estadoInput.value = "";
}


// --- Formulário de Cadastro de Pet ---
const formCadastroPet = document.getElementById("formCadastroPet");

formCadastroPet.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nomePet").value;
    const especie = document.getElementById("especiePet").value;
    const idade = parseInt(document.getElementById("idadePet").value);

    const rua = document.getElementById("ruaPet").value;
    const numero = document.getElementById("numeroPet").value;
    const bairro = document.getElementById("bairroPet").value;
    const cidade = document.getElementById("cidadePet").value;
    const estado = document.getElementById("estadoPet").value;
    const cep = document.getElementById("cepPet").value;

    if (isNaN(idade)) {
        alert("Por favor, insira uma idade válida para o pet.");
        return;
    }

    const donoEmail = localStorage.getItem("clienteLogadoEmail"); // Obtém o email do dono logado
    if (!donoEmail) {
        alert("Você precisa estar logado como cliente para cadastrar um pet.");
        return;
    }

    alert("Buscando coordenadas para o endereço... Por favor, aguarde.");
    const coordenadas = await geocodeAddress(rua, numero, bairro, cidade, estado, cep);
    if (!coordenadas) {
        alert("Não foi possível encontrar as coordenadas para o endereço fornecido.");
        return;
    }

    const localString = coordenadas.join(','); // Armazena como string "lat,lon"

    const novoPet = {
        nome,
        especie,
        idade,
        rua,
        numero,
        bairro,
        cidade,
        estado,
        cep,
        local: localString, // Envia a string "lat,lon" para o Supabase
        dono_email: donoEmail, // Use dono_email, que é o nome da coluna no seu DB
        foto: imagemBase64 // Se você tiver uma coluna 'foto' para armazenar base64
    };

    try {
        const { data, error } = await supabaseClient
            .from('pets') // Nome da sua tabela de pets no Supabase
            .insert([novoPet])
            .select(); // Retorna o registro inserido

        if (error) {
            throw new Error("Erro ao salvar pet: " + error.message);
        }

        alert("Pet cadastrado com sucesso no Supabase!");

        // Resetar o formulário visual
        formCadastroPet.reset();
        previewImg.style.display = "none";
        imagemBase64 = "";

        modalCadastro.classList.remove("active");
        modalCadastro.classList.add("hidden");

        // Recarrega a lista de pets e atualiza o mapa após o cadastro
        petsArray = await buscarPetsDoSupabase();
        const petsFiltrados = filtrarPetsPorRaio(petsArray, localUsuarioAtual, RAIO_FILTRO_KM);
        atualizarMarcadoresMapa(petsFiltrados, localUsuarioAtual);
        atualizarListaPets(petsFiltrados);

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});


// --- Modal de Chat - Novas constantes e lógica ---
const modalChat = document.getElementById("modalChat");
const fecharChatBtn = document.getElementById("fecharChat");
const chatPetNome = document.getElementById("chatPetNome");
const chatMessages = document.getElementById("chatMessages");
const chatMessageInput = document.getElementById("chatMessageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");

// Event listener para fechar o modal de chat
fecharChatBtn.addEventListener("click", () => {
    modalChat.classList.remove("active");
    modalChat.classList.add("hidden");
    chatMessageInput.value = "";
});

// Função para adicionar uma mensagem ao chat
function addMessageToChat(message, type) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", type); // 'sent' ou 'received'
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Rola para o final
}

// Event listener para enviar mensagem
sendMessageBtn.addEventListener("click", () => {
    const message = chatMessageInput.value.trim();
    const clienteEmail = localStorage.getItem("clienteLogadoEmail");
    const isAdmin = localStorage.getItem("logadoAdmin");

    let remetente = "desconhecido";
    if (clienteEmail) {
        remetente = clienteEmail;
    } else if (isAdmin) {
        remetente = "admin";
    }

    if (message) {
        salvarMensagem(chatPetNome.textContent.replace("Chat com ", ""), remetente, message);
        renderizarMensagens(chatPetNome.textContent.replace("Chat com ", ""));
        chatMessageInput.value = "";
    }
});

// Permite enviar mensagem pressionando Enter no input
chatMessageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        sendMessageBtn.click();
    }
});


// --- Função para atualizar a lista de cards de pets ---
function atualizarListaPets(currentPetsArray) {
    const lista = document.getElementById("listaPets");
    lista.innerHTML = "";

    if (currentPetsArray.length === 0) {
        lista.innerHTML = "<p>Nenhum pet encontrado na sua região. Cadastre um novo amigo!</p>";
        return;
    }

    currentPetsArray.forEach((pet) => { // Removido 'index' pois não será mais usado para exclusão direta
        const card = document.createElement("div");
        card.classList.add("card-pet");
        card.dataset.petId = pet.id; // Usar o ID do Supabase para identificação

        const clienteEmail = localStorage.getItem("clienteLogadoEmail");
        const isDono = clienteEmail && pet.dono_email === clienteEmail; // Verifica pelo dono_email do DB

        card.innerHTML = `
            <img src="${pet.foto || 'https://via.placeholder.com/150'}" alt="${pet.nome} para adoção" />
            <strong>${pet.nome}</strong>
            <p>Espécie: ${pet.especie}</p>
            <p>Idade: ${pet.idade !== undefined && pet.idade !== null ? pet.idade + " anos" : "não informada"}</p>
            ${isDono
                ? `<button class="chat-pet-btn" data-pet-nome="${pet.nome}">Ver Mensagens</button>`
                : `<button class="chat-pet-btn" data-pet-nome="${pet.nome}">Conversar com o Tutor</button>`
            }
            ${isDono ? `<button class="excluir-pet-btn" data-pet-id="${pet.id}">Excluir</button>` : ""}
        `;
        lista.appendChild(card);
    });

    document.querySelectorAll(".chat-pet-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            const petNome = e.target.dataset.petNome;
            renderizarMensagens(petNome);

            chatPetNome.textContent = `Chat com ${petNome}`;
            const clienteEmail = localStorage.getItem("clienteLogadoEmail");
            const isTutor = petsArray.find(p => p.nome === petNome && p.dono === clienteEmail);

            if (isTutor) {
                chatPetNome.textContent = `Mensagens do seu pet: ${petNome}`;
            }
            modalChat.classList.remove("hidden");
            modalChat.classList.add("active");
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    });

    // Event listener para excluir pet via Supabase
    document.querySelectorAll(".excluir-pet-btn").forEach(button => {
        button.addEventListener("click", async (e) => { // Adicionado 'async'
            const petId = e.target.dataset.petId;

            if (confirm("Tem certeza que deseja excluir este pet?")) {
                try {
                    const { error } = await supabaseClient
                        .from('pets')
                        .delete()
                        .eq('id', petId); // Exclui pelo ID do pet

                    if (error) {
                        throw new Error("Erro ao excluir pet do Supabase: " + error.message);
                    }

                    alert("Pet excluído com sucesso!");
                    // Recarrega a lista e o mapa após a exclusão
                    petsArray = await buscarPetsDoSupabase();
                    const petsFiltrados = filtrarPetsPorRaio(petsArray, localUsuarioAtual, RAIO_FILTRO_KM);
                    atualizarMarcadoresMapa(petsFiltrados, localUsuarioAtual);
                    atualizarListaPets(petsFiltrados);

                } catch (error) {
                    console.error(error);
                    alert(error.message);
                }
            }
        });
    });
}

function salvarMensagem(petNome, remetente, conteudo) {
    const mensagens = JSON.parse(localStorage.getItem("mensagensChat") || "[]");
    mensagens.push({ pet: petNome, remetente, conteudo, data: new Date().toISOString() });
    localStorage.setItem("mensagensChat", JSON.stringify(mensagens));
}

function renderizarMensagens(petNome) {
    const mensagens = JSON.parse(localStorage.getItem("mensagensChat") || "[]");
    const clienteEmail = localStorage.getItem("clienteLogadoEmail");
    const isAdmin = localStorage.getItem("logadoAdmin");

    const remetenteAtual = clienteEmail || (isAdmin ? "admin" : "desconhecido");

    chatMessages.innerHTML = "";

    mensagens
        .filter(msg => msg.pet === petNome)
        .forEach(msg => {
            const tipo = msg.remetente === remetenteAtual ? "sent" : "received";
            addMessageToChat(msg.conteudo, tipo);
        });
}

const dropArea = document.getElementById("dropArea");
const inputFile = document.getElementById("fotoPetInput");
const previewImg = document.getElementById("previewPetFoto");
let imagemBase64 = "";

dropArea.addEventListener("click", () => inputFile.click());

inputFile.addEventListener("change", handleFiles);

dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("highlight");
});

dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("highlight");
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.classList.remove("highlight");
    const files = e.dataTransfer.files;
    if (files.length) handleFiles({ target: { files } });
});

function handleFiles(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        imagemBase64 = reader.result;
        previewImg.src = imagemBase64;
        previewImg.style.display = "block";
    };
    reader.readAsDataURL(file);
}
const modalHistoricoChat = document.getElementById("modalHistoricoChat");
const fecharHistoricoChat = document.getElementById("fecharHistoricoChat");
const listaMensagensRecebidas = document.getElementById("listaMensagensRecebidas");

fecharHistoricoChat.addEventListener("click", () => {
  modalHistoricoChat.classList.remove("active");
  modalHistoricoChat.classList.add("hidden");
});

// Ao clicar no botão "Ver Conversas"
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("ver-conversas-btn")) {
    const petNome = e.target.dataset.petNome;
    mostrarMensagensDoTutor(petNome);
  }
});

function mostrarMensagensDoTutor(petNome) {
  const mensagens = JSON.parse(localStorage.getItem("mensagensChat") || "[]");
  const mensagensDoPet = mensagens.filter(msg => msg.pet === petNome);

  const agrupadasPorUsuario = mensagensDoPet.reduce((acc, msg) => {
    if (msg.remetente !== "admin") {
      if (!acc[msg.remetente]) acc[msg.remetente] = [];
      acc[msg.remetente].push(msg);
    }
    return acc;
  }, {});

  listaMensagensRecebidas.innerHTML = "";
  for (const [usuario, msgs] of Object.entries(agrupadasPorUsuario)) {
    const div = document.createElement("div");
    div.innerHTML = `<h4>${usuario}</h4><ul>` +
      msgs.map(m => `<li>${new Date(m.data).toLocaleString()}: ${m.conteudo}</li>`).join("") +
      `</ul>`;
    listaMensagensRecebidas.appendChild(div);
  }

  document.getElementById("tituloHistoricoChat").textContent = `Mensagens para ${petNome}`;
  modalHistoricoChat.classList.remove("hidden");
  modalHistoricoChat.classList.add("active");
}