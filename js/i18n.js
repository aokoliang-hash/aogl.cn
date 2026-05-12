(function () {
  var KEY = "aogl_lang";

  /** BCP 47 tags for <html lang>. Add a row when you add a locale code. */
  var HTML_LANG = {
    en: "en",
    zh: "zh-CN",
    ja: "ja",
    ko: "ko",
    fr: "fr",
    ru: "ru",
    ar: "ar",
  };

  /**
   * Supported UI locale codes (order = <select> order).
   * To add a language: 1) push code here  2) add HTML_LANG above
   * 3) add one CSS rule body:not(.locale-XX) .lang-XX in style.css (and privacy.css)
   * 4) add data-title-XX / data-desc-XX on <html> where you want SEO strings
   * 5) add .lang-XX markup for full UI, then push the code into FULL_UI_LOCALES.
   */
  var LOCALES = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

  var OPTION_LABELS = {
    en: "English",
    zh: "中文",
    ja: "日本語",
    ko: "한국어",
    fr: "Français",
    ru: "Русский",
    ar: "العربية",
  };

  /**
   * Locales that have matching .lang-XX markup site-wide. Others still appear in the
   * <select> and get <html lang> + <title> / meta from data-*; body uses English UI
   * until you add .lang-ja (etc.) blocks and push "ja" into this list.
   */
  var FULL_UI_LOCALES = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

  function bodyLocaleFor(lang) {
    return FULL_UI_LOCALES.indexOf(lang) !== -1 ? lang : "en";
  }

  function isSupported(code) {
    return LOCALES.indexOf(code) !== -1;
  }

  /** Browser language → our locale code, or null */
  function detectFromNavigator() {
    var list =
      typeof navigator.languages !== "undefined" && navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || ""];
    for (var i = 0; i < list.length; i++) {
      var tag = String(list[i] || "")
        .toLowerCase()
        .replace(/_/g, "-");
      if (tag === "zh" || tag.indexOf("zh-") === 0) return "zh";
      if (tag === "ja" || tag.indexOf("ja-") === 0) return "ja";
      if (tag === "ko" || tag.indexOf("ko-") === 0) return "ko";
      if (tag === "fr" || tag.indexOf("fr-") === 0) return "fr";
      if (tag === "ru" || tag.indexOf("ru-") === 0) return "ru";
      if (tag === "ar" || tag.indexOf("ar-") === 0) return "ar";
      if (tag === "en" || tag.indexOf("en-") === 0) return "en";
    }
    return null;
  }

  function getInitialLang() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved && isSupported(saved)) return saved;
    } catch (e) {}
    return detectFromNavigator() || "en";
  }

  /** Read data-title-xx / data-desc-xx from <html> for every supported locale */
  function readMeta(root) {
    var m = {};
    for (var i = 0; i < LOCALES.length; i++) {
      var code = LOCALES[i];
      var t = root.getAttribute("data-title-" + code);
      var d = root.getAttribute("data-desc-" + code);
      if (t != null && String(t).length) m["title_" + code] = t;
      if (d != null && String(d).length) m["desc_" + code] = d;
    }
    return m;
  }

  function pickMeta(m, field, lang) {
    var k = field + "_" + lang;
    if (m[k]) return m[k];
    if (m[field + "_en"]) return m[field + "_en"];
    for (var i = 0; i < LOCALES.length; i++) {
      var fk = field + "_" + LOCALES[i];
      if (m[fk]) return m[fk];
    }
    return "";
  }

  function apply(lang) {
    if (!isSupported(lang)) lang = "en";
    var root = document.documentElement;
    var m = readMeta(root);
    root.lang = HTML_LANG[lang] || lang;
    root.setAttribute("data-aogl-lang", lang);
    var bodyLoc = bodyLocaleFor(lang);
    document.body.className = "locale-" + bodyLoc;
    document.documentElement.removeAttribute("dir");
    document.body.removeAttribute("dir");

    document.title = pickMeta(m, "title", lang);
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", pickMeta(m, "desc", lang));

    var selects = document.querySelectorAll(".aogl-lang-select");
    for (var s = 0; s < selects.length; s++) {
      selects[s].value = lang;
    }

    try {
      localStorage.setItem(KEY, lang);
    } catch (e) {}
  }

  function buildOptionsHtml() {
    var parts = [];
    for (var i = 0; i < LOCALES.length; i++) {
      var c = LOCALES[i];
      parts.push('<option value="' + c + '">' + (OPTION_LABELS[c] || c) + "</option>");
    }
    return parts.join("");
  }

  apply(getInitialLang());

  document.addEventListener("DOMContentLoaded", function () {
    apply(getInitialLang());

    var selects = document.querySelectorAll(".aogl-lang-select");
    for (var i = 0; i < selects.length; i++) {
      (function (sel) {
        if (!sel.getAttribute("data-aogl-built")) {
          sel.setAttribute("data-aogl-built", "1");
          sel.innerHTML = buildOptionsHtml();
          sel.value = getInitialLang();
        }
        sel.addEventListener("change", function () {
          if (isSupported(sel.value)) apply(sel.value);
        });
      })(selects[i]);
    }

    var y = document.getElementById("y");
    if (y) y.textContent = new Date().getFullYear();
    var today = new Date().toISOString().slice(0, 10);
    var d = document.getElementById("d");
    var d2 = document.getElementById("d2");
    if (d) d.textContent = today;
    if (d2) d2.textContent = today;
    var dates = document.querySelectorAll(".aogl-today");
    for (var j = 0; j < dates.length; j++) dates[j].textContent = today;
  });
})();
