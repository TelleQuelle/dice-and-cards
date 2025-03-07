const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['♠', '♥', '♦', '♣']; // Spades, Hearts, Diamonds, Clubs
const combinations = {
    '1': ['7', 'J', 'Q', 'K', 'A'], // 150 очков
    '2': ['2', '4', '6', '8', '10', 'A'], // 100 очков
    '3': ['3', '6', '9', 'A'], // 200 очков
    '4': ['4', '8', 'A'], // 250 очков
    '5': ['5', '10', 'A'], // 250 очков
    '6': ['6', 'A'] // 300 очков
};

window.playerProgress = window.playerProgress || {
    highestLevel: 1,
    completedLevels: [],
    walletAddress: "",
    playerName: "",
    levelStats: {},
    hasSeenTutorial: false,
    hasSeenLore: false,
    gold: 0,
    inventory: [],
    equipped: {}
};

const gameState = {
    currentLevel: null,
    turnsLeft: 0,
    currentTurn: 1,
    totalScore: 0,
    turnScore: 0,
    selectedDie: null,
    dice: [0, 0],
    cards: [],
    selectedCards: [],
    attempts: 0,
    activeEffects: {} // Объект для эффектов, например, { doubleRoll: true }
};

// Функция для загрузки прогресса с сервера
window.loadProgress = async function(walletAddress) {
    try {
        console.log('Fetching progress for wallet:', walletAddress);
        const response = await fetch(`http://localhost:3000/api/player/${walletAddress}`);
        if (response.ok) {
            const serverData = await response.json();
            window.playerProgress = {
                ...window.playerProgress,
                ...serverData
            };
            console.log('Progress loaded successfully:', window.playerProgress);
        } else if (response.status === 404) {
            console.log('No profile found, starting fresh with wallet:', walletAddress);
            window.playerProgress.walletAddress = walletAddress;
        } else {
            console.error('Error loading progress, status:', response.status);
        }
    } catch (error) {
        console.error('Failed to load progress:', error);
    }
}

// Функция для сохранения прогресса на сервер
window.saveProgress = async function() {
    try {
        console.log('Starting saveProgress with data:', window.playerProgress);
        const response = await fetch('http://localhost:3000/api/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.playerProgress)
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error saving progress:', response.status, errorText);
        } else {
            console.log('Progress saved successfully to server');
        }
    } catch (error) {
        console.error('Failed to save progress:', error.message);
    }
    console.log('saveProgress completed');
}

function startLevel(levelNumber) {
    gameState.currentLevel = levels[levelNumber - 1];
    gameState.currentTurn = 1;
    gameState.turnsLeft = gameState.currentLevel.turns;
    gameState.initialTurns = gameState.currentLevel.turns; // Сохраняем начальное количество ходов
    gameState.totalScore = 0;
    gameState.dice = [0, 0];
    gameState.cards = [];
    gameState.selectedCards = [];
    gameState.turnScore = 0;
    gameState.selectedDie = null;
    gameState.activeEffects = {};

    showScreen('level-screen');
    document.getElementById('level-title').textContent = `Level ${levelNumber}`;
    document.getElementById('level-target').textContent = gameState.currentLevel.target;
    document.getElementById('current-turn').textContent = gameState.currentTurn;
    document.getElementById('turns-left').textContent = `${gameState.currentTurn} of ${gameState.initialTurns}`;
    document.getElementById('current-score').textContent = gameState.totalScore;
    document.getElementById('turn-score').textContent = gameState.turnScore;

    const equippedSkins = window.playerProgress.equipped || {};
    const diceSkin = equippedSkins['dice'];
    fetch('/api/special-items')
        .then(response => response.json())
        .then(items => {
            const item = items.find(i => i.id === diceSkin);
            const images = item ? JSON.parse(item.images || '{}') : {};
            const defaultDiceImage = diceSkin && images.default ? images.default : 'images/die-default.png';
            document.getElementById('die1').querySelector('img').src = defaultDiceImage;
            document.getElementById('die2').querySelector('img').src = defaultDiceImage;
        })
        .catch(err => console.error('Error loading dice skin:', err));
}

