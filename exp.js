// safe-probe-editprofile.js
// BENIGN: logs diagnostics locally only (no external exfiltration)
(async function safeProbeEditProfile(opts){
  opts = opts || {};
  const TARGET = opts.target || "https://epay2-preprod.efinance.com.eg/ePay/EditProfile.do?method=preEditProfile&STYLE_TYPE=0";
  const attempts = Number(opts.attempts || 5);
  const baseDelay = Number(opts.baseDelayMs || 500); // initial backoff
  const maxDelay = Number(opts.maxDelayMs || 5000);
  const timeoutMs = Number(opts.timeoutMs || 7000); // per-request timeout

  function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
  function jitter(ms){ return Math.floor(ms * (0.5 + Math.random()*0.5)); }

  async function fetchWithTimeout(url, options = {}, tms = timeoutMs){
    const controller = new AbortController();
    const id = setTimeout(()=> controller.abort(), tms);
    try {
      const resp = await fetch(url, Object.assign({}, options, { signal: controller.signal }));
      clearTimeout(id);
      return resp;
    } catch(e){
      clearTimeout(id);
      throw e;
    }
  }

  function extractInputsFromHtml(html){
    const data = {};
    try {
      // Primary: DOMParser -> querySelectorAll
      const doc = new DOMParser().parseFromString(html, "text/html");
      if(doc){
        const inputs = doc.querySelectorAll && doc.querySelectorAll('input[name], textarea[name], select[name]');
        if(inputs && inputs.length){
          inputs.forEach(i => {
            try {
              const n = i.getAttribute('name');
              const v = (i.value !== undefined && i.value !== null) ? i.value : (i.getAttribute('value') || "");
              if(n) data[n] = v;
            } catch(e){ /* ignore per-element */ }
          });
          return data;
        }
      }
    } catch(e){
      // fall through to regex fallback
    }

    // Fallback: tolerant regex for <input ... name="..." value="...">
    try {
      html.replace(/<input\b[^>]*\bname\s*=\s*["']?([^"'\s>]+)["']?[^>]*\bvalue\s*=\s*["']?([^"'>]*)["']?/gi,
        function(_, name, val){
          try { data[name] = val; } catch(e){}
          return "";
        });
    } catch(e){}
    return data;
  }

  // High-level probe loop with backoff
  for(let i=1;i<=attempts;i++){
    const attemptStart = Date.now();
    try {
      console.info(`[PROBE] attempt ${i}/${attempts} -> fetching ${TARGET} (timeout ${timeoutMs}ms)`);
      const resp = await fetchWithTimeout(TARGET, { credentials: "include", redirect: "follow", cache: "no-store" }, timeoutMs);
      const duration = Date.now() - attemptStart;
      console.info(`[PROBE] attempt ${i} result: status=${resp.status} type=${resp.type} url=${resp.url} time=${duration}ms`);

      // Try to read body if allowed
      let body = "";
      try {
        body = await resp.text();
        console.info(`[PROBE] attempt ${i} body length: ${body.length}`);
        if(body.length > 0) console.debug(`[PROBE] attempt ${i} preview:\n`, body.slice(0,500));
      } catch(readErr){
        console.warn(`[PROBE] attempt ${i} could not read body (likely CORS/opaque):`, readErr);
      }

      // Check for obvious login/redirect indicators
      const lower = (body || "").toLowerCase();
      const loginIndicators = ['login', 'sign in', 'username', 'password', 'authentication', 'please login'];
      const looksLikeLogin = loginIndicators.some(w => lower.includes(w));

      if(looksLikeLogin){
        console.warn(`[PROBE] attempt ${i} response looks like a login/redirect page (contains login keywords).`);
      }

      // parse inputs if body readable
      let parsed = {};
      if(body && body.length){
        parsed = extractInputsFromHtml(body);
        if(Object.keys(parsed).length){
          console.info(`[PROBE] attempt ${i} parsed input fields:`, parsed);
        } else {
          console.info(`[PROBE] attempt ${i} parsed zero input fields from fetched HTML.`);
        }
      }

      // Also inspect the **current page DOM** (if script executed inside the target origin)
      try {
        const currentInputs = {};
        const live = document.querySelectorAll && document.querySelectorAll('input[name], textarea[name], select[name]');
        if(live && live.length){
          live.forEach(el => {
            try {
              const n = el.getAttribute('name');
              currentInputs[n] = (el.value !== undefined && el.value !== null) ? el.value : (el.getAttribute('value') || "");
            } catch(e){}
          });
        }
        console.info("[PROBE] Current page DOM inputs (if present):", currentInputs);
      } catch(e){
        console.warn("[PROBE] failed to inspect current DOM:", e);
      }

      // If we got some meaningful parsed data, return success object
      const meaningful = parsed && Object.keys(parsed).length;
      return { ok: true, attempt: i, status: resp.status, url: resp.url, parsed, looksLikeLogin, bodyPreview: (body || "").slice(0,500) };

    } catch(err){
      const duration = Date.now() - attemptStart;
      console.error(`[PROBE] attempt ${i} failed after ${duration}ms:`, err && err.message ? err.message : err);
      // backoff with jitter
      if(i < attempts){
        const rawDelay = Math.min(baseDelay * Math.pow(2, i-1), maxDelay);
        const d = jitter(rawDelay);
        console.info(`[PROBE] waiting ${d}ms before next attempt...`);
        await sleep(d);
      } else {
        console.warn("[PROBE] exhausted attempts, aborting.");
      }
    }
  }

  // after all attempts failed
  return { ok: false, attempts, message: "All attempts failed or response unreadable. Check Network tab for request/response headers." };

})()
.then(result => {
  console.info("[PROBE] finished:", result);
})
.catch(e => console.error("[PROBE] unexpected error:", e));
