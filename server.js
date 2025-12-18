import express from 'express';
import { gotScraping } from 'got-scraping';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the root or public folder
app.use(express.static(__dirname)); 

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Single Video API (Lazy loading uses this)
app.get("/api", async (req, res) => {
  const videoUrl = req.query.url;
  try {
    const response = await gotScraping({
      url: 'https://tikwm.com/api/',
      searchParams: { url: videoUrl },
      responseType: 'json'
    });
    res.json(response.body);
  } catch (error) {
    res.status(500).json({ error: "API Error" });
  }
});

// Profile Endpoint
app.get("/profile", async (req, res) => {
  const profileUrl = req.query.url;
  const match = profileUrl.match(/@([a-zA-Z0-9_.-]+)/);
  
  if (!match) return res.json({ error: "Invalid username" });
  const unique_id = match[1];

  try {
    const response = await gotScraping({
      url: 'https://www.tikwm.com/api/user/posts',
      searchParams: { unique_id, count: 30 },
      responseType: 'json'
    });

    const data = response.body.data;
    if (!data || !data.videos) return res.json({ error: "No videos found", videos: [] });

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

// Download Proxy
app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  const name = req.query.name || "video";
  try {
    const response = await gotScraping({ url: videoUrl, responseType: 'buffer' });
    res.setHeader("Content-Disposition", `attachment; filename=${name}.mp4`);
    res.setHeader("Content-Type", "video/mp4");
    res.send(response.body);
  } catch (e) {
    res.status(500).send("Download error");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
