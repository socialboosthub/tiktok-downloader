const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Route for single videos
app.get("/api", async (req, res) => {
  const url = req.query.url;
  const r = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
  const j = await r.json();
  res.json(j);
});

// NEW: Route for Profiles
app.get("/profile", async (req, res) => {
  const url = req.query.url;
  const page = req.query.page || 0;
  // TikWM uses /api/user/posts for profile scraping
  const r = await fetch(`https://tikwm.com/api/user/posts?url=${encodeURIComponent(url)}&cursor=${page}`);
  const j = await r.json();
  
  // Format the data to match what your profile-download.html expects
  const formattedData = {
    user: {
      avatar: j.data?.videos[0]?.author.avatar,
      username: j.data?.videos[0]?.author.unique_id,
      following: "N/A",
      followers: "N/A",
      likes: "N/A"
    },
    videos: j.data?.videos.map(v => ({
      id: v.video_id,
      cover: v.cover,
      caption: v.title,
      play: v.play
    })) || []
  };
  
  res.json(formattedData);
});

app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  const response = await fetch(videoUrl);
  res.setHeader("Content-Disposition", "attachment; filename=tiktok.mp4");
  res.setHeader("Content-Type", "video/mp4");
  response.body.pipe(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
