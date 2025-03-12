function showScreen(screenId) {
    hideAllScreens(screenId);
}

function hideAllScreens(except) {
    const screens = [
        'profile-screen', 'tutorial', 'introduction', 'lore-screen',
        'main-menu', 'campaign-menu', 'level-screen', 'game-screen', 'about-screen',
        'shop-screen', 'inventory-screen', 'admin-panel' // Убедимся, что admin-panel включён
    ];
    screens.forEach(screen => {
        const element = document.getElementById(screen);
        if (element) {
            element.style.display = screen === except ? 'block' : 'none';
        }
    });
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) {
            step.style.display = (except === 'tutorial' && i === currentTutorialStep) ? 'block' : 'none';
        }
    };
    console.log(`Showing screen: ${except}`);
    debugScreenStates();
}

function showTutorialStep(step) {
    console.log('Entering showTutorialStep with step:', step);
    try {
        currentTutorialStep = step;
        hideAllScreens('tutorial');
        for (let i = 1; i <= 4; i++) {
            const stepElement = document.getElementById(`step${i}`);
            if (stepElement) {
                stepElement.style.display = (i === step) ? 'block' : 'none';
            }
        }
        console.log('Tutorial step shown successfully:', step);
    } catch (error) {
        console.error('Error in showTutorialStep:', error);
    }
}

function nextStep(next) {
    console.log('Moving to next tutorial step:', next);
    try {
        showTutorialStep(next);
    } catch (error) {
        console.error('Error in nextStep:', error);
    }
}

function previousStep(prev) {
    showTutorialStep(prev);
}

function finishTutorial() {
    console.log('Entering finishTutorial');
    window.playerProgress.hasSeenTutorial = true;
    console.log('Calling saveProgress from finishTutorial');
    saveProgress().then(() => {
        console.log('saveProgress completed in finishTutorial');
        showIntroduction(); // Переход к экрану Introduction
    }).catch(err => {
        console.error('Error saving progress in finishTutorial:', err);
        showIntroduction(); // Продолжаем даже при ошибке сохранения
    });
}

function showIntroduction() {
    console.log('Showing introduction from finishTutorial');
    showScreen('introduction');
    const introStep = document.getElementById('introduction-step-1');
    if (introStep) {
        introStep.style.display = 'block';
    } else {
        console.error('introduction-step-1 element not found');
    }
    console.log('Introduction step 1 displayed');
}

function nextIntro(next) {
    document.getElementById(`intro${loreStep}`).style.display = 'none';
    loreStep = next;
    document.getElementById(`intro${loreStep}`).style.display = 'block';
}

function previousIntro(prev) {
    document.getElementById(`intro${loreStep}`).style.display = 'none';
    loreStep = prev;
    document.getElementById(`intro${loreStep}`).style.display = 'block';
}

async function startMainMenu() {
    console.log('Entering startMainMenu with playerProgress:', window.playerProgress);
    hideAllScreens('main-menu');
    console.log('Screens hidden in startMainMenu');

    const titleElement = document.getElementById('main-menu-title');
    if (titleElement) {
        console.log('Setting title with playerName:', window.playerProgress.playerName);
        titleElement.textContent = `Dice and Cards: ${window.playerProgress.playerName || 'Unnamed Wanderer'}'s Quest`;
        console.log('Main menu title updated:', titleElement.textContent);
    } else {
        console.error('main-menu-title element not found');
    }

    const goldDisplay = document.getElementById('main-menu-gold');
    if (goldDisplay) {
        const goldValue = window.playerProgress.gold !== undefined && window.playerProgress.gold !== null ? window.playerProgress.gold : 0;
        goldDisplay.textContent = goldValue;
        console.log('Main menu gold set to:', goldValue, 'from playerProgress.gold:', window.playerProgress.gold);
    } else {
        console.error('main-menu-gold element not found');
    }

    try {
        updateCampaignMenu();
        console.log('Campaign menu updated in startMainMenu');
    } catch (error) {
        console.error('Error in updateCampaignMenu:', error);
    }

    const adminWallet = 'HVMaVhxKX6dLP1yLnkzH3ikRgDG1vqn2zP9PcXuYvZZH';
    if (window.playerProgress.walletAddress === adminWallet) {
        const adminButton = document.createElement('button');
        adminButton.id = 'admin-button';
        adminButton.innerHTML = '⚙️'; // Шестерёнка вместо текста
        adminButton.title = 'Admin Panel'; // Подсказка при наведении
        adminButton.onclick = openAdminPanel;
        document.getElementById('main-menu').appendChild(adminButton);
    }

    if (!window.playerProgress.hasSeenLore) {
        window.playerProgress.hasSeenLore = true;
        console.log('Calling saveProgress from startMainMenu');
        try {
            await window.saveProgress();
            console.log('saveProgress completed in startMainMenu with playerProgress:', window.playerProgress);
        } catch (error) {
            console.error('Error in saveProgress during startMainMenu:', error);
        }
    }

    console.log('startMainMenu completed');
}

function backToMainMenu() {
    hideAllScreens('main-menu');
    const goldDisplay = document.getElementById('main-menu-gold');
    if (goldDisplay) {
        const goldValue = window.playerProgress?.gold ?? 0;
        goldDisplay.textContent = goldValue;
        console.log('Back to main menu, gold updated to:', goldValue, 'from playerProgress.gold:', window.playerProgress.gold);
    } else {
        console.error('main-menu-gold element not found in backToMainMenu');
    }
}

