const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const generateChatTitlePrompt = require("../prompts/generateChatTitlePrompt");
const sanitizeChatTitle = require("../utils/sanitizeChatTitle");

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
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');

        const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content.trim() }]
        }));

        const result = await model.generateContentStream({ contents });

        let isDisconnected = false;
        req.on('close', () => {
            isDisconnected = true;
        });

        for await (const chunk of result.stream) {
            if (isDisconnected) {
                break;
            }

            const text = chunk.text();
            if (text) {
                res.write(text);
            }
        }

        if (!isDisconnected) {
            res.end();
        }
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

router.post('/title', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ success: false, message: "Valid message required." });
        }

        const promptText = generateChatTitlePrompt(message);
        
        const contents = [
            {
                role: "user",
                parts: [{ text: promptText }]
            }
        ];

        const result = await model.generateContent({ contents });
        const rawTitle = result.response.text();
        const cleanTitle = sanitizeChatTitle(rawTitle);
        
        res.json({ title: cleanTitle });
    } catch (error) {
        console.error("Error in /google/title route:", error);
        res.status(500).json({ success: false, message: "Failed to generate title." });
    }
});

module.exports = router;