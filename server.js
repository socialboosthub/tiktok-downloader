const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

// 1. Middleware & Static Files
app.use(express.static(path.join(__dirname, "public")));

// 2. Home Route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 3. General API Proxy (Used by frontend to get video/post data)
app.get("/api", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const r = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const j = await r.json();
    res.json(j);
  } catch (e) {
    res.status(500).json({ error: "API failed to fetch video data" });
  }
});

// 4. Video & Story Downloader
app.get("/download", async (req, res) => {
  try {
    const url = req.query.url;
    const fileName = req.query.name || "tiktok_media";

    const apiRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const apiJson = await apiRes.json();
    
    if (!apiJson.data) return res.status(404).send("Content not found");

    // Determine if it's a story or video and get the best URL
    const playUrl = apiJson.data.play || apiJson.data.wmplay;

    if (!playUrl) return res.status(400).send("No downloadable video found for this link.");

    const response = await fetch(playUrl);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");
    response.body.pipe(res);

  } catch (err) {
    res.status(500).send("Download failed");
  }
});

// 5. Slider Images Data Route
app.get("/slider", async (req, res) => {
  try {
    const url = req.query.url;
    const r = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const j = await r.json();
    const data = j.data;

    if (!data?.images || data.images.length === 0) {
      return res.status(400).json({ error: "This post does not contain a photo slider." });
    }

    res.json({
      author: data.author,
      caption: data.title,
      images: data.images // Returns array of image URLs
    });
  } catch (err) {
    res.status(500).json({ error: "Slider fetch failed" });
  }
});

// 6. Individual Image Downloader (For Sliders)
app.get("/image", async (req, res) => {
  try {
    const url = req.query.url;
    const name = req.query.name || "tiktok_photo";

    const r = await fetch(url);
    res.setHeader("Content-Disposition", `attachment; filename="${name}.jpg"`);
    res.setHeader("Content-Type", "image/jpeg");
    r.body.pipe(res);
  } catch (err) {
    res.status(500).send("Image download failed");
  }
});

// 7. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
