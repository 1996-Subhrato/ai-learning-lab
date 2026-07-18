const btn = document.getElementById("sendBtn");
const prompt = document.getElementById("prompt");
const messages = document.getElementById("messages");

const chatSessions = [];
let currentChatId = null;

function createChatObject() {
    return {
        id: `chat-${crypto.randomUUID()}`,
        title: "New Chat",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: []
    };
}

function createChat() {
    const chat = createChatObject();
    chatSessions.push(chat);
    return chat;
}

function setCurrentChat(chatId) {
    const exists = chatSessions.some(c => c.id === chatId);
    if (exists) {
        currentChatId = chatId;
    }
}

function getCurrentChat() {
    return chatSessions.find(c => c.id === currentChatId) || null;
}

function getCurrentMessages() {
    const chat = getCurrentChat();
    return chat ? chat.messages : [];
}

function addMessage(message) {
    const chat = getCurrentChat();
    if (chat) {
        chat.messages.push(message);
        chat.updatedAt = new Date();
    }
}

function rollbackLastMessage() {
    const chat = getCurrentChat();
    if (chat && chat.messages.length > 0) {
        chat.messages.pop();
        chat.updatedAt = new Date();
    }
}

function initializeChatSession() {
    const initialChat = createChat();
    setCurrentChat(initialChat.id);
    refreshUI();
}

function refreshUI() {
    renderSidebar();
    renderCurrentConversation();
}

function handleNewChat() {
    const newChat = createChat();
    setCurrentChat(newChat.id);
    refreshUI();
}

function clearConversation() {
    messages.innerHTML = "";
}

function renderMarkdown(container, markdownText) {
    const html = marked.parse(markdownText);
    container.innerHTML = html;
    container.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightElement(block);
    });
}

function initializeSidebarIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

function updateActiveChatUI() {
    document.querySelectorAll(".history-item").forEach(item => {
        item.classList.remove("active");
        if (item.dataset.chatId === currentChatId) {
            item.classList.add("active");
        }
    });
}

function createSidebarItem(chat) {
    const item = document.createElement("div");
    item.className = "history-item";
    item.dataset.chatId = chat.id;
    
    item.innerHTML = `<i data-lucide="message-square"></i> ${chat.title}`;
    item.addEventListener("click", () => {
        setCurrentChat(chat.id);
        refreshUI();
    });
    return item;
}

function renderSidebar() {
    const historyList = document.querySelector(".history-list");
    if (!historyList) return;
    
    historyList.innerHTML = "";
    
    for (const chat of chatSessions) {
        const item = createSidebarItem(chat);
        historyList.appendChild(item);
    }
    
    updateActiveChatUI();
    initializeSidebarIcons();
}

function updateChatTitle(chatId, title) {
    const chat = chatSessions.find(c => c.id === chatId);
    if (chat && title) {
        chat.title = title;
        chat.updatedAt = new Date();
    }
}

function shouldGenerateTitle(chat) {
    if (!chat || chat.title !== "New Chat") return false;
    
    const userMessages = chat.messages.filter(m => m.role === "user");
    if (userMessages.length !== 1) return false;
    
    const lastMessage = chat.messages[chat.messages.length - 1];
    return lastMessage.role === "assistant" && lastMessage.complete === true;
}

async function generateChatTitle(chat) {
    try {
        const userMessages = chat.messages.filter(m => m.role === "user");
        if (userMessages.length === 0) return null;
        
        const response = await fetch("/google/title", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: userMessages[0].content })
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.title || null;
    } catch (error) {
        return null;
    }
}

document.querySelectorAll(".new-chat-btn, .new-chat-mobile-btn").forEach(btn => {
    btn.addEventListener("click", handleNewChat);
});

// Automatically create first chat on load
initializeChatSession();
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

