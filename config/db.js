const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = {
    /**
     * Executes a database query using the connection pool.
     * @param {string} text - The SQL query string.
     * @param {Array} params - The array of query parameters.
     * @returns {Promise<object>} - The query result.
     */
    query: async (text, params) => {
        try {
            return await pool.query(text, params);
        } catch (error) {
            console.error('Database Query Error:', { text, error: error.message });
            throw error; // Throw error back to caller
        }
    },

    /**
     * Retrieves a dedicated client from the pool (e.g., for transactions).
     * Call client.release() when finished.
     * @returns {Promise<object>} - The database client.
     */
    getClient: async () => {
        try {
            return await pool.connect();
        } catch (error) {
            console.error('Database Client Connection Error:', error.message);
            throw error; // Throw error back to caller
        }
    }
};
