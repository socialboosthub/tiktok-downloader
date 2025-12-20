const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

// SERVE STATIC FILES
app.use(express.static(path.join(__dirname, "public")));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// TikTok API proxy
app.get("/api", async (req, res) => {
  const url = req.query.url;
  const r = await fetch(
    `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
  );
  const j = await r.json();
  res.json(j);
});

// DOWNLOAD ROUTE (FINAL & CORRECT)
app.get("/download", async (req, res) => {
  try {
    const videoUrl = req.query.url;

    // 👇 filename comes from frontend (TikTok video ID)
    const fileName = req.query.name || "tiktok_video";

    const response = await fetch(videoUrl);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}.mp4"`
    );
    res.setHeader("Content-Type", "video/mp4");

    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Download failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Server running on port " + PORT)
);
