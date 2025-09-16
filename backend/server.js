// Simple Express backend to proxy requests to Hugging Face Inference API
// const express = require("express");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const axios = require("axios");

require("dotenv").config();   // <-- add this line
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");


const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "1mb" }));

const HF_API_KEY = process.env.HF_API_KEY || ""; // set this in environment variables
if (!HF_API_KEY) {
  console.warn("Warning: HF_API_KEY not set. Set environment variable before running in production.");
}

app.get("/", (req, res) => res.send("Hugging Face Summarizer Proxy"));

app.post("/summarize", async (req, res) => {
  try {
    const { text, max_length = 150 } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "No text provided" });
    }

    // Using the Hugging Face Inference API for summarization model
    // Model: facebook/bart-large-cnn (good summarization model)
    const model = "facebook/bart-large-cnn";

    const hfResponse = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      { inputs: text, parameters: { max_length: max_length, min_length: 30 } },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 120000,
      }
    );

    // Response could be text or array of {summary_text: "..."} depending on model
    let summary = "";
    if (Array.isArray(hfResponse.data)) {
      if (hfResponse.data[0] && hfResponse.data[0].summary_text) {
        summary = hfResponse.data[0].summary_text;
      } else if (typeof hfResponse.data[0] === "string") {
        summary = hfResponse.data[0];
      } else {
        summary = JSON.stringify(hfResponse.data);
      }
    } else if (typeof hfResponse.data === "string") {
      summary = hfResponse.data;
    } else if (hfResponse.data.summary_text) {
      summary = hfResponse.data.summary_text;
    } else {
      summary = JSON.stringify(hfResponse.data);
    }

    res.json({ summary });
  } catch (err) {
    console.error("Error in /summarize:", err.response ? err.response.data : err.message);
    res.status(500).json({ error: "Failed to summarize", details: err.response ? err.response.data : err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`HF summarizer proxy listening on port ${PORT}`);
});
