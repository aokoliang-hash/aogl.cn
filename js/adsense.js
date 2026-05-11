/**
 * AdSense：
 * 1) 加载发布商脚本 → 配合后台「自动广告」在版面中自动插入广告；
 * 2) 若页面存在 #ad-display-root，可挂载「展示广告」固定单元 → DISPLAY_AD_SLOT 填 data-ad-slot。
 * ads.txt 见站点根目录。
 */
(function () {
  var PUBLISHER_CLIENT = "ca-pub-6958761551797888";
  /** 在 AdSense → 广告 → 按广告单元 → 新建展示广告 → 获取代码里的 data-ad-slot（数字） */
  var DISPLAY_AD_SLOT = "";

  function loadPublisherScript() {
    var s = document.createElement("script");
    s.async = true;
    s.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
      encodeURIComponent(PUBLISHER_CLIENT);
    s.crossOrigin = "anonymous";
    s.onerror = function () {};
    document.head.appendChild(s);
  }

  function mountManualUnit() {
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
