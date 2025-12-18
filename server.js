const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Single Video API (Works for your lazy loading)
app.get("/api", async (req, res) => {
  const url = req.query.url;
  try {
    const r = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );
    const j = await r.json();
    res.json(j);
  } catch (e) {
    res.status(500).json({ error: "API Error" });
  }
});

// NEW: Profile Endpoint
app.get("/profile", async (req, res) => {
  const profileUrl = req.query.url;
  
  // 1. Extract Username from URL (e.g., @user)
  const match = profileUrl.match(/@([a-zA-Z0-9_.-]+)/);
  if (!match) {
    return res.json({ error: "Invalid username" });
  }
  const unique_id = match[1];

  // 2. Fetch list of posts (Standard limit is ~30 per request)
  try {
    const apiUrl = `https://www.tikwm.com/api/user/posts?unique_id=${unique_id}&count=30`;
    const r = await fetch(apiUrl);
    const json = await r.json();

    if (!json.data || !json.data.videos) {
      return res.json({ error: "No videos found or private profile", videos: [] });
    }

    // 3. Return just the profile info and a list of Video URLs
    // We do NOT return full video data here to force the frontend to "lazy load" them one by one
    const videoLinks = json.data.videos.map(v => 
      `https://www.tiktok.com/@${json.data.author.unique_id}/video/${v.video_id}`
    );

    res.json({
      user: {
        username: json.data.author.unique_id,
        avatar: json.data.author.avatar,
        followers: json.data.author.followers || 0,
        following: json.data.author.following || 0,
        likes: json.data.author.heart || 0
      },
      links: videoLinks // The frontend will process these one by one
    });

  } catch (e) {
    console.error(e);
    res.json({ error: "Server Error", videos: [] });
  }
});

app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  const name = req.query.name || "tiktok";
  try {
    const response = await fetch(videoUrl);
    res.setHeader("Content-Disposition", `attachment; filename=${name}.mp4`);
    res.setHeader("Content-Type", "video/mp4");
    response.body.pipe(res);
  } catch (e) {
    res.status(500).send("Download Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
