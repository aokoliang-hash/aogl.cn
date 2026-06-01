(function () {
  var KEY = "aogl_lang";

  /** BCP 47 tags for <html lang>. Add a row when you add a locale code. */
  var HTML_LANG = {
    en: "en",
    zh: "zh-CN",
    zht: "zh-Hant",
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
  var LOCALES = ["en", "zh", "zht", "ja", "ko", "fr", "ru", "ar"];

  var OPTION_LABELS = {
    en: "English",
    zh: "中文（简体）",
    zht: "中文（繁體）",
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
  var FULL_UI_LOCALES = ["en", "zh", "zht", "ja", "ko", "fr", "ru", "ar"];

  /** Subfolders whose path must be kept when switching locale (like articles/). */
  var CONTENT_DIRS = ["articles", "briefs", "tool-guides", "hub-links"];

  function pathParts() {
    return (location.pathname || "/").replace(/\/+/g, "/").split("/").filter(Boolean);
  }

  /**
   * [deployBase][/locale/]relFile — deployBase is e.g. /aogl.cn on WAMP; relFile keeps articles/… subpaths.
   */
  function parseLocalePath() {
    var parts = pathParts();
    var localeIdx = -1;
    var locale = "zh";

    for (var i = 0; i < parts.length; i++) {
      if (parts[i] === "zh") {
        localeIdx = i;
        locale = "zht";
        break;
      }
      if (/^(en|ja|ko|fr|ru|ar)$/.test(parts[i])) {
        localeIdx = i;
        locale = parts[i];
        break;
      }
    }

    var deployBase = "";
    var relFile = "index.html";

    if (localeIdx >= 0) {
      if (localeIdx > 0) deployBase = "/" + parts.slice(0, localeIdx).join("/");
      var tail = parts.slice(localeIdx + 1);
      relFile = tail.length ? tail.join("/") : "index.html";
    } else {
      var contentAt = -1;
      for (var j = 0; j < parts.length; j++) {
        if (CONTENT_DIRS.indexOf(parts[j]) !== -1) {
          contentAt = j;
          break;
        }
      }
      if (contentAt >= 0) {
        if (contentAt > 0) deployBase = "/" + parts.slice(0, contentAt).join("/");
        relFile = parts.slice(contentAt).join("/");
      } else if (parts.length && /\.html$/i.test(parts[parts.length - 1])) {
        if (parts.length > 1) deployBase = "/" + parts.slice(0, -1).join("/");
        relFile = parts[parts.length - 1];
      } else if (parts.length) {
        deployBase = "/" + parts.join("/");
        relFile = "index.html";
      }
    }

    if (!relFile || relFile === "/") relFile = "index.html";
    return { locale: locale, deployBase: deployBase, relFile: relFile };
  }

  /**
   * URL → locale for built single-language pages (see build-seo-locale-pages).
   * /zh/… → 繁體；/en/、/ja/… → 对应语种；根路径及 /tools.html、/articles/… 等 → 简体 zh。
   * Must not return null on root: localStorage from a prior /en/ visit would hide all .lang-zh markup.
   */
  function localeFromPath() {
    return parseLocalePath().locale;
  }

  function currentHtmlFilename() {
    return parseLocalePath().relFile;
  }

  function targetPathForLocale(lang, file, deployBase) {
    var inner;
    if (lang === "zh") {
      inner = file === "index.html" ? "/" : "/" + file;
    } else if (lang === "zht") {
      inner = file === "index.html" ? "/zh/" : "/zh/" + file;
    } else if (lang === "en") {
      inner = file === "index.html" ? "/en/" : "/en/" + file;
    } else if (file === "index.html") {
      inner = "/" + lang + "/";
    } else {
      inner = "/" + lang + "/" + file;
    }
    deployBase = deployBase || "";
    if (deployBase.length > 1 && deployBase.charAt(deployBase.length - 1) === "/") {
      deployBase = deployBase.slice(0, -1);
    }
    if (!deployBase) return inner;
    if (inner === "/") return deployBase + "/";
    return deployBase + inner;
  }

  function normalizePath(p) {
    p = (p || "/").replace(/\/+/g, "/");
    if (p === "/index.html") return "/";

    var parts = p.split("/").filter(Boolean);
    if (parts.length && parts[parts.length - 1] === "index.html") {
      var withoutIndex = parts.slice(0, -1);
      if (withoutIndex.length === 0) return "/";
      var last = withoutIndex[withoutIndex.length - 1];
      if (last === "zh" || /^(en|ja|ko|fr|ru|ar)$/.test(last)) {
        return "/" + withoutIndex.join("/");
      }
      if (
        withoutIndex.length === 1 &&
        CONTENT_DIRS.indexOf(withoutIndex[0]) === -1 &&
        !/\.html$/i.test(withoutIndex[0])
      ) {
        return "/" + withoutIndex.join("/");
      }
    }

    if (p.length > 1 && p.charAt(p.length - 1) === "/") p = p.slice(0, -1);
    if (p === "") p = "/";
    return p;
  }

  /** If UI language should load a different URL, navigate and return true. */
  function navigateIfLocaleSwitch(lang) {
    if (!isSupported(lang)) return false;
    var parsed = parseLocalePath();
    var want = normalizePath(targetPathForLocale(lang, parsed.relFile, parsed.deployBase));
    var cur = normalizePath(location.pathname);
    if (cur === want) return false;
    try {
      localStorage.setItem(KEY, lang);
    } catch (e) {}
    location.href = want + location.search + location.hash;
    return true;
  }

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
      if (tag === "zh-tw" || tag === "zh-hant" || tag === "zh-hk" || tag === "zh-mo") return "zht";
      if (tag === "zh-cn" || tag === "zh") return "zh";
      if (tag.indexOf("zh-") === 0) return "zht";
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
    var pathLang = localeFromPath();
    if (pathLang && isSupported(pathLang)) return pathLang;
    try {
      var saved = localStorage.getItem(KEY);
      if (saved && isSupported(saved)) return saved;
    } catch (e) {}
    return detectFromNavigator() || "zh";
  }

  /** Read data-title-xx / data-desc-xx from <html> for every supported locale */
  function readMeta(root) {
    var m = {};
    for (var i = 0; i < LOCALES.length; i++) {
      var code = LOCALES[i];
      var t =
        code === "zht"
          ? root.getAttribute("data-title-zht") || root.getAttribute("data-title-zh")
          : root.getAttribute("data-title-" + code);
      var d =
        code === "zht"
          ? root.getAttribute("data-desc-zht") || root.getAttribute("data-desc-zh")
          : root.getAttribute("data-desc-" + code);
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

  function applySafe(lang) {
    if (!document.body) return;
    apply(lang);
  }

  function buildOptionsHtml() {
    var parts = [];
    for (var i = 0; i < LOCALES.length; i++) {
      var c = LOCALES[i];
      parts.push('<option value="' + c + '">' + (OPTION_LABELS[c] || c) + "</option>");
    }
    return parts.join("");
  }

  applySafe(getInitialLang());

  document.addEventListener("DOMContentLoaded", function () {
    applySafe(getInitialLang());

    var selects = document.querySelectorAll(".aogl-lang-select");
    for (var i = 0; i < selects.length; i++) {
      (function (sel) {
        if (!sel.getAttribute("data-aogl-built")) {
          sel.setAttribute("data-aogl-built", "1");
          sel.innerHTML = buildOptionsHtml();
          sel.value = getInitialLang();
        }
        sel.addEventListener("change", function () {
          if (!isSupported(sel.value)) return;
          if (navigateIfLocaleSwitch(sel.value)) return;
          apply(sel.value);
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
