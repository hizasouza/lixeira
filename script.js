const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dimensões da tela
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Dados das lixeiras (imagens serão carregadas mais tarde)
const lixeiras = {
  "Vidro": { x: 20, y: 50, width: 80, height: 80, image: null, src: 'lixeira_vidro.png'},
  "Plástico": { x: 110, y: 50, width: 80, height: 80, image: null, src: 'lixeira_plastico.png' },
  "Metal": { x: 205, y: 50, width: 80, height: 80, image: null, src: 'lixeira_metal.png' },
  "Papel": { x: 305, y: 50, width: 80, height: 80, image: null, src: 'lixeira_papel.png' }
};

// Lista de lixos
const tiposDeLixo = {
  "Vidro": [
    { name: "caco", image: null, src: 'lixo_vidro_1.png'},
    { name: "garrafa", image: null, src: 'lixo_vidro_2.png' }
  ],
  "Plástico": [
    { name: "garrafa PET", image: null, src: 'lixo_plastico_1.png' },
    { name: "borrifador", image: null, src: 'lixo_plastico_2.png' }
  ],
  "Metal": [
    { name: "lata", image: null, src: 'lixo_metal_1.png' },
    { name: "ferramenta", image: null, src: 'lixo_metal_2.png' }
  ],
  "Papel": [
    { name: "jornal", image: null, src: 'lixo_papel_1.png' },
    { name: "papelao", image: null, src: 'lixo_papel_2.png' }
  ]
};

let lixoAtual = null; // O lixo que o jogador está arremessando
let lixoImage = new Image(); // A imagem do lixo atual

// Elementos da interface
const timerDisplay = document.getElementById("timer");
const scoreDisplay = document.getElementById("score");
const itemInfoDisplay = document.getElementById("itemInfo");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
let gameRunning = false;
let gamePaused = false;
let timerInterval = null;
let remainingTime = 60;
let score = 0;

// Variáveis para rastrear o arremesso
let startX = 0;
let startY = 0;
let startTime = 0;

//Gravidade
const gravidade = 0.5; // Ajuste conforme necessário

//=====================================================================================
// Funções Utilitárias e de Carregamento
//=====================================================================================

