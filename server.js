const input = document.getElementById("linkInput");
const btn = document.getElementById("pasteClearBtn");

function isTikTokVideoLink(url) {
  return /^https?:\/\/(www\.|m\.)?(tiktok\.com\/@.+\/video\/\d+|vt\.tiktok\.com\/.+|vm\.tiktok\.com\/.+)/i.test(url);
}

btn.addEventListener("click", async () => {
  if (btn.textContent === "Paste") {
    try {
      const text = (await navigator.clipboard.readText()).trim();

      if (!isTikTokVideoLink(text)) {
        alert("❌ Clipboard does not contain a valid TikTok video link");
        return;
      }

      input.value = text;
      btn.textContent = "Clear";
    } catch (err) {
      alert("Clipboard permission denied");
    }
  } else {
    input.value = "";
    btn.textContent = "Paste";
  }
});

// If user types manually, update button state
input.addEventListener("input", () => {
  btn.textContent = input.value ? "Clear" : "Paste";
});
