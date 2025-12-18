import express from 'express';
import { gotScraping } from 'got-scraping';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory + /public
// (In ESM mode, we use process.cwd() instead of __dirname)
app.use(express.static(path.join(process.cwd(), "public")));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "index (1).html")); 
});

// --- API 1: Single Video Details (Lazy Loader uses this) ---
app.get("/api", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).json({ error: "No URL provided" });

  try {
    // gotScraping mimics a real browser to bypass Cloudflare
    const response = await gotScraping({
      url: 'https://tikwm.com/api/',
      searchParams: { url: videoUrl },
      responseType: 'json'
    });

    res.json(response.body);
  } catch (error) {
    console.error("Single Video Error:", error.message);
    res.status(500).json({ error: "Failed to fetch video details" });
  }
});

// --- API 2: Profile Fetcher (Gets the list of links) ---
app.get("/profile", async (req, res) => {
  const profileUrl = req.query.url;
  
  // Extract Username from URL (e.g., https://www.tiktok.com/@username)
  const match = profileUrl.match(/@([a-zA-Z0-9_.-]+)/);
  if (!match) {
    return res.status(400).json({ error: "Could not find username in URL" });
  }
  const unique_id = match[1];

  console.log(`Fetching profile for: ${unique_id}`);

  try {
    // Fetch profile posts using gotScraping to bypass the "Just a Moment" block
    const response = await gotScraping({
      url: 'https://www.tikwm.com/api/user/posts',
      searchParams: { 
        unique_id: unique_id, 
        count: 30 
      },
      responseType: 'json'
    });

    const data = response.body.data;

    if (!data || !data.videos) {
      return res.json({ error: "Private profile or no videos found", videos: [] });
    }

    // Extract just the links for your frontend lazy loader
    const videoLinks = data.videos.map(v => 
      `https://www.tiktok.com/@${data.author.unique_id}/video/${v.video_id}`
    );

    res.json({
      user: {
        username: data.author.unique_id,
        avatar: data.author.avatar,
        followers: data.author.followers || 0,
        following: data.author.following || 0,
        likes: data.author.heart || 0
      },
      links: videoLinks
    });

  } catch (error) {
    console.error("Profile Error:", error.message);
    // If it fails, send a clean error so the frontend doesn't crash
    res.status(502).json({ error: "Profile lookup blocked by TikTok/Cloudflare" });
  }
});

// --- Download Proxy ---
app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  const name = req.query.name || "tiktok_video";

  if (!videoUrl) return res.status(400).send("No URL");

  try {
    // Using basic fetch for the video file itself (usually less strict)
    const { body, headers } = await gotScraping({
      url: videoUrl,
      responseType: 'buffer'
    });

    res.setHeader("Content-Disposition", `attachment; filename=${name}.mp4`);
    res.setHeader("Content-Type", headers['content-type'] || "video/mp4");
    res.send(body);

  } catch (e) {
    console.error("Download Error:", e.message);
    res.status(500).send("Download Failed");
  }
});

app.listen(PORT, () => console.log("Server running on port " + PORT));
