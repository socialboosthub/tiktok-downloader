const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Main API handler with Cloudflare Bypass
app.get("/api", async (req, res) => {
  const videoUrl = req.query.url;
  
  try {
    const response = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.tikwm.com/',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const text = await response.text();

    // Check if Cloudflare blocked us
    if (text.includes("Just a moment") || text.includes("<html")) {
      console.error("BLOCK DETECTED: API returned HTML/Cloudflare instead of JSON.");
      return res.status(403).json({ code: -1, msg: "Cloudflare Blocked Request" });
    }

    const data = JSON.parse(text);
    res.json(data);
    
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ code: -1, msg: "Server Error" });
  }
});

// Profile downloader API
app.get("/profile", async (req, res) => {
  const profileUrl = req.query.url;
  const page = req.query.page || 0;

  try {
    const response = await fetch(`https://tikwm.com/api/user/posts?unique_id=${encodeURIComponent(profileUrl)}&count=12&cursor=${page}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
        'Referer': 'https://www.tikwm.com/'
      }
    });
    const data = await response.json();
    res.json(data.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Download Proxy (Fixes CORS and provides attachment)
app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  const fileName = req.query.name || "tiktok_video";

  try {
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
      }
    });

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}.mp4`);
    res.setHeader("Content-Type", "video/mp4");
    response.body.pipe(res);
  } catch (error) {
    res.status(500).send("Download failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

