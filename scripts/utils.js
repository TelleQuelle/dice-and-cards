function showMessage(text, type = 'info') {
    const message = document.getElementById('game-message');
    if (!message) {
        console.error('game-message element not found');
        alert(text); // Резервный вариант
        return;
    }
    message.textContent = text;
    message.className = 'game-message visible'; // Сбрасываем классы и добавляем visible
    message.classList.add(`message-${type}`);
    console.log(`Showing ${type} message: ${text}`);
    const displayTime = Math.max(2000, text.length * 100); // Динамическое время
    setTimeout(() => {
        message.classList.remove('visible');
        setTimeout(() => {
            message.classList.remove(`message-${type}`);
        }, 500); // Соответствует длительности transition
    }, displayTime);
}