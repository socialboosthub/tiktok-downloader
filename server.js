import express from 'express';
import { gotScraping } from 'got-scraping';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the /public folder
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index (1).html"));
});

// Profile Endpoint: Gets the list of video links
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
      return res.json({ error: "No videos found or profile is private", videos: [] });
    }

    // Return profile metadata and an array of links for the frontend to process one-by-one
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
    res.status(502).json({ error: "Blocked by Cloudflare" });
  }
});

// API for Single Video details
app.get("/api", async (req, res) => {
  try {
    const response = await gotScraping({
      url: 'https://tikwm.com/api/',
      searchParams: { url: req.query.url },
      responseType: 'json'
    });
    res.json(response.body);
  } catch (error) {
    res.status(500).json({ error: "API Error" });
  }
});

app.get("/download", async (req, res) => {
  try {
    const response = await gotScraping({ url: req.query.url, responseType: 'buffer' });
    res.setHeader("Content-Disposition", `attachment; filename=${req.query.name || 'video'}.mp4`);
    res.setHeader("Content-Type", "video/mp4");
    res.send(response.body);
  } catch (e) {
    res.status(500).send("Download failed");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
