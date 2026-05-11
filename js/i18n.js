(function () {
  var KEY = "aogl_lang";

  function prefersZh() {
    var list =
      typeof navigator.languages !== "undefined" && navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || ""];
    for (var i = 0; i < list.length; i++) {
      var tag = String(list[i] || "")
        .toLowerCase()
        .replace(/_/g, "-");
      if (tag === "zh" || tag.indexOf("zh-") === 0) return true;
    }
    return false;
  }

  function getInitialLang() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === "zh") return "zh";
      if (saved === "en") return "en";
      return prefersZh() ? "zh" : "en";
    } catch (e) {
      return prefersZh() ? "zh" : "en";
    }
  }

  function readMeta(root) {
    return {
      titleEn: root.getAttribute("data-title-en") || "",
      titleZh: root.getAttribute("data-title-zh") || "",
      descEn: root.getAttribute("data-desc-en") || "",
      descZh: root.getAttribute("data-desc-zh") || ""
    };
  }

  function apply(lang) {
    var zh = lang === "zh";
    var root = document.documentElement;
    var m = readMeta(root);
    root.lang = zh ? "zh-CN" : "en";
    document.body.className = zh ? "locale-zh" : "locale-en";
    document.title = zh ? m.titleZh : m.titleEn;
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", zh ? m.descZh : m.descEn);
    [["btn-en", "btn-zh"], ["footer-btn-en", "footer-btn-zh"]].forEach(function (pair) {
      var btnEn = document.getElementById(pair[0]);
      var btnZh = document.getElementById(pair[1]);
      if (btnEn) btnEn.setAttribute("aria-pressed", !zh ? "true" : "false");
      if (btnZh) btnZh.setAttribute("aria-pressed", zh ? "true" : "false");
    });
    try {
      localStorage.setItem(KEY, zh ? "zh" : "en");
    } catch (e) {}
  }

  apply(getInitialLang());

  document.addEventListener("DOMContentLoaded", function () {
    apply(getInitialLang());
    function bindPair(enId, zhId) {
      var btnEn = document.getElementById(enId);
      var btnZh = document.getElementById(zhId);
      if (btnEn) btnEn.addEventListener("click", function () { apply("en"); });
      if (btnZh) btnZh.addEventListener("click", function () { apply("zh"); });
    }
    bindPair("btn-en", "btn-zh");
    bindPair("footer-btn-en", "footer-btn-zh");
    var y = document.getElementById("y");
    if (y) y.textContent = new Date().getFullYear();
    var today = new Date().toISOString().slice(0, 10);
    var d = document.getElementById("d");
    var d2 = document.getElementById("d2");
    if (d) d.textContent = today;
    if (d2) d2.textContent = today;
  });
})();
