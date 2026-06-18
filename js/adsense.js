/**
 * AdSense：
 * 1) 加载发布商脚本 → 配合后台「自动广告」在版面中自动插入广告；
 * 2) 若页面存在 #ad-display-root，可挂载「展示广告」固定单元 → DISPLAY_AD_SLOT 填 data-ad-slot。
 * ads.txt 见站点根目录。
 *
 * 若控制台出现 GET …/adsbygoogle.js … ERR_CONNECTION_CLOSED / net::ERR_BLOCKED_BY_CLIENT：
 * 多为网络无法访问 Google 广告域名（地区策略、防火墙）、广告拦截扩展或代理异常；
 * 站点其余功能不受影响，只是广告脚本不会加载。Chrome 仍可能在「网络」面板里记录失败请求，属正常现象。
 * 本地或不想发起该请求时：地址栏加 ?noads=1，或执行
 *   localStorage.setItem('aogl-disable-ads','1')
 * 后刷新。若页面在 adsense.js 之前设置了 window.AOGL_DISABLE_ADSENSE = true，也会跳过加载。
 *
 * 过审策略：仅在「以正文为主」的 URL 加载发布商脚本（文章、brief、tool-guides、about、changelog）。
 * hub-links 已 noindex，不在此加载；首页 / Hub 等薄页仍引用本文件但不发起 adsbygoogle 请求。
 */
(function () {
  var PUBLISHER_CLIENT = "ca-pub-6958761551797888";
  /** 在 AdSense → 广告 → 按广告单元 → 新建展示广告 → 获取代码里的 data-ad-slot（数字） */
  var DISPLAY_AD_SLOT = "";

  var host = String(location.hostname || "");
  var qs = String(location.search || "");
  var skipAds =
    /(?:^|[?&])noads=1(?:&|$)/.test(qs) ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    (typeof window !== "undefined" && window.AOGL_DISABLE_ADSENSE === true) ||
    (typeof localStorage !== "undefined" && localStorage.getItem("aogl-disable-ads") === "1");

  /** AdSense review: load publisher script only on article / about / changelog URLs. */
  function isContentPrimaryPage() {
    if (typeof location === "undefined") return false;
    var p = String(location.pathname || "").toLowerCase();
    if (/\/articles\//.test(p) || /\/briefs\//.test(p) || /\/tool-guides\//.test(p) || /\/guides\//.test(p)) return true;
    if (/\/about\.html$/.test(p) || /\/changelog\.html$/.test(p)) return true;
    return false;
  }

  function loadPublisherScript() {
    if (skipAds || !isContentPrimaryPage()) return;
    var s = document.createElement("script");
    s.async = true;
    s.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
      encodeURIComponent(PUBLISHER_CLIENT);
    s.crossOrigin = "anonymous";
    s.onerror = function () {
      try {
        document.documentElement.setAttribute("data-adsense-unavailable", "1");
      } catch (e) {}
    };
    document.head.appendChild(s);
  }

  function mountManualUnit() {
    if (skipAds) return;
    var root = document.getElementById("ad-display-root");
    if (!root) return;

    if (!DISPLAY_AD_SLOT || !String(DISPLAY_AD_SLOT).trim()) {
      root.innerHTML =
        '<p class="ad-slot-placeholder lang-en">Manual ad: set <code>DISPLAY_AD_SLOT</code> in <code>js/adsense.js</code> (Display ad unit). Auto ads still work if enabled in AdSense.</p>' +
        '<p class="ad-slot-placeholder lang-zh">手动广告位：在 AdSense 创建「展示广告」后，把 <code>data-ad-slot</code> 填入 <code>js/adsense.js</code> 的 <code>DISPLAY_AD_SLOT</code>。自动广告可在后台单独开启。</p>';
      root.classList.remove("ad-slot--live");
      return;
    }

    root.innerHTML = "";
    root.classList.add("ad-slot--live");
    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.setAttribute("data-ad-client", PUBLISHER_CLIENT);
    ins.setAttribute("data-ad-slot", String(DISPLAY_AD_SLOT).trim());
    ins.setAttribute("data-ad-format", "auto");
    ins.setAttribute("data-full-width-responsive", "true");
    root.appendChild(ins);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }

  loadPublisherScript();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountManualUnit);
  } else {
    mountManualUnit();
  }
})();
