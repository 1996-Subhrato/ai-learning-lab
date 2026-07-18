const db = require('../config/db');

/**
 * Creates a new chat session.
 * @param {string} title - The title of the new chat.
 * @returns {Promise<object>} - The newly created chat object.
 */
async function createChat(title) {
    const result = await db.query(
        `
        INSERT INTO chats (title) 
        VALUES ($1) 
        RETURNING id, title, created_at, updated_at;
        `,
        [title]
    );
    return result.rows[0];
}

/**
 * Retrieves all chat sessions, ordered by the most recently updated.
 * @returns {Promise<Array>} - An array of chat objects.
 */
async function getChats() {
    const result = await db.query(
        `
        SELECT id, title, created_at, updated_at 
        FROM chats 
        ORDER BY updated_at DESC, created_at DESC;
        `
    );
    return result.rows;
}

/**
 * Retrieves a single chat session by its UUID.
 * @param {string} chatId - The UUID of the chat.
 * @returns {Promise<object|null>} - The chat object, or null if not found.
 */
async function getChatById(chatId) {
    const result = await db.query(
        `
        SELECT id, title, created_at, updated_at 
        FROM chats 
        WHERE id = $1;
        `,
        [chatId]
    );
    return result.rows[0] || null;
}

/**
 * Updates the title of an existing chat session.
 * @param {string} chatId - The UUID of the chat to rename.
 * @param {string} title - The new title.
 * @returns {Promise<object|null>} - The updated chat object, or null if not found.
 */
async function renameChat(chatId, title) {
    const result = await db.query(
        `
        UPDATE chats 
        SET title = $1, updated_at = NOW() 
        WHERE id = $2 
        RETURNING id, title, created_at, updated_at;
        `,
        [title, chatId]
    );
    return result.rows[0] || null;
}

/**
 * Deletes a chat session and all its associated messages (via ON DELETE CASCADE).
 * @param {string} chatId - The UUID of the chat to delete.
 * @returns {Promise<boolean>} - True if a chat was deleted, false otherwise.
 */
async function deleteChat(chatId) {
    const result = await db.query(
        `DELETE FROM chats WHERE id = $1;`,
        [chatId]
    );
    // rowCount is 1 if a row was deleted, 0 if not found
    return result.rowCount > 0;
}

module.exports = Object.freeze({
    createChat,
    getChats,
    getChatById,
    renameChat,
    deleteChat
});
