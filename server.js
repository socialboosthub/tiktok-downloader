const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Single Video API
app.get("/api", async (req, res) => {
  try {
    const url = req.query.url;
    const r = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    const j = await r.json();
    res.json(j);
  } catch (err) {
    res.status(500).json({ code: -1, msg: "Server Error" });
  }
});

// NEW: Profile API Route
app.get("/profile", async (req, res) => {
  try {
    const input = req.query.url;
    // Extract username if a full URL was provided
    const username = input.includes("@") ? input.split("@")[1].split("?")[0] : input;
    
    // We use the TikWM user/posts endpoint which is more stable for profiles
    const apiUrl = `https://tikwm.com/api/user/posts?unique_id=${username}&count=12&cursor=0`;
    
    const r = await fetch(apiUrl);
    const j = await r.json();
    res.json(j);
  } catch (err) {
    res.status(500).json({ code: -1, msg: "Profile fetch failed" });
  }
});

// Proxy Download to avoid CORs/Filename issues
app.get("/download", async (req, res) => {
  const videoUrl = req.query.url;
  const fileName = req.query.name || "tiktok";
  const response = await fetch(videoUrl);

  res.setHeader("Content-Disposition", `attachment; filename=${fileName}.mp4`);
  res.setHeader("Content-Type", "video/mp4");
  response.body.pipe(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
