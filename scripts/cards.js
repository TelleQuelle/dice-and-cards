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
    const cardsContainer = document.getElementById('cards');
    if (cardsContainer) {
        cardsContainer.appendChild(cardElement);
    } else {
        console.error('cards element not found');
        return;
    }

    if (!initial) {
        cardElement.classList.add('dealing');
        setTimeout(() => cardElement.classList.remove('dealing'), 300);

        if (!gameState.selectedDie) {
            const isValidForAnyDie = gameState.dice.some(die =>
                combinations[String(die)].includes(value)
            );
            if (!isValidForAnyDie) {
                const showMessage = window.showMessage;
                if (showMessage && typeof showMessage === 'function') {
                    showMessage("The fates reject thy draw! Turn lost... ⚰️", "warning");
                } else {
                    console.error('showMessage function not available');
                }
                const cards = document.querySelectorAll('.card');
                if (cards.length > 0) cards.forEach(card => card.style.pointerEvents = 'none');
                else console.error('cards elements not found');
                const drawButton = document.getElementById('draw-button');
                if (drawButton) drawButton.disabled = true;
                else console.error('draw-button element not found');
                const endTurnFunc = window.endTurn;
                if (endTurnFunc && typeof endTurnFunc === 'function') {
                    setTimeout(() => endTurnFunc(true), 2500);
                } else {
                    console.error('endTurn function not available');
                }
                return;
            } else {
                const showMessage = window.showMessage;
                if (showMessage && typeof showMessage === 'function') {
                    showMessage("A worthy draw! Choose thy die wisely... 📜", "info");
                } else {
                    console.error('showMessage function not available');
                }
            }
        } else if (!combinations[gameState.selectedDie].includes(value)) {
            const showMessage = window.showMessage;
            if (showMessage && typeof showMessage === 'function') {
                showMessage("Thy card defies the die! Turn lost... ⚰️", "warning");
            } else {
                console.error('showMessage function not available');
            }
            const endTurnFunc = window.endTurn;
            if (endTurnFunc && typeof endTurnFunc === 'function') {
                setTimeout(() => endTurnFunc(true), 2500);
            } else {
                console.error('endTurn function not available');
            }
            return;
        } else {
            const showMessage = window.showMessage;
            if (showMessage && typeof showMessage === 'function') {
                showMessage("A fine addition! Forge thy combo... 🃏", "info");
            } else {
                console.error('showMessage function not available');
            }
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
    const cardsContainer = document.getElementById('cards');
    if (!cardsContainer) {
        console.error('cards element not found');
        return;
    }
    const cardElements = cardsContainer.children;
    for (let i = 0; i < cardElements.length; i++) {
        const card = gameState.cards[i];
        const value = card.slice(0, -1);
        const isValid = gameState.selectedDie && combinations[gameState.selectedDie].includes(value);
        cardElements[i].classList.toggle('valid', isValid);
        cardElements[i].classList.toggle('invalid', !isValid && gameState.selectedDie);
    }
}