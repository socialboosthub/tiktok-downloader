const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();

// Serve frontend files from a folder named 'public'
app.use(express.static(path.join(__dirname, "public")));

// Home route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

/**
 * 1. ENHANCED API PROXY
 * Requests HD content specifically
 */
app.get("/api", async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ error: "No URL provided" });

        // hd=1 tells TikWM to attempt fetching the high-definition link
        const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;

        const response = await fetch(apiUrl, {
            headers: {
                // Mimicking a mobile device helps trigger HD availability
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
            }
        });
        
        const json = await response.json();
        res.json(json);
    } catch (error) {
        console.error("API Proxy Error:", error);
        res.status(500).json({ error: "API failed" });
    }
});

/**
 * 2. VIDEO DOWNLOAD PROXY
 */
app.get("/download", async (req, res) => {
    try {
        const videoUrl = req.query.url;
        const fileName = req.query.name || "tiktok_video";

        const response = await fetch(videoUrl);
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}.mp4"`);
        res.setHeader("Content-Type", "video/mp4");

        response.body.pipe(res);
    } catch (err) {
        res.status(500).send("Video download failed");
    }
});

/**
 * 3. IMAGE DOWNLOAD PROXY
 */
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
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
