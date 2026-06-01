/** Shared footer friendly link(s) — imported by build-hub-pages.mjs and build-articles.mjs */
export const FRIEND_LINK_URL = "https://aoglang.com/zh/";

const FRIEND_LABEL = {
  en: "aoglang",
  zh: "友情链接 aoglang",
  ja: "aoglang",
  ko: "aoglang",
  fr: "aoglang",
  ru: "aoglang",
  ar: "aoglang",
};

export function footerFriendLinkHtml(langCodes, escHtml) {
  return langCodes
    .map((lang) => {
      const label = FRIEND_LABEL[lang] || FRIEND_LABEL.en;
      return `        <a href="${FRIEND_LINK_URL}" class="footer-legal-link footer-friend-link lang-${lang}" target="_blank" rel="noopener noreferrer">${escHtml(label)}</a>`;
    })
    .join("\n");
}
