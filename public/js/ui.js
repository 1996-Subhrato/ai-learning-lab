document.addEventListener('DOMContentLoaded', () => {
    const prompt = document.getElementById('prompt');
    const sendBtn = document.getElementById('sendBtn');
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    // Auto-resize textarea
    prompt.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') {
            this.style.height = 'auto'; // Reset when empty
        }
    });

    // Enter to send, Shift+Enter for new line
    prompt.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default new line
            if (this.value.trim() !== '') {
                sendBtn.click(); // Trigger existing logic
                // Reset height after sending
                setTimeout(() => {
                    this.style.height = 'auto';
                }, 10);
            }
        }
    });

    // Mobile sidebar toggle
    if (openSidebarBtn) {
        openSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }

    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }
});
