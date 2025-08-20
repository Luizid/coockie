class PizzaClicker {
    constructor() {
        this.pizzas = 0;
        this.pps = 0;
        this.clickPower = 1;
        
        this.upgrades = {
            cursor: {
                cost: 15,
                owned: 0,
                pps: 0.1,
                multiplier: 1.15
            },
            oven: {
                cost: 100,
                owned: 0,
                pps: 1,
                multiplier: 1.15
            },
            chef: {
                cost: 500,
                owned: 0,
                pps: 5,
                multiplier: 1.15
            },
            factory: {
                cost: 2000,
                owned: 0,
                pps: 20,
                multiplier: 1.15
            },
            portal: {
                cost: 10000,
                owned: 0,
                pps: 100,
                multiplier: 1.15
            }
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.startGameLoop();
        this.loadGame();
    }

    bindEvents() {
        const pizza = document.getElementById('pizza');
        pizza.addEventListener('click', () => this.clickPizza());
        
        // Bind upgrade clicks
        document.querySelectorAll('.upgrade').forEach(upgrade => {
            upgrade.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.upgrade;
                this.buyUpgrade(type);
            });
        });
    }

    clickPizza() {
        this.pizzas += this.clickPower;
        this.updateDisplay();
        this.showFloatingPizza();
        this.playClickSound();
    }

    showFloatingPizza() {
        const floatingPizza = document.getElementById('floating-pizza');
        const pizza = document.getElementById('pizza');
        const rect = pizza.getBoundingClientRect();
        
        floatingPizza.style.left = rect.left + rect.width / 2 + 'px';
        floatingPizza.style.top = rect.top + 'px';
        floatingPizza.style.display = 'block';
        
        setTimeout(() => {
            floatingPizza.style.display = 'none';
        }, 1000);
    }

    playClickSound() {
        // Create a simple click sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    buyUpgrade(type) {
        const upgrade = this.upgrades[type];
        
        if (this.pizzas >= upgrade.cost) {
            this.pizzas -= upgrade.cost;
            upgrade.owned++;
            upgrade.cost = Math.floor(upgrade.cost * upgrade.multiplier);
            
            this.updatePPS();
            this.updateDisplay();
            this.saveGame();
        }
    }

    updatePPS() {
        this.pps = 0;
        for (const [type, upgrade] of Object.entries(this.upgrades)) {
            this.pps += upgrade.owned * upgrade.pps;
        }
    }

    updateDisplay() {
        document.getElementById('pizza-count').textContent = Math.floor(this.pizzas);
        document.getElementById('pizza-counter').textContent = Math.floor(this.pizzas);
        document.getElementById('pps').textContent = this.pps.toFixed(1);
        
        // Update upgrade displays
        for (const [type, upgrade] of Object.entries(this.upgrades)) {
            document.getElementById(`${type}-cost`).textContent = Math.floor(upgrade.cost);
            document.getElementById(`${type}-owned`).textContent = upgrade.owned;
            
            const upgradeElement = document.querySelector(`[data-upgrade="${type}"]`);
            if (this.pizzas >= upgrade.cost) {
                upgradeElement.classList.add('available');
                upgradeElement.classList.remove('unavailable');
            } else {
                upgradeElement.classList.add('unavailable');
                upgradeElement.classList.remove('available');
            }
        }
    }

    startGameLoop() {
        setInterval(() => {
            this.pizzas += this.pps / 10; // Divide by 10 for 100ms intervals
            this.updateDisplay();
        }, 100);
    }

    saveGame() {
        const saveData = {
            pizzas: this.pizzas,
            upgrades: this.upgrades
        };
        localStorage.setItem('pizzaClickerSave', JSON.stringify(saveData));
    }

    loadGame() {
        const saveData = localStorage.getItem('pizzaClickerSave');
        if (saveData) {
            const data = JSON.parse(saveData);
            this.pizzas = data.pizzas || 0;
            this.upgrades = { ...this.upgrades, ...data.upgrades };
            this.updatePPS();
            this.updateDisplay();
        }
    }

    resetGame() {
        if (confirm('Tem certeza que deseja resetar o jogo?')) {
            localStorage.removeItem('pizzaClickerSave');
            location.reload();
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new PizzaClicker();
    window.game = game;
    
    // Initialize rebirth system
    const rebirthSystem = new RebirthSystem(game);
    game.rebirthSystem = rebirthSystem;
    
    // Apply rebirth bonuses
    rebirthSystem.applyRebirthBonuses();
    
    // Add reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Game';
    resetButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px 20px;
        background: rgba(255, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    `;
    resetButton.addEventListener('click', () => game.resetGame());
    document.body.appendChild(resetButton);
});

// Auto-save every 10 seconds
setInterval(() => {
    if (window.game) {
        window.game.saveGame();
        if (window.game.rebirthSystem) {
            window.game.rebirthSystem.saveRebirthData();
        }
    }
}, 10000);
