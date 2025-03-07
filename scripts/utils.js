function showMessage(text, type = 'info') {
    const message = document.getElementById('game-message');
    if (!message) {
        console.error('game-message element not found');
        return;
    }
    message.textContent = text;
    message.className = 'game-message';
    message.classList.add(`message-${type}`, 'visible');
    console.log(`Showing ${type} message: ${text}`);
    setTimeout(() => {
        message.classList.remove('visible');
        setTimeout(() => {
            message.classList.remove(`message-${type}`);
        }, 500); // Соответствует длительности transition
    }, 2000); // Время отображения до начала исчезновения
}