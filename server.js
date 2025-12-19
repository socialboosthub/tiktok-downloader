const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const archiver = require("archiver");

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// TikWM proxy
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

    const api = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );
    const j = await api.json();

    if (j?.data?.images) {
      return res.status(400).send("This is a slider post");
    }

    if (j?.data?.is_story) {
      return res.status(400).send("This is a story");
    }

    const play = j.data.play || j.data.wmplay;
    const name = j.data.author?.unique_id || "tiktok_video";

    const r = await fetch(play);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${name}.mp4"`
    );
    res.setHeader("Content-Type", "video/mp4");

    r.body.pipe(res);
  } catch {
    res.status(500).send("Video download failed");
  }
});

// ================= STORY DOWNLOAD =================
app.get("/story", async (req, res) => {
  try {
    const url = req.query.url;

    const api = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );
    const j = await api.json();

    if (!j?.data?.is_story) {
      return res.status(400).send("Not a story");
    }

    const play = j.data.play || j.data.wmplay;
    const name = j.data.author?.unique_id || "tiktok_story";

    const r = await fetch(play);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${name}.mp4"`
    );
    res.setHeader("Content-Type", "video/mp4");

    r.body.pipe(res);
  } catch {
    res.status(500).send("Story download failed");
  }
});

// ================= SLIDER ZIP DOWNLOAD =================
app.get("/slider-zip", async (req, res) => {
  try {
    const images = JSON.parse(req.query.images);
    const name = req.query.name || "tiktok_slider";

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${name}.zip"`
    );
    res.setHeader("Content-Type", "application/zip");

    const archive = archiver("zip");
    archive.pipe(res);

    for (let i = 0; i < images.length; i++) {
      const r = await fetch(images[i]);
      archive.append(r.body, { name: `${name}_${i + 1}.jpg` });
    }

    archive.finalize();
  } catch {
    res.status(500).send("Slider download failed");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Server running on port " + PORT)
);