const effectHandlers = {
    doubleRoll: {
        roll: baseCount => baseCount + 1,
        apply: () => {}
    },
    lowChance: {
        rollDie: () => {
            const roll = Math.random();
            if (roll < 0.30) return 1;
            if (roll < 0.525) return 2;
            if (roll < 0.70) return 3;
            if (roll < 0.85) return 4;
            if (roll < 0.95) return 5;
            return 6;
        }
    },
    highChance: {
        rollDie: () => {
            const roll = Math.random();
            if (roll < 0.30) return 6;
            if (roll < 0.525) return 5;
            if (roll < 0.70) return 4;
            if (roll < 0.85) return 3;
            if (roll < 0.95) return 2;
            return 1;
        }
    },
    evenChance: {
        rollDie: () => {
            const roll = Math.random();
            if (roll < 0.25) return 2;
            if (roll < 0.50) return 4;
            if (roll < 0.75) return 6;
            if (roll < 0.833) return 1;
            if (roll < 0.916) return 3;
            return 5;
        }
    },
    oddChance: {
        rollDie: () => {
            const roll = Math.random();
            if (roll < 0.25) return 1;
            if (roll < 0.50) return 3;
            if (roll < 0.75) return 5;
            if (roll < 0.833) return 2;
            if (roll < 0.916) return 4;
            return 6;
        }
    },
    scoreMultiplier: {
        score: baseScore => Math.round(baseScore * 1.5),
        apply: () => {}
    },
    extraTurn: {
        apply: (state) => {
            state.turnsLeft += 1;
            state.initialTurns += 1; // Обновляем общее количество ходов
            document.getElementById('turns-left').textContent = `${state.currentTurn} of ${state.initialTurns}`;
            window.showMessage("Extra Turn granted! ⚡", "success");
        }
    },
    cardBonus: {
        cardScore: baseScore => Math.round(baseScore * 1.5),
        apply: () => {}
    },
    wildCard: {
        apply: () => {}
    },
    cardExtraTurn: {
        apply: (state) => {
            state.turnsLeft += 1;
            state.initialTurns += 1;
            document.getElementById('turns-left').textContent = `${state.currentTurn} of ${state.initialTurns}`;
            window.showMessage("Extra Turn granted from card! ⚡", "success");
        }
    },
    goldBoost: {
        apply: () => {}
    }
};

