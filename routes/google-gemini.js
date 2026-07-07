const express = require("express");
// const { marked } = require("marked");
// const hljs = require("highlight.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
});

router.post('/chat', async (req, res) => {
    try {
        const { prompt } = req.body;

        const result = await model.generateContent(prompt);
        res.json({
            success: true,
            response: result.response.text()
        });


        // const markdown = result.response.text();
        // const html = marked(markdown);
        // res.json({
        //     aiResponse: html
        // });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;