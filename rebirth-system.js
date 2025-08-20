class RebirthSystem {
    constructor(game) {
        this.game = game;
        this.rebirthPoints = 0;
        this.totalRebirths = 0;
        this.rebirthMultipliers = {
            clickPower: 1,
            ppsMultiplier: 1,
            costReduction: 1
        };
        this.rebirthUpgrades = {
            clickPower: {
                cost: 1,
                multiplier: 2,
                owned: 0,
                maxLevel: 10
            },
            ppsMultiplier: {
                cost: 1,
                multiplier: 1.5,
                owned: 0,
                maxLevel: 10
            },
            costReduction: {
                cost: 1,
                multiplier: 0.9,
                owned: 0,
                maxLevel: 5
            },
            startingBonus: {
                cost: 5,
                bonus: 1000,
                owned: 0,
                maxLevel: 5
            }
        };
        
        this.init();
    }

    init() {
        this.loadRebirthData();
        this.createRebirthUI();
    }

    // Calculate rebirth points based on total pizzas earned
    calculateRebirthPoints() {
        const totalPizzas = this.game.pizzas;
        const points = Math.floor(Math.pow(totalPizzas / 1000, 0.5));
        return Math.max(0, points);
    }

    // Check if player can rebirth
    canRebirth() {
        return this.game.pizzas >= 1000;
    }

    // Perform rebirth
    rebirth() {
        if (!this.canRebirth()) {
            alert(`Você precisa de pelo menos 1000 pizzas para renascer!`);
            return;
        }

        const points = this.calculateRebirthPoints();
        if (points === 0) {
            alert(`Você não ganhará pontos de renascimento com ${Math.floor(this.game.pizzas)} pizzas. Continue jogando!`);
            return;
        }

        if (confirm(`Renascer lhe dará ${points} pontos de renascimento e resetará seu progresso. Continuar?`)) {
            this.rebirthPoints += points;
            this.totalRebirths++;
            
            // Apply starting bonus if purchased
            const startingBonus = this.rebirthUpgrades.startingBonus.owned * this.rebirthUpgrades.startingBonus.bonus;
            
            // Reset game progress
            this.resetGameProgress();
            
            // Apply starting bonus
            if (startingBonus > 0) {
                this.game.pizzas = startingBonus;
            }
            
            this.updateRebirthMultipliers();
            this.saveRebirthData();
            this.game.updateDisplay();
            this.updateRebirthUI();
            
            alert(`Renascimento completo! Você ganhou ${points} pontos de renascimento.`);
        }
    }

    // Reset game progress but keep rebirth upgrades
    resetGameProgress() {
        this.game.pizzas = 0;
        
        // Reset all upgrades
        for (const upgrade of Object.values(this.game.upgrades)) {
            upgrade.owned = 0;
            upgrade.cost = this.getOriginalCost(upgrade);
        }
        
        this.game.updatePPS();
    }

    // Get original cost for upgrades
    getOriginalCost(upgrade) {
        const originalCosts = {
            cursor: 15,
            oven: 100,
            chef: 500,
            factory: 2000,
            portal: 10000
        };
        
        for (const [type, data] of Object.entries(this.game.upgrades)) {
            if (data === upgrade) {
                return originalCosts[type];
            }
        }
        return 100;
    }

    // Update rebirth multipliers based on upgrades
    updateRebirthMultipliers() {
        this.rebirthMultipliers.clickPower = Math.pow(
            this.rebirthUpgrades.clickPower.multiplier, 
            this.rebirthUpgrades.clickPower.owned
        );
        
        this.rebirthMultipliers.ppsMultiplier = Math.pow(
            this.rebirthUpgrades.ppsMultiplier.multiplier, 
            this.rebirthUpgrades.ppsMultiplier.owned
        );
        
        this.rebirthMultipliers.costReduction = Math.pow(
            this.rebirthUpgrades.costReduction.multiplier, 
            this.rebirthUpgrades.costReduction.owned
        );
    }

    // Apply rebirth bonuses to game calculations
    applyRebirthBonuses() {
        // Apply click power multiplier
        this.game.clickPower *= this.rebirthMultipliers.clickPower;
        
        // Apply PPS multiplier
        this.game.pps *= this.rebirthMultipliers.ppsMultiplier;
        
        // Apply cost reduction
        for (const upgrade of Object.values(this.game.upgrades)) {
            upgrade.cost = Math.floor(upgrade.cost * this.rebirthMultipliers.costReduction);
        }
    }

    // Buy rebirth upgrade
    buyRebirthUpgrade(type) {
        const upgrade = this.rebirthUpgrades[type];
        
        if (upgrade.owned >= upgrade.maxLevel) {
            alert(`Este upgrade já está no nível máximo!`);
            return;
        }
        
        if (this.rebirthPoints >= upgrade.cost) {
            this.rebirthPoints -= upgrade.cost;
            upgrade.owned++;
            upgrade.cost = Math.floor(upgrade.cost * 1.5);
            
            this.updateRebirthMultipliers();
            this.saveRebirthData();
            this.updateRebirthUI();
            
            // Apply new bonuses immediately
            this.applyRebirthBonuses();
            this.game.updateDisplay();
        } else {
            alert(`Você precisa de ${upgrade.cost} pontos de renascimento!`);
        }
    }

    // Create rebirth UI
    createRebirthUI() {
        const rebirthSection = document.createElement('div');
        rebirthSection.id = 'rebirth-section';
        rebirthSection.innerHTML = `
            <div class="rebirth-container">
                <h2>🔄 Sistema de Renascimento</h2>
                
                <div class="rebirth-info">
                    <div class="rebirth-stat">
                        <span class="rebirth-label">Pontos de Renascimento:</span>
                        <span id="rebirth-points" class="rebirth-value">0</span>
                    </div>
                    <div class="rebirth-stat">
                        <span class="rebirth-label">Total de Renascimentos:</span>
                        <span id="total-rebirths" class="rebirth-value">0</span>
                    </div>
                </div>

                <div class="rebirth-actions">
                    <button id="rebirth-button" class="rebirth-btn">
                        Renascer
                        <span class="rebirth-tooltip">Requer 1000 pizzas</span>
                    </button>
                </div>

                <div class="rebirth-upgrades">
                    <h3>Upgrades de Renascimento</h3>
                    <div class="rebirth-upgrades-container">
                        <div class="rebirth-upgrade" data-rebirth="clickPower">
                            <div class="rebirth-upgrade-info">
                                <div class="rebirth-upgrade-name">Poder de Clique</div>
                                <div class="rebirth-upgrade-desc">Aumenta o poder de clique em 2x</div>
                                <div class="rebirth-upgrade-cost">Custo: <span id="clickPower-cost">1</span> RP</div>
                                <div class="rebirth-upgrade-level">Nível: <span id="clickPower-level">0</span>/10</div>
                            </div>
                        </div>

                        <div class="rebirth-upgrade" data-rebirth="ppsMultiplier">
                            <div class="rebirth-upgrade-info">
                                <div class="rebirth-upgrade-name">Multiplicador PPS</div>
                                <div class="rebirth-upgrade-desc">Aumenta PPS em 1.5x</div>
                                <div class="rebirth-upgrade-cost">Custo: <span id="ppsMultiplier-cost">1</span> RP</div>
                                <div class="rebirth-upgrade-level">Nível: <span id="ppsMultiplier-level">0</span>/10</div>
                            </div>
                        </div>

                        <div class="rebirth-upgrade" data-rebirth="costReduction">
                            <div class="rebirth-upgrade-info">
                                <div class="rebirth-upgrade-name">Redução de Custo</div>
                                <div class="rebirth-upgrade-desc">Reduz custos em 10%</div>
                                <div class="rebirth-upgrade-cost">Custo: <span id="costReduction-cost">1</span> RP</div>
                                <div class="rebirth-upgrade-level">Nível: <span id="costReduction-level">0</span>/5</div>
                            </div>
                        </div>

                        <div class="rebirth-upgrade" data-rebirth="startingBonus">
                            <div class="rebirth-upgrade-info">
                                <div class="rebirth-upgrade-name">Bônus Inicial</div>
                                <div class="rebirth-upgrade-desc">Começa com 1000 pizzas</div>
                                <div class="rebirth-upgrade-cost">Custo: <span id="startingBonus-cost">5</span> RP</div>
                                <div class="rebirth-upgrade-level">Nível: <span id="startingBonus-level">0</span>/5</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after upgrades section
        const upgradesSection = document.querySelector('.upgrades-section');
        upgradesSection.parentNode.insertBefore(rebirthSection, upgradesSection.nextSibling);
        
        // Bind events
        document.getElementById('rebirth-button').addEventListener('click', () => this.rebirth());
        
        document.querySelectorAll('.rebirth-upgrade').forEach(upgrade => {
            upgrade.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.rebirth;
                this.buyRebirthUpgrade(type);
            });
        });
    }

    // Update rebirth UI
    updateRebirthUI() {
        document.getElementById('rebirth-points').textContent = this.rebirthPoints;
        document.getElementById('total-rebirths').textContent = this.totalRebirths;
        
        // Update rebirth upgrade displays
        for (const [type, upgrade] of Object.entries(this.rebirthUpgrades)) {
            document.getElementById(`${type}-cost`).textContent = upgrade.cost;
            document.getElementById(`${type}-level`).textContent = upgrade.owned;
            
            const element = document.querySelector(`[data-rebirth="${type}"]`);
            if (upgrade.owned >= upgrade.maxLevel) {
                element.classList.add('max-level');
                element.classList.remove('available');
            } else if (this.rebirthPoints >= upgrade.cost) {
                element.classList.add('available');
                element.classList.remove('unavailable', 'max-level');
            } else {
                element.classList.add('unavailable');
                element.classList.remove('available', 'max-level');
            }
        }
        
        // Update rebirth button
        const rebirthButton = document.getElementById('rebirth-button');
        if (this.canRebirth()) {
            rebirthButton.classList.add('available');
            rebirthButton.classList.remove('unavailable');
        } else {
            rebirthButton.classList.add('unavailable');
            rebirthButton.classList.remove('available');
        }
    }

    // Save rebirth data
    saveRebirthData() {
        const rebirthData = {
            rebirthPoints: this.rebirthPoints,
            totalRebirths: this.totalRebirths,
            rebirthUpgrades: this.rebirthUpgrades
        };
        localStorage.setItem('pizzaClickerRebirth', JSON.stringify(rebirthData));
    }

    // Load rebirth data
    loadRebirthData() {
        const rebirthData = localStorage.getItem('pizzaClickerRebirth');
        if (rebirthData) {
            const data = JSON.parse(rebirthData);
            this.rebirthPoints = data.rebirthPoints || 0;
            this.totalRebirths = data.totalRebirths || 0;
            this.rebirthUpgrades = { ...this.rebirthUpgrades, ...data.rebirthUpgrades };
            this.updateRebirthMultipliers();
        }
    }
}