function rollDice() {
    const die1 = document.getElementById('die1');
    const die2 = document.getElementById('die2');
    die1.classList.add('rolling');
    die2.classList.add('rolling');
    document.getElementById('roll-button').disabled = true;

    const equippedSkins = window.playerProgress.equipped || {};
    const diceSkin = equippedSkins['dice'];
    let cardCount = 3;

    if (gameState.activeEffects.doubleRoll) {
        cardCount = effectHandlers.doubleRoll.roll(cardCount);
        delete gameState.activeEffects.doubleRoll;
        window.showMessage("Double Roll activates! Four cards await thee... 🎴", "success");
    }

    setTimeout(() => {
        fetch('/api/special-items')
            .then(response => response.json())
            .then(items => {
                const item = items.find(i => i.id === diceSkin);
                const images = item ? JSON.parse(item.images || '{}') : {};

                const rollDie = () => {
                    let result = Math.floor(Math.random() * 6) + 1;
                    if (item && effectHandlers[item.effect]?.rollDie) {
                        result = effectHandlers[item.effect].rollDie();
                    }
                    return result;
                };

                gameState.dice[0] = rollDie();
                gameState.dice[1] = rollDie();
                const die1Image = images[String(gameState.dice[0])] || `images/die-${gameState.dice[0]}.png`;
                const die2Image = images[String(gameState.dice[1])] || `images/die-${gameState.dice[1]}.png`;
                die1.querySelector('img').src = die1Image;
                die1.querySelector('img').onerror = () => die1.querySelector('img').src = `images/die-${gameState.dice[0]}.png`;
                die2.querySelector('img').src = die2Image;
                die2.querySelector('img').onerror = () => die2.querySelector('img').src = `images/die-${gameState.dice[1]}.png`;
                die1.classList.remove('rolling');
                die2.classList.remove('rolling');

                gameState.cards = [];
                for (let i = 0; i < cardCount; i++) {
                    window.drawCard(true);
                }

                const hasValidCombo = gameState.cards.some(card => 
                    combinations[String(gameState.dice[0])].includes(card.slice(0, -1)) || 
                    combinations[String(gameState.dice[1])].includes(card.slice(0, -1))
                );
                if (!hasValidCombo) {
                    window.showMessage("No path to glory! The fates deny thee this turn... ⚰️", "warning");
                    die1.style.pointerEvents = 'none';
                    die2.style.pointerEvents = 'none';
                    document.querySelectorAll('.card').forEach(card => card.style.pointerEvents = 'none');
                    document.getElementById('draw-button').disabled = true;
                    setTimeout(() => endTurn(true), 2500);
                } else {
                    document.getElementById('draw-button').disabled = false;
                    die1.style.pointerEvents = 'auto';
                    die2.style.pointerEvents = 'auto';
                    document.querySelectorAll('.card').forEach(card => card.style.pointerEvents = 'auto');
                    window.showMessage("The dice are cast! Choose thy fate... ⚡", "info");
                }
            })
            .catch(err => {
                console.error('Error fetching dice skin:', err);
                gameState.dice[0] = Math.floor(Math.random() * 6) + 1;
                gameState.dice[1] = Math.floor(Math.random() * 6) + 1;
                die1.querySelector('img').src = `images/die-${gameState.dice[0]}.png`;
                die2.querySelector('img').src = `images/die-${gameState.dice[1]}.png`;
                die1.classList.remove('rolling');
                die2.classList.remove('rolling');
            });
    }, 800);
}

function selectDie(dieIndex) {
    gameState.selectedDie = String(gameState.dice[dieIndex - 1]);
    console.log('Selected die set to:', gameState.selectedDie);
    document.getElementById('die1').classList.toggle('selected', dieIndex === 1);
    document.getElementById('die2').classList.toggle('selected', dieIndex === 2);
    updateCards();
    showMessage("Choose cards or draw more! 🃏");
}

window.drawCard = function(initial = false) {
    let value, suit, card;
    do {
        value = values[Math.floor(Math.random() * values.length)];
        suit = suits[Math.floor(Math.random() * suits.length)];
        card = `${value}${suit}`;
    } while (gameState.cards.includes(card));

    const equippedSkins = window.playerProgress.equipped || {};
    const skinId = equippedSkins[card];
    const cardImage = skinId ? `images/${skinId}.png` : `images/card-${value}${suit}.png`;

    gameState.cards.push(card);

    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    const img = document.createElement('img');
    img.src = cardImage;
    cardElement.appendChild(img);
    const label = document.createElement('span');
    label.textContent = card;
    label.classList.add('card-label');
    cardElement.appendChild(label);
    cardElement.onclick = () => toggleCardSelection(card, cardElement);
    document.getElementById('cards').appendChild(cardElement);

    if (!initial) {
        cardElement.classList.add('dealing');
        setTimeout(() => cardElement.classList.remove('dealing'), 300);

        if (!gameState.selectedDie) {
            const isValidForAnyDie = gameState.dice.some(die => 
                combinations[String(die)].includes(value)
            );
            if (!isValidForAnyDie) {
                window.showMessage("The fates reject thy draw! Turn lost... ⚰️", "warning");
                document.querySelectorAll('.card').forEach(card => card.style.pointerEvents = 'none');
                document.getElementById('draw-button').disabled = true;
                setTimeout(() => endTurn(true), 2500);
                return;
            } else {
                window.showMessage("A worthy draw! Choose thy die wisely... 📜", "info");
            }
        } else if (!combinations[gameState.selectedDie].includes(value)) {
            window.showMessage("Thy card defies the die! Turn lost... ⚰️", "warning");
            setTimeout(() => endTurn(true), 2500);
            return;
        } else {
            window.showMessage("A fine addition! Forge thy combo... 🃏", "info");
        }
    }
    if (gameState.selectedDie) updateCards();
}

