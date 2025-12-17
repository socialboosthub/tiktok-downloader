const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
// SERVE STATIC FILES
app.use(express.static(path.join(__dirname, "public")));
// Home route (extra safety)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api", async (req, res) => {
  const url = req.query.url;
  const r = await fetch(
    `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
  );
  const j = await r.json();
  res.json(j);
});

app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  const response = await fetch(videoUrl);

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=tiktok.mp4"
  );
  res.setHeader("Content-Type", "video/mp4");

  response.body.pipe(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Server running on port " + PORT)
);

// Add this route to your existing server.js
app.get('/api/profile', async (req, res) => {
    const profileUrl = req.query.url;
    
    try {
        // Here you would use an API or Scraper to get the profile videos
        // For testing, we send dummy data:
        const dummyData = {
            username: "user123",
            videos: [
                { thumbnail: "https://via.placeholder.com/150", downloadUrl: "#" },
                { thumbnail: "https://via.placeholder.com/150", downloadUrl: "#" }
            ]
        };
        
        res.json(dummyData);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});
