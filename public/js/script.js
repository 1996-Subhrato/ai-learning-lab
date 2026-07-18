const btn = document.getElementById("sendBtn");
const prompt = document.getElementById("prompt");
const messages = document.getElementById("messages");

btn.addEventListener("click", sendMessage);

async function sendMessage() {
    if (btn.disabled) return;

    const text = prompt.value.trim();
    if (!text) return;

    btn.disabled = true;

    messages.insertAdjacentHTML('beforeend', `
        <div class="message">
            <div class="user">You</div>
            <p>${text}</p>
        </div>
    `);

    prompt.value = "";
    messages.scrollTop = messages.scrollHeight;

    const loading = document.createElement("div");
    loading.innerHTML = `
        <div class="message">
            <div class="ai">AI</div>
            <p>Thinking...</p>
        </div>
    `;
    messages.appendChild(loading);
    messages.scrollTop = messages.scrollHeight;

    try {
        const response = await fetch("/google/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt: text })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let aiResponseDiv = null;
        let accumulatedText = "";

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunkText = decoder.decode(value, { stream: true });
            if (!chunkText) continue;

            accumulatedText += chunkText;

            if (!aiResponseDiv) {
                loading.remove();
                
                const messageDiv = document.createElement("div");
                messageDiv.className = "message";
                messageDiv.innerHTML = `
                    <div class="ai">AI</div>
                    <div class="ai-response"></div>
                `;
                messages.appendChild(messageDiv);
                
                // Store direct reference to the newly created DOM node
                aiResponseDiv = messageDiv.querySelector(".ai-response");
            }

            const html = marked.parse(accumulatedText);
            aiResponseDiv.innerHTML = html;

            aiResponseDiv.querySelectorAll("pre code").forEach((block) => {
                hljs.highlightElement(block);
            });

            messages.scrollTop = messages.scrollHeight;
        }

        // Flush remaining decoder bytes
        const finalChunk = decoder.decode();
        if (finalChunk) {
            accumulatedText += finalChunk;
            if (!aiResponseDiv) {
                loading.remove();
                const messageDiv = document.createElement("div");
                messageDiv.className = "message";
                messageDiv.innerHTML = `
                    <div class="ai">AI</div>
                    <div class="ai-response"></div>
                `;
                messages.appendChild(messageDiv);
                aiResponseDiv = messageDiv.querySelector(".ai-response");
            }
            
            const html = marked.parse(accumulatedText);
            aiResponseDiv.innerHTML = html;
            aiResponseDiv.querySelectorAll("pre code").forEach((block) => {
                hljs.highlightElement(block);
            });
            messages.scrollTop = messages.scrollHeight;
        }

        // Failsafe to remove loading if response was completely empty
        if (loading.parentNode) {
            loading.remove();
        }

    } catch (error) {
        console.error("Streaming error:", error);
        if (loading.parentNode) loading.remove();
        
        messages.insertAdjacentHTML('beforeend', `
            <div class="message">
                <div class="ai">AI</div>
                <div class="ai-response" style="color: red;">
                    Error: Streaming failed. Please try again.
                </div>
            </div>
        `);
        messages.scrollTop = messages.scrollHeight;
    } finally {
        btn.disabled = false;
    }
}