function toggleCardSelection(card, element) {
    if (!gameState.selectedDie) return;
    const value = card.slice(0, -1);
    if (!combinations[gameState.selectedDie].includes(value)) return;

    const index = gameState.selectedCards.indexOf(card);
    if (index === -1) {
        gameState.selectedCards.push(card);
        element.classList.add('selected');
    } else {
        gameState.selectedCards.splice(index, 1);
        element.classList.remove('selected');
    }
    calculateTurnScore();
}

function updateCards() {
    const cardElements = document.getElementById('cards').children;
    for (let i = 0; i < cardElements.length; i++) {
        const card = gameState.cards[i];
        const value = card.slice(0, -1);
        const isValid = gameState.selectedDie && combinations[gameState.selectedDie].includes(value);
        cardElements[i].classList.toggle('valid', isValid);
        cardElements[i].classList.toggle('invalid', !isValid && gameState.selectedDie);
    }
}

function calculateTurnScore() {
    if (!gameState.selectedDie) {
        console.log('No die selected');
        return;
    }
    console.log('Calculating score for die:', gameState.selectedDie, 'cards:', gameState.selectedCards);
    let baseScore = 0;
    gameState.selectedCards.forEach(card => {
        const value = card.slice(0, -1);
        console.log('Checking card:', value, 'for die:', gameState.selectedDie);
        if (gameState.selectedDie === '1' && combinations['1'].includes(value)) {
            baseScore += 150;
            console.log('Added 150 points for', value);
        } else if (gameState.selectedDie === '2' && combinations['2'].includes(value)) {
            baseScore += 100;
            console.log('Added 100 points for', value);
        } else if (gameState.selectedDie === '3' && combinations['3'].includes(value)) {
            baseScore += 200;
            console.log('Added 200 points for', value);
        } else if (gameState.selectedDie === '4' && combinations['4'].includes(value)) {
            baseScore += 250;
            console.log('Added 250 points for', value);
        } else if (gameState.selectedDie === '5' && combinations['5'].includes(value)) {
            baseScore += 250;
            console.log('Added 250 points for', value);
        } else if (gameState.selectedDie === '6' && combinations['6'].includes(value)) {
            baseScore += 300;
            console.log('Added 300 points for', value);
        }
    });

    let multiplier = 1;
    const aceCount = gameState.selectedCards.filter(card => card.slice(0, -1) === 'A').length;
    if (aceCount > 0) {
        multiplier *= Math.pow(1.25, aceCount);
        console.log('Applied multiplier for', aceCount, 'aces:', multiplier);
    }
    const suitsSelected = [...new Set(gameState.selectedCards.map(card => card.slice(-1)))];
    if (suitsSelected.length === 1 && gameState.selectedCards.length >= 2) {
        multiplier *= gameState.selectedCards.length === 2 ? 1.5 :
                      gameState.selectedCards.length === 3 ? 2 :
                      gameState.selectedCards.length >= 4 ? 3 : 1;
        console.log('Applied suit multiplier for', gameState.selectedCards.length, 'cards:', multiplier);
    }

    gameState.turnScore = Math.round(baseScore * multiplier);
    console.log('Base score:', baseScore, 'Multiplier:', multiplier.toFixed(2), 'Total score:', gameState.turnScore);
    document.getElementById('turn-score').textContent = gameState.turnScore;
    document.getElementById('combinations').textContent = `Selected: ${gameState.selectedCards.join(", ")} (x${multiplier.toFixed(2)})`;
}

