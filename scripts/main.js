const levels = [
    { number: 1, name: "The Ruined Gates", target: 1000, turns: 10, lore1: "The mist thickens as you approach the ruined gates, a skeletal frame of what once stood proud.", lore2: "A raven watches silently from a broken tower, its eyes glinting with an unnatural knowing.", image1: "images/lore1-1.png", image2: "images/lore1-2.png" },
    { number: 2, name: "The Whispering Woods", target: 1500, turns: 10, lore1: "Twisted trees murmur secrets in the wind, their gnarled branches clawing at the sky.", lore2: "A faint glow flickers between the branches, beckoning—or warning—you onward.", image1: "images/lore2-1.png", image2: "images/lore2-2.png" },
    { number: 3, name: "The Cursed Village", target: 2000, turns: 10, lore1: "Huts stand silent, marked by claw and flame, abandoned by all but the echoes of despair.", lore2: "An eerie wail echoes through the fog, a remnant of lives lost to darkness.", image1: "images/lore3-1.png", image2: "images/lore3-2.png" },
    { number: 4, name: "The Forgotten Keep", target: 2500, turns: 9, lore1: "Crumbling stones hide ancient traps, each step a gamble with fate.", lore2: "A knight’s rusted helm lies in the dust, a mute testament to forgotten valor.", image1: "images/lore4-1.png", image2: "images/lore4-2.png" },
    { number: 5, name: "The Shadowed Pass", target: 3000, turns: 9, lore1: "The cliffs loom, swallowing all light, a passage carved by time and malice.", lore2: "Footsteps echo where none should tread, a shadow trailing your every move.", image1: "images/lore5-1.png", image2: "images/lore5-2.png" },
    { number: 6, name: "The Witch’s Lair", target: 3500, turns: 8, lore1: "Candles burn with unnatural green flame, casting twisted shadows on the walls.", lore2: "A cackle cuts through the silence, sharp and cold as a blade.", image1: "images/lore6-1.png", image2: "images/lore6-2.png" },
    { number: 7, name: "The Iron Spire", target: 4000, turns: 8, lore1: "A tower of steel pierces the storm, unyielding against the raging sky.", lore2: "Chains rattle in the howling wind, binding something—or someone—within.", image1: "images/lore7-1.png", image2: "images/lore7-2.png" },
    { number: 8, name: "The Abyssal Depths", target: 4500, turns: 7, lore1: "Cold water drips into endless dark, each drop a whisper of eternity.", lore2: "Something stirs in the depths below, vast and hungry for the light.", image1: "images/lore8-1.png", image2: "images/lore8-2.png" },
    { number: 9, name: "The Sorcerer’s Gate", target: 5000, turns: 7, lore1: "Runes glow red upon the stone arch, pulsing with a power older than the earth.", lore2: "A voice demands tribute in blood, its tone as ancient as it is cruel.", image1: "images/lore9-1.png", image2: "images/lore9-2.png" },
    { number: 10, name: "The Final Reckoning", target: 6000, turns: 6, lore1: "The sorcerer stands, cloaked in shadow, his gaze a weight upon your soul.", lore2: "Fate itself bends to his will, and only one shall claim the dawn.", image1: "images/lore10-1.png", image2: "images/lore10-2.png" }
];

let currentLevel = null;
let loreStep = 1;
let currentTutorialStep = 1;

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

function debugScreenStates() {
    console.log('Profile:', document.getElementById('profile-screen')?.style.display);
    console.log('Tutorial:', document.getElementById('tutorial')?.style.display);
    console.log('Step 1:', document.getElementById('step1')?.style.display);
    console.log('Step 4:', document.getElementById('step4')?.style.display);
    console.log('Introduction:', document.getElementById('introduction')?.style.display);
    console.log('Lore:', document.getElementById('lore-screen')?.style.display);
    console.log('Main Menu:', document.getElementById('main-menu')?.style.display);
    console.log('Campaign:', document.getElementById('campaign-menu')?.style.display);
    console.log('Level:', document.getElementById('level-screen')?.style.display);
}

function resetProgress() {
    window.playerProgress.highestLevel = 1;
    window.playerProgress.completedLevels = [];
    saveProgress();
    updateCampaignMenu();
    showMessage("Progress reset! Starting anew... ⚔️");
}

function updateCampaignMenu() {
    console.log('Entering updateCampaignMenu');
    const levelItems = document.querySelectorAll('.level-item');
    if (!levelItems.length) {
        console.error('No level items found in campaign menu');
        return;
    }
    levelItems.forEach((item, index) => {
        const level = index + 1;
        console.log('Processing level:', level);
        if (level <= window.playerProgress.highestLevel) {
            item.classList.remove('locked');
            const firstSpan = item.querySelector('span:first-child');
            const lastSpan = item.querySelector('span:last-child');
            if (firstSpan && lastSpan) {
                if (!levels || !levels[level - 1]) {
                    console.error('Level data not found for level:', level);
                    return;
                }
                firstSpan.textContent = `Level ${level}: ${levels[level - 1].name}`;
                lastSpan.textContent = window.playerProgress.completedLevels.includes(level) ? "Completed" : "Not Started";
                item.onclick = () => openLevel(level);
                console.log('Updated level item:', level);
            } else {
                console.error('Missing span elements in level item:', level);
            }
        } else {
            item.classList.add('locked');
            const firstSpan = item.querySelector('span:first-child');
            const lastSpan = item.querySelector('span:last-child');
            if (firstSpan && lastSpan) {
                firstSpan.textContent = `Level ${level}: ᚱᚢᚾᛖᛋ ᚩᚠ ᛗᛁᛋᛏ`;
                lastSpan.textContent = "Locked";
                item.onclick = null;
            } else {
                console.error('Missing span elements in locked level item:', level);
            }
        }
    });
    console.log('updateCampaignMenu completed');
}

