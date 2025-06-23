const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const user = require("./models/userModel");
const path = require("path");
const upload = require("./config/multerConfig");
const app = express();
const axios = require("axios");
const fs = require("fs");
const { Deepgram } = require("@deepgram/sdk");
const { OpenAI } = require("openai");

dotenv.config();

connectDB();

app.use(
  cors({
    origin: true,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "./uploads")));
app.use(express.json());

const createAdmin = async () => {
  try {
    const existingAdmin = await user.findOne({
      username: "admin",
      role: "admin",
    });
    if (!existingAdmin) {
      // Hash the password before saving
      const salt = await bcrypt.genSalt(10); // Generate a salt
      const hashedPassword = await bcrypt.hash("1234", salt); // Hash the password

      const admin = new user({
        username: "admin",
        email: "admin@gmail.com",
        password: hashedPassword, // Save the hashed password
        phone: "1234567890",
        isVerified: true,
        isAdmin: true,
        role: "admin",
      });
      await admin.save();
      console.log("Hardcoded admin created.");
    } else {
      console.log("Admin already exists.");
    }
  } catch (error) {
    console.error("Error creating admin:", error);
  }
};

createAdmin();

app.use("/", require("./routes/aiRoutes"));
app.use("/", require("./routes/aiRoutes2"));

app.use("/api", require("./routes/auth"));
// app.use('/api/reports', require('./routes/reportUpload'));
app.use("/api/admin", require("./routes/adminRoutes"));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  const audioPath = req.file.path;
  const apiKey =
    "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";

  const formData = new FormData();
  formData.append("file", fs.createReadStream(audioPath));
  formData.append("model", "whisper-1");
  formData.append("language", "en"); // Change for different language

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    res.json({ transcript: response.data.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    fs.unlinkSync(audioPath); // Clean up the uploaded file
  }
});

app.post("/generate-text", async (req, res) => {
  console.log("hello");
});

// Listen on port 6000
const PORT = 7000;
app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
