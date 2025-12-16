<!DOCTYPE html>
<html>
<head>
  <title>Download Video</title>
</head>
<body style="text-align:center;font-family:sans-serif">

<h3>Your Video</h3>

<img id="thumb"
     style="width:95%;border-radius:10px"
     alt="Video thumbnail">

<br><br>

<button id="btn" style="padding:12px 25px">
Download Video
</button>

<script>
const params = new URLSearchParams(window.location.search);
const tiktokUrl = params.get("url");

async function load() {
  const res = await fetch(`/api?url=${encodeURIComponent(tiktokUrl)}`);
  const json = await res.json();

  // THUMBNAIL IMAGE
  document.getElementById("thumb").src = json.data.cover;

  // VIDEO FILE
  const videoUrl = json.data.play;

  document.getElementById("btn").onclick = () => {
    window.location.href =
      `/download?url=${encodeURIComponent(videoUrl)}`;
  };
}

load();
</script>

</body>
</html>
