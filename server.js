const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// TikWM proxy
app.get("/api", async (req, res) => {
  try {
    const url = req.query.url;
    const r = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const j = await r.json();
    res.json(j);
  } catch {
    res.status(500).json({ error: "API failed" });
  }
});

// Slider images ONLY
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
      images: data.images
    });

  } catch {
    res.status(500).json({ error: "Slider fetch failed" });
  }
});

// Force image download
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
app.listen(PORT, () => console.log("Server running on " + PORT));
