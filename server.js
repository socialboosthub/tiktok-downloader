const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

/* =========================
   STATIC FILES
========================= */
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   VIDEO INFO API
========================= */
app.get("/api", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const r = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );
    const j = await r.json();
    res.json(j);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch video info" });
  }
});

/* =========================
   VIDEO DOWNLOAD
========================= */
app.get("/download", async (req, res) => {
  try {
    const videoUrl = req.query.url;
    const name = req.query.name || "tiktok";

    if (!videoUrl) {
      return res.status(400).send("Video URL missing");
    }

    const response = await fetch(videoUrl);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${name}.mp4`
    );
    res.setHeader("Content-Type", "video/mp4");

    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Download failed");
  }
});

/* =========================
   PROFILE DOWNLOADER API
========================= */
app.get("/profile", async (req, res) => {
  try {
    let username = req.query.username;
    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    username = username.replace("@", "");

    const apiUrl =
      `https://tikwm.com/api/user/posts?unique_id=${username}&count=8`;

    const r = await fetch(apiUrl);
    const j = await r.json();

    if (!j.data || !j.data.user) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const user = j.data.user;

    const videos = j.data.videos.slice(0, 8).map(v => ({
      cover: v.cover || v.origin_cover,
      play: v.play
    }));

    res.json({
      username: user.unique_id,
      nickname: user.nickname,
      avatar: user.avatar,
      videos
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to load profile" });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
