const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3000;

// Настройка базы данных SQLite
const db = new sqlite3.Database('./database.db');

// Настройка multer для сохранения файлов в public/images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(express.static('public'));
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    console.log(`Handling request: ${req.method} ${req.path}`);
    next();
});

// Создание таблиц и начальные данные остаются без изменений
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS players (
        walletAddress TEXT PRIMARY KEY,
        playerName TEXT,
        highestLevel INTEGER,
        completedLevels TEXT,
        hasSeenTutorial INTEGER,
        hasSeenLore INTEGER,
        levelStats TEXT,
        gold INTEGER,
        inventory TEXT,
        equipped TEXT
    )`, (err) => {
        if (err) console.error('Error creating players table:', err);
        else console.log('Players table created or already exists.');
    });

    db.run(`CREATE TABLE IF NOT EXISTS special_items (
        id TEXT PRIMARY KEY,
        type TEXT,
        name TEXT,
        description TEXT,
        effect TEXT,
        cost INTEGER,
        rarity TEXT,
        appliesTo TEXT,
        images TEXT
    )`, (err) => {
        if (err) console.error('Error creating special_items table:', err);
        else console.log('Special items table created or already exists.');
    });

    // Начальные данные с .png
    db.run(`INSERT OR IGNORE INTO special_items (id, type, name, description, effect, cost, rarity, appliesTo, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        'special-dice-1',
        'dice',
        'Double Roll Dice',
        'Grants an extra card in the next round after forming a combination.',
        'doubleRoll',
        400,
        'Epic',
        'dice',
        JSON.stringify({
            shop: 'images/special-dice-1.png',
            default: 'images/special-dice-1-default.png',
            1: 'images/special-dice-1-1.png',
            2: 'images/special-dice-1-2.png',
            3: 'images/special-dice-1-3.png',
            4: 'images/special-dice-1-4.png',
            5: 'images/special-dice-1-5.png',
            6: 'images/special-dice-1-6.png'
        })
    ], (err) => {
        if (err) console.error('Error inserting Double Roll Dice:', err);
    });

    const dragonAceSuits = ['spades', 'hearts', 'diamonds', 'clubs'];
    dragonAceSuits.forEach(suit => {
        db.run(`INSERT OR IGNORE INTO special_items (id, type, name, description, effect, cost, rarity, appliesTo, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            `dragon-ace-${suit}`,
            'card',
            `Dragon Ace of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`,
            '',
            null,
            300,
            'Rare',
            `A${suit === 'spades' ? '♠' : suit === 'hearts' ? '♥' : suit === 'diamonds' ? '♦' : '♣'}`,
            JSON.stringify({ shop: 'images/dragon-ace.png', '♠': 'images/dragon-ace.png', '♥': 'images/dragon-ace.png', '♦': 'images/dragon-ace.png', '♣': 'images/dragon-ace.png' })
        ], (err) => {
            if (err) console.error(`Error inserting Dragon Ace of ${suit}:`, err);
        });
    });

    const goldenKingSuits = ['spades', 'hearts', 'diamonds', 'clubs'];
    goldenKingSuits.forEach(suit => {
        db.run(`INSERT OR IGNORE INTO special_items (id, type, name, description, effect, cost, rarity, appliesTo, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            `golden-king-${suit}`,
            'card',
            `Golden King of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`,
            '',
            null,
            500,
            'Epic',
            `K${suit === 'spades' ? '♠' : suit === 'hearts' ? '♥' : suit === 'diamonds' ? '♦' : '♣'}`,
            JSON.stringify({ shop: 'images/golden-king.png', '♠': 'images/golden-king.png', '♥': 'images/golden-king.png', '♦': 'images/golden-king.png', '♣': 'images/golden-king.png' })
        ], (err) => {
            if (err) console.error(`Error inserting Golden King of ${suit}:`, err);
        });
    });

    db.run(`INSERT OR IGNORE INTO special_items (id, type, name, description, effect, cost, rarity, appliesTo, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        'dice-skin-1',
        'dice',
        'Wooden Dice Skin',
        '',
        null,
        100,
        'Common',
        'dice',
        JSON.stringify({
            shop: 'images/dice-skin-1.png',
            default: 'images/dice-skin-1.png',
            1: 'images/dice-skin-1.png',
            2: 'images/dice-skin-1.png',
            3: 'images/dice-skin-1.png',
            4: 'images/dice-skin-1.png',
            5: 'images/dice-skin-1.png',
            6: 'images/dice-skin-1.png'
        })
    ], (err) => {
        if (err) console.error('Error inserting Wooden Dice Skin:', err);
    });

    db.run(`INSERT OR IGNORE INTO special_items (id, type, name, description, effect, cost, rarity, appliesTo, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        'dice-skin-2',
        'dice',
        'Dragon Dice Skin',
        '',
        null,
        500,
        'Epic',
        'dice',
        JSON.stringify({
            shop: 'images/dice-skin-2.png',
            default: 'images/dice-skin-2.png',
            1: 'images/dice-skin-2.png',
            2: 'images/dice-skin-2.png',
            3: 'images/dice-skin-2.png',
            4: 'images/dice-skin-2.png',
            5: 'images/dice-skin-2.png',
            6: 'images/dice-skin-2.png'
        })
    ], (err) => {
        if (err) console.error('Error inserting Dragon Dice Skin:', err);
    });

    const specialCardSuits = ['spades', 'hearts', 'diamonds', 'clubs'];
    specialCardSuits.forEach(suit => {
        db.run(`INSERT OR IGNORE INTO special_items (id, type, name, description, effect, cost, rarity, appliesTo, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            `special-card-1-${suit}`,
            'card',
            `Lucky Ace of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`,
            `A lucky card that brings fortune (${suit.charAt(0).toUpperCase() + suit.slice(1)}).`,
            null,
            200,
            'Rare',
            `A${suit === 'spades' ? '♠' : suit === 'hearts' ? '♥' : suit === 'diamonds' ? '♦' : '♣'}`,
            JSON.stringify({ shop: 'images/special-card-1.png', '♠': 'images/special-card-1.png', '♥': 'images/special-card-1.png', '♦': 'images/special-card-1.png', '♣': 'images/special-card-1.png' })
        ], (err) => {
            if (err) console.error(`Error inserting Lucky Ace of ${suit}:`, err);
        });
    });
});

// Остальные маршруты без изменений
app.get('/api/player/:walletAddress', (req, res) => {
    const walletAddress = req.params.walletAddress;
    db.get(`SELECT * FROM players WHERE walletAddress = ?`, [walletAddress], (err, row) => {
        if (err) {
            console.error('Error fetching player:', err.message);
            res.status(500).send('Database error');
        } else if (row) {
            res.status(200).json({
                walletAddress: row.walletAddress,
                playerName: row.playerName,
                highestLevel: row.highestLevel,
                completedLevels: JSON.parse(row.completedLevels || '[]'),
                hasSeenTutorial: Boolean(row.hasSeenTutorial),
                hasSeenLore: Boolean(row.hasSeenLore),
                levelStats: JSON.parse(row.levelStats || '{}'),
                gold: row.gold || 0,
                inventory: JSON.parse(row.inventory || '[]'),
                equipped: JSON.parse(row.equipped || '{}')
            });
        } else {
            res.status(404).send('Player not found');
        }
    });
});

app.post('/api/create-profile', (req, res) => {
    const { walletAddress, playerName, highestLevel, completedLevels, hasSeenTutorial, hasSeenLore, levelStats, gold, inventory, equipped } = req.body;
    console.log('Received profile data:', req.body);
    db.run(
        `INSERT OR REPLACE INTO players (walletAddress, playerName, highestLevel, completedLevels, hasSeenTutorial, hasSeenLore, levelStats, gold, inventory, equipped) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            walletAddress,
            playerName,
            highestLevel || 1,
            JSON.stringify(completedLevels || []),
            hasSeenTutorial ? 1 : 0,
            hasSeenLore ? 1 : 0,
            JSON.stringify(levelStats || {}),
            gold || 0,
            JSON.stringify(inventory || []),
            JSON.stringify(equipped || {})
        ],
        (err) => {
            if (err) {
                console.error('Error saving profile:', err.message);
                res.status(500).send('Database error');
            } else {
                console.log(`Profile saved for ${walletAddress}`);
                res.status(200).send('Profile saved');
            }
        }
    );
});

app.get('/api/special-items', (req, res) => {
    db.all('SELECT * FROM special_items', (err, rows) => {
        if (err) {
            console.error('Error fetching special items:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/add-special-item', (req, res) => {
    const { id, type, name, cost, rarity, description, effect, appliesTo, images } = req.body;

    // Проверяем, существует ли уже такой ID
    db.get('SELECT id FROM special_items WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error checking item existence:', err);
            return res.status(500).send('Server error');
        }
        if (row) {
            return res.status(400).send('Item with this ID already exists');
        }

        // Если ID уникален, добавляем предмет
        db.run(
            `INSERT INTO special_items (id, type, name, cost, rarity, description, effect, appliesTo, images) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, type, name, cost, rarity, description, effect, appliesTo, JSON.stringify(images)],
            (err) => {
                if (err) {
                    console.error('Error inserting special item:', err);
                    res.status(500).send('Error adding special item');
                } else {
                    res.send('Special item added');
                }
            }
        );
    });
});

// Маршрут для загрузки изображений
app.post('/api/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = `/images/${req.file.filename}`;
    res.json({ path: filePath });
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));