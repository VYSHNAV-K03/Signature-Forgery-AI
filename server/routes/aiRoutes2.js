const express = require('express');
const router = express.Router();
const axios = require('axios');
const pdfParse = require("pdf-parse");
const multer = require("multer");
const { appendBezierCurve } = require('pdf-lib');


const COHERE_API_URL = "https://api.cohere.ai/v1/generate";
const API_KEY = "7Dbjk8G3UCx4QSkXxuApvNpPH4AFKaW1aOy743z3"; // Store API key securely

router.post("/api/answer", async (req, res) => {
    try {
        const { context, question } = req.body;
        const prompt = `Given the following paragraph:\n"${context}"\nAnswer the question: "${question}"`;

        const response = await axios.post(
            COHERE_API_URL,
            {
                model: "command",  // Use the best Cohere model
                prompt: prompt,
                max_tokens: 100,
                temperature: 0.5,  // Controls randomness
            },
            { headers: { Authorization: `Bearer ${API_KEY}` } }
        );

        res.json({ answer: response.data.generations[0].text.trim() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching answer from Cohere" });
    }
});







module.exports = router