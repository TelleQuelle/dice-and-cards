function rollDice() {
    const die1 = document.getElementById('die1');
    const die2 = document.getElementById('die2');
    if (!die1 || !die2) {
        console.error('die1 or die2 element not found');
        return;
    }
    die1.classList.add('rolling');
    die2.classList.add('rolling');

    const rollButton = document.getElementById('roll-button');
    if (rollButton) rollButton.disabled = true;
    else console.error('roll-button element not found');

    const equippedSkins = window.playerProgress.equipped || {};
    const diceSkin = equippedSkins['dice'];
    let cardCount = 3;

    if (gameState.activeEffects.doubleRoll) {
        cardCount = effectHandlers.doubleRoll.roll(cardCount);
        delete gameState.activeEffects.doubleRoll;
        const showMessage = window.showMessage;
        if (showMessage && typeof showMessage === 'function') {
            showMessage("Double Roll activates! Four cards await thee... 🎴", "success");
        } else {
            console.error('showMessage function not available');
        }
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
                const die1Img = die1.querySelector('img');
                const die2Img = die2.querySelector('img');
                if (die1Img) {
                    die1Img.src = die1Image;
                    die1Img.onerror = () => {
                        die1Img.src = `images/die-${gameState.dice[0]}.png`;
                        die1Img.onerror = null;
                    };
                } else {
                    console.error('die1 image not found');
                }
                if (die2Img) {
                    die2Img.src = die2Image;
                    die2Img.onerror = () => {
                        die2Img.src = `images/die-${gameState.dice[1]}.png`;
                        die2Img.onerror = null;
                    };
                } else {
                    console.error('die2 image not found');
                }
                die1.classList.remove('rolling');
                die2.classList.remove('rolling');

                gameState.cards = [];
                const drawCard = window.drawCard;

                if (drawCard && typeof drawCard === 'function') {
                    for (let i = 0; i < cardCount; i++) {
                        drawCard(true);
                    }
                } else {
                    console.error('drawCard function not available');
                }

                const hasValidCombo = gameState.cards.some(card =>
                    combinations[String(gameState.dice[0])].includes(card.slice(0, -1)) ||
                    combinations[String(gameState.dice[1])].includes(card.slice(0, -1))
                );
                if (!hasValidCombo) {
                    const showMessage = window.showMessage;
                    if (showMessage && typeof showMessage === 'function') {
                        showMessage("No path to glory! The fates deny thee this turn... ⚰️", "warning");
                    } else {
                        console.error('showMessage function not available');
                    }
                    if (die1) die1.style.pointerEvents = 'none';
                    else console.error('die1 element not found');
                    if (die2) die2.style.pointerEvents = 'none';
                    else console.error('die2 element not found');
                    const cards = document.querySelectorAll('.card');
                    if (cards) cards.forEach(card => card.style.pointerEvents = 'none');
                    else console.error('cards elements not found');
                    const drawButton = document.getElementById('draw-button');
                    if (drawButton) drawButton.disabled = true;
                    else console.error('draw-button element not found');
                    setTimeout(() => endTurn(true), 2500);
                } else {
                    const drawButton = document.getElementById('draw-button');
                    if (drawButton) drawButton.disabled = false;
                    else console.error('draw-button element not found');
                    if (die1) die1.style.pointerEvents = 'auto';
                    else console.error('die1 element not found');
                    if (die2) die2.style.pointerEvents = 'auto';
                    else console.error('die2 element not found');
                    const cards = document.querySelectorAll('.card');
                    if (cards) cards.forEach(card => card.style.pointerEvents = 'auto');
                    else console.error('cards elements not found');
                    const showMessage = window.showMessage;
                    if (showMessage && typeof showMessage === 'function') {
                        showMessage("The dice are cast! Choose thy fate... ⚡", "info");
                    } else {
                        console.error('showMessage function not available');
                    }
                }
            })
            .catch(err => {
                console.error('Error fetching dice skin:', err);
                gameState.dice[0] = Math.floor(Math.random() * 6) + 1;
                gameState.dice[1] = Math.floor(Math.random() * 6) + 1;
                if (die1 && die1.querySelector('img')) die1.querySelector('img').src = `images/die-${gameState.dice[0]}.png`;
                else console.error('die1 or its image not found');
                if (die2 && die2.querySelector('img')) die2.querySelector('img').src = `images/die-${gameState.dice[1]}.png`;
                else console.error('die2 or its image not found');
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
    const showMessage = window.showMessage;
    if (showMessage && typeof showMessage === 'function') {
        showMessage("Choose cards or draw more! 🃏");
    } else {
        console.error('showMessage function not available');
    }
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
            document.getElementById('game-max-turns').textContent = `${state.currentTurn} of ${state.initialTurns}`;
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
            document.getElementById('game-max-turns').textContent = `${state.currentTurn} of ${state.initialTurns}`;
            window.showMessage("Extra Turn granted from card! ⚡", "success");
        }
    },
    goldBoost: {
        apply: () => {}
    }
};