// Função para carregar uma imagem e retornar uma Promise
function carregarImagem(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Falha ao carregar imagem de ${src}`));
        img.src = src;
    });
}

// Função para obter um lixo aleatório
function escolherLixoAleatorio() {
    const tipos = Object.keys(tiposDeLixo);
    const tipoAleatorio = tipos[Math.floor(Math.random() * tipos.length)];
    const lixosDoTipo = tiposDeLixo[tipoAleatorio];
    const lixoAleatorio = lixosDoTipo[Math.floor(Math.random() * lixosDoTipo.length)];

    return {
        tipo: tipoAleatorio,
        lixo: lixoAleatorio
    };
}

async function criarNovoLixo() {
    const novoLixo = escolherLixoAleatorio();
    lixoAtual = {
        tipo: novoLixo.tipo,
        lixo: novoLixo.lixo,
        x: canvasWidth / 2,
        y: canvasHeight - 100,
        width: 50,
        height: 50,
        vx: 0,
        vy: 0,
        arremessado: false
    };
    try {
        lixoAtual.lixo.image = await carregarImagem(lixoAtual.lixo.src);
        itemInfoDisplay.innerText = "Lixo: " + lixoAtual.lixo.name + " (" + lixoAtual.tipo + ")";
    } catch (error) {
        console.error("Erro ao carregar imagem do lixo:", error);
    }
}

//=====================================================================================
// Funções de Lógica do Jogo
//=====================================================================================

function atualizarLixo() {
    if (lixoAtual && lixoAtual.arremessado) {
        lixoAtual.vy += gravidade;
        lixoAtual.x += lixoAtual.vx;
        lixoAtual.y += lixoAtual.vy;

        // Checar colisão com as lixeiras
        for (const tipo in lixeiras) {
            const lixeira = lixeiras[tipo];
            if (lixoAtual.x > lixeira.x && lixoAtual.x < lixeira.x + lixeira.width &&
                lixoAtual.y > lixeira.y && lixoAtual.y < lixeira.y + lixeira.height) {
                if (tipo === lixoAtual.tipo) {
                    score++;
                    scoreDisplay.innerText = "Pontuação: " + score;
                }
                criarNovoLixo(); // Cria um novo lixo após a colisão
                return; // Sai da função para evitar múltiplas colisões
            }
        }

        // Se sair da tela, cria um novo lixo
        if (lixoAtual.y > canvasHeight) {
            criarNovoLixo();
        }
    }
}

//=====================================================================================
// Funções de Desenho
//=====================================================================================

function desenharLixeiras() {
    for (const tipo in lixeiras) {
        const lixeira = lixeiras[tipo];
        if (lixeira.image) {
            ctx.drawImage(lixeira.image, lixeira.x, lixeira.y, lixeira.width, lixeira.height);
        }
    }
}

function desenharLixo() {
    if (lixoAtual && lixoAtual.lixo.image) {
        ctx.drawImage(lixoAtual.lixo.image, lixoAtual.x - lixoAtual.width / 2, lixoAtual.y - lixoAtual.height / 2, lixoAtual.width, lixoAtual.height);
    }
}

function desenhar() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    desenharLixeiras();
    desenharLixo();
}

//=====================================================================================
// Funções de Interação (Arremesso)
//=====================================================================================

canvas.addEventListener('mousedown', function (e) {
    if (!gameRunning || gamePaused) return;
    startX = e.clientX - canvas.offsetLeft;
    startY = e.clientY - canvas.offsetTop;
    startTime = Date.now();
});

canvas.addEventListener('mouseup', function (e) {
    if (!gameRunning || gamePaused) return;
    const endX = e.clientX - canvas.offsetLeft;
    const endY = e.clientY - canvas.offsetTop;
    const endTime = Date.now();
    const dt = (endTime - startTime) / 1000;

    if (dt === 0) return;

    lixoAtual.vx = (endX - startX) / dt * 0.1;
    lixoAtual.vy = (endY - startY) / dt * 0.1;
    lixoAtual.arremessado = true;
});

canvas.addEventListener('touchstart', function (e) {
    if (!gameRunning || gamePaused) return;
    e.preventDefault(); // Impede o comportamento padrão do touch
    const touch = e.touches[0];
    startX = touch.clientX - canvas.offsetLeft;
    startY = touch.clientY - canvas.offsetTop;
    startTime = Date.now();
});

canvas.addEventListener('touchend', function (e) {
    if (!gameRunning || gamePaused) return;
    e.preventDefault(); // Impede o comportamento padrão do touch
    const touch = e.changedTouches[0];
    const endX = touch.clientX - canvas.offsetLeft;
    const endY = touch.clientY - canvas.offsetTop;
    const endTime = Date.now();
    const dt = (endTime - startTime) / 1000;

    if (dt === 0) return;

    lixoAtual.vx = (endX - startX) / dt * 0.1;
    lixoAtual.vy = (endY - startY) / dt * 0.1;
    lixoAtual.arremessado = true;
});

//=====================================================================================
// Funções de Controle do Jogo
//=====================================================================================

function iniciarCronometro() {
    timerInterval = setInterval(() => {
        if (!gamePaused && gameRunning) {
            remainingTime--;
            timerDisplay.innerText = "Tempo: " + remainingTime;

            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                gameRunning = false;
                alert("Fim de jogo! Sua pontuação: " + score);
            }
        }
    }, 1000);
}

async function iniciarJogo() {
    gameRunning = true;
    gamePaused = false;
    remainingTime = 60;
    score = 0;
    timerDisplay.innerText = "Tempo: " + remainingTime;
    scoreDisplay.innerText = "Pontuação: " + score;
    await criarNovoLixo();
    iniciarCronometro();
    pauseBtn.innerText = "Pausar";
}

function pausarJogo() {
    gamePaused = !gamePaused;
    pauseBtn.innerText = gamePaused ? "Continuar" : "Pausar";
}

function reiniciarJogo() {
    clearInterval(timerInterval); // Limpa o intervalo anterior
    iniciarJogo();
}

//=====================================================================================
// Loop Principal do Jogo
//=====================================================================================

function atualizarJogo() {
    if (!gamePaused && gameRunning) {
        atualizarLixo();
    }
    desenhar();

    requestAnimationFrame(atualizarJogo);
}

//=====================================================================================
// Inicialização
//=====================================================================================

async function carregarLixeiras() {
    for (const tipo in lixeiras) {
        try {
            lixeiras[tipo].image = await carregarImagem(lixeiras[tipo].src);
        } catch (error) {
            console.error(`Erro ao carregar lixeira ${tipo}:`, error);
        }
    }
    console.log("Todas as lixeiras foram carregadas!");
}

async function inicializar() {
    await carregarLixeiras();
    // Adiciona os event listeners aos botões
    startBtn.addEventListener("click", iniciarJogo);
    pauseBtn.addEventListener("click", pausarJogo);
    restartBtn.addEventListener("click", reiniciarJogo);

    atualizarJogo(); // Inicia o loop do jogo
}

inicializar();
