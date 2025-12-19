const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// TikTok API proxy
app.get("/api", async (req, res) => {
  try {
    const url = req.query.url;
    const r = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const j = await r.json();
    res.json(j);
  } catch (e) {
    res.status(500).json({ error: "API failed" });
  }
});

// VIDEO DOWNLOAD (videos only)
app.get("/download", async (req, res) => {
  try {
    const videoUrl = req.query.url;
    const fileName = req.query.name || `tiktok_video_${Date.now()}`;

    const apiRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`);
    const apiJson = await apiRes.json();

    const isStory = apiJson?.data?.itemType === "story" || apiJson?.data?.is_story;
    if (isStory) return res.status(400).send("This is a story link. Use the Story Downloader.");

    const playUrl = apiJson?.data?.play || apiJson?.data?.wmplay || videoUrl;
    const response = await fetch(playUrl);

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");

    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Video download failed");
  }
});

// STORY DOWNLOAD (stories only)
app.get("/story", async (req, res) => {
  try {
    const storyUrl = req.query.url;
    const fileName = req.query.name || `tiktok_story_${Date.now()}`;

    const apiRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(storyUrl)}`);
    const apiJson = await apiRes.json();

    const isStory = apiJson?.data?.itemType === "story" || apiJson?.data?.is_story;
    if (!isStory) return res.status(400).send("This is not a story link.");

    const storyVideo = apiJson?.data?.play || apiJson?.data?.wmplay;
    if (!storyVideo) return res.status(404).send("Story not found or expired");

    const response = await fetch(storyVideo);

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");

    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Story download failed");
  }
});

// SLIDER/PHOTO DOWNLOAD (sliders only)
app.get("/slider", async (req, res) => {
  try {
    const sliderUrl = req.query.url;
    const fileName = req.query.name || `tiktok_slider_${Date.now()}`;

    const apiRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(sliderUrl)}`);
    const apiJson = await apiRes.json();

    const images = apiJson?.data?.images || [];
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).send("This is not a slider/photo post or no images found.");
    }

    // Send JSON with images for frontend to handle
    res.json({ images, name: fileName });
  } catch (err) {
    res.status(500).send("Slider download failed");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
