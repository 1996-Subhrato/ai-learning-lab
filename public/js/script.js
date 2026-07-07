const btn = document.getElementById("sendBtn");
const prompt = document.getElementById("prompt");
const messages = document.getElementById("messages");

btn.addEventListener("click", sendMessage);

async function sendMessage() {

    const text = prompt.value.trim();

    if (!text) return;

    messages.innerHTML += `
        <div class="message">
            <div class="user">You</div>
            <p>${text}</p>
        </div>
    `;

    prompt.value = "";

    const loading = document.createElement("div");

    loading.innerHTML = `
        <div class="message">
            <div class="ai">AI</div>
            <p>Thinking...</p>
        </div>
    `;

    messages.appendChild(loading);

    const response = await fetch("/google/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            prompt: text
        })

    });

    const data = await response.json();

    loading.remove();

    /* ================================= */
    /* It will show simple text response */
    /* ================================= */
    // messages.innerHTML += `
    //     <div class="message">
    //         <div class="ai">AI</div>
    //         <p>${data.response}</p>
    //     </div>
    // `;

    /* ============================================== */
    /* It will show well formatted/structure response */
    /* ============================================== */
    const html = marked.parse(data.response);

    messages.innerHTML += `
        <div class="message">
            <div class="ai">AI</div>
            <div class="ai-response">
                ${html}
            </div>
        </div>
    `;

    messages.scrollTop = messages.scrollHeight;
}