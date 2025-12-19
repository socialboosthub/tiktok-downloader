const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();

// SERVE STATIC FILES
app.use(express.static(path.join(__dirname, "public")));

// Home route (extra safety)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api", async (req, res) => {
  const url = req.query.url;
  const r = await fetch(
    `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
  );
  const j = await r.json();
  res.json(j);
});

app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  const response = await fetch(videoUrl);

  // 🔴 CHANGED PART (ONLY THIS)
  const uniqueName =
    "tiktok_" + Date.now() + "_" + Math.floor(Math.random() * 1e9);

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${uniqueName}.mp4"`
  );
  res.setHeader("Content-Type", "video/mp4");

  response.body.pipe(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Server running on port " + PORT)
);
