const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API
app.get("/api", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "No URL provided" });

    const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)"
      }
    });

    const json = await response.json();
    res.json(json);
  } catch {
    res.status(500).json({ error: "API failed" });
  }
});

// IMAGE DOWNLOAD (FIXED NAME – NO RANDOM)
app.get("/image", async (req, res) => {
  try {
    const imageUrl = req.query.url;
    const fileName = req.query.name;

    if (!imageUrl || !fileName) {
      return res.status(400).send("Missing image or filename");
    }

    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );
    res.setHeader("Cache-Control", "no-store");

    response.body.pipe(res);
  } catch {
    res.status(500).send("Image download failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
