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

  function bindHotmixCarouselDrag(root) {
    if (!root || root.dataset.aoglHotmixDrag === "1") return;
    root.dataset.aoglHotmixDrag = "1";

    let dragging = false;
    let dragMoved = false;
    let dragDist = 0;
    let captureId = null;
    let lastX = 0;

    root.addEventListener(
      "pointerdown",
      (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        dragging = true;
        dragMoved = false;
        dragDist = 0;
        captureId = e.pointerId;
        lastX = e.clientX;
        root.classList.add("hub-hotmix-cards--carousel--dragging");
        root.setPointerCapture(e.pointerId);
      },
      true
    );

    root.addEventListener(
      "pointermove",
      (e) => {
        if (!dragging || e.pointerId !== captureId) return;
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        root.scrollLeft -= dx;
        dragDist += Math.abs(dx);
        if (dragDist > 5) dragMoved = true;
      },
      true
    );

    const end = (e) => {
      if (!dragging || e.pointerId !== captureId) return;
      dragging = false;
      root.classList.remove("hub-hotmix-cards--carousel--dragging");
      try {
        root.releasePointerCapture(captureId);
      } catch (_) {
        /* ignore */
      }
      captureId = null;
    };

    root.addEventListener("pointerup", end, true);
    root.addEventListener("pointercancel", end, true);

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
