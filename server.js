import express from 'express';
import { gotScraping } from 'got-scraping';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. SERVE STATIC FILES
// This allows the browser to find CSS, JS, and HTML files inside the /public folder
app.use(express.static(path.join(__dirname, 'public')));

// 2. MAIN ROUTES
// Home Page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Explicit route for Profile Page (Fixes "Cannot GET /profile-download.html")
app.get("/profile-download.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile-download.html"));
});

// 3. API ENDPOINTS
// Single Video Data (Used by Lazy Loader to bypass blocks)
app.get("/api", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).json({ error: "No URL" });

  try {
    const response = await gotScraping({
      url: 'https://tikwm.com/api/',
      searchParams: { url: videoUrl },
      responseType: 'json'
    });
    res.json(response.body);
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({ error: "Failed to fetch video" });
  }
});

// Profile List Fetcher
app.get("/profile", async (req, res) => {
  const profileUrl = req.query.url;
  const match = profileUrl?.match(/@([a-zA-Z0-9_.-]+)/);
  
  if (!match) return res.json({ error: "Invalid TikTok username link" });
  const unique_id = match[1];

  try {
    const response = await gotScraping({
      url: 'https://www.tikwm.com/api/user/posts',
      searchParams: { unique_id, count: 30 },
      responseType: 'json'
    });

    const data = response.body.data;
    if (!data || !data.videos) {
      return res.json({ error: "No videos found or profile is private" });
    }

    // Return profile metadata and a list of links for the frontend to loop through
    const videoLinks = data.videos.map(v => 
      `https://www.tiktok.com/@${data.author.unique_id}/video/${v.video_id}`
    );

    res.json({
      user: {
        username: data.author.unique_id,
        avatar: data.author.avatar,
        followers: data.author.followers || 0,
        likes: data.author.heart || 0
      },
      links: videoLinks
    });
  } catch (e) {
    console.error("Profile Fetch Error:", e.message);
    res.status(502).json({ error: "Service temporarily blocked by Cloudflare" });
  }
});

// 4. DOWNLOAD PROXY (Bypass CORs and naming issues)
app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  const name = req.query.name || "tiktok_video";

  try {
    const response = await gotScraping({ url: videoUrl, responseType: 'buffer' });
    res.setHeader("Content-Disposition", `attachment; filename=${name}.mp4`);
    res.setHeader("Content-Type", "video/mp4");
    res.send(response.body);
  } catch (e) {
    res.status(500).send("Download failed");
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
