const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
import fetch from "node-fetch";
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

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=tiktok.mp4"
  );
  res.setHeader("Content-Type", "video/mp4");

  response.body.pipe(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Server running on port " + PORT)
);

const express = require('express');
const cors = require('cors');
const TikTokScraper = require('tiktok-scraper');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/profile', async (req, res) => {
  try {
    const { username } = req.body;

    const user = await TikTokScraper.getUserProfileInfo(username);
    const videos = await TikTokScraper.user(username, { number: 12 });

    res.json({
      profile: {
        username: user.user.uniqueId,
        bio: user.user.signature,
        avatar: user.user.avatarLarger
      },
      videos: videos.collector
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
