function openShop() {
    console.log('Opening Shop');
    hideAllScreens('shop-screen');
    const shopScreen = document.getElementById('shop-screen');
    if (shopScreen) {
        console.log('Shop screen found, updating display');
        updateShopDisplay();
    } else {
        console.error('Shop screen element not found');
    }
}

function updateShopDisplay() {
    const goldDisplay = document.getElementById('shop-gold');
    const cardSkinsContainer = document.getElementById('card-skins');
    const diceSkinsContainer = document.getElementById('dice-skins');
    const specialCardsContainer = document.getElementById('special-cards');
    const specialDiceContainer = document.getElementById('special-dice');

    if (goldDisplay) goldDisplay.textContent = window.playerProgress.gold || 0;

    fetch('/api/special-items')
        .then(response => response.json())
        .then(items => {
            cardSkinsContainer.innerHTML = '';
            diceSkinsContainer.innerHTML = '';
            specialCardsContainer.innerHTML = '';
            specialDiceContainer.innerHTML = '';

            const inventory = window.playerProgress.inventory || [];
            const groupedItems = {};
            items.forEach(item => {
                const baseName = item.name.split(' of ')[0];
                if (!groupedItems[baseName]) groupedItems[baseName] = [];
                groupedItems[baseName].push(item);
            });

            Object.keys(groupedItems).forEach(baseName => {
                const group = groupedItems[baseName];
                const isCardGroup = group[0].type === 'card' && group.length > 1;
                const container = group[0].type === 'card' ?
                    (group[0].id.includes('special-card') ? specialCardsContainer : cardSkinsContainer) :
                    ((group[0].effect || group[0].description) ? specialDiceContainer : diceSkinsContainer);

                if (isCardGroup) {
                    const groupDiv = document.createElement('div');
                    groupDiv.className = 'shop-item-group';
                    group.forEach(item => {
                        const images = JSON.parse(item.images || '{}');
                        const shopImage = images.shop || 'images/default-item.png';
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'shop-item';
                        itemDiv.setAttribute('data-id', item.id);
                        itemDiv.setAttribute('data-cost', item.cost);
                        itemDiv.setAttribute('data-applies-to', item.appliesTo);
                        itemDiv.setAttribute('data-rarity', item.rarity);
                        const suit = item.appliesTo.slice(-1);
                        const isSpecial = item.id.includes('special-card') && (item.description || item.effect);
                        itemDiv.innerHTML = `
                            <img src="/${shopImage}" alt="${item.name}" class="shop-image card-image" onerror="this.src='/images/default-item.png'">
                            <span>${suit} - ${item.cost} Gold</span>
                            // Пример внутри шаблона для специальных предметов
                            ${isSpecial ? `<button onclick="showDescriptionModal('${item.description}')">Description</button>` : ''}
                            <button ${inventory.includes(item.id) ? 'disabled' : ''}>
                                ${inventory.includes(item.id) ? 'Owned' : 'Buy'}
                            </button>
                        `;
                        if (!inventory.includes(item.id)) {
                            itemDiv.querySelector('button:last-child').onclick = () => buyItem(item.id, item.cost);
                        }
                        groupDiv.appendChild(itemDiv);
                    });
                    container.appendChild(groupDiv);
                } else {
                    group.forEach(item => {
                        const images = JSON.parse(item.images || '{}');
                        const shopImage = images.shop || 'images/default-item.png';
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'shop-item';
                        itemDiv.setAttribute('data-id', item.id);
                        itemDiv.setAttribute('data-cost', item.cost);
                        itemDiv.setAttribute('data-applies-to', item.appliesTo);
                        itemDiv.setAttribute('data-rarity', item.rarity);
                        const isSpecial = (item.effect || item.description);
                        itemDiv.innerHTML = `
                            <img src="/${shopImage}" alt="${item.name}" class="${item.type === 'card' ? 'card-image' : 'dice-image'} shop-image" onerror="this.src='/images/default-item.png'">
                            <span>${item.name} (${item.rarity})</span>
                            ${isSpecial ? `<button onclick="showDescriptionModal('${item.description}', event)">Description</button>` : ''}
                            <span>${item.cost} Gold</span>
                            <button ${inventory.includes(item.id) ? 'disabled' : ''}>
                                ${inventory.includes(item.id) ? 'Owned' : 'Buy'}
                            </button>
                        `;
                        if (!inventory.includes(item.id)) {
                            itemDiv.querySelector('button:last-child').onclick = () => buyItem(item.id, item.cost);
                        }
                        container.appendChild(itemDiv);
                    });
                }
            });
        })
        .catch(err => console.error('Error loading shop items:', err));
}

function showDescriptionModal(description) {
    const modal = document.getElementById('description-modal');
    const text = document.getElementById('description-text');
    text.textContent = description;
    modal.style.display = 'flex';
}

async function buyItem(itemId, cost) {
    console.log('Attempting to buy item:', itemId, 'Cost:', cost);
    const itemName = itemNames[itemId] || itemId; // Используем читаемое имя или data-id, если имени нет
    if (window.playerProgress.gold >= cost) {
        window.playerProgress.gold -= cost;
        if (!window.playerProgress.inventory) window.playerProgress.inventory = [];
        if (!window.playerProgress.inventory.includes(itemId)) {
            window.playerProgress.inventory.push(itemId);
            window.showMessage(`Thy coin hath secured ${itemName} for ${cost} Gold! ⚜️`, "success");
            console.log(`Item ${itemId} purchased. Remaining gold: ${window.playerProgress.gold}`);
            const itemButton = document.querySelector(`.shop-item[data-id="${itemId}"] button`);
            if (itemButton) {
                itemButton.disabled = true;
                itemButton.textContent = "Owned";
            }
        } else {
            window.showMessage(`Thou already possesseth ${itemName}! 🛡️`, "info");
            return;
        }
        try {
            await window.saveProgress();
            await window.loadProgress(window.playerProgress.walletAddress);
            console.log('Player progress reloaded after purchase:', window.playerProgress);
            updateShopDisplay();
        } catch (error) {
            console.error('Error during buyItem save/load:', error);
            window.showMessage("The merchant’s ledger failed! Purchase lost... 😞", "warning");
        }
    } else {
        window.showMessage("Thy purse is too light! Gather more gold... 💰", "warning");
        console.log('Not enough gold to buy', itemId);
    }
}