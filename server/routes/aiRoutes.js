const express = require('express');
const router = express.Router();
const axios = require('axios');
const pdfParse = require("pdf-parse");
const multer = require("multer");
const HUGGINGFACE_API_KEY = process.env.HF_API_KEY;
const { PDFDocument } = require("pdf-lib");
// const fs = require("fs");
const fs = require("fs-extra");

const path = require("path");
const { fromPath } = require("pdf2pic");
const { PDFImage } = require("pdf-image");



router.post("/analyze-text", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "Text is required" });

        const response = await axios.post(
            "https://api-inference.huggingface.co/models/roberta-base-openai-detector",
            { inputs: text },
            {
                headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}` },
            }
        );

        res.json({ result: response.data });
    } catch (error) {
        res.status(500).json({ error: "Error analyzing text", details: error.message });
    }
});

// Configure multer to accept only PDFs
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "application/pdf") {
            return cb(new Error("Only PDF files are allowed"));
        }
        cb(null, true);
    },
});



const COHERE_API_URL = "https://api.cohere.ai/v1/generate";
const CohereAPI_KEY = "7Dbjk8G3UCx4QSkXxuApvNpPH4AFKaW1aOy743z3";

async function analyzeText(text, task) {
    const prompt = `You are an expert in analyzing business reports. Carefully analyze the following text:\n\n"${text}"\n\nPerform the following task with detailed insights: "${task}". Provide a clear and concise response with relevant information and actionable insights.`;
    
    const response = await axios.post(
        COHERE_API_URL,
        {
            model: "command",  // Use the best Cohere model
            prompt: prompt,
            max_tokens: 200,  // Increase token limit for a more detailed response
            temperature: 0.3, // Lower temperature for more focused responses
        },
        { headers: { Authorization: `Bearer ${CohereAPI_KEY}` } }
    );

    return response.data.generations[0]?.text.trim() || "No relevant insights found.";
}

router.post("/analyze-pdf", upload.single("pdf"), async (req, res) => {
    console.log("hello world");
    
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
        const data = await pdfParse(req.file.buffer);

        console.log("PDF Data:", data);

        
        const text = data.text.trim();
        if (!text) return res.status(400).json({ error: "Unable to extract text from PDF" });

        const truncatedText = text.substring(0, 5000);

        // Extract required insights using Hugging Face summarization model
        const [summary, taskPrioritization, resourceAllocation, riskAnalysis, errorRework, businessCost] =
    await Promise.all([
        analyzeText(truncatedText, "Summarize the key points and provide a brief overview."),
        analyzeText(truncatedText, "Identify and prioritize the most critical tasks with justifications."),
        analyzeText(truncatedText, "Suggest an optimal approach for resource allocation and justify the distribution."),
        analyzeText(truncatedText, "Analyze potential risks and suggest mitigation strategies."),
        analyzeText(truncatedText, "Evaluate possible errors and provide a plan to minimize rework."),
        analyzeText(truncatedText, "Propose strategies to optimize business costs and improve efficiency."),
    ]);


        res.json({
            summary,
            taskPrioritization,
            resourceAllocation,
            riskAnalysis,
            errorRework,
            businessCost,
        });
    } catch (error) {
        console.error("Error processing PDF:", error.message);
        res.status(500).json({ error: "Error analyzing PDF", details: error.message });
    }
});



const HF_SUMMARY_API = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
const HF_QA_API = "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2";
const HF_API_KEY = HUGGINGFACE_API_KEY; // Replace with your API key

const headers = { Authorization: `Bearer ${HF_API_KEY}` };

// PDF Summarization Endpoint
let fullPdfText = ""; // Store full PDF text globally

router.post("/summarize", upload.single("pdf"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });

    console.log("📄 PDF uploaded:", req.file);
    

    try {
        const pdfText = await pdfParse(req.file.buffer);
        fullPdfText = pdfText.text; // Store the entire PDF text

        const response = await axios.post(HF_SUMMARY_API, { inputs: fullPdfText }, { headers });
        res.json({ summary: response.data[0].summary_text, fullText: fullPdfText });
    } catch (error) {
        console.error("Summarization Error:", error);
        res.status(500).json({ error: "Error summarizing PDF" });
    }
});


// const uploads = multer({ dest: "uploads/" });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "uploads/";
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const uploads = multer({ storage });

router.post("/extract-images", uploads.single("pdf"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No PDF file uploaded" });
        }

        // Dynamically import pdfjs-dist (since it's an ESM module)
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
        const { getDocument, OPS } = pdfjsLib;

        const pdfPath = req.file.path;
        console.log("PDF Uploaded Path:", pdfPath);

        const pdfData = await fs.promises.readFile(pdfPath);
        const pdfDoc = await getDocument({ data: pdfData }).promise;

        const outputDir = path.join("uploads", "extracted_images");
        await fs.ensureDir(outputDir);

        let imageFiles = [];

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const operatorList = await page.getOperatorList();

            for (let i = 0; i < operatorList.fnArray.length; i++) {
                if (operatorList.fnArray[i] === OPS.paintImageXObject) {
                    const imgName = operatorList.argsArray[i][0];
                    const img = await page.objs.get(imgName);

                    if (img) {
                        const pdfLibDoc = await PDFDocument.create();
                        const embeddedImage = await pdfLibDoc.embedPng(img.data);
                        const imageBytes = await embeddedImage.save();

                        const imagePath = path.join(outputDir, `image_${pageNum}_${i}.png`);
                        await fs.promises.writeFile(imagePath, imageBytes);
                        imageFiles.push(imagePath);
                    }
                }
            }
        }

        if (imageFiles.length === 0) {
            return res.status(404).json({ error: "No images found in the PDF" });
        }

        res.json({ message: "Images extracted successfully", images: imageFiles });

    } catch (error) {
        console.error("Error extracting images:", error);
        res.status(500).json({ error: error.message });
    }
});

// Function to split text into chunks
const splitText = (text, chunkSize = 512, overlap = 50) => {
    let chunks = [];
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
        chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
};

router.post("/ask", async (req, res) => {
    const { question ,text} = req.body;

    console.log("Question:", question);
    console.log("Text:", text);
    

    if (!text || !question) {
        return res.status(400).json({ error: "Invalid input" });
    }

    try {
        const textChunks = splitText(text);
        let answers = [];

        for (const chunk of textChunks) {
            const response = await axios.post(
                HF_QA_API,
                { inputs: { question, context: chunk } },
                { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
            );
            answers.push(response.data.answer);
        }


        // Return the most common answer
        const finalAnswer = answers.find(ans => ans) || "No relevant answer found.";
        res.json({ answer: finalAnswer });

    } catch (error) {
        console.error("QA Error:", error);
        res.status(500).json({ error: "Error answering question" });
    }
});


module.exports = router