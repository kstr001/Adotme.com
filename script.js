const SUPABASE_URL = "https://ymfmlqzwnzmtuvuhavbt.supabase.co"; // SUBSTITUA PELA SUA PROJECT URL DO SUPABASE
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZm1scXp3bnptdHV2dWhhdmJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTM4ODksImV4cCI6MjA2NTQ2OTg4OX0.eimoL0JlSCxHAnrfl5WwwiOnvJznBxh-FFQYl7NSKFk"; // SUBSTITUA PELA SUA CHAVE anon public DO SUPABASE

// --- Inicialização do Supabase Client ---
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
const fecharLogin = document.getElementById("fecharModalLogin");
const cadastroClienteBtn = document.getElementById("cadastroClienteBtn");
const modalCadastroCliente = document.getElementById("modalCadastroCliente");
const fecharCadastroCliente = document.getElementById("fecharCadastroCliente");
const listaPetsDiv = document.getElementById("listaPets");
const emailLogin = document.getElementById("emailLogin");
const senhaLogin = document = document.getElementById("senhaLogin"); // Corrigido a atribuição aqui, era duplicada
const loginForm = document.getElementById("loginForm");
const cadastroClienteForm = document.getElementById("cadastroClienteForm");
const cadastroPetForm = document.getElementById("cadastroPetForm");
const emailCliente = document.getElementById("emailCliente");
const senhaCliente = document.getElementById("senhaCliente");
const confirmaSenhaCliente = document.getElementById("confirmaSenhaCliente");
const logoutBtn = document.getElementById("logoutBtn");
const verConversasBtn = document.getElementById("verConversasBtn"); // Botão "Ver Conversas" do tutor
const usuarioLogadoDisplay = document.getElementById("usuarioLogadoDisplay"); // Novo elemento para exibir o usuário

// Chat Elements
const modalChat = document.getElementById("modalChat");
const fecharChat = document.getElementById("fecharChat");
const chatPetNome = document.getElementById("chatPetNome");
const chatMessages = document.getElementById("chatMessages");
const chatMessageInput = document.getElementById("chatMessageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");

// Histórico de Conversas Elements
const modalHistorico = document.getElementById("modalHistorico");
const fecharHistorico = document.getElementById("fecharHistorico");
const historicoMensagensContainer = document.getElementById("historicoMensagensContainer");

// Leaflet Map
let map; // Variável para o mapa Leaflet

// --- Funções de Modal ---
cadastroBtn.addEventListener("click", () => {
    modalCadastro.classList.remove("hidden");
    modalCadastro.classList.add("active");
});

fecharCadastro.addEventListener("click", () => {
    modalCadastro.classList.remove("active");
    modalCadastro.classList.add("hidden");
});

loginBtn.addEventListener("click", () => {
    modalLogin.classList.remove("hidden");
    modalLogin.classList.add("active");
});

fecharLogin.addEventListener("click", () => {
    modalLogin.classList.remove("active");
    modalLogin.classList.add("hidden");
});

cadastroClienteBtn.addEventListener("click", () => {
    modalCadastroCliente.classList.remove("hidden");
    modalCadastroCliente.classList.add("active");
});

fecharCadastroCliente.addEventListener("click", () => {
    modalCadastroCliente.classList.remove("active");
    modalCadastroCliente.classList.add("hidden");
});

fecharChat.addEventListener("click", () => {
    modalChat.classList.remove("active");
    modalChat.classList.add("hidden");
});

fecharHistorico.addEventListener("click", () => {
    modalHistorico.classList.remove("active");
    modalHistorico.classList.add("hidden");
});


