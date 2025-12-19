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
    const r = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const j = await r.json();
    res.json(j);
  } catch (e) {
    res.status(500).json({ error: "API failed" });
  }
});

// VIDEO DOWNLOAD
app.get("/download", async (req, res) => {
  try {
    const url = req.query.url;
    const name = req.query.name || `tiktok_video_${Date.now()}`;

    const apiRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const apiJson = await apiRes.json();

    // Check type
    const data = apiJson?.data;
    if (!data) return res.status(404).send("Video not found");
    if (data.is_story || data.itemType === "story") {
      return res.status(400).send("This is a story link. Use /story endpoint");
    }
    if (data.itemType === "slide") {
      return res.status(400).send("This is a slider. Use /slider endpoint");
    }

    const playUrl = data.play || data.wmplay;
    if (!playUrl) return res.status(404).send("Video URL not found");

    const response = await fetch(playUrl);

    res.setHeader("Content-Disposition", `attachment; filename="${name}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");

    response.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Video download failed");
  }
});

// STORY DOWNLOAD
app.get("/story", async (req, res) => {
  try {
    const url = req.query.url;
    const name = req.query.name || `tiktok_story_${Date.now()}`;

    const apiRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const apiJson = await apiRes.json();

    const data = apiJson?.data;
    if (!data) return res.status(404).send("Story not found");
    if (!(data.is_story || data.itemType === "story")) {
      return res.status(400).send("This is not a story link.");
    }

    const playUrl = data.play || data.wmplay;
    if (!playUrl) return res.status(404).send("Story video not found");

    const response = await fetch(playUrl);

    res.setHeader("Content-Disposition", `attachment; filename="${name}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");

    response.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Story download failed");
  }
});

// SLIDER DOWNLOAD
app.get("/slider", async (req, res) => {
  try {
    const url = req.query.url;
    const name = req.query.name || `tiktok_slider_${Date.now()}`;

    const apiRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const apiJson = await apiRes.json();

    const data = apiJson?.data;
    if (!data) return res.status(404).send("Slider not found");
    if (data.itemType !== "slide") return res.status(400).send("This is not a slider post");

    const slides = data.images || data.slides || [];
    if (!slides.length) return res.status(404).send("No slides available");

    // For now, just send the first slide if only one, otherwise zip all
    if (slides.length === 1) {
      const response = await fetch(slides[0]);
      res.setHeader("Content-Disposition", `attachment; filename="${name}.jpg"`);
      res.setHeader("Content-Type", "image/jpeg");
      response.body.pipe(res);
    } else {
      const archiver = require("archiver");
      res.setHeader("Content-Disposition", `attachment; filename="${name}.zip"`);
      res.setHeader("Content-Type", "application/zip");

      const archive = archiver("zip");
      archive.pipe(res);

      for (let i = 0; i < slides.length; i++) {
        const slideResponse = await fetch(slides[i]);
        archive.append(slideResponse.body, { name: `slide_${i + 1}.jpg` });
      }

      archive.finalize();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Slider download failed");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
