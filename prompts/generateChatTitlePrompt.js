function generateChatTitlePrompt(message) {
    return `Generate a short title for a chat based on this first message: "${message.trim()}".
Requirements:
* 3-5 words
* No quotes
* No punctuation
* No markdown
* Plain text only

Return only the title.`;
}

module.exports = generateChatTitlePrompt;