// --- Funções de Autenticação ---
async function verificarLogin() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    localUsuarioAtual = user;

    // A verificação de admin deve ser baseada no email do user do Supabase, não apenas no localStorage
    let isAdmin = false;
    if (user && user.email === "SEU_EMAIL_ADMIN@EXEMPLO.COM") { // ** SUBSTITUA PELO SEU EMAIL DE ADMINISTRADOR REAL **
        isAdmin = true;
        localStorage.setItem("logadoAdmin", "true"); // Mantém para retrocompatibilidade se necessário
    } else {
        localStorage.removeItem("logadoAdmin");
    }

    // Atualiza a exibição dos botões de autenticação
    if (user) {
        document.getElementById("cadastroClienteBtn").style.display = "none";
        document.getElementById("loginBtn").style.display = "none";
        document.getElementById("logoutBtn").style.display = "block";
        document.getElementById("verConversasBtn").style.display = "block"; // Mostrar botão de conversas
        
        // Exibir nome do usuário logado
        usuarioLogadoDisplay.textContent = `Olá, ${user.email.split('@')[0]}${isAdmin ? ' (Admin)' : ''}!`;
        usuarioLogadoDisplay.style.display = "block";
    } else {
        document.getElementById("cadastroClienteBtn").style.display = "block";
        document.getElementById("loginBtn").style.display = "block";
        document.getElementById("logoutBtn").style.display = "none";
        document.getElementById("verConversasBtn").style.display = "none";
        usuarioLogadoDisplay.style.display = "none";
    }

    // Apenas admin pode cadastrar pet
    //if (isAdmin) {
        cadastroBtn.style.display = "block";
    //} else {
        cadastroBtn.style.display = "none";
   // }

    renderizarPets(); // Re-renderiza pets para mostrar ou esconder botão de chat
}

// Chamar verificarLogin ao carregar a página
async function verificarLogin() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    localUsuarioAtual = user;

    // A verificação de admin deve ser baseada no email do user do Supabase, não apenas no localStorage
    // **DEIXE ESTA PARTE PARA OUTRAS FUNCIONALIDADES DE ADMIN (chat, etc.)**
    let isAdmin = false;
    if (user && user.email === "SEU_EMAIL_ADMIN@EXEMPLO.COM") { // MANTENHA ESTA LINHA E SEU EMAIL ADMIN
        isAdmin = true;
        localStorage.setItem("logadoAdmin", "true"); // Mantém para retrocompatibilidade se necessário
    } else {
        localStorage.removeItem("logadoAdmin");
    }

    // Atualiza a exibição dos botões de autenticação
    if (user) {
        document.getElementById("cadastroClienteBtn").style.display = "none";
        document.getElementById("loginBtn").style.display = "none";
        document.getElementById("logoutBtn").style.display = "block";
        document.getElementById("verConversasBtn").style.display = "block"; // Mostrar botão de conversas
        
        // Exibir nome do usuário logado
        usuarioLogadoDisplay.textContent = `Olá, ${user.email.split('@')[0]}${isAdmin ? ' (Admin)' : ''}!`;
        usuarioLogadoDisplay.style.display = "block";

        // **AQUI: Torne o botão de cadastro de pet visível para qualquer usuário logado**
        cadastroBtn.style.display = "block"; 
    } else {
        document.getElementById("cadastroClienteBtn").style.display = "block";
        document.getElementById("loginBtn").style.display = "block";
        document.getElementById("logoutBtn").style.display = "none";
        document.getElementById("verConversasBtn").style.display = "none";
        usuarioLogadoDisplay.style.display = "none";
        cadastroBtn.style.display = "none"; // Esconde o botão se ninguém estiver logado
    }

    renderizarPets(); // Re-renderiza pets para mostrar ou esconder botão de chat
}

