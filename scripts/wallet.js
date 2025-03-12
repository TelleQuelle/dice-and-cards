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
                if (error.message.includes("Phantom")) {
                    showMessage("Phantom wallet not found! Please install Phantom to continue. 😞");
                } else {
                    showMessage("Failed to connect wallet! Check your connection or try again. 😞");
                }
                throw error;
            }
        } else {
            showMessage("Phantom wallet not found! Please install Phantom to continue. 😞");
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
    console.log('Initializing wallet setup');
    const connectButton = document.getElementById('wallet-connect');
    const createButton = document.getElementById('create-profile');
    const walletAddress = document.getElementById('wallet-address');
    const addressSpan = document.getElementById('address');
    const playerNameInput = document.getElementById('player-name');

    if (!connectButton) {
        console.error('wallet-connect element not found');
        return;
    }
    if (!createButton) {
        console.error('create-profile element not found');
        return;
    }
    if (!walletAddress || !addressSpan || !playerNameInput) {
        console.error('Required profile elements not found');
        return;
    }

    connectButton.innerHTML = '<button>Connect Wallet</button>';
    connectButton.querySelector('button').addEventListener('click', async () => {
        console.log('Connect Wallet button clicked');
        if (wallet.connected) {
            showMessage("Wallet already connected! 😊");
            return;
        }
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
            showMessage("Wallet not connected! Please connect your wallet. 😞");
            return;
        }
        if (!name) {
            showMessage("Please enter a player name or accept the default. 😞");
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
                if (response.status === 400) {
                    showMessage("Invalid data! Please check your input. 😞");
                } else if (response.status === 500) {
                    showMessage("Server error! Try again later. 😞");
                } else {
                    showMessage("Failed to create profile! Error: " + errorText);
                }
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