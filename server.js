// VIDEO DOWNLOAD ROUTE (only videos allowed)
app.get("/download", async (req, res) => {
  try {
    const videoUrl = req.query.url;
    const fileName = req.query.name || "tiktok_video";

    // Call TikWM API to check type
    const apiRes = await fetch(
      `https://tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`
    );
    const apiJson = await apiRes.json();

    // Check if it's a story
    const isStory = apiJson?.data?.itemType === "story" || apiJson?.data?.is_story;

    if (isStory) {
      return res.status(400).send("This is a story link. Use the Story Downloader.");
    }

    // Get actual video URL from API
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

// STORY DOWNLOAD ROUTE (only stories allowed)
app.get("/story", async (req, res) => {
  try {
    const storyUrl = req.query.url;
    const fileName = req.query.name || "tiktok_story";

    // Call TikWM API
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
