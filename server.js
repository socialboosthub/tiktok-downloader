const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));

// Standard Headers to mimic a real browser and bypass blocks
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Referer": "https://www.tikwm.com/",
  "Origin": "https://www.tikwm.com"
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Single Video API
app.get("/api", async (req, res) => {
  const url = req.query.url;
  try {
    const r = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      headers: HEADERS // <--- Added Headers
    });

    // Check if response is actually JSON
    const contentType = r.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("API returned HTML instead of JSON");
    }

    const j = await r.json();
    res.json(j);
  } catch (e) {
    console.error("Single Video Error:", e.message);
    res.status(500).json({ error: "API Blocked or Error", details: e.message });
  }
});

// Profile Endpoint
app.get("/profile", async (req, res) => {
  const profileUrl = req.query.url;
  
  // Extract Username
  const match = profileUrl.match(/@([a-zA-Z0-9_.-]+)/);
  if (!match) {
    return res.json({ error: "Invalid username format" });
  }
  const unique_id = match[1];

  try {
    // We add headers here specifically to fix the "Unexpected token <" error
    const apiUrl = `https://www.tikwm.com/api/user/posts?unique_id=${unique_id}&count=30`;
    console.log(`Fetching profile: ${unique_id}`);

    const r = await fetch(apiUrl, {
      headers: HEADERS // <--- Added Headers
    });

    // Safety check: Did we get HTML (blocked) or JSON (success)?
    const text = await r.text();
    
    let json;
    try {
      json = JSON.parse(text);
    } catch (parseError) {
      console.error("API returned non-JSON:", text.substring(0, 100)); // Log first 100 chars
      return res.status(502).json({ error: "Upstream API Blocked Request" });
    }

    if (!json.data || !json.data.videos) {
      return res.json({ error: "No videos found or private profile", videos: [] });
    }

    // Map videos to links for the frontend lazy loader
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
      links: videoLinks
    });

  } catch (e) {
    console.error("Profile Error:", e);
    res.status(500).json({ error: "Server Error" });
  }
});

app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  const name = req.query.name || "tiktok";
  try {
    const response = await fetch(videoUrl, { headers: HEADERS });
    res.setHeader("Content-Disposition", `attachment; filename=${name}.mp4`);
    res.setHeader("Content-Type", "video/mp4");
    response.body.pipe(res);
  } catch (e) {
    res.status(500).send("Download Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
