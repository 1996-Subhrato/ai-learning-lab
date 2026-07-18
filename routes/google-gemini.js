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

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        const result = await model.generateContentStream(prompt);

        for await (const chunk of result.stream) {
            res.write(chunk.text());
        }

        res.end();
    } catch (error) {
        console.error("Error in /google/chat route: ", error.message);

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