supabaseClient.auth.onAuthStateChange((event, session) => {
    verificarLogin(); // Verifica login sempre que o estado de autenticação mudar
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailLogin.value;
    const senha = senhaLogin.value;

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: senha,
        });

        if (error) {
            console.error("Erro no login:", error.message);
            alert("Erro no login: " + error.message + ". Verifique suas credenciais e se seu email foi confirmado.");
        } else {
            console.log("Usuário logado:", data.user);
            localUsuarioAtual = data.user;
            // Removed localStorage.setItem("clienteLogadoEmail") as user object is directly available
            // isAdmin check moved to verificarLogin for a single source of truth based on user.email
            alert("Login realizado com sucesso!");
            modalLogin.classList.remove("active");
            modalLogin.classList.add("hidden");
            emailLogin.value = "";
            senhaLogin.value = "";
            verificarLogin(); // Refresh UI based on new login state
            renderizarPets(); // Update pets list with correct button visibility
        }
    } catch (err) {
        console.error("Erro inesperado no login:", err);
        alert("Ocorreu um erro inesperado no login.");
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

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: senha,
        });

        if (error) {
            console.error("Erro no cadastro:", error.message);
            alert("Erro no cadastro: " + error.message);
        } else {
            console.log("Usuário cadastrado:", data.user);
            alert("Cadastro realizado com sucesso! Verifique seu email para confirmar a conta.");
            modalCadastroCliente.classList.remove("active");
            modalCadastroCliente.classList.add("hidden");
            cadastroClienteForm.reset(); // Limpa o formulário
        }
    } catch (err) {
        console.error("Erro inesperado no cadastro:", err);
        alert("Ocorreu um erro inesperado no cadastro.");
    }
});

logoutBtn.addEventListener("click", async () => {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error("Erro ao fazer logout:", error.message);
            alert("Erro ao fazer logout: " + error.message);
        } else {
            localStorage.removeItem("logadoAdmin"); // Clear admin flag
            localUsuarioAtual = null;
            alert("Logout realizado com sucesso!");
            verificarLogin(); // Atualiza a UI para estado deslogado
            renderizarPets(); // Atualiza a lista de pets sem botões de chat
        }
    } catch (err) {
        console.error("Erro inesperado no logout:", err);
        alert("Ocorreu um erro inesperado no logout.");
    }
});


// --- Funções de Pets ---
async function buscarPetsDoSupabase() {
    try {
        const { data, error } = await supabaseClient
            .from("pets")
            .select("*");

        if (error) {
            throw new Error("Erro ao buscar pets: " + error.message);
        }
        petsArray = data;
        renderizarPets();
        atualizarMapaComPets(petsArray); // Atualiza os marcadores no mapa
    } catch (err) {
        console.error(err);
        listaPetsDiv.innerHTML = "<p>Não foi possível carregar os pets.</p>";
    }
}

async function renderizarPets() {
    listaPetsDiv.innerHTML = "";
    // Usar localUsuarioAtual.email para verificações
    const usuarioLogadoEmail = localUsuarioAtual ? localUsuarioAtual.email : null;
    const isAdmin = (usuarioLogadoEmail === "SEU_EMAIL_ADMIN@EXEMPLO.COM"); // ** SUBSTITUA PELO SEU EMAIL DE ADMINISTRADOR REAL **

    petsArray.forEach((pet) => {
        const petDiv = document.createElement("div");
        petDiv.classList.add("pet-card");
        petDiv.innerHTML = `
            <h3>${pet.nome} (${pet.especie})</h3>
            <p><strong>Raça:</strong> ${pet.raca}</p>
            <p><strong>Idade:</strong> ${pet.idade} anos</p>
            <p><strong>Localização:</strong> ${pet.localizacao}</p>
            <img src="${pet.foto_url}" alt="${pet.nome}" />
            ${
                // Botão "Conversar com o Tutor" visível para clientes NÃO donos do pet
                // Ou para o admin (admin pode iniciar conversa com qualquer dono de pet)
                (usuarioLogadoEmail && usuarioLogadoEmail !== pet.dono_email) || isAdmin
                    ? `<button class="chat-btn" data-pet-id="${pet.id}" data-pet-nome="${pet.nome}" data-dono-email="${pet.dono_email}">Conversar com o Tutor</button>`
                    : ""
            }
            ${
                // Botão "Excluir Pet" visível para o dono do pet OU para o admin
                (usuarioLogadoEmail && usuarioLogadoEmail === pet.dono_email) || isAdmin
                    ? `<button class="delete-btn" data-pet-id="${pet.id}">Excluir Pet</button>`
                    : ""
            }
        `;
        listaPetsDiv.appendChild(petDiv);
    });

    // Adiciona event listeners para os botões de chat
    document.querySelectorAll(".chat-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
            currentPetId = event.target.dataset.petId; // Define o pet ID atual
            const petNome = event.target.dataset.petNome;
            // Para o chat com o tutor, o nome do pet é o suficiente.
            // Para conversas cliente-tutor, o sistema de remetente/destinatário vai resolver quem é quem.
            chatPetNome.textContent = `Chat sobre ${petNome}`;
            modalChat.classList.remove("hidden");
            modalChat.classList.add("active");
            renderizarMensagens(petNome); // Carrega as mensagens do chat
        });
    });

    // Adiciona event listeners para os botões de exclusão
    document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", async (event) => {
            const petIdToDelete = event.target.dataset.petId;
            if (confirm("Tem certeza que deseja excluir este pet?")) {
                try {
                    const { error } = await supabaseClient
                        .from("pets")
                        .delete()
                        .eq("id", petIdToDelete);

                    if (error) {
                        // Mais detalhes no alert para depuração
                        throw new Error(`Erro ao excluir pet: ${error.message}. Verifique a política RLS de DELETE para a tabela 'pets' no Supabase.`);
                    }
                    alert("Pet excluído com sucesso!");
                    buscarPetsDoSupabase(); // Atualiza a lista
                } catch (err) {
                    console.error(err);
                    alert("Ocorreu um erro ao excluir o pet: " + err.message);
                }
            }
        });
    });
}


cadastroPetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nomePet").value;
    const especie = document.getElementById("especiePet").value;
    const raca = document.getElementById("racaPet").value;
    const idade = parseInt(document.getElementById("idadePet").value);
    const localizacao = document.getElementById("localizacaoPet").value;
    const fotoFile = document.getElementById("fotoPet").files[0];
    const donoEmail = localUsuarioAtual ? localUsuarioAtual.email : null; // Quem está logado é o dono

    if (!donoEmail) {
        alert("Você precisa estar logado para cadastrar um pet.");
        return;
    }

    try {
        let foto_url = null;
        if (fotoFile) {
            const { data, error } = await supabaseClient.storage
                .from("fotos-pets")
                .upload(`${Date.now()}-${fotoFile.name}`, fotoFile, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (error) {
                throw new Error("Erro ao fazer upload da imagem: " + error.message);
            }
            foto_url = `${SUPABASE_URL}/storage/v1/object/public/fotos-pets/${data.path}`;
        }

        // Simula a obtenção de coordenadas de localização
        const coordenadas = await obterCoordenadasDaLocalizacao(localizacao);
        if (!coordenadas) {
            alert("Não foi possível encontrar as coordenadas para a localização informada.");
            return;
        }

        const { error } = await supabaseClient.from("pets").insert([
            {
                nome,
                especie,
                raca,
                idade,
                localizacao,
                foto_url,
                dono_email: donoEmail,
                latitude: coordenadas.lat,
                longitude: coordenadas.lng
            },
        ]);

        if (error) {
            throw new Error("Erro ao cadastrar pet: " + error.message);
        }

        alert("Pet cadastrado com sucesso!");
        modalCadastro.classList.remove("active");
        modalCadastro.classList.add("hidden");
        cadastroPetForm.reset();
        buscarPetsDoSupabase(); // Atualiza a lista de pets e o mapa
    } catch (err) {
        console.error(err);
        alert("Ocorreu um erro ao cadastrar o pet: " + err.message);
    }
});


// --- Funções de Chat ---

// Adiciona uma mensagem ao DOM do chat
function addMessageToChat(messageText, type) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", type); // 'sent' ou 'received'
    
    const messageBubble = document.createElement("div");
    messageBubble.classList.add("message-bubble");
    messageBubble.textContent = messageText;

    messageDiv.appendChild(messageBubble);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Rola para o final
}


