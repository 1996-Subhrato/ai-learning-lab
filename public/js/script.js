const btn = document.getElementById("sendBtn");
const prompt = document.getElementById("prompt");
const messages = document.getElementById("messages");

const renameModal = document.getElementById("renameModal");
const renameInput = document.getElementById("renameInput");
const renameError = document.getElementById("renameError");
const cancelRenameBtn = document.getElementById("cancelRenameBtn");
const saveRenameBtn = document.getElementById("saveRenameBtn");

const deleteModal = document.getElementById("deleteModal");
const deleteModalChatTitle = document.getElementById("deleteModalChatTitle");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const chatSearchInput = document.getElementById("chatSearchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");

const chatSessions = [];
let currentChatId = null;

const STORAGE_KEY = "ai-chat-app";
const STORAGE_VERSION = 1;

// --- Storage Layer ---

function saveChatSessions() {
    try {
        const data = {
            version: STORAGE_VERSION,
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
            
            if (!data || data.version !== STORAGE_VERSION) {
                clearStoredChats();
                return false;
            }
            
            if (Array.isArray(data.chatSessions) && data.chatSessions.length > 0) {
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
            } else {
                clearStoredChats();
                return false;
            }
        }
    } catch (e) {
        console.error("Failed to restore chat sessions:", e);
        clearStoredChats();
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

// --- Application State Helpers ---

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
    if (currentChatId === chatId) return;
    
    const exists = chatSessions.some(c => c.id === chatId);
    if (exists) {
        currentChatId = chatId;
        saveChatSessions();
    }
}

// --- Rename Modal Logic ---

let currentRenameChatId = null;

function showRenameError(message) {
    renameError.textContent = message;
    renameError.style.display = "block";
    renameInput.classList.add("error");
}

function clearRenameError() {
    renameError.textContent = "";
    renameError.style.display = "none";
    renameInput.classList.remove("error");
}

function openRenameModal(chatId, currentTitle) {
    currentRenameChatId = chatId;
    renameInput.value = currentTitle;
    clearRenameError();
    renameModal.style.display = "flex";
    renameModal.setAttribute("aria-hidden", "false");
    renameInput.focus();
}

function closeRenameModal() {
    currentRenameChatId = null;
    renameModal.style.display = "none";
    renameModal.setAttribute("aria-hidden", "true");
    renameInput.value = "";
    clearRenameError();
}

function validateChatTitle(newTitle, currentTitle) {
    if (!newTitle || newTitle.trim() === "") {
        showRenameError("Chat name cannot be empty.");
        return false;
    }
    if (newTitle.trim() === currentTitle) {
        showRenameError("Please enter a different name.");
        return false;
    }
    return true;
}

function renameChat(chatId, newTitle) {
    const chat = chatSessions.find(c => c.id === chatId);
    if (chat) {
        chat.title = newTitle.trim();
        chat.updatedAt = new Date();
        saveChatSessions();
        return true;
    }
    return false;
}

function handleRenameSave() {
    if (!currentRenameChatId) return;
    
    const chat = chatSessions.find(c => c.id === currentRenameChatId);
    if (!chat) return;
    
    const newTitle = renameInput.value;
    
    if (validateChatTitle(newTitle, chat.title)) {
        const success = renameChat(currentRenameChatId, newTitle);
        if (success) {
            renderSidebar();
            closeRenameModal();
        }
    }
}

renameInput.addEventListener("input", clearRenameError);

cancelRenameBtn.addEventListener("click", closeRenameModal);
saveRenameBtn.addEventListener("click", handleRenameSave);

renameModal.addEventListener("click", (e) => {
    if (e.target === renameModal) {
        closeRenameModal();
    }
});

// --- Delete Modal Logic ---

let currentDeleteChatId = null;

function openDeleteModal(chatId, chatTitle) {
    currentDeleteChatId = chatId;
    deleteModalChatTitle.textContent = chatTitle;
    deleteModal.style.display = "flex";
    deleteModal.setAttribute("aria-hidden", "false");
}

function closeDeleteModal() {
    currentDeleteChatId = null;
    deleteModalChatTitle.textContent = "";
    deleteModal.style.display = "none";
    deleteModal.setAttribute("aria-hidden", "true");
}

function chatExists(chatId) {
    return chatSessions.some(c => c.id === chatId);
}

function ensureMinimumChats() {
    if (chatSessions.length === 0) {
        const newChat = createChat();
        currentChatId = newChat.id;
        return true;
    }
    return false;
}

function ensureValidActiveChat() {
    if (!currentChatId) return false;
    
    const exists = chatExists(currentChatId);
    if (!exists && chatSessions.length > 0) {
        currentChatId = chatSessions[0].id;
        return true;
    }
    return false;
}

function deleteChat(chatId) {
    if (!chatId) return false;
    
    const index = chatSessions.findIndex(c => c.id === chatId);
    if (index === -1) return false;
    
    // Remove the chat from the array
    chatSessions.splice(index, 1);
    
    // If we deleted the currently active chat
    if (currentChatId === chatId) {
        if (!ensureMinimumChats()) {
            // Select the next chat (which shifted into 'index'), or the previous one if we deleted the tail
            const nextIndex = Math.min(index, chatSessions.length - 1);
            currentChatId = chatSessions[nextIndex].id;
        }
    } else {
        // Defensive checks for external state invalidation
        ensureMinimumChats();
        ensureValidActiveChat();
    }
    
    saveChatSessions();
    return true;
}

function handleDeleteConfirm() {
    const targetChatId = currentDeleteChatId;
    if (!targetChatId) return; // Prevent rapid double-clicks
    
    // Clear immediately to prevent double-firing
    currentDeleteChatId = null;
    
    // Validate chat still exists before attempting deletion
    if (chatExists(targetChatId)) {
        const success = deleteChat(targetChatId);
        if (success) {
            refreshUI();
        }
    }
    
    closeDeleteModal();
}

// --- Search UI Logic ---

function filterChats(chatsCollection, query) {
    if (!query || typeof query !== "string") return chatsCollection;
    
    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery === "") return chatsCollection;
    
    return chatsCollection.filter(chat => 
        chat.title.toLowerCase().includes(trimmedQuery)
    );
}