function createUserMessage(text) {
    const userMessageDiv = document.createElement("div");
    userMessageDiv.className = "message";
    
    const userLabel = document.createElement("div");
    userLabel.className = "user";
    userLabel.textContent = "You";
    
    const userText = document.createElement("p");
    userText.textContent = text;
    
    userMessageDiv.appendChild(userLabel);
    userMessageDiv.appendChild(userText);
    messages.appendChild(userMessageDiv);
    return userMessageDiv;
}

function renderCopyButtonDefaultState(button) {
    button.innerHTML = `<i data-lucide="copy"></i> Copy`;
    if (window.lucide) {
        lucide.createIcons({ root: button });
    }
}

function renderCopyButton(container, messageText) {
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.setAttribute("aria-label", "Copy response");
    renderCopyButtonDefaultState(copyBtn);
    
    copyBtn.addEventListener("click", async () => {
        if (copyBtn.disabled) return;
        
        const success = await copyText(messageText);
        if (success) {
            showCopySuccess(copyBtn);
        }
    });
    
    container.appendChild(copyBtn);
}

async function copyText(text) {
    if (!text) return false;
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error("Failed to copy text: ", err);
        return false;
    }
}

function showCopySuccess(button) {
    button.disabled = true;
    button.innerHTML = `<i data-lucide="check"></i> Copied`;
    if (window.lucide) {
        lucide.createIcons({ root: button });
    }
    
    setTimeout(() => {
        renderCopyButtonDefaultState(button);
        button.disabled = false;
    }, 2000);
}

function renderMessage(msg) {
    if (msg.role === 'user') {
        createUserMessage(msg.content);
    } else if (msg.role === 'assistant') {
        const aiResponseDiv = createAiMessage();
        renderMarkdown(aiResponseDiv, msg.content);
        
        if (msg.complete && msg.content) {
            renderCopyButton(aiResponseDiv.parentNode, msg.content);
        }
    }
}

function renderCurrentConversation() {
    clearConversation();
    const currentMessages = getCurrentMessages();
    for (const msg of currentMessages) {
        renderMessage(msg);
    }
    messages.scrollTop = messages.scrollHeight;
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

    addMessage({
        role: "user",
        content: text
    });

    createUserMessage(text);

    prompt.value = "";
    messages.scrollTop = messages.scrollHeight;

    const loading = createLoadingMessage();
    messages.scrollTop = messages.scrollHeight;

    const payloadMessages = getCurrentMessages().filter(msg => msg.role === 'user' || msg.complete);

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

            renderMarkdown(aiResponseDiv, accumulatedText);

            messages.scrollTop = messages.scrollHeight;
        }

        const finalChunk = decoder.decode();
        if (finalChunk) {
            accumulatedText += finalChunk;
            if (!aiResponseDiv) {
                loading.remove();
                aiResponseDiv = createAiMessage();
            }
            
            renderMarkdown(aiResponseDiv, accumulatedText);
            messages.scrollTop = messages.scrollHeight;
        }

        if (loading.parentNode) {
            loading.remove();
        }

        if (accumulatedText) {
            addMessage({
                role: "assistant",
                content: accumulatedText,
                complete: true
            });
            
            if (aiResponseDiv && aiResponseDiv.parentNode) {
                renderCopyButton(aiResponseDiv.parentNode, accumulatedText);
            }
            
            const currentChat = getCurrentChat();
            if (shouldGenerateTitle(currentChat)) {
                generateChatTitle(currentChat).then(title => {
                    if (title) {
                        updateChatTitle(currentChat.id, title);
                        refreshUI();
                    }
                });
            }
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            if (loading.parentNode) loading.remove();
            
            if (accumulatedText) {
                addMessage({
                    role: "assistant",
                    content: accumulatedText,
                    complete: false
                });
            }
            
            messages.scrollTop = messages.scrollHeight;
        } else {
            console.error("Streaming error:", error);
            if (loading.parentNode) loading.remove();
            
            rollbackLastMessage(); // Rollback user message
            
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