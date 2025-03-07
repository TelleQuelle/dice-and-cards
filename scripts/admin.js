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
            <input type="file" class="image-upload" data-key="${key}" accept="image/png, image/jpeg">
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
        // Собираем данные из полей админ-панели
        const type = document.getElementById('item-type').value;
        const id = document.getElementById('item-id').value;
        const name = document.getElementById('item-name').value;
        const cost = document.getElementById('item-cost').value;
        const rarity = document.getElementById('item-rarity').value;
        const description = document.getElementById('item-description').value;
        const effect = document.getElementById('item-effect').value;
        const appliesTo = document.getElementById('item-applies-to').value;
        const imageInputs = document.querySelectorAll('.special-item-image');

        // Объект для хранения путей к картинкам
        const images = {};

        // Загружаем каждую картинку
        for (const input of imageInputs) {
            const file = input.files[0];
            if (file) {
                const formData = new FormData();
                formData.append('image', file);
                const response = await fetch('/api/upload-image', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (!data.path) {
                    throw new Error('Image upload failed');
                }
                const key = input.getAttribute('data-key') || 'shop';
                images[key] = data.path;
            }
        }

        // Собираем данные для отправки на сервер
        const itemData = {
            id: id,
            type: type,
            name: name,
            cost: cost,
            rarity: rarity,
            description: description,
            effect: effect,
            appliesTo: appliesTo,
            images: images
        };

        // Отправляем данные на сервер
        const response = await fetch('/api/add-special-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to add item');
        }

        console.log('Item added successfully!');
        window.showMessage('Item added successfully', 'success');
    } catch (err) {
        console.error('Error adding item:', err);
        window.showMessage('Failed to add item', 'warning');
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