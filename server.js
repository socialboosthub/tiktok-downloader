const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

/* SERVE STATIC FILES */
app.use(express.static(path.join(__dirname, "public")));

/* HOME */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* SINGLE VIDEO API */
app.get("/api", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "No URL" });

    const r = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );
    const j = await r.json();
    res.json(j);
  } catch (err) {
    res.status(500).json({ error: "API failed" });
  }
});

/* 🔥 PROFILE → FIRST 10 VIDEOS */
app.get("/profile", async (req, res) => {
  try {
    const profileUrl = req.query.url;
    if (!profileUrl)
      return res.status(400).json({ error: "No profile URL" });

    const r = await fetch(
      `https://tikwm.com/api/user/posts?url=${encodeURIComponent(
        profileUrl
      )}&count=10`
    );
    const j = await r.json();

    if (!j.data || !j.data.videos) {
      return res.status(500).json({ error: "No videos found" });
    }

    // Return VIDEO PAGE LINKS (not direct mp4)
    const links = j.data.videos.map(
      v => `https://www.tiktok.com/@${v.author.unique_id}/video/${v.video_id}`
    );

    res.json({ links });
  } catch (err) {
    res.status(500).json({ error: "Profile fetch failed" });
  }
});

/* VIDEO DOWNLOAD */
app.get("/download", async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.sendStatus(400);

    const response = await fetch(videoUrl);

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=tiktok.mp4"
    );
    res.setHeader("Content-Type", "video/mp4");

    response.body.pipe(res);
  } catch (err) {
    res.sendStatus(500);
  }
});

/* START SERVER */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
