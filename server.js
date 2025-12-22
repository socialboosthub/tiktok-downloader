const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// PROXY API
app.get("/api", async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ error: "No URL provided" });

        const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
        const response = await fetch(apiUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)"
            }
        });

        const json = await response.json();
        res.json(json);
    } catch {
        res.status(500).json({ error: "API failed" });
    }
});

// MP3 DOWNLOAD
app.get("/mp3", async (req, res) => {
    try {
        const response = await fetch(req.query.url);
        res.setHeader("Content-Disposition", `attachment; filename="${req.query.name || "audio"}.mp3"`);
        res.setHeader("Content-Type", "audio/mpeg");
        response.body.pipe(res);
    } catch {
        res.status(500).send("Audio download failed");
    }
});

// VIDEO DOWNLOAD
app.get("/download", async (req, res) => {
    try {
        const response = await fetch(req.query.url);
        res.setHeader("Content-Disposition", `attachment; filename="${req.query.name || "video"}.mp4"`);
        res.setHeader("Content-Type", "video/mp4");
        response.body.pipe(res);
    } catch {
        res.status(500).send("Download failed");
    }
});

// IMAGE DOWNLOAD PROXY
app.get("/image", async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) {
            return res.status(400).send("No image URL provided");
        }

        // ✅ Generate unique Tiksave filename
        const uniqueNumber = Date.now() + Math.floor(Math.random() * 1000);
        const fileName = `Tiksave_${uniqueNumber}.jpg`;

        const response = await fetch(imageUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );
        res.setHeader("Content-Type", "image/jpeg");

        response.body.pipe(res);
    } catch (err) {
        console.error(err);
        res.status(500).send("Image download failed");
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Running on http://localhost:${PORT}`);
});
