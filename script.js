// Estado do jogo
let gameState = {
    cookies: 0,
    cookiesPerSecond: 0,
    clickPower: 1,
    buildings: {
        cursor: { count: 0, baseCost: 15, baseProduction: 0.1 },
        grandma: { count: 0, baseCost: 100, baseProduction: 1 },
        farm: { count: 0, baseCost: 1100, baseProduction: 8 },
        mine: { count: 0, baseCost: 12000, baseProduction: 47 },
        factory: { count: 0, baseCost: 130000, baseProduction: 260 }
    },
    achievements: [],
    totalCookiesEarned: 0,
    playerName: ''
};

// Elementos DOM
const cookieElement = document.getElementById('cookie');
const cookiesDisplay = document.getElementById('cookies');
const cpsDisplay = document.getElementById('cps');
const clickEffect = document.getElementById('clickEffect');
const achievementList = document.getElementById('achievementList');
const leaderboardBody = document.getElementById('leaderboardBody');

// Inicializar o jogo
function initGame() {
    loadGame();
    
    // Solicitar nome do jogador se ainda não foi definido
    if (!gameState.playerName) {
        gameState.playerName = prompt("Digite seu nome de jogador:") || "Jogador Anônimo";
        saveGame();
    }
    
    updateDisplay();
    updateLeaderboard();
    setInterval(produceCookies, 1000);
    setInterval(saveGame, 10000);
    setInterval(updateLeaderboard, 5000); // Atualizar leaderboard a cada 5 segundos
    
    // Initialize audio controls
    initAudioControls();
}

// Initialize audio controls
function initAudioControls() {
    const soundToggle = document.getElementById('soundToggle');
    const volumeSlider = document.getElementById('volumeSlider');
    
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            audioManager.toggleSound();
        });
    }
    
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            audioManager.setVolume(e.target.value / 100);
        });
        volumeSlider.value = audioManager.volume * 100;
    }
}