function endTurn(failed = false) {
    if (failed) {
        gameState.turnScore = 0;
    } else {
        const equippedSkins = window.playerProgress.equipped || {};
        let modifiedScore = gameState.turnScore;

        gameState.selectedCards.forEach(card => {
            const itemId = equippedSkins[card];
            if (itemId) {
                fetch('/api/special-items')
                    .then(response => response.json())
                    .then(items => {
                        const item = items.find(i => i.id === itemId);
                        if (item && effectHandlers[item.effect]?.cardScore) {
                            modifiedScore += effectHandlers[item.effect].cardScore(gameState.turnScore / gameState.selectedCards.length) - (gameState.turnScore / gameState.selectedCards.length);
                        }
                    });
            }
        });

        const diceSkin = equippedSkins['dice'];
        if (diceSkin && gameState.selectedDie && gameState.turnScore > 0) {
            fetch('/api/special-items')
                .then(response => response.json())
                .then(items => {
                    const item = items.find(i => i.id === diceSkin);
                    if (item) {
                        if (effectHandlers[item.effect]?.score) {
                            modifiedScore = effectHandlers[item.effect].score(modifiedScore);
                        }
                        if (effectHandlers[item.effect]?.apply) {
                            effectHandlers[item.effect].apply(gameState);
                        }
                    }
                    gameState.totalScore += modifiedScore;
                    document.getElementById('current-score').textContent = gameState.totalScore;
                    window.showMessage("Turn ended! Roll again! 🎲", "info");
                });
        } else {
            gameState.totalScore += modifiedScore;
            document.getElementById('current-score').textContent = gameState.totalScore;
            window.showMessage("Turn ended! Roll again! 🎲", "info");
        }
    }

    gameState.currentTurn++;
    gameState.turnsLeft--; // Уменьшаем ходы при каждом завершении
    gameState.selectedDie = null;
    gameState.cards = [];
    gameState.selectedCards = [];
    gameState.turnScore = 0;

    document.getElementById('current-turn').textContent = gameState.currentTurn;
    document.getElementById('turns-left').textContent = `${gameState.currentTurn} of ${gameState.initialTurns}`;
    document.getElementById('turn-score').textContent = gameState.turnScore;

    const equippedSkins = window.playerProgress.equipped || {};
    const diceSkin = equippedSkins['dice'];
    fetch('/api/special-items')
        .then(response => response.json())
        .then(items => {
            const item = items.find(i => i.id === diceSkin);
            const images = item ? JSON.parse(item.images || '{}') : {};
            const defaultDiceImage = diceSkin && images.default ? images.default : 'images/die-default.png';
            document.getElementById('die1').querySelector('img').src = defaultDiceImage;
            document.getElementById('die2').querySelector('img').src = defaultDiceImage;
        });
    document.getElementById('die1').classList.remove('selected');
    document.getElementById('die2').classList.remove('selected');
    document.getElementById('die1').style.pointerEvents = 'auto';
    document.getElementById('die2').style.pointerEvents = 'auto';
    document.getElementById('cards').innerHTML = "";
    document.getElementById('combinations').textContent = "";
    document.getElementById('roll-button').disabled = false;
    document.getElementById('draw-button').disabled = true;

    if (gameState.turnsLeft <= 0 || gameState.totalScore >= gameState.currentLevel.target) {
        endGame();
    }
}

function backToLevelScreen() {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('level-screen').style.display = 'block';
}

