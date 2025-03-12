const images = {
    shop: 'images/default.png', // значение по умолчанию, если изображение не загружено
    default: 'images/default.png'
};

const formData = {
    id: itemId,
    type: itemType,
    name: itemName,
    cost: parseInt(itemCost),
    rarity: itemRarity,
    description: itemDescription || '',
    effect: itemEffect || null,
    appliesTo: itemAppliesTo || '',
    images: images // Объект, не строка
};


function openAdminPanel() {
    if (window.playerProgress.walletAddress !== 'HVMaVhxKX6dLP1yLnkzH3ikRgDG1vqn2zP9PcXuYvZZH') {
        window.showMessage("Thou art not an admin! Begone! 🚫", "warning");
        return;
    }
    hideAllScreens('admin-panel');
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.style.display = 'block'; // Убеждаемся, что панель видна
        updateImageFields(); // Инициализируем поля изображений
    } else {
        console.error('Admin panel element not found');
    }
}

function updateImageFields() {
    const type = document.getElementById('item-type');
    const appliesTo = document.getElementById('item-applies-to');
    const container = document.getElementById('image-upload-fields');
    if (!type || !appliesTo || !container) {
        console.error('item-type, item-applies-to, or image-upload-fields not found');
        return;
    }
    container.innerHTML = '';
    const fields = type.value === 'card' ? 
        ['♠', '♥', '♦', '♣'] : 
        ['shop', 'default', '1', '2', '3', '4', '5', '6'];
    fields.forEach(key => {
        const div = document.createElement('div');
        div.innerHTML = `
            <label>${key} Image:</label>
            <input type="file" class="image-upload" data-key="${key}" accept="image/png">
        `;
        container.appendChild(div);
    });
    // Устанавливаем значение appliesTo в зависимости от типа
    document.getElementById('all-suits-option').style.display = type.value === 'card' ? 'block' : 'none';
    document.getElementById('dice-option').style.display = type.value === 'dice' ? 'block' : 'none';
    appliesTo.value = type.value === 'card' ? 'all-suits' : 'dice';
}

async function addSpecialItem() {
    try {
        const type = document.getElementById('item-type').value;
        const id = document.getElementById('item-id').value;
        const name = document.getElementById('item-name').value;
        const cost = document.getElementById('item-cost').value;
        const rarity = document.getElementById('item-rarity').value;
        const description = document.getElementById('item-description').value;
        const effect = document.getElementById('item-effect').value;
        const appliesTo = document.getElementById('item-applies-to').value;
        const imageInputs = document.querySelectorAll('.image-upload');

        // Проверка обязательных полей
        if (!id || !name || !cost || !type || !appliesTo) {
            window.showMessage('Please fill in all required fields (ID, Name, Cost, Type, Applies To)! 🚫', 'warning');
            return;
        }
        if (isNaN(cost) || Number(cost) <= 0) {
            window.showMessage('Cost must be a positive number! 🚫', 'warning');
            return;
        }

        const images = {};

        for (const input of imageInputs) {
            const file = input.files[0];
            if (file) {
                console.log('Uploading image:', file.name);
                const formData = new FormData();
                formData.append('image', file);
                const response = await fetch('/api/upload-image', {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Image upload failed:', errorText);
                    throw new Error('Image upload failed: ' + errorText);
                }
                const data = await response.json();
                if (!data.path) {
                    console.error('Image upload failed:', data.error || 'No path returned');
                    throw new Error('Image upload failed');
                }
                console.log('Image uploaded successfully:', data.path);
                const key = input.getAttribute('data-key') || 'shop';
                images[key] = data.path;
            }
        }

        const itemData = {
            id: id,
            type: type,
            name: name,
            cost: Number(cost),
            rarity: rarity,
            description: description,
            effect: effect,
            appliesTo: appliesTo,
            images: images
        };

        const response = await fetch('/api/add-special-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response error:', errorText);
            throw new Error('Failed to add item: ' + errorText);
        }

        const result = await response.json(); // Проверяем, что сервер возвращает JSON
        console.log('Item added successfully:', result);
        window.showMessage('Item added successfully', 'success');
    } catch (err) {
        console.error('Error adding item:', err.message);
        window.showMessage('Failed to add item: ' + err.message, 'warning');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-item-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addSpecialItem();
        });
    } else {
        console.error('Form with ID "add-item-form" not found');
    }
});