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
    playerName: '',
    rebirths: 0,
    rebirthMultiplier: 1
};

// Elementos DOM
const cookieElement = document.getElementById('cookie');
const cookiesDisplay = document.getElementById('cookies');
const cpsDisplay = document.getElementById('cps');
const clickEffect = document.getElementById('clickEffect');
const achievementList = document.getElementById('achievementList');

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
    const clickValue = gameState.clickPower * gameState.rebirthMultiplier;
    gameState.cookies += clickValue;
    gameState.totalCookiesEarned += clickValue;
    
    // Play click sound
    audioManager.playSound('click');
    
    // Enhanced visual effect
    const rect = cookieElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = `+${formatNumber(clickValue)}`;
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
        gameState.cookiesPerSecond += count * production * gameState.rebirthMultiplier;
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

// Salvar jogo com verificação e backup
function saveGame() {
    try {
        const saveData = JSON.stringify(gameState);
        
        // Criar backup do save anterior
        const currentSave = localStorage.getItem('cookieClickerSave');
        if (currentSave) {
            localStorage.setItem('cookieClickerSaveBackup', currentSave);
        }
        
        // Salvar novo estado
        localStorage.setItem('cookieClickerSave', saveData);
        
        // Adicionar timestamp do último save
        localStorage.setItem('cookieClickerLastSave', new Date().toISOString());
        
        // Mostrar indicador visual de save
        showSaveIndicator();
        
    } catch (error) {
        console.error('Erro ao salvar jogo:', error);
    }
}

// Carregar jogo com verificação de integridade
function loadGame() {
    try {
        const saved = localStorage.getItem('cookieClickerSave');
        
        if (!saved) {
            // Tentar carregar backup se existir
            const backup = localStorage.getItem('cookieClickerSaveBackup');
            if (backup) {
                gameState = { ...gameState, ...JSON.parse(backup) };
                console.warn('Carregando jogo do backup');
            }
            return;
        }
        
        const savedState = JSON.parse(saved);
        
        // Validar estrutura básica do save
        if (typeof savedState.cookies === 'number' && 
            typeof savedState.totalCookiesEarned === 'number') {
            gameState = { ...gameState, ...savedState };
            updateCookiesPerSecond();
            console.log('Jogo carregado com sucesso!');
        } else {
            console.warn('Save corrompido, usando valores padrão');
        }
        
    } catch (error) {
        console.error('Erro ao carregar jogo:', error);
        
        // Tentar carregar backup
        const backup = localStorage.getItem('cookieClickerSaveBackup');
        if (backup) {
            gameState = { ...gameState, ...JSON.parse(backup) };
            console.warn('Carregando jogo do backup após erro');
        }
    }
}

// Indicador visual de save
function showSaveIndicator() {
    const indicator = document.createElement('div');
    indicator.textContent = '💾 Salvo!';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
        animation: fadeInOut 2s ease-in-out;
    `;
    
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        indicator.remove();
    }, 2000);
}

// CSS para animação do indicador
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-10px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);

// Calcular custo de renascimento (1 milhão de cookies * multiplicador atual)
function getRebirthCost() {
    return 1000000 * Math.pow(10, gameState.rebirths);
}

// Renascimento - resetar progresso mas ganhar multiplicador permanente
function rebirthGame() {
    const rebirthCost = getRebirthCost();
    
    if (gameState.totalCookiesEarned < rebirthCost) {
        alert(`Você precisa de ${formatNumber(rebirthCost)} cookies totais para renascer!\nAtualmente: ${formatNumber(gameState.totalCookiesEarned)}`);
        return;
    }
    
    const newMultiplier = gameState.rebirthMultiplier * 2;
    const rebirthCount = gameState.rebirths + 1;
    
    if (confirm(`Deseja renascer?\n\nBenefícios:\n• Multiplicador permanente: ${newMultiplier}x\n• Renascimentos: ${rebirthCount}\n\nCusto: ${formatNumber(rebirthCost)} cookies totais\n\nIsso resetará todo seu progresso!`)) {
        // Salvar apenas dados de renascimento
        const rebirthData = {
            rebirths: rebirthCount,
            rebirthMultiplier: newMultiplier,
            playerName: gameState.playerName
        };
        
        // Resetar jogo mas manter dados de renascimento
        localStorage.removeItem('cookieClickerSave');
        localStorage.removeItem('cookieClickerLeaderboard');
        localStorage.setItem('cookieClickerRebirth', JSON.stringify(rebirthData));
        
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

// Função para resetar o jogo
function resetGame() {
    if (confirm('Tem certeza que deseja resetar o jogo? Todo o progresso será perdido.')) {
        localStorage.removeItem('cookieClickerSave');
        localStorage.removeItem('cookieClickerSaveBackup');
        localStorage.removeItem('cookieClickerLastSave');
        localStorage.removeItem('cookieClickerRebirth');
        location.reload();
    }
}

// Iniciar o jogo
initGame();

// Jogo iniciado sem música
