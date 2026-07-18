function sanitizeChatTitle(title) {
    if (!title || typeof title !== 'string') return '';
    
    // Remove quotation marks and punctuation
    let cleaned = title.replace(/['".,!?;:*_~`]/g, '');
    
    // Collapse multiple spaces into one and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Limit maximum length to 50 characters
    if (cleaned.length > 50) {
        cleaned = cleaned.substring(0, 50).trim();
    }
    
    return cleaned;
}

module.exports = sanitizeChatTitle;