// Salva a mensagem no Supabase
async function salvarMensagem(petId, remetente, conteudo) {
    try {
        const { data, error } = await supabaseClient
            .from('mensagens_chat')
            .insert([
                {
                    pet_id: petId,
                    remetente_email: remetente,
                    conteudo: conteudo
                }
            ])
            .select();

        if (error) {
            throw new Error(`Erro ao salvar mensagem no Supabase: ${error.message}. Verifique a política RLS de INSERT para a tabela 'mensagens_chat' no Supabase.`);
        }
        console.log("Mensagem salva no Supabase:", data);
    } catch (err) {
        console.error(err);
        alert("Erro ao enviar mensagem.");
    }
}

// Renderiza as mensagens do chat buscando do Supabase
async function renderizarMensagens(petNome) {
    chatMessages.innerHTML = ""; // Limpa o chat antes de carregar as novas mensagens

    const petEncontrado = petsArray.find(p => p.nome === petNome);
    if (!petEncontrado) {
        console.error("Erro: Pet não encontrado para o chat:", petNome);
        chatMessages.innerHTML = "<p>Erro: Pet não encontrado para carregar mensagens.</p>";
        return;
    }
    const petId = petEncontrado.id;
    const donoPetEmail = petEncontrado.dono_email;

    console.log("--- Chamando renderizarMensagens para o pet:", petNome, "(ID:", petId, ") ---");

    try {
        const { data: mensagens, error } = await supabaseClient
            .from('mensagens_chat')
            .select('*')
            .eq('pet_id', petId)
            .order('created_at', { ascending: true }); // Ordena por data

        if (error) {
            console.error("Erro ao buscar mensagens no Supabase:", error);
            chatMessages.innerHTML = `<p>Não foi possível carregar as mensagens: ${error.message}. Verifique o RLS de SELECT na tabela 'mensagens_chat'.</p>`;
            return;
        }

        const usuarioVisualizadorEmail = localUsuarioAtual ? localUsuarioAtual.email : null;
        const isAdmin = (usuarioVisualizadorEmail === "SEU_EMAIL_ADMIN@EXEMPLO.COM"); // ** SUBSTITUA PELO SEU EMAIL DE ADMINISTRADOR REAL **
        
        console.log("Usuário visualizador atual:", usuarioVisualizadorEmail);

        if (mensagens.length === 0) {
            chatMessages.innerHTML = "<p>Nenhuma mensagem ainda neste chat.</p>";
        } else {
            mensagens.forEach(msg => {
                let tipo;
                // Compara o remetente da mensagem (salvo no DB) com o e-mail do usuário logado AGORA
                if (msg.remetente_email === usuarioVisualizadorEmail) {
                    tipo = "sent";
                } else {
                    tipo = "received";
                }

                const dataMensagem = new Date(msg.created_at);
                const horaFormatada = dataMensagem.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                console.log(`Mensagem: "${msg.conteudo}" | Remetente DB: "${msg.remetente_email}" | Tipo Calculado: "${tipo}"`);
                
                addMessageToChat(`${msg.conteudo} (${horaFormatada})`, tipo);
            });
        }
        chatMessages.scrollTop = chatMessages.scrollHeight; // Garante que o scroll vá para o final
    } catch (err) {
        console.error("Erro inesperado ao renderizar mensagens:", err);
        chatMessages.innerHTML = `<p>Ocorreu um erro inesperado ao exibir as mensagens: ${err.message}</p>`;
    }
}

// Event listener para o botão de enviar mensagem no chat
sendMessageBtn.addEventListener("click", async () => {
    const message = chatMessageInput.value.trim();
    if (!message || !currentPetId) { // Verifica se há mensagem e um pet ativo
        alert("Nenhuma mensagem para enviar ou pet não selecionado.");
        return;
    }

    const remetenteParaSalvar = localUsuarioAtual ? localUsuarioAtual.email : null;

    if (!remetenteParaSalvar) {
        alert("Você precisa estar logado para enviar mensagens.");
        return;
    }

    const petNomeAtual = chatPetNome.textContent.split(' com ')[0].replace("Chat sobre ", ""); // Ajuste no texto

    await salvarMensagem(currentPetId, remetenteParaSalvar, message);
    chatMessageInput.value = ""; // Limpa o input
    await renderizarMensagens(petNomeAtual); // Recarrega as mensagens do chat
});


