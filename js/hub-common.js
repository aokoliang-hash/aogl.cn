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
   * PC: horizontal drag scroll on the carousel strip (rAF-batched).
   * We do not use setPointerCapture on the list: capture retargets pointerup/click to the
   * list root, so clicks on wrapped hub-hotmix-card-link anchors would never open the URL.
   * Touch keeps native overflow-x pan.
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
    const DRAG_GLIDE_THRESHOLD_PX = 5;

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
      if (dragDist > DRAG_GLIDE_THRESHOLD_PX) dragMoved = true;
      if (!moveRaf) {
        moveRaf = requestAnimationFrame(flushPendingScroll);
      }
    }

    function onPointerUp(e) {
      if (!isDown || e.pointerId !== activePid) return;
      endDrag(true);
    }

    function onPointerCancel(e) {
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
      },
      { capture: true, passive: false }
    );
  }

  const CAROUSEL_NAV_LABEL = {
    prev: {
      en: "Previous",
      zh: "上一组",
      ja: "前へ",
      ko: "이전",
      fr: "Précédent",
      ru: "Назад",
      ar: "السابق",
    },
    next: {
      en: "Next",
      zh: "下一组",
      ja: "次へ",
      ko: "다음",
      fr: "Suivant",
      ru: "Вперёд",
      ar: "التالي",
    },
  };

  function pageLocale() {
    const m = document.body.className.match(/\blocale-(\w+)\b/);
    return m ? m[1] : "en";
  }

  function carouselNavLabel(kind) {
    const loc = pageLocale();
    return CAROUSEL_NAV_LABEL[kind][loc] || CAROUSEL_NAV_LABEL[kind].en;
  }

  function bindHotmixCarouselNav(wrap) {
    if (!wrap || wrap.dataset.aoglCarouselNav === "1") return;
    const root = wrap.querySelector(".hub-hotmix-cards--carousel");
    const prev = wrap.querySelector(".hub-carousel-nav--prev");
    const next = wrap.querySelector(".hub-carousel-nav--next");
    if (!root || !prev || !next) return;
    wrap.dataset.aoglCarouselNav = "1";

    prev.setAttribute("aria-label", carouselNavLabel("prev"));
    next.setAttribute("aria-label", carouselNavLabel("next"));
    prev.setAttribute("type", "button");
    next.setAttribute("type", "button");

    function cards() {
      return Array.from(root.querySelectorAll(".hub-hotmix-card"));
    }

    function maxScroll() {
      return Math.max(0, root.scrollWidth - root.clientWidth);
    }

    function leadingCardIndex(list) {
      const sl = root.scrollLeft;
      let idx = 0;
      for (let i = 0; i < list.length; i++) {
        if (list[i].offsetLeft <= sl + 16) idx = i;
      }
      return idx;
    }

    function scrollCarousel(dir) {
      const list = cards();
      if (!list.length) return;
      const max = maxScroll();
      if (max < 2) return;

      const cur = leadingCardIndex(list);
      let targetIdx = dir === "next" ? Math.min(list.length - 1, cur + 1) : Math.max(0, cur - 1);

      if (dir === "next" && targetIdx === cur && cur < list.length - 1) {
        for (let i = 0; i < list.length; i++) {
          if (list[i].offsetLeft > root.scrollLeft + 20) {
            targetIdx = i;
            break;
          }
        }
        if (targetIdx === cur) targetIdx = cur + 1;
      }

      const targetLeft = Math.min(max, Math.max(0, list[targetIdx].offsetLeft));
      if (typeof root.scrollTo === "function") {
        try {
          root.scrollTo({ left: targetLeft, behavior: "smooth" });
          return;
        } catch (_) {
          /* fall through */
        }
      }
      root.scrollLeft = targetLeft;
    }

    function updateButtons() {
      const max = maxScroll();
      const sl = root.scrollLeft;
      const atStart = max < 2 || sl <= 2;
      const atEnd = max < 2 || sl >= max - 2;
      prev.classList.toggle("is-at-edge", atStart);
      next.classList.toggle("is-at-edge", atEnd);
      prev.setAttribute("aria-disabled", atStart ? "true" : "false");
      next.setAttribute("aria-disabled", atEnd ? "true" : "false");
    }

    function onNavClick(e, dir) {
      e.preventDefault();
      e.stopPropagation();
      scrollCarousel(dir);
    }

    [prev, next].forEach(function (btn) {
      btn.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
      });
      btn.addEventListener("click", function (e) {
        if (btn.classList.contains("is-at-edge")) return;
        onNavClick(e, btn === prev ? "prev" : "next");
      });
    });

    root.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    window.addEventListener("load", updateButtons);
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(updateButtons);
      ro.observe(root);
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(updateButtons);
    });
    updateButtons();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("img.hub-favicon").forEach(favFallback);
    document.querySelectorAll(".hub-hotmix-cards--carousel").forEach(bindHotmixCarouselDrag);
    document.querySelectorAll(".hub-carousel-wrap").forEach(bindHotmixCarouselNav);
  });
})();
