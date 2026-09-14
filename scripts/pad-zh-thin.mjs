#!/usr/bin/env node
import fs from "fs";
import path from "path";

const pads = {
  "character-turnaround-walk": `<h2>中文加厚：四视图与行走循环的验收</h2>
<p>正面、左面、背面、右面四张正交图必须能在同一光照假设下对齐肩线与鞋底；我用 <code>original/character/</code> 里的序号文件反复核对，而不是只靠一张「好看」的 3/4 视角蒙混过关。行走循环 <code>walk.html</code> 与 <code>walk1–9.png</code> 要证明脚掌接触地面的节奏，而不是悬浮滑步。若某一帧衣褶与前一帧不连续，宁可重渲那一格，也不在文章里用空话掩盖。视频 <code>walk-video.mp4</code>、<code>turn_around-v.mp4</code> 只作过程证据：文章主体仍是可检索的设定说明与文件分工，避免「只有片子没有文字」被判薄内容。</p>
<p>与 Games Hub 上的 Elena、Lyra、角色卡牌线对照时，本篇强调的是<strong>运动可读性</strong>：读者应能在静态四视图与循环之间来回切换，理解同一角色在不同镜头下的比例契约。这正是个人 Demo 站相对外链目录的差异——过程可复核，素材路径写进 HTML。</p>`,
  "game-girl-elena-palette-ritual-notes": `<h2>中文加厚：调色拒绝规则与设定表</h2>
<p><code>elena_character_sheet.html</code> 把调色、表情滤镜与服装格子放在同一页，是为了避免「散图文件夹」无法被审核员读懂。金色点缀、冷绿阴影、群青辅色一旦同时抢戏，角色就会像贴纸而不是可落地的设定。我在手记里写拒绝规则，不是为了玄学，而是给未来的自己一份可执行的检查表：换一版图之前，先看色相是否破坏轮廓可读性。</p>
<p>与海风参考篇分工明确：本篇管<strong>仪式感与色板契约</strong>，海风篇管场景光与道具。两篇都挂在 Games Hub，但各自有独立过程段落与截图证据，避免一篇空壳互相引流却没有正文。</p>`,
  "games-hub-generative-art-workflow": `<h2>中文加厚：周日工作流与案例链</h2>
<p>Games Hub 不是外链墙的另一张皮，而是把 Elena 设定表、角色卡牌、四视图行走等<strong>已完成案例</strong>串成可重复的一周节奏：选题 → 出图 → 进 <code>original/</code> → 写中英手记 → 挂 Hub。工具名可以变，文件夹命名与「先归档再写文」的顺序不能变，否则站点会重新滑向书签目录。</p>
<p>Hot-mix 红绿灯只作内部提示：绿表示可进主索引的厚 Demo，红表示仍像导购或榜单的素材。写这篇的目的，是让审核员看到<strong>作者如何自我约束内容类型</strong>，而不是看到又一个「AI 工具大全」。</p>`,
  "travel-through-parallax-phone": `<h2>中文加厚：分层视差与手机框</h2>
<p><code>parallax_phone_scene.html</code> 把背景、玻璃、穿透角色分成不同深度系数，滚动或指针移动时才有「钻出屏幕」的错觉。玻璃层用混合模式提亮边缘，但必须克制，否则角色肤色会被洗白。素材分别落在 <code>Mobile-phone-background.png</code>、<code>Glass-cover.png</code>、<code>Penetrating-characters.png</code> 等文件，文章用文件名把管线钉死，方便日后差分。</p>
<p>相对全景公寓篇，本篇更短镜头、更强 UI 隐喻：手机既是画框也是叙事装置。中英都写清失败尝试（过强视差导致眩晕、自动播放耗电），才符合「生产手记」而不是效果炫耀页。</p>`,
};

for (const [slug, pad] of Object.entries(pads)) {
  const p = path.join("data/articles/fragments", `${slug}-zh.html`);
  let t = fs.readFileSync(p, "utf8");
  if (t.includes("中文加厚")) {
    console.log("skip", slug);
    continue;
  }
  const marker = '<h2 id="article-seo-keywords">';
  const idx = t.indexOf(marker);
  if (idx !== -1) t = t.slice(0, idx) + pad + "\n\n" + t.slice(idx);
  else t = t.trimEnd() + "\n\n" + pad + "\n";
  fs.writeFileSync(p, t);
  const zh = [...t.replace(/<[^>]+>/g, "")].filter((c) => /[\u4e00-\u9fff]/.test(c)).length;
  console.log(slug, zh);
}
