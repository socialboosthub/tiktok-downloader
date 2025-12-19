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

// TikWM API proxy
app.get("/api", async (req, res) => {
  try {
    const url = req.query.url;
    const r = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );
    const j = await r.json();
    res.json(j);
  } catch {
    res.status(500).json({ error: "API failed" });
  }
});

// ================= VIDEO DOWNLOAD =================
app.get("/download", async (req, res) => {
  try {
    const url = req.query.url;
    const name = req.query.name || `tiktok_${Date.now()}`;

    const r = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );
    const j = await r.json();

    const isStory = j?.data?.itemType === "story" || j?.data?.is_story;
    if (isStory) {
      return res.status(400).send("This is a story. Use story downloader.");
    }

    const play = j?.data?.play || j?.data?.wmplay;
    const video = await fetch(play);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${name}.mp4"`
    );
    res.setHeader("Content-Type", "video/mp4");

    video.body.pipe(res);
  } catch {
    res.status(500).send("Video download failed");
  }
});

// ================= STORY DOWNLOAD =================
app.get("/story", async (req, res) => {
  try {
    const url = req.query.url;
    const name = req.query.name || `story_${Date.now()}`;

    const r = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );
    const j = await r.json();

    const isStory = j?.data?.itemType === "story" || j?.data?.is_story;
    if (!isStory) {
      return res.status(400).send("Not a story");
    }

    const play = j?.data?.play || j?.data?.wmplay;
    const video = await fetch(play);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${name}.mp4"`
    );
    res.setHeader("Content-Type", "video/mp4");

    video.body.pipe(res);
  } catch {
    res.status(500).send("Story download failed");
  }
});

// ================= SLIDER INFO =================
app.get("/slider", async (req, res) => {
  try {
    const url = req.query.url;

    const r = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );
    const j = await r.json();
    const d = j.data;

    if (!Array.isArray(d?.images) || d.images.length === 0) {
      return res.status(400).send("Not a slider post");
    }

    res.json({
      images: d.images,
      username: d.author?.unique_id || d.author?.nickname || "unknown",
      avatar: d.author?.avatar || d.author?.avatar_thumb || "",
      caption: d.title || "No caption available",
      name: `slider_${d.id || Date.now()}`
    });
  } catch {
    res.status(500).send("Slider fetch failed");
  }
});

// ================= SLIDER IMAGE DOWNLOAD (MOBILE SAFE) =================
app.get("/slider-download", async (req, res) => {
  try {
    const img = req.query.img;
    const name = req.query.name || `photo_${Date.now()}.jpg`;

    const r = await fetch(img);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${name}"`
    );
    res.setHeader("Content-Type", "image/jpeg");

    r.body.pipe(res);
  } catch {
    res.status(500).send("Image download failed");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Server running on port " + PORT)
);
