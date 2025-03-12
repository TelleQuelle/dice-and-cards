function startLevel(levelNumber) {
    if (!levels || !levels[levelNumber - 1]) {
        console.error('Level data not found for level:', levelNumber);
        window.showMessage('Level data is missing! Contact support. 🚫', 'warning');
        return;
    }
    gameState.currentLevel = levels[levelNumber - 1];
    gameState.currentTurn = 1;
    gameState.turnsLeft = gameState.currentLevel.turns;
    gameState.initialTurns = gameState.currentLevel.turns;
    gameState.totalScore = 0;
    gameState.dice = [0, 0];
    gameState.cards = [];
    gameState.selectedCards = [];
    gameState.turnScore = 0;
    gameState.selectedDie = null;
    gameState.activeEffects = {};
    gameState.attempts++;

    showScreen('level-screen');
    const levelTitle = document.getElementById('level-title');
    if (levelTitle) levelTitle.textContent = `Level ${levelNumber}`;
    else console.error('level-title element not found');

    const levelTarget = document.getElementById('level-target');
    if (levelTarget) levelTarget.textContent = gameState.currentLevel.target;
    else console.error('level-target element not found');

    const currentTurn = document.getElementById('current-turn');
    if (currentTurn) currentTurn.textContent = gameState.currentTurn;
    else console.error('current-turn element not found');

    const turnsLeft = document.getElementById('turns-left');
    if (turnsLeft) turnsLeft.textContent = `${gameState.turnsLeft} turns left`;
    else console.error('turns-left element not found');

    const currentScore = document.getElementById('current-score');
    if (currentScore) currentScore.textContent = gameState.totalScore;
    else console.error('current-score element not found');

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
}

function updateLevelScreen(levelNum, won) {
    const levelStats = document.getElementById('level-stats');
    if (levelStats) levelStats.style.display = 'block';
    else console.error('level-stats element not found');

    const levelStatus = document.getElementById('level-status');
    if (levelStatus) levelStatus.textContent = won ? "Completed" : "Failed";
    else console.error('level-status element not found');

    const levelAttempts = document.getElementById('level-attempts');
    if (levelAttempts) levelAttempts.textContent = gameState.attempts;
    else console.error('level-attempts element not found');

    const levelTurnsUsed = document.getElementById('level-turns-used');
    if (levelTurnsUsed) levelTurnsUsed.textContent = gameState.currentLevel.turns - gameState.turnsLeft;
    else console.error('level-turns-used element not found');

    const levelGoldEarned = document.getElementById('level-gold-earned');
    if (levelGoldEarned) levelGoldEarned.textContent = window.playerProgress.levelStats[levelNum]?.goldEarned || 0;
    else console.error('level-gold-earned element not found');

    window.updateCampaignMenu(); // Вызываем глобальную функцию из main.js
}