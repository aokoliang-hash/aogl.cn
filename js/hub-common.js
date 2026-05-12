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
   * PC: pointer + setPointerCapture so pointerup/cancel always ends the gesture
   * (document mouseup is missed when releasing outside the window or over iframes).
   * Touch keeps native overflow-x pan.
   * rAF-batched scroll; scroll-snap off while dragging (hub.css); optional inertia on release.
   */
  function bindHotmixCarouselDrag(root) {
    if (!root || root.dataset.aoglHotmixDrag === "1") return;
    root.dataset.aoglHotmixDrag = "1";

    let activePid = null;
    let isDown = false;
    let dragMoved = false;
    let dragDist = 0;
    let lastX = 0;
    let lastT = 0;
    let vx = 0;
    let pendingDx = 0;
    let moveRaf = 0;
    let glideRaf = 0;

    function cancelGlide() {
      if (glideRaf) {
        cancelAnimationFrame(glideRaf);
        glideRaf = 0;
      }
    }

    function flushPendingScroll() {
      moveRaf = 0;
      if (pendingDx === 0) return;
      root.scrollLeft -= pendingDx;
      pendingDx = 0;
    }

    function endDrag(allowGlide) {
      if (!isDown) return;
      isDown = false;
      activePid = null;
      if (moveRaf) {
        cancelAnimationFrame(moveRaf);
        moveRaf = 0;
      }
      if (pendingDx !== 0) {
        root.scrollLeft -= pendingDx;
        pendingDx = 0;
      }
      root.classList.remove("hub-hotmix-cards--carousel--dragging");
      if (allowGlide && dragMoved && Math.abs(vx) > 0.12) {
        glideRaf = requestAnimationFrame(glideStep);
      }
    }

    function glideStep() {
      glideRaf = 0;
      const cap = 48;
      let step = -vx * 10;
      if (step > cap) step = cap;
      if (step < -cap) step = -cap;
      vx *= 0.88;
      if (Math.abs(step) < 0.35 && Math.abs(vx) < 0.02) return;
      root.scrollLeft += step;
      glideRaf = requestAnimationFrame(glideStep);
    }

    function onPointerMove(e) {
      if (!isDown || e.pointerId !== activePid) return;
      cancelGlide();
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dt = Math.max(4, now - lastT);
      lastX = e.clientX;
      lastT = now;
      const inst = dx / dt;
      vx = vx * 0.55 + inst * 0.45;
      pendingDx += dx;
      dragDist += Math.abs(dx);
      if (dragDist > 5) dragMoved = true;
      if (!moveRaf) {
        moveRaf = requestAnimationFrame(flushPendingScroll);
      }
    }

    function onPointerUp(e) {
      if (!isDown || e.pointerId !== activePid) return;
      endDrag(true);
      try {
        root.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    function onPointerCancel(e) {
      if (!isDown || e.pointerId !== activePid) return;
      vx = 0;
      endDrag(false);
      try {
        root.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    function onLostPointerCapture(e) {
      if (!isDown || e.pointerId !== activePid) return;
      vx = 0;
      endDrag(false);
    }

    function onWindowBlur() {
      if (isDown) {
        vx = 0;
        endDrag(false);
      }
    }

    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", onPointerUp);
    root.addEventListener("pointercancel", onPointerCancel);
    root.addEventListener("lostpointercapture", onLostPointerCapture);
    window.addEventListener("blur", onWindowBlur);

    root.addEventListener(
      "dragstart",
      (e) => {
        e.preventDefault();
      },
      true
    );

    root.addEventListener(
      "pointerdown",
      (e) => {
        if (e.pointerType === "touch") return;
        if (e.button !== 0) return;
        if (e.target.closest("button, input, select, textarea")) return;
        if (e.target.closest(".hub-hotmix-card-media")) {
          e.preventDefault();
        }
        cancelGlide();
        isDown = true;
        activePid = e.pointerId;
        dragMoved = false;
        dragDist = 0;
        pendingDx = 0;
        vx = 0;
        lastX = e.clientX;
        lastT = performance.now();
        root.classList.add("hub-hotmix-cards--carousel--dragging");
        try {
          root.setPointerCapture(e.pointerId);
        } catch (_) {}
      },
      { capture: true, passive: false }
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
