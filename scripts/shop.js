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

async function updateShopDisplay() {
    console.log('Opening Shop');
    const shopScreen = document.getElementById('shop-screen');
    if (shopScreen) {
        console.log('Shop screen found, updating display');
        const response = await fetch('/api/special-items');
        const items = await response.json();
        const shopItemsContainer = document.getElementById('shop-items');
        shopItemsContainer.innerHTML = '';

        if (!response.ok) {
            console.error('Failed to fetch special items:', response.status);
            window.showMessage("The merchant’s wares are unavailable! Try again later. 😞", "warning");
            return;
        }

        if (!Array.isArray(items)) {
            console.error('Invalid data format for special items');
            window.showMessage("The merchant’s ledger is corrupted! 😞", "warning");
            return;
        }


        items.forEach(item => {
            const isSpecial = item.description || item.effect;
            const itemElement = document.createElement('div');
            itemElement.className = 'shop-item';

            const images = JSON.parse(item.images || '{}');
            const imageSrc = images.shop || '/images/dice-skin-1.png';
            itemElement.innerHTML = `
                <img src="${imageSrc}" alt="${item.name}" onerror="this.src='/images/dice-skin-1.png'; this.onerror=null;">
                <h3>${item.name}</h3>
                <p>Cost: ${item.cost} Gold</p>
                ${isSpecial ? `<button onclick="showDescription('${item.description}')">Description</button>` : ''}
                <button onclick="buyItem('${item.id}', ${item.cost}, '${item.name}')">Buy</button>
            `;
            itemElement.setAttribute('data-id', item.id);
            shopItemsContainer.appendChild(itemElement);
        });
    }
}

function showDescriptionModal(description) {
    const modal = document.getElementById('shop-description-modal');
    const text = document.getElementById('description-text');
    text.textContent = description;
    modal.style.display = 'flex';
}

async function buyItem(itemId, cost, itemName) {
    console.log('Attempting to buy item:', itemId, 'Cost:', cost);
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