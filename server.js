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
    if (!url) return res.status(400).json({ error: "Profile URL required" });

    // ✅ SAFELY extract username
    const cleanUrl = url.split("?")[0];
    const username = cleanUrl
      .split("/")
      .filter(p => p.startsWith("@"))[0]
      ?.replace("@", "");

    if (!username) {
      return res.status(400).json({ error: "Invalid TikTok profile URL" });
    }

    const cursor = Number(page) * 6;

    const apiUrl =
      `https://tikwm.com/api/user/posts?unique_id=${username}&count=6&cursor=${cursor}`;

    const response = await fetch(apiUrl);
    const text = await response.text();

    // 🔒 Detect HTML block page
    if (text.startsWith("<")) {
      console.error("TikWM HTML response (blocked)");
      return res.status(503).json({ error: "TikTok server blocked request" });
    }

    const json = JSON.parse(text);

    if (!json.data || !json.data.user) {
      return res.status(404).json({ error: "Profile not found" });
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

  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});
