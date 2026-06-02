/**
 * Google Analytics 4 (gtag.js) — measurement ID G-8G0L9VPSP1.
 * Skip on localhost and when ?noads=1 or localStorage aogl-disable-ads=1 (same as adsense.js).
 */
(function () {
  var GA_ID = "G-8G0L9VPSP1";
  var host = String(location.hostname || "");
  var qs = String(location.search || "");
  var skip =
    /(?:^|[?&])noads=1(?:&|$)/.test(qs) ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    (typeof localStorage !== "undefined" && localStorage.getItem("aogl-disable-ads") === "1");
  if (skip) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID);

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
  document.head.appendChild(s);
})();
