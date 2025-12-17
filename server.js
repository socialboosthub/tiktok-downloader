const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Helper to prevent server crashes on bad API responses
async function fetchTikWM(apiUrl) {
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }
  });
  
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("API returned non-JSON response:", text.substring(0, 100));
    return { code: -1, msg: "Invalid API response" };
  }
}

app.get("/api", async (req, res) => {
  const url = req.query.url;
  const data = await fetchTikWM(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
  res.json(data);
});

app.get("/profile", async (req, res) => {
  const url = req.query.url;
  const page = req.query.page || 0;
  
  // Clean the URL: TikWM works best with the clean profile link (no query params)
  const cleanUrl = url.split('?')[0]; 
  
  const j = await fetchTikWM(`https://tikwm.com/api/user/posts?url=${encodeURIComponent(cleanUrl)}&cursor=${page}`);

  if (j.code === 0 && j.data && j.data.videos) {
    const formattedData = {
      user: {
        avatar: j.data.videos[0].author.avatar,
        username: j.data.videos[0].author.unique_id,
        following: "N/A",
        followers: "N/A",
        likes: "N/A"
      },
      videos: j.data.videos.map(v => ({
        id: v.video_id,
        cover: v.cover,
        caption: v.title,
        play: v.play
      }))
    };
    res.json(formattedData);
  } else {
    res.status(500).json({ error: "Could not fetch profile", details: j.msg });
  }
});

app.get("/download", async (req, res) => {
  try {
    const videoUrl = req.query.url;
    const response = await fetch(videoUrl);
    res.setHeader("Content-Disposition", `attachment; filename="${req.query.name || 'tiktok'}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");
    response.body.pipe(res);
  } catch (e) {
    res.status(500).send("Download failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