function startCampaign() {
    hideAllScreens('campaign-menu');
    updateCampaignMenu();
}

function openLevel(level) {
    console.log('Opening level:', level);
    if (level === undefined || level < 1 || level > levels.length) {
        console.error('Invalid level value:', level);
        showMessage("Invalid level selected! Please try again. 🚫");
        return;
    }
    if (level > window.playerProgress.highestLevel) {
        showMessage("This level is locked! Complete the previous trials first. 🔒");
        return;
    }
    currentLevel = levels[level - 1];
    document.getElementById('level-number').textContent = level;
    document.getElementById('level-name').textContent = currentLevel.name;
    document.getElementById('target-score').textContent = currentLevel.target;
    document.getElementById('max-turns').textContent = currentLevel.turns;
    hideAllScreens('level-screen');
    if (window.playerProgress.levelStats && window.playerProgress.levelStats[level]) {
        document.getElementById('level-stats').style.display = 'block';
        document.getElementById('level-status').textContent = window.playerProgress.levelStats[level].status;
        document.getElementById('level-attempts').textContent = window.playerProgress.levelStats[level].attempts;
        document.getElementById('level-turns-used').textContent = window.playerProgress.levelStats[level].turnsUsed;
        document.getElementById('level-gold-earned').textContent = window.playerProgress.levelStats[level].goldEarned || 0;
    } else {
        document.getElementById('level-stats').style.display = 'none';
    }

    // Добавляем обработчик для кнопки "Begin Quest"
    const startLevelButton = document.getElementById('startLevel');
    if (startLevelButton) {
        startLevelButton.onclick = () => {
            console.log('Starting level:', level);
            startLevel(level); // Вызываем startLevel из gameplay.js с корректным level
        };
    } else {
        console.error('startLevel button not found');
    }
}

function showLore() {
    loreStep = 1;
    hideAllScreens('lore-screen');
    document.getElementById('lore-title').textContent = `The Tale of ${currentLevel.name}`;
    document.getElementById('lore-text').textContent = currentLevel.lore1;
    document.getElementById('lore-image').src = currentLevel.image1;
    document.getElementById('lore-next').textContent = 'Next ➡️';
}

function nextLoreStep() {
    if (loreStep === 1) {
        loreStep = 2;
        document.getElementById('lore-text').textContent = currentLevel.lore2;
        document.getElementById('lore-image').src = currentLevel.image2;
        document.getElementById('lore-next').textContent = 'Return ⬅️';
    } else {
        hideAllScreens('level-screen');
    }
}

function backToCampaignMenu() {
    hideAllScreens('campaign-menu');
}

function closeDescriptionModal() {
    const modal = document.getElementById('game-description-modal');
    modal.style.display = 'none';
}

function openInventory() {
    console.log('Opening Inventory');
    hideAllScreens('inventory-screen');
    const inventoryScreen = document.getElementById('inventory-screen');
    if (inventoryScreen) {
        console.log('Inventory screen found, updating display');
        updateInventoryDisplay();
    } else {
        console.error('Inventory screen element not found');
    }
}

function updateInventoryDisplay() {
    const goldDisplay = document.getElementById('inventory-gold');
    const itemsContainer = document.getElementById('inventory-items');
    if (goldDisplay) goldDisplay.textContent = window.playerProgress.gold || 0;
    if (itemsContainer) {
        itemsContainer.innerHTML = '';
        const inventory = window.playerProgress.inventory || [];
        const equipped = window.playerProgress.equipped || {};

        fetch('/api/special-items')
            .then(response => response.json())
            .then(items => {
                inventory.forEach(itemId => {
                    const item = items.find(i => i.id === itemId);
                    if (!item) return;

                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'inventory-item';
                    const img = document.createElement('img');
                    const images = JSON.parse(item.images || '{}');
                    const shopImage = images.shop || 'images/default-item.png';
                    img.src = shopImage;
                    img.alt = item.name;
                    img.className = 'inventory-image';
                    img.onerror = () => img.src = 'images/default-item.png';
                    if (item.type === 'dice') {
                        img.classList.add('dice-image');
                    } else {
                        img.classList.add('card-image');
                    }
                    const span = document.createElement('span');
                    span.textContent = item.name;
                    const equipButton = document.createElement('button');
                    const isEquipped = Object.values(equipped).includes(itemId);
                    equipButton.textContent = isEquipped ? 'Equipped' : 'Equip';
                    equipButton.disabled = isEquipped;
                    if (!isEquipped) {
                        equipButton.onclick = () => equipItem(itemId);
                    }
                    itemDiv.appendChild(img);
                    itemDiv.appendChild(span);
                    itemDiv.appendChild(equipButton);
                    itemsContainer.appendChild(itemDiv);
                });
            })
            .catch(err => {
                console.error('Error fetching inventory items:', err);
                showMessage("Failed to load inventory! Check your connection. 😞", 'error');
            });
    }
}

function openAbout() {
    console.log('Opening About screen');
    hideAllScreens('about-screen');
}

function backToLevelScreen() {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('level-screen').style.display = 'block';
}