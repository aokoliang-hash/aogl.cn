/**
 * Shared client enhancements for static hub pages (portal, brands, …).
 */
(function () {
  function favFallback(img) {
    img.addEventListener("error", function () {
      this.style.opacity = "0.35";
      this.alt = "";
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("img.hub-favicon").forEach(favFallback);
  });
})();
