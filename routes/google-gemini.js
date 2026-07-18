const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL
});

router.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                success: false,
                message: "A valid 'messages' array is required."
            });
        }

        for (const msg of messages) {
            if (msg.role !== 'user' && msg.role !== 'assistant') {
                return res.status(400).json({
                    success: false,
                    message: "Invalid role. Only 'user' and 'assistant' are permitted."
                });
            }

            if (typeof msg.content !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: "Message content must be a string."
                });
            }

            const trimmedContent = msg.content.trim();
            if (!trimmedContent) {
                return res.status(400).json({
                    success: false,
                    message: "Message content cannot be empty."
                });
            }

            msg.content = trimmedContent;
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');

        const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const result = await model.generateContentStream({ contents });

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