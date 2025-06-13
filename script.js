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

loginBtn.addEventListener("click", () => {
    if (localStorage.getItem("logadoAdmin") || localStorage.getItem("logadoCliente")) {
        localStorage.removeItem("logadoAdmin");
        localStorage.removeItem("logadoCliente");
        localStorage.removeItem("clienteLogadoEmail");
        atualizarEstadoLogin();
    } else {
        modalLogin.classList.remove("hidden");
        modalLogin.classList.add("active");
    }
});

fecharLogin.addEventListener("click", () => {
    modalLogin.classList.remove("active");
    modalLogin.classList.add("hidden");
});

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = loginForm.email.value;
    const senha = loginForm.senha.value;

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

    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]");
    const clienteEncontrado = clientes.find(cliente => cliente.email === email && cliente.senha === senha);

    if (clienteEncontrado) {
        localStorage.setItem("logadoCliente", "true");
        localStorage.setItem("clienteLogadoEmail", clienteEncontrado.email);
        localStorage.removeItem("logadoAdmin");
        modalLogin.classList.remove("active");
        modalLogin.classList.add("hidden");
        atualizarEstadoLogin();
        alert(`Bem-vindo(a), ${clienteEncontrado.nome}!`);
    } else {
        alert("Credenciais inválidas. Verifique seu e-mail e senha.");
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

formCadastroCliente.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("nomeCliente").value;
    const email = document.getElementById("emailCliente").value;
    const senha = document.getElementById("senhaCliente").value;
    const confirmaSenha = document.getElementById("confirmaSenhaCliente").value;

    if (senha !== confirmaSenha) {
        alert("As senhas não coincidem! Por favor, digite a mesma senha nos dois campos.");
        return;
    }
    if (senha.length < 4) {
        alert("A senha deve ter pelo menos 4 caracteres.");
        return;
    }

    const clientes = JSON.parse(localStorage.getItem("clientes") || "[]");
    const emailJaExiste = clientes.some(cliente => cliente.email === email);
    if (emailJaExiste) {
        alert("Este e-mail já está cadastrado. Por favor, use outro.");
        return;
    }

    const novoCliente = {
        nome: nome,
        email: email,
        senha: senha
    };

    clientes.push(novoCliente);
    localStorage.setItem("clientes", JSON.stringify(clientes));

    alert("Cadastro realizado com sucesso! Agora você pode fazer login.");
    formCadastroCliente.reset();
    modalCadastroCliente.classList.remove("active");
    modalCadastroCliente.classList.add("hidden");
});

// --- Função para atualizar o estado do botão de login/cadastro ---
function atualizarEstadoLogin() {
    const logadoAdmin = localStorage.getItem("logadoAdmin");
    const logadoCliente = localStorage.getItem("logadoCliente");
    const clienteEmail = localStorage.getItem("clienteLogadoEmail");

    if (logadoAdmin) {
        loginBtn.textContent = "Sair";
        cadastroBtn.style.display = "inline-block";
        cadastroClienteBtn.style.display = "none";
    } else if (logadoCliente) {
        const clientes = JSON.parse(localStorage.getItem("clientes") || "[]");
        const clienteAtual = clientes.find(c => c.email === clienteEmail);
        loginBtn.textContent = `Olá, ${clienteAtual ? clienteAtual.nome.split(' ')[0] : 'Cliente'} (Sair)`;
        cadastroBtn.style.display = "inline-block"; // Cliente também pode cadastrar pet
        cadastroClienteBtn.style.display = "none";
    } else {
        loginBtn.textContent = "Entrar";
        cadastroBtn.style.display = "none";
        cadastroClienteBtn.style.display = "inline-block";
    }
}

atualizarEstadoLogin();

// --- Configuração do Mapa Leaflet ---
const mapa = L.map('map').setView([-25.4284, -49.2733], 12); // Curitiba, PR

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © OpenStreetMap contributors'
}).addTo(mapa);

// --- Dados Iniciais de Pets ---
const petsIniciais = [
    {
        nome: "Rex",
        especie: "Cachorro",
        rua: "Rua das Flores",
        numero: "100",
        bairro: "Centro",
        cidade: "Curitiba",
        estado: "PR",
        cep: "80000-000",
        local: [-25.4305, -49.2707], // Coordenadas para Rex (centro da região)
        idade: 1
    },
    {
        nome: "Mimi",
        especie: "Gata",
        rua: "Avenida da Paz",
        numero: "50",
        bairro: "Jardim América",
        cidade: "Curitiba",
        estado: "PR",
        cep: "80000-000",
        local: [-25.4270, -49.2735], // Coordenadas para Mimi
        idade: 2
    }
];

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

