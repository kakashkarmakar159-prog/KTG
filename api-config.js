/* KTG API connection
   GitHub Pages is static, so editing uses the Node/Express backend.
   Change DEFAULT_API_ORIGIN only if your Render backend URL is different.
*/
(function(){
  const DEFAULT_API_ORIGIN = "https://kolkata-tourist-guide.onrender.com";
  let saved = "";
  try { saved = localStorage.getItem("ktg_api_origin") || ""; } catch (_) {}
  const origin = (saved || DEFAULT_API_ORIGIN).replace(/\/+$/, "");
  window.KTG_API_ORIGIN = origin;
  window.KTG_API_BASE = origin + "/api";
  window.ktgApiUrl = function(path){
    const p = String(path || "").replace(/^\/+/, "");
    return window.KTG_API_BASE + "/" + p;
  };
})();
