require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const path = require("path");
const db = require('./config/db');

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// =======================================
/* ==========> Route: Render Views <========== */
const renderViewsRoutes = require('./routes/page');
app.use('/', renderViewsRoutes);
// =======================================

// =======================================
/* ==========> Route: Google Gemini <========== */
const googleGeminiRoutes = require('./routes/google-gemini');
app.use('/google', googleGeminiRoutes);
// =======================================

// =======================================
/* ==========> Route: OpenAI <========== */
const openAIRoutes = require('./routes/open-ai');
app.use('/openai', openAIRoutes);
// =======================================

const port = process.env.PORT || 5000;

async function startServer() {
    console.log("Starting server...");
    console.log("Connecting to PostgreSQL...");

    try {
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL is missing in environment variables.");
        }

        await db.query('SELECT NOW()');
        console.log("✅ PostgreSQL connected successfully");

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error("❌ PostgreSQL connection failed");
        console.error(error.message);
        process.exit(1);
    }
}

startServer();