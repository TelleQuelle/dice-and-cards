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
        // Сбрасываем hasSeenTutorial, если вызываем из About
        const aboutScreen = document.getElementById('about-screen');
        if (aboutScreen && aboutScreen.style.display === 'block') {
            window.playerProgress.hasSeenTutorial = false;
            console.log('Reset hasSeenTutorial for tutorial from About');
        }
        currentTutorialStep = step;
        hideAllScreens('tutorial');
        const stepElement = document.getElementById(`step${step}`);
        if (!stepElement) {
            console.error(`Tutorial step element step${step} not found`);
        } else {
            console.log('Step element found:', stepElement);
        }
        console.log('Tutorial step shown successfully:', step);
        setTimeout(() => {
            console.log('Checking step', step, 'after delay');
        }, 100);
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

async function finishTutorial() {
    console.log('Entering finishTutorial');
    if (window.playerProgress.hasSeenTutorial) {
        console.log('Tutorial already finished, skipping');
        return;
    }
    window.playerProgress.hasSeenTutorial = true;
    console.log('Calling saveProgress from finishTutorial');
    try {
        await window.saveProgress();
        console.log('saveProgress completed in finishTutorial');
    } catch (error) {
        console.error('Error in saveProgress during finishTutorial:', error);
    }
    if (!window.playerProgress.hasSeenLore) {
        console.log('Showing introduction from finishTutorial');
        hideAllScreens('introduction');
        const intro1 = document.getElementById('intro1');
        if (intro1) {
            intro1.style.display = 'block';
            console.log('Introduction step 1 displayed');
        } else {
            console.error('intro1 element not found');
        }
    } else {
        console.log('Calling startMainMenu from finishTutorial');
        try {
            await startMainMenu();
        } catch (error) {
            console.error('Error in startMainMenu from finishTutorial:', error);
        }
    }
    console.log('finishTutorial completed');
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

function startCampaign() {
    hideAllScreens('campaign-menu');
    updateCampaignMenu();
}

function backToMainMenu() {
    hideAllScreens('main-menu');
    const goldDisplay = document.getElementById('main-menu-gold');
    if (goldDisplay) {
        const goldValue = window.playerProgress.gold !== undefined && window.playerProgress.gold !== null ? window.playerProgress.gold : 0;
        goldDisplay.textContent = goldValue;
        console.log('Back to main menu, gold updated to:', goldValue, 'from playerProgress.gold:', window.playerProgress.gold);
    } else {
        console.error('main-menu-gold element not found in backToMainMenu');
    }
}

function openLevel(level) {
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

function closeDescriptionModal() {
    const modal = document.getElementById('description-modal');
    modal.style.display = 'none';
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
            .catch(err => console.error('Error fetching inventory items:', err));
    }
}

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

function openAbout() {
    console.log('Opening About screen');
    hideAllScreens('about-screen');
}

const wallet = {
    connected: false,
    publicKey: null,
    connect: async function() {
        if (window.solana && window.solana.isPhantom) {
            try {
                await window.solana.connect();
                this.connected = true;
                this.publicKey = window.solana.publicKey.toString();
                return this.publicKey;
            } catch (error) {
                console.error("Wallet connection error:", error);
                throw error;
            }
        } else {
            throw new Error("Phantom wallet not found!");
        }
    },
    disconnect: function() {
        if (window.solana && window.solana.isPhantom) {
            window.solana.disconnect();
            this.connected = false;
            this.publicKey = null;
        }
    }
};

function initializeWallet() {
    const connectButton = document.getElementById('wallet-connect');
    const createButton = document.getElementById('create-profile');
    const walletAddress = document.getElementById('wallet-address');
    const addressSpan = document.getElementById('address');
    const playerNameInput = document.getElementById('player-name');

    connectButton.innerHTML = '<button>Connect Wallet</button>';
    connectButton.querySelector('button').addEventListener('click', async () => {
        try {
            const publicKey = await wallet.connect();
            console.log('Wallet connected:', publicKey);
            addressSpan.textContent = publicKey.slice(0, 6) + '...' + publicKey.slice(-4);
            walletAddress.style.display = 'block';
            playerNameInput.style.display = 'block';
            createButton.style.display = 'block';
            connectButton.style.display = 'none';
        } catch (error) {
            showMessage("Failed to connect wallet! Install Phantom or check connection. 😞");
            console.error('Wallet connection error:', error);
        }
    });

    createButton.addEventListener('click', async () => {
        const publicKey = wallet.publicKey;
        const name = playerNameInput.value.trim() || "Unnamed Wanderer";
    
        if (!publicKey) {
            showMessage("Wallet not connected! 😞");
            console.log('No wallet connected');
            return;
        }
    
        const profileData = {
            walletAddress: publicKey,
            playerName: name,
            highestLevel: 1,
            completedLevels: [],
            hasSeenTutorial: false,
            hasSeenLore: false,
            levelStats: {},
            gold: 0,
            inventory: [],
            equipped: {}
        };
    
        try {
            console.log('Sending profile data to server:', profileData);
            const response = await fetch('http://localhost:3000/api/create-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
    
            if (response.ok) {
                console.log('Profile saved successfully');
                window.playerProgress = { ...profileData };
                localStorage.setItem('lastWalletAddress', publicKey);
                console.log('Updated playerProgress:', window.playerProgress);
                try {
                    await window.saveProgress();
                    console.log('Progress saved, proceeding to next screen');
                    await window.loadProgress(publicKey);
                    console.log('Loaded playerProgress after initialization:', window.playerProgress);
                } catch (error) {
                    console.error('Error saving progress in initializeWallet:', error);
                }
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
                const errorText = await response.text();
                showMessage("Failed to create profile! Server error: " + errorText);
                console.error('Server responded with error:', response.status, errorText);
            }
        } catch (error) {
            showMessage("Server not responding! Check if server is running. 😞");
            console.error('Fetch error:', error.message);
        }
    });
}

function disconnectWallet() {
    wallet.disconnect();
    window.playerProgress.walletAddress = "";
    window.playerProgress.playerName = "";
    saveProgress();
    hideAllScreens('profile-screen');
    document.getElementById('wallet-address').style.display = 'none';
    document.getElementById('player-name').style.display = 'none';
    document.getElementById('create-profile').style.display = 'none';
    document.getElementById('wallet-connect').style.display = 'block';
    showMessage("Wallet disconnected! Please reconnect to continue... 🔌");
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
    return true; // Предотвращает перезагрузку
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
        <input type="file" class="image-upload" data-key="${key}" accept="image/png, image/jpeg">
    `;
    container.appendChild(div);
}