const itemNames = {
    'dragon-ace-spades': 'Dragon Ace of Spades',
    'dragon-ace-hearts': 'Dragon Ace of Hearts',
    'dragon-ace-diamonds': 'Dragon Ace of Diamonds',
    'dragon-ace-clubs': 'Dragon Ace of Clubs',
    'golden-king-spades': 'Golden King of Spades',
    'golden-king-hearts': 'Golden King of Hearts',
    'golden-king-diamonds': 'Golden King of Diamonds',
    'golden-king-clubs': 'Golden King of Clubs',
    'dice-skin-1': 'Wooden Dice Skin',
    'dice-skin-2': 'Dragon Dice Skin',
    'special-card-1-spades': 'Lucky Ace of Spades',
    'special-card-1-hearts': 'Lucky Ace of Hearts',
    'special-card-1-diamonds': 'Lucky Ace of Diamonds',
    'special-card-1-clubs': 'Lucky Ace of Clubs',
    'special-dice-1': 'Double Roll Dice'
};

function equipItem(itemId) {
    console.log('Equipping item:', itemId);
    if (!window.playerProgress.equipped) window.playerProgress.equipped = {};
    const shopItem = document.querySelector(`.shop-item[data-id="${itemId}"]`);
    const appliesTo = shopItem ? shopItem.getAttribute('data-applies-to') : 'unknown';
    window.playerProgress.equipped[appliesTo] = itemId;
    const itemName = itemNames[itemId] || itemId;
    window.showMessage(`Equipped ${itemName} for ${appliesTo}! ⚜️`, 'success');
    window.saveProgress();
    updateInventoryDisplay();
}

function pageLoaded() {
    console.log('Page loaded, checking progress');
    if (window.playerProgress.walletAddress) {
        console.log('Found saved wallet:', window.playerProgress.walletAddress);
        loadProgress(window.playerProgress.walletAddress).then(() => {
            console.log('Loaded playerProgress after loadProgress:', window.playerProgress);
            // Убираем автоматический запуск туториала
            if (!window.playerProgress.hasSeenTutorial) {
                window.playerProgress.hasSeenTutorial = true; // Помечаем, что туториал виден
                saveProgress(); // Сохраняем изменения
            }
            startMainMenu(window.playerProgress);
        });
    } else {
        console.log('No wallet found, showing profile setup');
        showScreen('profile-setup');
    }
}

// Добавляем обработчик для кнопки "View Tutorial"
document.addEventListener('DOMContentLoaded', () => {
    const viewTutorialButton = document.getElementById('view-tutorial-button');
    if (viewTutorialButton) {
        viewTutorialButton.addEventListener('click', () => {
            console.log('View Tutorial button clicked');
            showTutorial();
        });
    } else {
        console.error('view-tutorial-button element not found');
    }
});

function showTutorial() {
    console.log('Showing tutorial');
    currentTutorialStep = 1;
    showTutorialStep(currentTutorialStep);
}

window.addEventListener('load', async () => {
    console.log('Page loaded, checking progress');
    const savedWallet = localStorage.getItem('lastWalletAddress');
    if (savedWallet) {
        console.log('Found saved wallet:', savedWallet);
        await loadProgress(savedWallet);
        console.log('Loaded playerProgress after loadProgress:', window.playerProgress);
        if (!window.playerProgress.hasSeenTutorial) {
            console.log('Showing tutorial step 1');
            showTutorialStep(1);
        } else if (!window.playerProgress.hasSeenLore) {
            console.log('Showing introduction');
            hideAllScreens('introduction');
            const intro1 = document.getElementById('intro1');
            if (intro1) intro1.style.display = 'block';
            else console.error('intro1 element not found');
        } else {
            console.log('Starting main menu with loaded progress:', window.playerProgress);
            await startMainMenu();
        }
    } else {
        console.log('No wallet address, showing profile screen');
        hideAllScreens('profile-screen');
        initializeWallet();
    }
});

window.onerror = (msg, url, lineNo, columnNo, error) => {
    console.error('Global error:', msg, 'Line:', lineNo, 'Error:', error);
    return false; // Предотвращает перезагрузку
};

function setupTutorialButtons() {
    const startBtn = document.getElementById('startTutorialBtn');
    const skipBtn = document.getElementById('skipTutorialBtn');
    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            console.log('Start button clicked');
            try {
                await finishTutorial();
            } catch (error) {
                console.error('Error on Start button:', error);
            }
        });
    } else {
        console.error('startTutorialBtn not found');
    }
    if (skipBtn) {
        skipBtn.addEventListener('click', async () => {
            console.log('Skip button clicked');
            try {
                await finishTutorial();
            } catch (error) {
                console.error('Error on Skip button:', error);
            }
        });
    } else {
        console.error('skipTutorialBtn not found');
    }
}

// Вызываем после загрузки страницы
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, setting up tutorial buttons');
    setupTutorialButtons();
});

function addImageField() {
    const container = document.getElementById('image-upload-fields');
    const type = document.getElementById('item-type').value;
    const key = prompt('Enter image key (e.g., shop, default, 1, ♠):');
    if (!key) return;

    const div = document.createElement('div');
    div.innerHTML = `
        <label>${key} Image:</label>
        <input type="file" class="image-upload" data-key="${key}" accept="image/png">
    `;
    container.appendChild(div);
}