// Atualizar tabela de classificação
function updateLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem('cookieClickerLeaderboard')) || [];
    
    // Atualizar ou adicionar jogador atual
    const existingIndex = leaderboard.findIndex(p => p.name === gameState.playerName);
    if (existingIndex >= 0) {
        leaderboard[existingIndex].cookies = gameState.cookies;
        leaderboard[existingIndex].cps = gameState.cookiesPerSecond;
    } else {
        leaderboard.push({
            name: gameState.playerName,
            cookies: gameState.cookies,
            cps: gameState.cookiesPerSecond
        });
    }
    
    // Ordenar por cookies decrescente
    leaderboard.sort((a, b) => b.cookies - a.cookies);
    
    // Manter top 10
    leaderboard = leaderboard.slice(0, 10);
    
    // Salvar no localStorage
    localStorage.setItem('cookieClickerLeaderboard', JSON.stringify(leaderboard));
    
    // Atualizar tabela HTML
    if (leaderboardBody) {
        leaderboardBody.innerHTML = '';
        leaderboard.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.name}</td>
                <td>${formatNumber(player.cookies)}</td>
                <td>${formatNumber(player.cps)}</td>
            `;
            leaderboardBody.appendChild(row);
        });
    }
}

// Atualizar display
function updateDisplay() {
    cookiesDisplay.textContent = formatNumber(gameState.cookies);
    cpsDisplay.textContent = formatNumber(gameState.cookiesPerSecond);
    
    // Atualizar custos e contagens
    Object.keys(gameState.buildings).forEach(building => {
        const costElement = document.getElementById(`${building}Cost`);
        const countElement = document.getElementById(`${building}Count`);
        if (costElement && countElement) {
            costElement.textContent = formatNumber(getBuildingCost(building));
            countElement.textContent = gameState.buildings[building].count;
        }
    });
    
    // Verificar conquistas
    checkAchievements();
}

// Formatar números grandes
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toString();
}

// Clicar no cookie
cookieElement.addEventListener('click', (e) => {
    gameState.cookies += gameState.clickPower;
    gameState.totalCookiesEarned += gameState.clickPower;
    
    // Play click sound
    audioManager.playSound('click');
    
    // Enhanced visual effect
    const rect = cookieElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = `+${gameState.clickPower}`;
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    
    cookieElement.appendChild(effect);
    
    setTimeout(() => {
        effect.remove();
    }, 1000);
    
    updateDisplay();
});

// Calcular custo de um prédio
function getBuildingCost(building) {
    const baseCost = gameState.buildings[building].baseCost;
    const count = gameState.buildings[building].count;
    return Math.floor(baseCost * Math.pow(1.15, count));
}

// Comprar prédio
function buyBuilding(building) {
    const cost = getBuildingCost(building);
    if (gameState.cookies >= cost) {
        gameState.cookies -= cost;
        gameState.buildings[building].count++;
        updateCookiesPerSecond();
        updateDisplay();
        
        // Play purchase sound
        audioManager.playSound('purchase');
    }
}

// Atualizar cookies por segundo
function updateCookiesPerSecond() {
    gameState.cookiesPerSecond = 0;
    Object.keys(gameState.buildings).forEach(building => {
        const count = gameState.buildings[building].count;
        const production = gameState.buildings[building].baseProduction;
        gameState.cookiesPerSecond += count * production;
    });
}

// Produzir cookies automaticamente
function produceCookies() {
    const produced = gameState.cookiesPerSecond;
    gameState.cookies += produced;
    gameState.totalCookiesEarned += produced;
    updateDisplay();
}

// Conquistas
const achievements = [
    { id: 'first_click', name: 'Primeiro Clique!', requirement: () => gameState.totalCookiesEarned >= 1 },
    { id: 'hundred_cookies', name: '100 Cookies!', requirement: () => gameState.totalCookiesEarned >= 100 },
    { id: 'thousand_cookies', name: '1.000 Cookies!', requirement: () => gameState.totalCookiesEarned >= 1000 },
    { id: 'million_cookies', name: '1.000.000 Cookies!', requirement: () => gameState.totalCookiesEarned >= 1000000 },
    { id: 'cursor_10', name: '10 Cursores!', requirement: () => gameState.buildings.cursor.count >= 10 },
    { id: 'grandma_10', name: '10 Vovós!', requirement: () => gameState.buildings.grandma.count >= 10 },
    { id: 'farm_10', name: '10 Fábricas!', requirement: () => gameState.buildings.farm.count >= 10 }
];

function checkAchievements() {
    achievements.forEach(achievement => {
        if (!gameState.achievements.includes(achievement.id) && achievement.requirement()) {
            gameState.achievements.push(achievement.id);
            showAchievement(achievement.name);
        }
    });
}

function showAchievement(name) {
    const achievement = document.createElement('div');
    achievement.className = 'achievement';
    achievement.textContent = `🏆 ${name}`;
    achievementList.appendChild(achievement);
    
    setTimeout(() => {
        achievement.remove();
    }, 5000);
}

// Salvar jogo
function saveGame() {
    localStorage.setItem('cookieClickerSave', JSON.stringify(gameState));
}

// Carregar jogo
function loadGame() {
    const saved = localStorage.getItem('cookieClickerSave');
    if (saved) {
        const savedState = JSON.parse(saved);
        gameState = { ...gameState, ...savedState };
        updateCookiesPerSecond();
    }
}

// Resetar jogo
function resetGame() {
    if (confirm('Tem certeza que deseja resetar o jogo?')) {
        localStorage.removeItem('cookieClickerSave');
        localStorage.removeItem('cookieClickerLeaderboard');
        location.reload();
    }
}

// Adicionar event listeners aos prédios
Object.keys(gameState.buildings).forEach(building => {
    const element = document.getElementById(building);
    if (element) {
        element.addEventListener('click', () => buyBuilding(building));
    }
});

// Adicionar botão de reset
const resetButton = document.createElement('button');
resetButton.textContent = 'Resetar Jogo';
resetButton.style.position = 'fixed';
resetButton.style.bottom = '20px';
resetButton.style.right = '20px';
resetButton.style.padding = '10px 20px';
resetButton.style.background = '#ff4444';
resetButton.style.color = 'white';
resetButton.style.border = 'none';
resetButton.style.borderRadius = '5px';
resetButton.style.cursor = 'pointer';
resetButton.addEventListener('click', resetGame);
document.body.appendChild(resetButton);

// Iniciar o jogo
initGame();

// Jogo iniciado sem música
