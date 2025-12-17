const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();

// Serve static files from the root or "public" folder
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, "public")));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/**
 * HELPER: Robust Fetch with Browser Headers
 * This mimics a real Chrome browser to reduce Cloudflare blocks.
 */
async function fetchTikWM(apiUrl) {
  try {
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.tikwm.com/",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const text = await response.text();

    // Check if the response is actually JSON
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("BLOCK DETECTED: API returned HTML/Cloudflare instead of JSON.");
      return { code: -1, msg: "Cloudflare/IP Blocked" };
    }
  } catch (error) {
    console.error("FETCH ERROR:", error.message);
    return { code: -1, msg: "Server connection error" };
  }
}

// Single Video API
app.get("/api", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ code: -1, msg: "No URL provided" });

  const data = await fetchTikWM(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
  res.json(data);
});

// Profile API
app.get("/profile", async (req, res) => {
  let url = req.query.url;
  if (!url) return res.status(400).json({ code: -1, msg: "No Profile URL provided" });

  // 1. Clean the URL (remove tracking ?_r=1 etc.)
  const cleanUrl = url.split('?')[0];
  const page = req.query.page || 0;

  console.log(`Fetching profile: ${cleanUrl} (Page: ${page})`);

  // 2. Call TikWM user posts endpoint
  const j = await fetchTikWM(`https://tikwm.com/api/user/posts?url=${encodeURIComponent(cleanUrl)}&cursor=${page}`);

  // 3. Check for successful data
  if (j.code === 0 && j.data && j.data.videos) {
    const firstVid = j.data.videos[0];
    const formattedData = {
      user: {
        avatar: firstVid.author.avatar,
        username: firstVid.author.unique_id,
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
    // Return the error code from the API so the frontend knows what happened
    res.status(500).json({ 
      error: "Could not load profile", 
      details: j.msg || "The API is currently blocking requests from this server." 
    });
  }
});

// Download Proxy
app.get("/download", async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).send("No video URL");

    const response = await fetch(videoUrl);
    res.setHeader("Content-Disposition", `attachment; filename="tiktok_video.mp4"`);
    res.setHeader("Content-Type", "video/mp4");
    response.body.pipe(res);
  } catch (e) {
    res.status(500).send("Download failed: " + e.message);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
