const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// PROXY API: Requests both SD and HD data
app.get("/api", async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ error: "No URL provided" });

        // hd=1 is crucial for getting the 'hdplay' field from TikWM
        const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;

        const response = await fetch(apiUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
            }
        });
        
        const json = await response.json();
        res.json(json);
    } catch (error) {
        res.status(500).json({ error: "API failed" });
    }
});

// PROXY DOWNLOAD: Streams the file to the browser
app.get("/download", async (req, res) => {
    try {
        const videoUrl = req.query.url;
        const fileName = req.query.name || "tiktok_video";

        const response = await fetch(videoUrl);
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}.mp4"`);
        res.setHeader("Content-Type", "video/mp4");

        response.body.pipe(res);
    } catch (err) {
        res.status(500).send("Download failed");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
