const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();

// Serve all files (HTML/JS/CSS) from the root and public folder
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/**
 * CORE FETCH FUNCTION: Mimics a real iPhone/Chrome browser
 * to avoid the "Just a moment" Cloudflare screen.
 */
async function fetchTikWM(apiUrl) {
  try {
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Referer": "https://www.tikwm.com/",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    const text = await response.text();
    
    // Check if we got HTML (Cloudflare) instead of JSON
    if (text.includes("<html") || text.includes("Just a moment")) {
      console.error("BLOCK DETECTED: Render's IP is currently being challenged by Cloudflare.");
      return { code: -1, msg: "Cloudflare Challenge Active" };
    }

    return JSON.parse(text);
  } catch (err) {
    console.error("Fetch Error:", err.message);
    return { code: -1, msg: "Connection Error" };
  }
}

// ROUTE 1: Single Video API
app.get("/api", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ code: -1, msg: "No URL" });
  const data = await fetchTikWM(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
  res.json(data);
});

// ROUTE 2: Profile API (Required for profile-download.html)
app.get("/profile", async (req, res) => {
  let url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  // Clean the URL (removes tracking junk like ?_r=1)
  const cleanUrl = url.split('?')[0];
  const page = req.query.page || 0;

  console.log(`Processing Profile: ${cleanUrl}`);

  const j = await fetchTikWM(`https://tikwm.com/api/user/posts?url=${encodeURIComponent(cleanUrl)}&cursor=${page}`);

  if (j.code === 0 && j.data && j.data.videos) {
    // Format the response exactly as your HTML file expects
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
    res.status(500).json({ error: "Profile Not Found", details: j.msg });
  }
});

// ROUTE 3: Download Proxy
app.get("/download", async (req, res) => {
  try {
    const videoUrl = req.query.url;
    const response = await fetch(videoUrl);
    res.setHeader("Content-Disposition", `attachment; filename="tiktok.mp4"`);
    res.setHeader("Content-Type", "video/mp4");
    response.body.pipe(res);
  } catch (e) {
    res.status(500).send("Download failed");
  }
});

// BIND TO RENDER PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
