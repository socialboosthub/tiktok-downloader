const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

/* =======================
   STATIC FILES
======================= */
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* =======================
   API PROXY (ALL TYPES)
======================= */
app.get("/api", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "No URL" });

    const r = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );
    const j = await r.json();

    res.json(j);
  } catch {
    res.status(500).json({ error: "API failed" });
  }
});

/* =======================
   VIDEO DOWNLOAD (ONLY VIDEO)
======================= */
app.get("/download", async (req, res) => {
  try {
    const url = req.query.url;
    const name = req.query.name || "tiktok_video";

    const apiRes = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );
    const apiJson = await apiRes.json();
    const data = apiJson.data;

    // BLOCK sliders & stories
    if (data.images || data.is_story) {
      return res.status(400).send("Not a video");
    }

    const videoUrl = data.play || data.wmplay;
    if (!videoUrl) return res.status(404).send("Video not found");

    const videoRes = await fetch(videoUrl);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${name}.mp4"`
    );
    res.setHeader("Content-Type", "video/mp4");

    videoRes.body.pipe(res);
  } catch {
    res.status(500).send("Video download failed");
  }
});

/* =======================
   STORY DOWNLOAD (ONLY STORY)
======================= */
app.get("/story", async (req, res) => {
  try {
    const url = req.query.url;
    const name = req.query.name || "tiktok_story";

    const apiRes = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );
    const apiJson = await apiRes.json();
    const data = apiJson.data;

    if (!data.is_story) {
      return res.status(400).send("Not a story");
    }

    const storyUrl = data.play || data.wmplay;
    if (!storyUrl) return res.status(404).send("Story expired");

    const storyRes = await fetch(storyUrl);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${name}.mp4"`
    );
    res.setHeader("Content-Type", "video/mp4");

    storyRes.body.pipe(res);
  } catch {
    res.status(500).send("Story download failed");
  }
});

/* =======================
   SLIDER METADATA
======================= */
app.get("/slider", async (req, res) => {
  try {
    const url = req.query.url;

    const apiRes = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );
    const apiJson = await apiRes.json();
    const data = apiJson.data;

    if (!data.images || data.images.length === 0) {
      return res.status(400).json({ error: "Not a slider" });
    }

    res.json({
      images: data.images,
      caption: data.title,
      author: data.author
    });
  } catch {
    res.status(500).json({ error: "Slider failed" });
  }
});

/* =======================
   IMAGE DOWNLOAD (FOR SLIDER)
======================= */
app.get("/image", async (req, res) => {
  try {
    const imgUrl = req.query.url;
    const name = req.query.name || "photo";

    const imgRes = await fetch(imgUrl);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${name}.jpg"`
    );
    res.setHeader("Content-Type", "image/jpeg");

    imgRes.body.pipe(res);
  } catch {
    res.status(500).send("Image download failed");
  }
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Server running on port " + PORT)
);
