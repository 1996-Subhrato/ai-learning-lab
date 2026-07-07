const express = require("express");
const OpenAI = require('openai');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await client.responses.create({
            model: "gpt-5",
            input: "Explain React in simple Hindi."
        });
        console.log(response.output_text);


        res.send(response.output_text);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message,
            status: error.status
        });
    }
});

router.get('/open-router-ai', async (req, res) => {
    try {
        const client = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1",
        });

        const response = await client.chat.completions.create({
            model: "deepseek/deepseek-chat",
            messages: [
                {
                    role: "user",
                    content: "Explain React in simple Hindi."
                }
            ]
        });

        console.log(response.choices[0].message.content);

        res.send(response.choices[0].message.content);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message,
            status: error.status
        });
    }
});

module.exports = router;
