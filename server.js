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

app.get("/profile", async (req, res) => {
  try {
    const { url, page = 0 } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Profile URL required" });
    }

    const cursor = page * 6;

    const username = url.split("/").filter(Boolean).pop();

const apiUrl =
  `https://tikwm.com/api/user/posts?unique_id=${encodeURIComponent(username)}&count=6&cursor=${cursor}`;

    const response = await fetch(apiUrl);
    const json = await response.json();

    if (!json.data) {
      return res.json({ hasMore: false, videos: [] });
    }

    const user = {
      avatar: json.data.user.avatar_thumb,
      username: json.data.user.unique_id,
      followers: json.data.stats.followerCount,
      following: json.data.stats.followingCount,
      likes: json.data.stats.heartCount
    };

    const videos = json.data.videos.map(v => ({
      id: v.video_id,
      cover: v.cover,
      caption: v.title,
      play: v.play
    }));

    res.json({
      user,
      videos,
      hasMore: json.data.hasMore
    });

  } catch (e) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});
