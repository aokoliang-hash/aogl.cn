(function () {
  var canvas = document.getElementById("bg-canvas");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var BASE = "#050709";
  var w = 0;
  var h = 0;
  var dpr = 1;
  var raf = 0;
  var reduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var tx = 0;
  var ty = 0;
  var px = 0;
  var py = 0;
  var lx = 0;
  var ly = 0;

  function syncTargetFromViewport() {
    if (tx === 0 && ty === 0) {
      tx = w * 0.5;
      ty = h * 0.38;
    }
    px = px || tx;
    py = py || ty;
    lx = lx || tx;
    ly = ly || ty;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    syncTargetFromViewport();
    if (reduced) {
      drawStatic();
    }
  }

  function drawStatic() {
    ctx.fillStyle = BASE;
    ctx.fillRect(0, 0, w, h);
    var cx = w * 0.5;
    var cy = h * 0.36;
    var r = Math.max(w, h) * 0.52;
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(90, 190, 230, 0.055)");
    g.addColorStop(0.45, "rgba(130, 110, 200, 0.03)");
    g.addColorStop(1, "rgba(5, 7, 9, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function paintFrame() {
    ctx.fillStyle = BASE;
    ctx.fillRect(0, 0, w, h);

    px += (tx - px) * 0.085;
    py += (ty - py) * 0.085;
    lx += (tx - lx) * 0.038;
    ly += (ty - ly) * 0.038;

    var maxR = Math.max(w, h) * 0.58;

    var g1 = ctx.createRadialGradient(lx, ly, 0, lx, ly, maxR);
    g1.addColorStop(0, "rgba(140, 115, 210, 0.065)");
    g1.addColorStop(0.4, "rgba(90, 70, 150, 0.025)");
    g1.addColorStop(1, "rgba(5, 7, 9, 0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);

    var g2 = ctx.createRadialGradient(px, py, 0, px, py, maxR * 0.92);
    g2.addColorStop(0, "rgba(100, 200, 240, 0.075)");
    g2.addColorStop(0.35, "rgba(120, 180, 230, 0.032)");
    g2.addColorStop(1, "rgba(5, 7, 9, 0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);

    var core = Math.max(w, h) * 0.22;
    var g3 = ctx.createRadialGradient(px, py, 0, px, py, core);
    g3.addColorStop(0, "rgba(180, 230, 255, 0.045)");
    g3.addColorStop(1, "rgba(5, 7, 9, 0)");
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, w, h);
  }

  function tick() {
    if (reduced) return;
    paintFrame();
    raf = requestAnimationFrame(tick);
  }

  function onMove(clientX, clientY) {
    tx = clientX;
    ty = clientY;
  }

  window.addEventListener(
    "mousemove",
    function (e) {
      onMove(e.clientX, e.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    function (e) {
      if (e.touches && e.touches.length) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true }
  );

  window.addEventListener(
    "touchstart",
    function (e) {
      if (e.touches && e.touches.length) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true }
  );

  window.addEventListener("resize", function () {
    resize();
    if (reduced) {
      drawStatic();
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (reduced) return;
    if (document.hidden) {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    } else if (!raf) {
      raf = requestAnimationFrame(tick);
    }
  });

  resize();
  if (!reduced) {
    raf = requestAnimationFrame(tick);
  }
})();
