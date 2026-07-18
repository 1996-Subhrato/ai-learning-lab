const btn = document.getElementById("sendBtn");
const prompt = document.getElementById("prompt");
const messages = document.getElementById("messages");

const conversationHistory = [];

btn.addEventListener("click", sendMessage);

function createAiMessage() {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message";
    messageDiv.innerHTML = `
        <div class="ai">AI</div>
        <div class="ai-response"></div>
    `;
    messages.appendChild(messageDiv);
    return messageDiv.querySelector(".ai-response");
}

async function sendMessage() {
    if (btn.disabled) return;

    const text = prompt.value.trim();
    if (!text) return;

    btn.disabled = true;

    conversationHistory.push({
        role: "user",
        content: text
    });

    const userMessageDiv = document.createElement("div");
    userMessageDiv.className = "message";
    
    const userLabel = document.createElement("div");
    userLabel.className = "user";
    userLabel.textContent = "You";
    
    const userText = document.createElement("p");
    userText.textContent = text; // Safe from XSS
    
    userMessageDiv.appendChild(userLabel);
    userMessageDiv.appendChild(userText);
    messages.appendChild(userMessageDiv);

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
            body: JSON.stringify({ messages: conversationHistory })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
            throw new Error("ReadableStream not supported or response body is missing.");
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
                aiResponseDiv = createAiMessage();
            }

            const html = marked.parse(accumulatedText);
            aiResponseDiv.innerHTML = html;

            aiResponseDiv.querySelectorAll("pre code").forEach((block) => {
                hljs.highlightElement(block);
            });

            messages.scrollTop = messages.scrollHeight;
        }

        const finalChunk = decoder.decode();
        if (finalChunk) {
            accumulatedText += finalChunk;
            if (!aiResponseDiv) {
                loading.remove();
                aiResponseDiv = createAiMessage();
            }
            
            const html = marked.parse(accumulatedText);
            aiResponseDiv.innerHTML = html;
            aiResponseDiv.querySelectorAll("pre code").forEach((block) => {
                hljs.highlightElement(block);
            });
            messages.scrollTop = messages.scrollHeight;
        }

        if (loading.parentNode) {
            loading.remove();
        }

        if (accumulatedText) {
            conversationHistory.push({
                role: "assistant",
                content: accumulatedText
            });
        }

    } catch (error) {
        console.error("Streaming error:", error);
        if (loading.parentNode) loading.remove();
        
        conversationHistory.pop(); // Rollback user message
        
        const errorResponseDiv = createAiMessage();
        errorResponseDiv.className = "ai-response ai-error";
        errorResponseDiv.textContent = "Error: Streaming failed. Please try again.";
        
        messages.scrollTop = messages.scrollHeight;
    } finally {
        btn.disabled = false;
    }
}