// --- Lógica do Histórico de Conversas (Tutor/Admin) ---
verConversasBtn.addEventListener("click", async () => {
    const usuarioLogadoEmail = localUsuarioAtual ? localUsuarioAtual.email : null;
    const isAdmin = (usuarioLogadoEmail === "SEU_EMAIL_ADMIN@EXEMPLO.COM"); // ** SUBSTITUA PELO SEU EMAIL DE ADMINISTRADOR REAL **

    if (!usuarioLogadoEmail) { // Se não há usuário logado
        alert("Você precisa estar logado para ver as conversas.");
        return;
    }

    historicoMensagensContainer.innerHTML = ""; // Limpa o histórico anterior

    try {
        let petsParaHistorico = [];

        if (isAdmin) {
            // Se for admin, buscar todos os pets para ver todas as conversas
            const { data, error } = await supabaseClient
                .from('pets')
                .select('id, nome, dono_email');
            if (error) throw new Error("Erro ao buscar todos os pets para admin: " + error.message);
            petsParaHistorico = data;
        } else {
            // Se for cliente (tutor), buscar apenas os pets que pertencem ao cliente logado
            const { data, error } = await supabaseClient
                .from('pets')
                .select('id, nome, dono_email')
                .eq('dono_email', usuarioLogadoEmail);
            if (error) throw new Error("Erro ao buscar seus pets: " + error.message);
            petsParaHistorico = data;
        }

        if (petsParaHistorico.length === 0) {
            historicoMensagensContainer.innerHTML = "<p>Nenhuma conversa encontrada para seus pets ou para admin.</p>";
        } else {
            for (const pet of petsParaHistorico) {
                // Buscar todas as mensagens para este pet
                const { data: mensagensDoPet, error: mensagensError } = await supabaseClient
                    .from('mensagens_chat')
                    .select('*')
                    .eq('pet_id', pet.id)
                    .order('created_at', { ascending: true });

                if (mensagensError) {
                    console.error(`Erro ao buscar mensagens para o pet ${pet.nome}:`, mensagensError);
                    continue; // Pula para o próximo pet se houver erro
                }

                const bloco = document.createElement("div");
                bloco.classList.add("historico-bloco");
                bloco.innerHTML = `<h3>Conversas sobre: ${pet.nome} (Dono: ${pet.dono_email})</h3>`;

                if (mensagensDoPet.length > 0) {
                    // Agrupar mensagens por remetente (cliente que iniciou a conversa)
                    const conversasAgrupadas = {};
                    mensagensDoPet.forEach(msg => {
                        // Tentar encontrar o "outro lado" da conversa para agrupar
                        let outroParticipanteEmail;
                        if (msg.remetente_email === pet.dono_email || msg.remetente_email === "SEU_EMAIL_ADMIN@EXEMPLO.COM") { // ** SUBSTITUA PELO SEU EMAIL DE ADMINISTRADOR REAL **
                            // Se a mensagem é do dono ou admin, o "outro participante" é quem não é dono/admin
                            const clientesNaConversa = mensagensDoPet.filter(m =>
                                m.remetente_email !== pet.dono_email && m.remetente_email !== "SEU_EMAIL_ADMIN@EXEMPLO.COM" // ** SUBSTITUA PELO SEU EMAIL DE ADMINISTRADOR REAL **
                            ).map(m => m.remetente_email);
                            outroParticipanteEmail = clientesNaConversa.length > 0 ? clientesNaConversa[0] : "Cliente Desconhecido";
                        } else {
                            // Se a mensagem não é do dono nem do admin, ela é de um cliente
                            outroParticipanteEmail = msg.remetente_email;
                        }

                        if (!conversasAgrupadas[outroParticipanteEmail]) {
                            conversasAgrupadas[outroParticipanteEmail] = [];
                        }
                        conversasAgrupadas[outroParticipanteEmail].push(msg);
                    });

                    for (const [participante, msgs] of Object.entries(conversasAgrupadas)) {
                        const subBlocoConversa = document.createElement("div");
                        subBlocoConversa.classList.add("conversa-individual");
                        
                        // Mostra o email do participante para o tutor/admin
                        subBlocoConversa.innerHTML = `<h4>Conversa com: ${participante}</h4>`;
                        
                        msgs.forEach(msg => {
                            const linha = document.createElement("p");
                            const remetenteDisplay = msg.remetente_email === usuarioLogadoEmail ? "Você" : 
                                                     (msg.remetente_email === "SEU_EMAIL_ADMIN@EXEMPLO.COM" ? "Administrador" : msg.remetente_email); // ** SUBSTITUA PELO SEU EMAIL DE ADMINISTRADOR REAL **
                            linha.innerHTML = `<strong>${remetenteDisplay}:</strong> ${msg.conteudo} <em>(${new Date(msg.created_at).toLocaleString()})</em>`;
                            subBlocoConversa.appendChild(linha);
                        });

                        // Botão de responder para o tutor/admin
                        if (usuarioLogadoEmail === pet.dono_email || isAdmin) {
                            const responderBtn = document.createElement("button");
                            responderBtn.classList.add("responder-btn");
                            responderBtn.textContent = `Responder a ${participante.split('@')[0]}`; // Mostra só o nome antes do @
                            responderBtn.dataset.petId = pet.id;
                            responderBtn.dataset.petNome = pet.nome;
                            responderBtn.dataset.clienteEmail = participante; // Salva o email do cliente para o chat
                            subBlocoConversa.appendChild(responderBtn);
                        }

                        bloco.appendChild(subBlocoConversa);
                    }
                } else {
                    bloco.innerHTML += `<p>Nenhuma mensagem ainda sobre este pet.</p>`;
                }
                historicoMensagensContainer.appendChild(bloco);
            }
        }

        modalHistorico.classList.remove("hidden");
        modalHistorico.classList.add("active");

        // Adiciona event listeners para os novos botões "Responder"
        document.querySelectorAll(".responder-btn").forEach(button => {
            button.addEventListener("click", (event) => {
                currentPetId = event.target.dataset.petId;
                const petNome = event.target.dataset.petNome;
                const clienteEmailParaChat = event.target.dataset.clienteEmail;
                
                // Abre o modal de chat
                chatPetNome.textContent = `Chat sobre ${petNome} com ${clienteEmailParaChat.split('@')[0]}`;
                modalHistorico.classList.remove("active"); // Fecha o histórico
                modalHistorico.classList.add("hidden");
                modalChat.classList.remove("hidden");
                modalChat.classList.add("active");
                renderizarMensagens(petNome); // Recarrega o chat para o pet selecionado
            });
        });

    } catch (error) {
        console.error("Erro ao carregar histórico de conversas:", error);
        alert("Ocorreu um erro ao carregar o histórico de conversas.");
    }
});


// --- Funções de Mapa (Leaflet) ---
function inicializarMapa() {
    if (!map) { // Inicializa o mapa apenas uma vez
        map = L.map('map').setView([-25.4284, -49.2733], 13); // Coordenadas de Curitiba, Brasil
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }
}

let markers = []; // Para armazenar os marcadores atuais no mapa

function atualizarMapaComPets(pets) {
    if (!map) {
        console.warn("Mapa não inicializado. Chamando inicializarMapa().");
        inicializarMapa(); // Garante que o mapa esteja inicializado antes de adicionar marcadores
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


// --- Inicialização ---
// A ordem é importante:
// 1. Verificar login (para ajustar UI)
// 2. Buscar pets (e consequentemente renderizar pets e atualizar mapa)
buscarPetsDoSupabase(); // Carrega os pets e atualiza o mapa ao iniciar
// O mapa agora é inicializado em 'DOMContentLoaded' e atualizado após buscarPetsDoSupabase