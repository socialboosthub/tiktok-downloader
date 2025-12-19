const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// TikTok API proxy
app.get("/api", async (req, res) => {
  try {
    const url = req.query.url;
    const r = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );
    const j = await r.json();
    res.json(j);
  } catch (e) {
    res.status(500).json({ error: "API failed" });
  }
});

// VIDEO DOWNLOAD (videos only)
app.get("/download", async (req, res) => {
  try {
    const tiktokUrl = req.query.url; // TikTok page URL
    const fileName = req.query.name || `tiktok_video_${Date.now()}`;

    // Fetch TikWM API to get actual video info
    const apiRes = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`
    );
    const apiJson = await apiRes.json();
    const data = apiJson?.data;

    // Check if it's a story
    const isStory = data?.itemType === "story" || data?.is_story;
    if (isStory) return res.status(400).send("This is a story link. Use Story Downloader page.");

    // Get actual video URL
    const playUrl = data?.play || data?.wmplay;
    if (!playUrl) return res.status(404).send("Video not found");

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
    const tiktokUrl = req.query.url; // TikTok page URL
    const fileName = req.query.name || `tiktok_story_${Date.now()}`;

    // Fetch TikWM API to get actual story info
    const apiRes = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`
    );
    const apiJson = await apiRes.json();
    const data = apiJson?.data;

    const isStory = data?.itemType === "story" || data?.is_story;
    if (!isStory) return res.status(400).send("This is not a story link.");

    const playUrl = data?.play || data?.wmplay;
    if (!playUrl) return res.status(404).send("Story not found or expired");

    const response = await fetch(playUrl);

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");

    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Story download failed");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