// --- Gerenciamento de Pets Salvos no LocalStorage ---
function carregarPets() {
    const petsSalvos = localStorage.getItem("pets");
    if (petsSalvos) {
        return JSON.parse(petsSalvos);
    }
    return petsIniciais;
}

function salvarPets(petsArray) {
    localStorage.setItem("pets", JSON.stringify(petsArray));
}

let petsArray = carregarPets();
let localUsuarioAtual = null;
const RAIO_FILTRO_KM = 300; // Define o raio de 300 km para filtragem

// --- Geolocalização e Inicialização do Mapa com Filtro ---
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
    // ATENÇÃO: Substitua 'seu.email@exemplo.com' pelo seu e-mail real para uso do Nominatim.
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&email=seu.email@exemplo.com`;
    
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

    alert("Buscando coordenadas para o endereço... Por favor, aguarde.");
    const coordenadas = await geocodeAddress(rua, numero, bairro, cidade, estado, cep);

    if (!coordenadas) {
        alert("Não foi possível encontrar as coordenadas para o endereço fornecido. Por favor, verifique o endereço e tente novamente.");
        return;
    }

const donoEmail = localStorage.getItem("clienteLogadoEmail") || null;
if (!donoEmail) {
    alert("Você precisa estar logado como cliente para cadastrar um pet.");
    return;
}

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
    local: coordenadas,
    dono: donoEmail // associando o dono ao pet
};

    petsArray.push(novoPet);
    salvarPets(petsArray);
    
    const petsFiltradosAposCadastro = filtrarPetsPorRaio(petsArray, localUsuarioAtual, RAIO_FILTRO_KM);
    atualizarMarcadoresMapa(petsFiltradosAposCadastro, localUsuarioAtual);
    atualizarListaPets(petsFiltradosAposCadastro);

    formCadastroPet.reset();
    document.getElementById("cidadePet").value = "Curitiba";
    document.getElementById("estadoPet").value = "PR";

    modalCadastro.classList.remove("active");
    modalCadastro.classList.add("hidden");
    alert("Pet cadastrado com sucesso!");
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
    // REMOVIDA A LINHA: chatMessages.innerHTML = ``; // Esta linha não existe mais
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

    currentPetsArray.forEach((pet, index) => {
        const card = document.createElement("div");
        card.classList.add("card-pet");
        card.dataset.petIndex = index; 

        const clienteEmail = localStorage.getItem("clienteLogadoEmail");
        const isDono = clienteEmail && pet.dono === clienteEmail;

        card.innerHTML = `
            <img src="https://via.placeholder.com/150" alt="${pet.nome} para adoção" />
            <strong>${pet.nome}</strong>
            <p>Espécie: ${pet.especie}</p>
            <p>Idade: ${pet.idade !== undefined && pet.idade !== null ? pet.idade + " anos" : "não informada"}</p>
            <button class="chat-pet-btn" data-pet-nome="${pet.nome}">Conversar com o Tutor</button>
            ${isDono ? `<button class="excluir-pet-btn" data-pet-index="${index}">Excluir</button>` : ""}
        `;
        lista.appendChild(card);
    });

    document.querySelectorAll(".chat-pet-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            const petNome = e.target.dataset.petNome;
            renderizarMensagens(petNome); 

            chatPetNome.textContent = `Chat com ${petNome}`;
            modalChat.classList.remove("hidden");
            modalChat.classList.add("active");
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    });
    document.querySelectorAll(".excluir-pet-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            const index = parseInt(e.target.dataset.petIndex);

            if (confirm("Tem certeza que deseja excluir este pet?")) {
                petsArray.splice(index, 1); // remove da lista
                salvarPets(petsArray);      // salva no localStorage

                const petsFiltrados = filtrarPetsPorRaio(petsArray, localUsuarioAtual, RAIO_FILTRO_KM);
                atualizarMarcadoresMapa(petsFiltrados, localUsuarioAtual);
                atualizarListaPets(petsFiltrados);
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