const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Home route
app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "index.html"));
});

// TikTok API proxy
app.get("/api", async (req, res) => {
try {
const url = req.query.url;
const r = await fetch(
https://tikwm.com/api/?url=${encodeURIComponent(url)}
);
const j = await r.json();
res.json(j);
} catch (e) {
res.status(500).json({ error: "API failed" });
}
});

// VIDEO DOWNLOAD (only videos allowed)
app.get("/download", async (req, res) => {
try {
const videoUrl = req.query.url;
const fileName = req.query.name || "tiktok_video";

// Check type via TikWM API      
const apiRes = await fetch(      
  `https://tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`      
);      
const apiJson = await apiRes.json();      
  
const isStory = apiJson?.data?.itemType === "story" || apiJson?.data?.is_story;      
if (isStory) {      
  return res.status(400).send("This is a story link. Use the Story Downloader.");      
}      
  
// Get actual video URL      
const playUrl = apiJson?.data?.play || apiJson?.data?.wmplay || videoUrl;      
  
const response = await fetch(playUrl);      
  
res.setHeader(      
  "Content-Disposition",      
  `attachment; filename="${fileName}.mp4"`      
);      
res.setHeader("Content-Type", "video/mp4");      
  
response.body.pipe(res);

} catch (err) {
res.status(500).send("Video download failed");
}
});

// STORY DOWNLOAD (only stories allowed)
app.get("/story", async (req, res) => {
try {
const storyUrl = req.query.url;
const fileName = req.query.name || "tiktok_story";

// Check type via TikWM API      
const apiRes = await fetch(      
  `https://tikwm.com/api/?url=${encodeURIComponent(storyUrl)}`      
);      
const apiJson = await apiRes.json();      
  
const isStory = apiJson?.data?.itemType === "story" || apiJson?.data?.is_story;      
if (!isStory) {      
  return res.status(400).send("This is not a story link.");      
}      
  
const storyVideo = apiJson?.data?.play || apiJson?.data?.wmplay;      
if (!storyVideo) {      
  return res.status(404).send("Story not found or expired");      
}      
  
const response = await fetch(storyVideo);      
  
res.setHeader(      
  "Content-Disposition",      
  `attachment; filename="${fileName}.mp4"`      
);      
res.setHeader("Content-Type", "video/mp4");      
  
response.body.pipe(res);

} catch (err) {
res.status(500).send("Story download failed");
}
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// TikWM proxy
app.get("/api", async (req, res) => {
  try {
    const url = req.query.url;
    const r = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const j = await r.json();
    res.json(j);
  } catch {
    res.status(500).json({ error: "API failed" });
  }
});

// Slider images ONLY
app.get("/slider", async (req, res) => {
  try {
    const url = req.query.url;
    const r = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const j = await r.json();
    const data = j.data;

    if (!data?.images || data.images.length === 0) {
      return res.status(400).json({ error: "Not a slider post" });
    }

    res.json({
      author: data.author,
      caption: data.title,
      images: data.images
    });

  } catch {
    res.status(500).json({ error: "Slider fetch failed" });
  }
});

// Force image download
app.get("/image", async (req, res) => {
  try {
    const url = req.query.url;
    const name = req.query.name || "tiktok_photo";

    const r = await fetch(url);
    res.setHeader("Content-Disposition", `attachment; filename="${name}.jpg"`);
    res.setHeader("Content-Type", "image/jpeg");
    r.body.pipe(res);

  } catch {
    res.status(500).send("Image download failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
