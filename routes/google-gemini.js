const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL
});

router.post('/chat', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "A valid 'prompt' string is required."
            });
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');

        const result = await model.generateContentStream(prompt.trim());

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                res.write(text);
            }
        }

        res.end();
    } catch (error) {
        console.error("Error in /google/chat route:");
        console.error(error.stack);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        } else {
            res.end();
        }
    }
});

module.exports = router;