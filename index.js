const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.static("public"));

app.get("/api", async (req, res) => {
  const url = req.query.url;
  const r = await fetch(
    `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
  );
  const j = await r.json();
  res.json(j);
});

app.listen(3000, () => console.log("running"));
