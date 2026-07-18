const btn = document.getElementById("sendBtn");
const prompt = document.getElementById("prompt");
const messages = document.getElementById("messages");

const conversationHistory = [];
let currentController = null;

// Initialize global Stop button
const stopBtn = document.createElement("button");
stopBtn.id = "stopBtn";
stopBtn.title = "Stop generating";
stopBtn.style.display = "none";
stopBtn.innerHTML = `<i data-lucide="square"></i>`;
btn.parentNode.appendChild(stopBtn);
if (window.lucide) {
    lucide.createIcons();
}

stopBtn.addEventListener("click", () => {
    if (currentController) {
        currentController.abort();
    }
});

btn.addEventListener("click", sendMessage);

function createAiMessage() {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message";
    
    const aiLabel = document.createElement("div");
    aiLabel.className = "ai";
    aiLabel.textContent = "AI";
    
    const aiResponseDiv = document.createElement("div");
    aiResponseDiv.className = "ai-response";
    
    messageDiv.appendChild(aiLabel);
    messageDiv.appendChild(aiResponseDiv);
    
    messages.appendChild(messageDiv);
    return aiResponseDiv;
}

function createLoadingMessage() {
    const loadingWrapper = document.createElement("div");
    
    const messageDiv = document.createElement("div");
    messageDiv.className = "message";
    
    const aiLabel = document.createElement("div");
    aiLabel.className = "ai";
    aiLabel.textContent = "AI";
    
    const p = document.createElement("p");
    p.textContent = "Thinking...";
    
    messageDiv.appendChild(aiLabel);
    messageDiv.appendChild(p);
    loadingWrapper.appendChild(messageDiv);
    
    messages.appendChild(loadingWrapper);
    return loadingWrapper;
}

async function sendMessage() {
    if (btn.disabled) return;

    const text = prompt.value.trim();
    if (!text) return;

    btn.disabled = true;
    btn.style.display = "none";
    stopBtn.style.display = "";

    currentController = new AbortController();

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

    const loading = createLoadingMessage();
    messages.scrollTop = messages.scrollHeight;

    const payloadMessages = conversationHistory.filter(msg => msg.role === 'user' || msg.complete);

    try {
        const response = await fetch("/google/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ messages: payloadMessages }),
            signal: currentController.signal
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
                content: accumulatedText,
                complete: true
            });
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            if (loading.parentNode) loading.remove();
            
            if (accumulatedText) {
                conversationHistory.push({
                    role: "assistant",
                    content: accumulatedText,
                    complete: false
                });
            }
            
            messages.scrollTop = messages.scrollHeight;
        } else {
            console.error("Streaming error:", error);
            if (loading.parentNode) loading.remove();
            
            conversationHistory.pop(); // Rollback user message
            
            const errorResponseDiv = createAiMessage();
            errorResponseDiv.className = "ai-response ai-error";
            errorResponseDiv.textContent = "Error: Streaming failed. Please try again.";
            
            messages.scrollTop = messages.scrollHeight;
        }
    } finally {
        btn.disabled = false;
        btn.style.display = "";
        stopBtn.style.display = "none";
        
        currentController = null;
    }
}