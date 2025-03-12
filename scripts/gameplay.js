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
        const response = await fetch(`http://localhost:3000/api/player/${window.playerProgress.walletAddress}`, {
            method: 'PUT', // Используем PUT для обновления вместо POST для создания
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

async function endTurn(failed = false) {
    if (failed) {
        gameState.turnScore = 0;
    } else {
        const equippedSkins = window.playerProgress.equipped || {};
        let modifiedScore = gameState.turnScore;

        for (const card of gameState.selectedCards) {
            const itemId = equippedSkins[card];
            if (itemId) {
                const response = await fetch('/api/special-items');
                const items = await response.json();
                const item = items.find(i => i.id === itemId);
                if (item && effectHandlers[item.effect]?.cardScore) {
                    modifiedScore += effectHandlers[item.effect].cardScore(gameState.turnScore / gameState.selectedCards.length) - (gameState.turnScore / gameState.selectedCards.length);
                }
            }
        }

        const diceSkin = equippedSkins['dice'];
        if (diceSkin && gameState.selectedDie && gameState.turnScore > 0) {
            const response = await fetch('/api/special-items');
            const items = await response.json();
            const item = items.find(i => i.id === diceSkin);
            if (item) {
                if (effectHandlers[item.effect]?.score) {
                    modifiedScore = effectHandlers[item.effect].score(modifiedScore);
                }
                if (effectHandlers[item.effect]?.apply) {
                    effectHandlers[item.effect].apply(gameState);
                }
            }
        }
        gameState.totalScore += modifiedScore;
    }

    gameState.currentTurn++;
    gameState.turnsLeft--;
    gameState.selectedDie = null;
    gameState.cards = [];
    gameState.selectedCards = [];
    gameState.turnScore = 0;

    const currentTurn = document.getElementById('current-turn');
    if (currentTurn) currentTurn.textContent = gameState.currentTurn;
    else console.error('current-turn element not found');

    const turnsLeft = document.getElementById('turns-left');
    if (turnsLeft) turnsLeft.textContent = `${gameState.currentTurn} of ${gameState.initialTurns}`;
    else console.error('turns-left element not found');

    const turnScore = document.getElementById('turn-score');
    if (turnScore) turnScore.textContent = gameState.turnScore;
    else console.error('turn-score element not found');

    const equippedSkins = window.playerProgress.equipped || {};
    const diceSkin = equippedSkins['dice'];
    fetch('/api/special-items')
        .then(response => response.json())
        .then(items => {
            const item = items.find(i => i.id === diceSkin);
            const images = item ? JSON.parse(item.images || '{}') : {};
            const defaultDiceImage = diceSkin && images.default ? images.default : 'images/die-default.png';
            const die1Img = document.getElementById('die1')?.querySelector('img');
            const die2Img = document.getElementById('die2')?.querySelector('img');
            if (die1Img) die1Img.src = defaultDiceImage;
            else console.error('die1 image not found');
            if (die2Img) die2Img.src = defaultDiceImage;
            else console.error('die2 image not found');
        })
        .catch(err => console.error('Error loading dice skin:', err));

    const die1 = document.getElementById('die1');
    const die2 = document.getElementById('die2');
    if (die1) die1.classList.remove('selected');
    else console.error('die1 element not found');
    if (die2) die2.classList.remove('selected');
    else console.error('die2 element not found');
    if (die1) die1.style.pointerEvents = 'auto';
    else console.error('die1 element not found');
    if (die2) die2.style.pointerEvents = 'auto';
    else console.error('die2 element not found');

    const cards = document.getElementById('cards');
    if (cards) cards.innerHTML = "";
    else console.error('cards element not found');

    const combinations = document.getElementById('combinations');
    if (combinations) combinations.textContent = "";
    else console.error('combinations element not found');

    const rollButton = document.getElementById('roll-button');
    if (rollButton) rollButton.disabled = false;
    else console.error('roll-button element not found');

    const drawButton = document.getElementById('draw-button');
    if (drawButton) drawButton.disabled = true;
    else console.error('draw-button element not found');

    if (gameState.turnsLeft <= 0 || gameState.totalScore >= gameState.currentLevel.target) {
        endGame();
    }
}


function endGame() {
    const won = gameState.totalScore >= gameState.currentLevel.target;
    const overlay = document.getElementById('game-end-overlay');
    const message = document.getElementById('game-end-message');

    if (!overlay || !message) {
        console.error('game-end-overlay or game-end-message element not found');
        return;
    }

    const currentLevelNum = gameState.currentLevel.number;
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

    const rollButton = document.getElementById('roll-button');
    if (rollButton) rollButton.disabled = true;
    else console.error('roll-button element not found');

    const drawButton = document.getElementById('draw-button');
    if (drawButton) drawButton.disabled = true;
    else console.error('draw-button element not found');

    const combinationsButton = document.getElementById('combinations-button');
    if (combinationsButton) combinationsButton.disabled = true;
    else console.error('combinations-button element not found');

    if (!window.playerProgress.levelStats) window.playerProgress.levelStats = {};
    window.playerProgress.levelStats[currentLevelNum] = {
        status: won ? "Completed" : "Failed",
        attempts: gameState.attempts,
        turnsUsed: gameState.currentLevel.turns - gameState.turnsLeft,
        goldEarned: rewards.gold
    };

    function closeOverlay() {
        if (overlay) {
            overlay.classList.remove('active');
            const overlayContent = document.querySelector('.overlay-content');
            if (overlayContent) overlayContent.classList.remove('active');
            setTimeout(() => {
                if (overlay) overlay.style.display = 'none';
                window.hideAllScreens('level-screen');
                window.updateLevelScreen(currentLevelNum, won);
            }, 500);
        } else {
            console.error('overlay element not found in closeOverlay');
        }
    }

    if (!won) {
        setTimeout(() => closeOverlay(), 2500);
    }
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
    const combinationsList = document.getElementById('combinations-list');
    const combinationsModal = document.getElementById('combinations-modal');
    if (combinationsList && combinationsModal) {
        combinationsList.innerHTML = `${combosList}<br><br>${multipliersList}`;
        combinationsModal.style.display = 'flex';
    } else {
        console.error('combinations-list or combinations-modal element not found');
    }
}

function hideCombinations() {
    const combinationsModal = document.getElementById('combinations-modal');
    if (combinationsModal) combinationsModal.style.display = 'none';
    else console.error('combinations-modal element not found');
}