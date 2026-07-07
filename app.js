require('dotenv').config();

const express = require('express');
const OpenAI = require('openai');
const morgan = require('morgan');
const path = require("path");

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
app.listen(port, () => {
    console.log(`Server is running, http://localhost:${port}`);
})