const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// PROXY API: Requests video & audio data
app.get("/api", async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ error: "No URL provided" });

        const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;

        const response = await fetch(apiUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
            }
        });

        const json = await response.json();
        res.json(json);
    } catch (error) {
        res.status(500).json({ error: "API failed" });
    }
});

// MP3 DOWNLOAD PROXY
app.get("/mp3", async (req, res) => {
    try {
        const audioUrl = req.query.url;
        const fileName = req.query.name || "tiktok_audio";

        const response = await fetch(audioUrl);

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}.mp3"`
        );
        res.setHeader("Content-Type", "audio/mpeg");

        response.body.pipe(res);
    } catch (err) {
        res.status(500).send("Audio download failed");
    }
});

// VIDEO DOWNLOAD ROUTE (UNCHANGED)
app.get("/download", async (req, res) => {
    try {
        const videoUrl = req.query.url;
        const fileName = req.query.name || "tiktok_video";

        const response = await fetch(videoUrl);

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}.mp4"`
        );
        res.setHeader("Content-Type", "video/mp4");

        response.body.pipe(res);
    } catch (err) {
        res.status(500).send("Download failed");
    }
});

// ✅ IMAGE DOWNLOAD ROUTE (ONLY ADDITION)
app.get("/image", async (req, res) => {
    try {
        const imageUrl = req.query.url;
        const fileName = req.query.name; // stable name from frontend

        if (!imageUrl || !fileName) {
            return res.status(400).send("Missing image url or filename");
        }

        const response = await fetch(imageUrl, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "no-store");

        response.body.pipe(res);
    } catch (err) {
        res.status(500).send("Image download failed");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`Running on http://localhost:${PORT}`)
);
