const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

// Serve your frontend files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/**
 * 1. GENERAL API PROXY
 * This works for both Videos and Slideshows to get the initial data
 */
app.get("/api", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "No URL provided" });

    const r = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const j = await r.json();
    res.json(j);
  } catch (error) {
    res.status(500).json({ error: "API failed" });
  }
});

/**
 * 2. SLIDER DATA ROUTE
 * Use this specifically if you want to filter for images only
 */
app.get("/slider", async (req, res) => {
  try {
    const url = req.query.url;
    const r = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const j = await r.json();
    const data = j.data;

    if (!data?.images || data.images.length === 0) {
      return res.status(400).json({ error: "Not a slider post" });
    }

    res.json({
      author: data.author,
      caption: data.title,
      images: data.images,
      music: data.music
    });
  } catch {
    res.status(500).json({ error: "Slider fetch failed" });
  }
});

/**
 * 3. VIDEO DOWNLOAD PROXY
 * Forces the browser to download the .mp4 file
 */
app.get("/download", async (req, res) => {
  try {
    const videoUrl = req.query.url;
    const fileName = req.query.name || "tiktok_video";

    const response = await fetch(videoUrl);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");

    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Video download failed");
  }
});

/**
 * 4. IMAGE DOWNLOAD PROXY
 * Forces the browser to download individual slideshow photos as .jpg
 */
app.get("/image", async (req, res) => {
  try {
    const url = req.query.url;
    const name = req.query.name || "tiktok_photo";

    const r = await fetch(url);
    res.setHeader("Content-Disposition", `attachment; filename="${name}.jpg"`);
    res.setHeader("Content-Type", "image/jpeg");
    
    r.body.pipe(res);
  } catch {
    res.status(500).send("Image download failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
