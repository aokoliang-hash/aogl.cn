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

  /**
   * PC: mousedown + document mousemove — avoids Chrome treating drag on <a href> as
   * native link-drag (which steals moves from pointer capture on the strip).
   * Touch: native overflow-x scroll; no JS needed.
   */
  function bindHotmixCarouselDrag(root) {
    if (!root || root.dataset.aoglHotmixDrag === "1") return;
    root.dataset.aoglHotmixDrag = "1";

    let isDown = false;
    let dragMoved = false;
    let dragDist = 0;
    let lastX = 0;

    function onMove(e) {
      if (!isDown) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      root.scrollLeft -= dx;
      dragDist += Math.abs(dx);
      if (dragDist > 5) dragMoved = true;
    }

    function onUp() {
      if (!isDown) return;
      isDown = false;
      root.classList.remove("hub-hotmix-cards--carousel--dragging");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    root.addEventListener(
      "mousedown",
      (e) => {
        if (e.button !== 0) return;
        if (e.target.closest("button, input, select, textarea")) return;
        isDown = true;
        dragMoved = false;
        dragDist = 0;
        lastX = e.clientX;
        root.classList.add("hub-hotmix-cards--carousel--dragging");
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      },
      true
    );

    root.addEventListener(
      "click",
      (e) => {
        if (!dragMoved) return;
        e.preventDefault();
        e.stopPropagation();
        dragMoved = false;
      },
      true
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("img.hub-favicon").forEach(favFallback);
    document.querySelectorAll(".hub-hotmix-cards--carousel").forEach(bindHotmixCarouselDrag);
  });
})();