function endGame() {
    const won = gameState.totalScore >= gameState.currentLevel.target;
    const overlay = document.getElementById('game-end-overlay');
    const message = document.getElementById('game-end-message');
    
    const currentLevelNum = currentLevel.number;
    let rewards = { gold: Math.round(gameState.totalScore / 10) };
    
    if (gameState.activeEffects.goldBoost) {
        rewards.gold = Math.round(rewards.gold * 1.25);
        delete gameState.activeEffects.goldBoost;
    }

    if (won && !window.playerProgress.completedLevels.includes(currentLevelNum)) {
        window.playerProgress.completedLevels.push(currentLevelNum);
        if (currentLevelNum === window.playerProgress.highestLevel && currentLevelNum < levels.length) {
            window.playerProgress.highestLevel++;
        }
        console.log(`Rewards prepared:`, rewards);
    }

    const img = document.createElement('img');
    img.src = won ? 'images/victory.png' : 'images/defeat.png';
    img.alt = won ? 'Victory' : 'Defeat';
    img.className = 'overlay-image';
    message.innerHTML = '';
    message.appendChild(img);
    message.appendChild(document.createTextNode(won ? ` Victory!` : " Defeat... The sorcerer’s power prevails. 💀"));

    if (won) {
        const rewardsDiv = document.createElement('div');
        rewardsDiv.id = 'rewards-list';
        rewardsDiv.innerHTML = `<p>Rewards:</p><ul><li>Gold: ${rewards.gold}</li></ul>`;
        message.appendChild(rewardsDiv);

        const claimButton = document.createElement('button');
        claimButton.textContent = 'Claim Rewards';
        claimButton.onclick = () => {
            window.playerProgress.gold = (window.playerProgress.gold || 0) + rewards.gold;
            console.log(`Rewards claimed: Gold ${rewards.gold}, Total gold: ${window.playerProgress.gold}`);
            saveProgress();
            claimButton.disabled = true;
            skipButton.disabled = true;
            setTimeout(() => closeOverlay(), 2000);
        };

        const skipButton = document.createElement('button');
        skipButton.textContent = 'Skip Rewards';
        skipButton.onclick = () => {
            console.log('Rewards skipped');
            saveProgress();
            closeOverlay();
        };

        message.appendChild(claimButton);
        message.appendChild(skipButton);
    }

    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.classList.add('active');
        document.querySelector('.overlay-content').classList.add('active');
    }, 10);

    document.getElementById('roll-button').disabled = true;
    document.getElementById('draw-button').disabled = true;
    document.getElementById('combinations-button').disabled = true;

    if (!window.playerProgress.levelStats) window.playerProgress.levelStats = {};
    window.playerProgress.levelStats[currentLevelNum] = {
        status: won ? "Completed" : "Failed",
        attempts: gameState.attempts,
        turnsUsed: gameState.currentLevel.turns - gameState.turnsLeft,
        goldEarned: rewards.gold
    };

    function closeOverlay() {
        overlay.classList.remove('active');
        document.querySelector('.overlay-content').classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
            window.hideAllScreens('level-screen');
            window.updateLevelScreen(currentLevelNum, won);
        }, 500);
    }

    if (!won) {
        setTimeout(() => closeOverlay(), 2500);
    }
}

function updateLevelScreen(levelNum, won) {
    document.getElementById('level-stats').style.display = 'block';
    document.getElementById('level-status').textContent = won ? "Completed" : "Failed";
    document.getElementById('level-attempts').textContent = gameState.attempts;
    document.getElementById('level-turns-used').textContent = currentLevel.turns - gameState.turnsLeft;
    document.getElementById('level-gold-earned').textContent = window.playerProgress.levelStats[levelNum]?.goldEarned || 0;
    window.updateCampaignMenu(); // Вызываем глобальную функцию из main.js
}

function showCombinations() {
    const combosList = Object.entries(combinations).map(([die, cards]) => 
        `Die ${die}: ${cards.join(", ")} (${die === '1' ? 150 : die === '2' ? 100 : die === '3' ? 200 : die === '4' ? 250 : die === '5' ? 250 : 300} points)`
    ).join("<br>");
    const multipliersList = [
        "Multipliers:",
        "- Each Ace (A) in combination: 1.25x",
        "- 2 cards of the same suit: 1.5x",
        "- 3 cards of the same suit: 2x",
        "- 4+ cards of the same suit: 3x"
    ].join("<br>");
    document.getElementById('combinations-list').innerHTML = `${combosList}<br><br>${multipliersList}`;
    document.getElementById('combinations-modal').style.display = 'flex';
}

function hideCombinations() {
    document.getElementById('combinations-modal').style.display = 'none';
}