const btn = document.getElementById("sendBtn");
const prompt = document.getElementById("prompt");
const messages = document.getElementById("messages");

const chatSessions = [];
let currentChatId = null;

const STORAGE_KEY = "ai-chat-app";

function saveChatSessions() {
    try {
        const data = {
            chatSessions,
            currentChatId
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save chat sessions:", e);
    }
}

function restoreChatSessions() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            if (data && Array.isArray(data.chatSessions) && data.chatSessions.length > 0) {
                chatSessions.length = 0;
                data.chatSessions.forEach(chat => {
                    chat.createdAt = new Date(chat.createdAt);
                    chat.updatedAt = new Date(chat.updatedAt);
                    chatSessions.push(chat);
                });
                
                const validCurrentChat = chatSessions.some(c => c.id === data.currentChatId);
                if (validCurrentChat) {
                    currentChatId = data.currentChatId;
                } else {
                    currentChatId = chatSessions[0].id;
                    saveChatSessions();
                }
                
                return true;
            }
        }
    } catch (e) {
        console.error("Failed to restore chat sessions:", e);
    }
    return false;
}

function clearStoredChats() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error("Failed to clear stored chats:", e);
    }
}

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
    saveChatSessions();
    return chat;
}

function setCurrentChat(chatId) {
    const exists = chatSessions.some(c => c.id === chatId);
    if (exists) {
        currentChatId = chatId;
        saveChatSessions();
    }
}

function getCurrentChat() {
    return chatSessions.find(c => c.id === currentChatId) || null;
}

function getCurrentMessages() {
    const chat = getCurrentChat();
    return chat ? chat.messages : [];
}

function buildConversationPayload() {
    return getCurrentMessages().filter(msg => msg.role === 'user' || msg.complete);
}

function getLastAssistantMessageIndex() {
    const messages = getCurrentMessages();
    return messages.findLastIndex(msg => msg.role === 'assistant');
}

function getLastAssistantMessage() {
    const messages = getCurrentMessages();
    const index = messages.findLastIndex(msg => msg.role === 'assistant' && msg.complete);
    return index !== -1 ? messages[index] : null;
}

function getLastUserMessage() {
    const messages = getCurrentMessages();
    const index = messages.findLastIndex(msg => msg.role === 'user');
    return index !== -1 ? messages[index] : null;
}

function hasRegeneratableResponse() {
    return getLastAssistantMessage() !== null;
}

function isGenerationInProgress() {
    return btn.disabled;
}

function addMessage(message) {
    const chat = getCurrentChat();
    if (chat) {
        chat.messages.push(message);
        chat.updatedAt = new Date();
        saveChatSessions();
    }
}

function rollbackLastMessage() {
    const chat = getCurrentChat();
    if (chat && chat.messages.length > 0) {
        chat.messages.pop();
        chat.updatedAt = new Date();
        saveChatSessions();
    }
}

function initializeChatSession() {
    const restored = restoreChatSessions();
    if (!restored) {
        const initialChat = createChat();
        setCurrentChat(initialChat.id);
    }
    refreshUI();
}

function refreshUI() {
    renderSidebar();
    renderCurrentConversation();
}

function handleNewChat() {
    if (isGenerationInProgress()) return;
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
        if (isGenerationInProgress()) return;
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
        saveChatSessions();
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

function renderRegenerateButton(container) {
    const regenBtn = document.createElement("button");
    regenBtn.className = "regenerate-btn";
    regenBtn.setAttribute("aria-label", "Regenerate response");
    regenBtn.innerHTML = `<i data-lucide="refresh-cw"></i> Regenerate`;
    
    regenBtn.addEventListener("click", () => {
        regenerateResponse();
    });
    
    container.appendChild(regenBtn);
    if (window.lucide) {
        lucide.createIcons({ root: container });
    }
}

function renderMessage(msg, isLastAssistantMessage = false) {
    if (msg.role === 'user') {
        createUserMessage(msg.content);
    } else if (msg.role === 'assistant') {
        const aiResponseDiv = createAiMessage();
        renderMarkdown(aiResponseDiv, msg.content);
        
        if (msg.complete && msg.content) {
            const actionsContainer = document.createElement("div");
            actionsContainer.className = "message-actions";
            
            renderCopyButton(actionsContainer, msg.content);
            
            if (isLastAssistantMessage) {
                renderRegenerateButton(actionsContainer);
            }
            
            aiResponseDiv.parentNode.appendChild(actionsContainer);
        }
    }
}

function renderCurrentConversation() {
    clearConversation();
    const currentMessages = getCurrentMessages();
    const lastAssistantMessageIndex = currentMessages.findLastIndex(msg => msg.role === 'assistant');
    
    for (let i = 0; i < currentMessages.length; i++) {
        const msg = currentMessages[i];
        const isLastAssistantMessage = (i === lastAssistantMessageIndex);
        renderMessage(msg, isLastAssistantMessage);
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
    if (isGenerationInProgress()) return;
    
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

    const payloadMessages = buildConversationPayload();
    await streamChatResponse(payloadMessages, false);
}

async function regenerateResponse() {
    if (!hasRegeneratableResponse() || isGenerationInProgress()) return;
    
    btn.disabled = true;
    btn.style.display = "none";
    stopBtn.style.display = "";
    
    currentController = new AbortController();
    
    const lastAssistantIndex = getLastAssistantMessageIndex();
    if (lastAssistantIndex !== -1) {
        const chat = getCurrentChat();
        if (chat) {
            chat.messages.splice(lastAssistantIndex, 1);
            chat.updatedAt = new Date();
            saveChatSessions();
        }
    }
    
    renderCurrentConversation();
    
    const payloadMessages = buildConversationPayload();
    await streamChatResponse(payloadMessages, true);
}

async function streamChatResponse(payloadMessages, isRegenerate = false) {
    let accumulatedText = "";
    let loading = null;
    
    try {
        loading = createLoadingMessage();
        messages.scrollTop = messages.scrollHeight;

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
                const actionsContainer = document.createElement("div");
                actionsContainer.className = "message-actions";
                
                renderCopyButton(actionsContainer, accumulatedText);
                renderRegenerateButton(actionsContainer);
                
                aiResponseDiv.parentNode.appendChild(actionsContainer);
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
            if (loading && loading.parentNode) loading.remove();
            
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
            if (loading && loading.parentNode) loading.remove();
            
            if (!isRegenerate) {
                rollbackLastMessage(); // Rollback user message only if it's a new message
            }
            
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