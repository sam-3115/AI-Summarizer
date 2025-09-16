// Configure the backend URL where you deployed the Express server.
// Example: "https://my-summarizer-backend.onrender.com" or "http://localhost:3000"
// const BACKEND_URL = "http://localhost:3000"; // <-- Change this to your deployed backend
// Auto-detect backend: use localhost for local dev, Render URL for production
const BACKEND_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://my-summarizer.onrender.com";  // <-- replace with your Render backend URL


const summarizeBtn = document.getElementById("summarizeBtn");
const inputText = document.getElementById("inputText");
const summaryDiv = document.getElementById("summary");
const maxLengthInput = document.getElementById("maxLength");
const copyBtn = document.getElementById("copyBtn");

summarizeBtn.addEventListener("click", async () => {
  const text = inputText.value.trim();
  if (!text) {
    alert("Please paste some text to summarize.");
    return;
  }
  const max_length = parseInt(maxLengthInput.value) || 150;

  summaryDiv.textContent = "Summarizing... (this may take a few seconds)";
  summarizeBtn.disabled = true;

  try {
    const res = await fetch(`${BACKEND_URL}/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, max_length })
    });

    if (!res.ok) {
      const err = await res.json().catch(()=>({error:res.statusText}));
      summaryDiv.textContent = "Error: " + (err.error || JSON.stringify(err));
      summarizeBtn.disabled = false;
      return;
    }

    const data = await res.json();
    summaryDiv.textContent = data.summary || "No summary returned.";
    copyBtn.style.display = "inline-block";
  } catch (err) {
    summaryDiv.textContent = "Network error or backend not deployed. Check console.";
    console.error(err);
  } finally {
    summarizeBtn.disabled = false;
  }
});

copyBtn.addEventListener("click", () => {
  const text = summaryDiv.textContent || "";
  navigator.clipboard.writeText(text).then(()=> {
    copyBtn.textContent = "Copied!";
    setTimeout(()=> copyBtn.textContent = "Copy Summary", 1500);
  }).catch(()=> alert("Copy failed"));
});