chatSearchInput.addEventListener("input", () => {
    if (chatSearchInput.value.length > 0) {
        clearSearchBtn.style.display = "flex";
    } else {
        clearSearchBtn.style.display = "none";
    }
    renderSidebar();
});

chatSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && chatSearchInput.value.length > 0) {
        chatSearchInput.value = "";
        clearSearchBtn.style.display = "none";
        renderSidebar();
    }
});

clearSearchBtn.addEventListener("click", () => {
    chatSearchInput.value = "";
    clearSearchBtn.style.display = "none";
    chatSearchInput.focus();
    renderSidebar();
});

document.querySelector(".sidebar-search").addEventListener("click", (e) => {
    if (e.target !== clearSearchBtn && !clearSearchBtn.contains(e.target)) {
        chatSearchInput.focus();
    }
});

cancelDeleteBtn.addEventListener("click", closeDeleteModal);
confirmDeleteBtn.addEventListener("click", handleDeleteConfirm);

deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) {
        closeDeleteModal();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (renameModal.style.display === "flex") {
            closeRenameModal();
        }
        if (deleteModal.style.display === "flex") {
            closeDeleteModal();
        }
    }
});

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
    
    const titleWrapper = document.createElement("div");
    titleWrapper.className = "chat-title-wrapper";
    titleWrapper.innerHTML = `<i data-lucide="message-square"></i> <span>${chat.title}</span>`;
    
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "chat-actions";
    
    const renameBtn = document.createElement("button");
    renameBtn.className = "rename-btn";
    renameBtn.setAttribute("aria-label", "Rename Chat");
    renameBtn.title = "Rename Chat";
    renameBtn.innerHTML = `<i data-lucide="pencil"></i>`;
    
    renameBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isGenerationInProgress()) return;
        openRenameModal(chat.id, chat.title);
    });
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.setAttribute("aria-label", "Delete Chat");
    deleteBtn.title = "Delete Chat";
    deleteBtn.innerHTML = `<i data-lucide="trash-2"></i>`;
    
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isGenerationInProgress()) return;
        openDeleteModal(chat.id, chat.title);
    });
    
    actionsDiv.appendChild(renameBtn);
    actionsDiv.appendChild(deleteBtn);
    
    item.appendChild(titleWrapper);
    item.appendChild(actionsDiv);
    
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
    
    // Save scroll position
    const currentScroll = historyList.scrollTop;
    
    historyList.innerHTML = "";
    
    const query = chatSearchInput.value;
    const visibleChats = filterChats(chatSessions, query);
    
    if (query.length > 0) {
        const countHeader = document.createElement("div");
        countHeader.className = "search-result-count";
        countHeader.textContent = `${visibleChats.length} chat${visibleChats.length === 1 ? '' : 's'} found`;
        historyList.appendChild(countHeader);
    }
    
    if (visibleChats.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-search-state";
        emptyState.innerHTML = `No chats found.<br><span style="font-size: 0.8rem; opacity: 0.7; margin-top: 5px; display: inline-block;">Try a different search.</span>`;
        historyList.appendChild(emptyState);
        return;
    }
    
    for (const chat of visibleChats) {
        const item = createSidebarItem(chat);
        historyList.appendChild(item);
    }
    
    updateActiveChatUI();
    initializeSidebarIcons();
    
    // Restore scroll position
    historyList.scrollTop = currentScroll;
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

function createTypingIndicator() {
    const loadingWrapper = document.createElement("div");
    
    const messageDiv = document.createElement("div");
    messageDiv.className = "message";
    
    const aiLabel = document.createElement("div");
    aiLabel.className = "ai";
    aiLabel.textContent = "AI";
    
    const typingContainer = document.createElement("div");
    typingContainer.className = "typing-indicator";
    typingContainer.setAttribute("aria-live", "polite");
    typingContainer.setAttribute("role", "status");
    typingContainer.setAttribute("aria-label", "Assistant is typing");
    typingContainer.innerHTML = '<span></span><span></span><span></span>';
    
    messageDiv.appendChild(aiLabel);
    messageDiv.appendChild(typingContainer);
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
        loading = createTypingIndicator();
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