/**
 * Static hub pages from data/hubs/*.json
 * Extra locales (ja, ko, fr, ru, ar): copy in data/i18n/hub-ui.json + EDITORIAL_I18N below.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { footerFriendLinkHtml } from "./footer-friend-link.mjs";
import { faviconSrcForHtml } from "./favicon-local.mjs";
import { hotMixImageSrcForHtml } from "./hub-image-local.mjs";
import { localHrefAttr, resolveLocalHref } from "./resolve-local-link.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MULTILANG_DIR = path.join(ROOT, "_multilang");
const HUB_DIR = path.join(ROOT, "data", "hubs");
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
const BASE = String(SITE.siteUrl || "https://aogl.cn").replace(/\/$/, "");
const hubUi = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "i18n", "hub-ui.json"), "utf8"));

const LOCALES = ["en", "zh", "ja", "ko", "fr", "ru", "ar"];

/** Short editorial HTML for locales without zh; falls back to English in spec. */
const EDITORIAL_I18N = {
  portal: {
    ja: "<p>順序は Similarweb や Cloudflare Radar などの公開トラフィックランキングに沿っています。私個人のクリックログではありません。</p><p>数値は手法・地域でズレます。大きな年次レポートが出たタイミングで見直し、分単位の更新はしません。「もっと見る」は単一の世界前十に入りにくい地域ポータルです。</p><p>最終確認：<strong>2026-05-19</strong>。有料掲載はありません。</p><p>分析ダッシュボードの代わりではなく、見出しで名前が出たときに開く用のブックマークです。</p>",
    ko: "<p>순서는 Similarweb·Cloudflare Radar 등 공개 글로벌 트래픽 순위를 참고했으며 개인 클릭 통계가 아닙니다.</p><p>지표는 방법론·지역에 따라 어긋날 수 있습니다. 주요 연간 보고가 나올 때 맞추며 실시간 순위를 보장하지 않습니다. ‘더보기’는 단일 글로벌 10위에 넣기 애매한 지역 포털입니다.</p><p>마지막 점검: <strong>2026-05-19</strong>. 유료 게재 없음.</p><p>실시간 순위 대시보드가 아니라, 기사에 포털 이름이 나올 때 여는 북마크입니다.</p>",
    fr: "<p>L’ordre suit les classements publics de trafic (Similarweb, Cloudflare Radar, etc.) — pas mon journal de clics privé.</p><p>Les classements traînent la réalité (méthodo, géographie). Je réaligne quand les grands rapports annuels sortent, pas minute par minute. « Plus » regroupe des portails régionaux hors d’un seul top 10 global.</p><p>Dernière vérification : <strong>2026-05-19</strong>. Pas de placement payant.</p><p>Signets pour ouvrir une page familière quand un titre la cite — pas un tableau de bord analytics.</p>",
    ru: "<p>Порядок ориентирован на открытые рейтинги трафика (Similarweb, Cloudflare Radar и т.п.) — не на мою личную статистику кликов.</p><p>Таблицы отстают от реальности (метод, география). Подправляю при крупных годовых отчётах, не в реальном времени. В «ещё» — региональные порталы вне одного глобального топ‑10.</p><p>Проверено: <strong>2026-05-19</strong>. Платного размещения нет.</p><p>Закладки, чтобы открыть знакомый сайт из заголовка — не замена аналитическим панелям.</p>",
    ar: "<p>يستند الترتيب إلى تصنيفات الزيارات العلنية (Similarweb وCloudflare Radar وغيرها) — وليس إلى سجل نقراتي الشخصي.</p><p>الترتيب يتأخر عن الواقع (المنهجية والجغرافيا). أعيد المطابقة عند التقارير السنوية الكبرى وليس دقيقة بدقيقة. قسم «المزيد» يجمع بوابات إقليمية خارج قائمة عالمية واحدة للعشرة الأوائل.</p><p>آخر مراجعة: <strong>2026-05-19</strong>. لا عرض مدفوع.</p><p>روابط لفتح بوابة مألوفة عند ذكرها في العناوين — وليس لوحة تحليلات حية.</p>",
  },
  brands: {
    ja: "<p>Interbrand「世界のベストブランド」価値ランキングに近い並びです。年次更新後に順位は変わる場合があります。</p><p>評価額は市場と製品で動きます。ここは<strong>ブックマーク用</strong>であり、投資助言や売買推奨ではありません。</p><p>最終確認：<strong>2026-05-19</strong>。</p><p>プレス PDF は転載せず、各行3本は自分が読む公式記事へのリンクのみです。</p>",
    ko: "<p>Interbrand식 글로벌 브랜드 가치 상위권과 유사한 순서이며, 연간 발표 후 순위가 바뀔 수 있습니다.</p><p>가치는 시장·제품 주기에 따라 변합니다. 이 페이지는 <strong>북마크 레일</strong>일 뿐 투자 조사나 매매 권유가 아닙니다.</p><p>마지막 점검: <strong>2026-05-19</strong>.</p><p>보도자료 PDF는 올리지 않으며, 행마다 세 링크는 제가 읽는 공식 기사입니다.</p>",
    fr: "<p>Ordre proche du classement Interbrand « Best Global Brands » ; il peut bouger quand ils publient le tableau annuel.</p><p>La valorisation suit les marchés — ce rail est un <strong>signet</strong>, pas une recherche d’investissement ni un conseil d’achat ou de vente.</p><p>Dernière vérification : <strong>2026-05-19</strong>.</p><p>Pas de miroir des communiqués PDF — trois liens par ligne vers des articles que je lis vraiment.</p>",
    ru: "<p>Порядок близок к рейтингу Interbrand «Best Global Brands»; после ежегодной публикации он может меняться.</p><p>Оценка пляшет вместе с рынком. Это <strong>закладки</strong>, не инвестиционное исследование и не рекомендация покупать или продавать бумаги.</p><p>Проверено: <strong>2026-05-19</strong>.</p><p>PDF пресс-релизов здесь нет — по три ссылки на статьи, которые я сам открываю.</p>",
    ar: "<p>يقترب الترتيب من ترتيب Interbrand لأفضل العلامات العالمية؛ وقد يتغير عند نشر الجدول السنوي.</p><p>التقييم يتحرك مع الأسواق. الصفحة مجرد <strong>شريط روابط</strong> وليست بحثًا استثماريًا ولا توصية بشراء أو بيع أوراق مالية.</p><p>آخر مراجعة: <strong>2026-05-19</strong>.</p><p>لا نسخ لملفات PDF الصحفية — ثلاثة روابط لكل صف هي مقالات أقرأها فعلاً.</p>",
  },
  shopping: {
    ja: "<p>Digital Commerce 360 や Statista 系の「最大手ネット小売」表に近い順序です。中国国内モールは下の「もっと見る」にまとめています。</p><p>英語圏の「最大」表は米欧本社小売に偏りがちです。中国主導モールを「もっと見る」に分け、同じ見出し同士を比べやすくしています。</p><p>最終確認：<strong>2026-05-19</strong>。アフィリエイト専用サイトは含みません。</p><p>価格比較・クーポンサイトは載せず、セールは各社の deals 入口から見ます。</p>",
    ko: "<p>Digital Commerce 360·Statista 등 ‘최대 온라인 소매’ 순위와 유사합니다. 중국 전용 몰은 아래 ‘더보기’에 있습니다.</p><p>영어권 ‘최대’ 표는 미·유럽 본사 소매에 치우치기 쉽습니다. 중국 중심 몰을 ‘더보기’로 나눠 같은 헤드라인끼리 비교하기 쉽게 했습니다.</p><p>마지막 점검: <strong>2026-05-19</strong>.</p><p>가격 비교·쿠폰 사이트는 없고, 할인은 각사 deals 링크로 봅니다.</p>",
    fr: "<p>Ordre proche des tableaux « plus grands détaillants en ligne » (Digital Commerce 360, Statista, etc.) — les malls chinois sont dans « plus ».</p><p>Les tableaux « globaux » en anglais penchent vers des sièges US/UE. Les places chinoises vont dans « plus » pour garder une ligne comparable aux titres que vous lisez souvent.</p><p>Dernière vérification : <strong>2026-05-19</strong>.</p><p>Pas de comparateurs de prix ni blogs coupons — les promos passent par le hub deals de chaque enseigne.</p>",
    ru: "<p>Порядок близок к таблицам «крупнейшие онлайн‑ритейлеры» (Digital Commerce 360, Statista и т.п.) — китайские площадки внизу в «ещё».</p><p>«Глобальные» таблицы на английском чаще про ритейлеров со штабами в США/ЕС. Китайские маркетплейсы в «ещё», чтобы строка совпадала с привычными заголовками.</p><p>Проверено: <strong>2026-05-19</strong>.</p><p>Без трекеров цен и купонных агрегаторов — акции смотрю через deals у самого ритейлера.</p>",
    ar: "<p>يقترب الترتيب من جداول «أكبر تجار التجزئة عبر الإنترنت» (Digital Commerce 360 وStatista وغيرهما) — والمراكز الصينية في قسم «المزيد».</p><p>جداول «العالمية» بالإنجليزية تميل لشركات مقرها أمريكا وأوروبا. أسواق الصين في «المزيد» لتسهيل مقارنة الصف مع العناوين التي تقرأها غالبًا.</p><p>آخر مراجعة: <strong>2026-05-19</strong>.</p><p>لا مقارنات أسعار ولا مدونات كوبونات — العروض عبر صفحة deals لكل متجر.</p>",
  },
  life: {
    ja: "<p>Data.ai / Sensor Tower 系のグローバルMAUチャートに沿った順序です。地域スーパーアプリは下にあります。</p><p>「デジタル生活」は地図・移動・メディア・決済・旅行などの便利ツールまで。遠隔診療や診断ではありません。健康判断は医療専門家と各アプリの注意書きを参照してください。</p><p>最終確認：<strong>2026-05-19</strong>。</p><p>中段リンクは機種変更後に入れ直す製品ページで、アプリ界のゴシップ集ではありません。</p>",
    ko: "<p>Data.ai·Sensor Tower 등 글로벌 MAU 차트를 참고했습니다. 지역 슈퍼앱은 아래에 있습니다.</p><p>‘디지털 생활’은 지도·이동·미디어·지갑·여행 편의까지이며 원격 진단이 아닙니다. 건강 결정은 면허 의료인과 각 서비스 안내를 따르세요.</p><p>마지막 점검: <strong>2026-05-19</strong>.</p><p>가운데 링크는 폰 교체 후 다시 깔 제품 페이지이며, 앱 가십 요약이 아닙니다.</p>",
    fr: "<p>Ordre aligné sur les classements mondiaux de MAU (Data.ai, Sensor Tower, etc.) — les super‑apps régionales sont listées plus bas.</p><p>« Vie numérique » = cartes, trajets, médias, portefeuilles, voyage — pas de télémédecine ni de diagnostic. Pour la santé, parlez à un pro et lisez les mentions légales de chaque app.</p><p>Dernière vérification : <strong>2026-05-19</strong>.</p><p>Les trois liens du milieu sont des pages produit que je réinstalle — pas un digest de rumeurs.</p>",
    ru: "<p>Порядок по глобальным рейтингам MAU (Data.ai, Sensor Tower и т.п.) — региональные супер‑приложения ниже.</p><p>«Цифровая жизнь» здесь — карты, такси, медиа, кошельки, путешествия; не телемедицина и не диагноз. За здоровьем — к врачу и в официальные тексты сервисов.</p><p>Проверено: <strong>2026-05-19</strong>.</p><p>Средние ссылки — продуктовые страницы после смены телефона, не сводка сплетен.</p>",
    ar: "<p>يستند الترتيب إلى تصنيفات المستخدمين النشطين عالميًا (Data.ai وSensor Tower وغيرهما) — والتطبيقات الإقليمية الكبرى في الأسفل.</p><p>«الحياة الرقمية» هنا تعني الخرائط والتنقل والوسائط والمحافظ والسفر — وليست تشخيصًا طبيًا عن بُعد. للصحة راجع مختصًا مرخصًا ونصوص كل تطبيق.</p><p>آخر مراجعة: <strong>2026-05-19</strong>.</p><p>روابط الوسط صفحات منتج أعيد تثبيتها بعد تغيير الهاتف — وليست ملخص شائعات.</p>",
  },
  social: {
    ja: "<p>Data.ai / We Are Social 系のグローバルSNS MAUランキングに近い順序です。いずれの製品政策を推奨するものではありません。</p><p>MAUはニュースサイクルより遅れます。国内閉じ・超ニッチはノイズ削減のため省きます。Hot mixはRSSでタイトル英語のまま出ることがあります。</p><p>最終確認：<strong>2026-05-19</strong>。</p><p>Hot mix は公式ブログ見出しのみで、ユーザータイムラインのスクレイピングではありません。</p>",
    ko: "<p>Data.ai·We Are Social 등 글로벌 소셜 MAU 순위와 유사합니다. 특정 정책을 지지하는 뜻은 아닙니다.</p><p>MAU는 보도 주기보다 늦습니다. 국내 폐쇄·초소형 네트워크는 가독성을 위해 생략했습니다. Hot mix는 RSS이며 제목이 영어로 남을 수 있습니다.</p><p>마지막 점검: <strong>2026-05-19</strong>.</p><p>Hot mix는 공식 블로그 제목만, 사용자 타임라인 수집이 아닙니다.</p>",
    fr: "<p>Ordre proche des classements mondiaux d’apps sociales (Data.ai, We Are Social, etc.) — sans endosser les politiques produit.</p><p>Les MAU traînent les cycles presse ; messagers nationaux et niches minuscules sont omis pour garder la ligne lisible. Le hot mix RSS garde souvent l’anglais à la source.</p><p>Dernière vérification : <strong>2026-05-19</strong>.</p><p>Le hot mix reprend les titres des blogs officiels — pas les fils utilisateurs.</p>",
    ru: "<p>Порядок близок к глобальным рейтингам соцприложений (Data.ai, We Are Social и т.д.) — без одобрения политик продуктов.</p><p>MAU отстают от прессы; локальные мессенджеры и крошечные ниши убраны ради читаемости. Hot mix из RSS — заголовки часто остаются на английском.</p><p>Проверено: <strong>2026-05-19</strong>.</p><p>Hot mix — заголовки официальных блогов, не лента пользователей.</p>",
    ar: "<p>يقترب الترتيب من تصنيفات تطبيقات التواصل العالمية (Data.ai وWe Are Social وغيرهما) — دون تأييد سياسات أي منتج.</p><p>أرقام المستخدمين النشطين تتأخر عن دورة الأخبار؛ حذفت شبكات محلية ضيقة لتقليل الضجيج. خليط RSS أدناه يبقي العناوين إنجليزية غالبًا.</p><p>آخر مراجعة: <strong>2026-05-19</strong>.</p><p>Hot mix عناوين مدونات رسمية فقط — وليس جدول مستخدمين.</p>",
  },
  tech: {
    ja: "<p>NVIDIA・TSMC・Broadcom など公開の時価ランキングに近い並びです。投資推奨ではありません。</p><p>portal の大衆サイト流量とは違い、ここはCAPEX/GPU供給の話に出る半導体・プラットフォーム寄りです。提出書類と自分の許容リスクは必ず各自で確認してください。</p><p>最終確認：<strong>2026-05-19</strong>。</p><p>GPU 不足のニュース時は IR から開き、動画の銘柄推しチャンネルは使いません。</p>",
    ko: "<p>NVIDIA·TSMC·Broadcom 등 공개 시가총액 순위와 유사합니다. 매수 권유가 아닙니다.</p><p>portal의 대중 웹 트래픽과 달리 여기는 반도체·플랫폼의 CAPEX/GPU 서사에 가깝습니다. 여전히 투자 조언이 아니며 공시와 본인의 위험 감수를 확인하세요.</p><p>마지막 점검: <strong>2026-05-19</strong>.</p><p>GPU 부족 뉴스 때는 IR로 들어가며, 영상 추천 채널은 쓰지 않습니다.</p>",
    fr: "<p>Ordre proche des tableaux de capitalisation (NVIDIA, TSMC, Broadcom, etc.) — pas une liste d’achat.</p><p>Contrairement au portail (trafic grand public), ici ce sont semi‑conducteurs et hyperscalers des cycles GPU/capex — toujours <strong>pas</strong> un conseil en investissement.</p><p>Dernière vérification : <strong>2026-05-19</strong>.</p><p>En pénurie GPU j’ouvre les pages IR ici — pas les chaînes « guru » sur YouTube.</p>",
    ru: "<p>Порядок близок к таблицам капитализации (NVIDIA, TSMC, Broadcom и т.д.) — не список для покупки.</p><p>В отличие от портала (массовый веб‑трафик), здесь полупроводники и гиперскейлеры из историй про capex/GPU — по‑прежнему <strong>не</strong> инвестиционный совет.</p><p>Проверено: <strong>2026-05-19</strong>.</p><p>При новостях о дефиците GPU захожу в IR отсюда — не в «гуру» на YouTube.</p>",
    ar: "<p>يقترب الترتيب من جداول القيمة السوقية (NVIDIA وTSMC وBroadcom وغيرها) — وليس قائمة شراء.</p><p>بخلاف صفحة البوابة (زيارات الويب الجماهيرية)، هنا شرائح ومنصات تظهر في روايات نفقات رأس المال ووحدات GPU — ما زال <strong>ليس</strong> نصيحة استثمارية.</p><p>آخر مراجعة: <strong>2026-05-19</strong>.</p><p>عند أخبار نقص GPU أفتح علاقات المستثمرين من هنا — لا قنوات «الخبراء» على YouTube.</p>",
  },
  games: {
    ja: "<p>PC・リビング支出では Steam と御三家が先行。Tencent 級のモバイル巨人は主站の形が違うため「もっと見る」に置いています。</p><p>Hot mix は npm run fetch-hub-news で公開RSSを結合。重複除去はベストエフォート、日付はフィード基準、見出しは英語のまま出ることがあります。</p><p>最終確認：<strong>2026-05-19</strong>。海賊版・キージェンは掲載しません。</p><p>公式ブログの見出しを一画面で追う人用。未知の APK 目録ではありません。</p>",
    ko: "<p>PC·거실 지출은 Steam과 콘솔 3사가 앞섭니다. 텐센트급 모바일 거인은 웹 허브 형태가 달라 ‘더보기’에 두었습니다.</p><p>Hot mix는 npm run fetch-hub-news로 공개 RSS 병합, 중복 제거는 최선 노력, 날짜는 피드 기준이며 제목은 영어로 남을 수 있습니다.</p><p>마지막 점검: <strong>2026-05-19</strong>. 해적·키젠 미게재.</p><p>공식 블로그 헤드라인을 한 화면에서 보는 용도이며, 알 수 없는 APK 목록이 아닙니다.</p>",
    fr: "<p>Steam et les trois familles de consoles dominent PC / salon ; les géants mobiles type Tencent sont dans « plus » car leurs hubs web diffèrent.</p><p>Le hot mix fusionne les RSS publics via npm run fetch-hub-news — dédup partiel, dates des flux, titres souvent en anglais à la source.</p><p>Dernière vérification : <strong>2026-05-19</strong>. Pas de sites de piratage ni de keygens.</p><p>Pour suivre les titres des blogs officiels sur une seule ligne — pas un annuaire d’APK inconnus.</p>",
    ru: "<p>Steam и три консольные семьи лидируют в PC / гостиной; мобильные гиганты уровня Tencent — в «ещё», так как их веб‑хабы иные.</p><p>Hot mix собирает публичные RSS через npm run fetch-hub-news — дедуп приблизительный, даты из лент, заголовки часто на английском.</p><p>Проверено: <strong>2026-05-19</strong>. Пиратские индексы и кейгены не публикуются.</p><p>Лента заголовков с официальных блогов — не каталог неизвестных APK.</p>",
    ar: "<p>يغلب Steam وعائلات المنصات الثلاث إنفاق الحاسوب والصالة؛ عملاقو الموبايل على غرار Tencent في قسم «المزيد» لأن مراكزهم الويب تختلف.</p><p>يمزج Hot mix خلاصات RSS العامة عبر npm run fetch-hub-news — إزالة التكرار تقريبية والتواريخ من التغذيات والعناوين غالبًا بالإنجليزية.</p><p>آخر مراجعة: <strong>2026-05-19</strong>. لا فهارس قرصنة ولا مفاتيح مكسورة.</p><p>لمتابعة عناوين المدونات الرسمية في شريط واحد — وليس فهرس APK مجهول.</p>",
  },
  tools: {
    ja: "<p>天気・翻訳・電卓などは各サービスの公式ページへリンクしています。利用規約・データの扱いは必ず各サイトで確認してください。</p><p>大規模なSaaS目録ではなく、日常でよく使う少数のショートカットです。aogl.cn 上で処理は行わずリンクのみです。</p><p>最終確認：<strong>2026-05-19</strong>。</p><p>月に一度は使う公式 Web 版だけ。機密ファイルのアップロード前は各社ポリシーを確認してください。</p>",
    ko: "<p>날씨·번역·계산기 등은 각 서비스 공식 페이지로 연결됩니다. 약관과 데이터 처리는 해당 사이트에서 확인하세요.</p><p>모든 SaaS 목록이 아니라 자주 쓰는 소수 바로가기입니다. aogl.cn에서는 실행 없이 링크만 제공합니다.</p><p>마지막 점검: <strong>2026-05-19</strong>.</p><p>월 1회 이상 쓰는 공식 웹앱만. 기밀 파일 업로드 전 각사 정책을 확인하세요.</p>",
    fr: "<p>Liens vers les services officiels (météo, traduction, calculatrice, etc.). Vérifiez toujours leurs conditions et leur traitement des données.</p><p>Rail court pour usages quotidiens — pas un annuaire géant. Rien ne s’exécute sur aogl.cn hors liens sortants.</p><p>Dernière vérification : <strong>2026-05-19</strong>.</p><p>Apps web officielles que j’ouvre au moins une fois par mois — lisez la politique du fournisseur avant d’y coller des fichiers sensibles.</p>",
    ru: "<p>Ссылки ведут на официальные сервисы (погода, перевод, калькулятор и т.д.). Условия и данные — на сторонних сайтах.</p><p>Короткий набор частых утилит — не каталог всех SaaS. На aogl.cn ничего не выполняется, только внешние ссылки.</p><p>Проверено: <strong>2026-05-19</strong>.</p><p>Только официальные веб‑версии, которыми пользуюсь хотя бы раз в месяц — перед загрузкой конфиденциальных файлов читайте политику вендора.</p>",
    ar: "<p>روابط إلى صفحات الخدمات الرسمية (الطقس، الترجمة، الحاسبة، إلخ). راجع شروط كل موقع ومعالجة البيانات هناك.</p><p>قائمة قصيرة للأدوات اليومية — ليس دليل كل خدمات SaaS. لا يُشغَّل شيء على aogl.cn سوى الروابط الخارجية.</p><p>آخر مراجعة: <strong>2026-05-19</strong>.</p><p>تطبيقات ويب رسمية أستخدمها شهريًا على الأقل — اقرأ سياسة المزود قبل رفع ملفات حساسة.</p>",
  },
};

const BRAND_IMG_ALT = {
  ja: "aogl.cn — 生成AIツールの個人用ブックマーク",
  ko: "aogl.cn — 생성형 AI 도구 개인 북마크",
  fr: "aogl.cn — signets personnels pour outils d’IA générative",
  ru: "aogl.cn — личные закладки по инструментам генеративного ИИ",
  ar: "aogl.cn — روابط شخصية لأدوات الذكاء الاصطناعي التوليدي",
};

const FOOTER_ABOUT = { ja: "概要", ko: "소개", fr: "À propos", ru: "О сайте", ar: "حول الموقع" };
const FOOTER_PRIVACY = { ja: "プライバシー", ko: "개인정보", fr: "Confidentialité", ru: "Конфиденциальность", ar: "الخصوصية" };
const FOOTER_CHANGELOG = {
  ja: "更新履歴",
  ko: "변경 기록",
  fr: "Mises à jour",
  ru: "Обновления",
  ar: "التحديثات",
};
const FOOTER_CONTACT = {
  ja: "お問い合わせ",
  ko: "문의",
  fr: "Contact",
  ru: "Контакты",
  ar: "اتصل بنا",
};

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function T(spec, key, lang) {
  const en = spec[key + "En"] ?? "";
  const zh = spec[key + "Zh"] ?? "";
  if (lang === "en") return en;
  if (lang === "zh") return zh || en;
  const pack = hubUi[spec.slug]?.[key]?.[lang];
  return pack != null && String(pack).length ? pack : en;
}

function entityName(nameEn, lang) {
  if (lang === "en" || lang === "zh") return null;
  return hubUi.entityNames?.[nameEn]?.[lang];
}

function displayName(t, lang) {
  if (lang === "en") return t.nameEn;
  if (lang === "zh") return t.nameZh;
  return entityName(t.nameEn, lang) || t.nameEn;
}

function newsTitle(it, lang) {
  if (lang === "en") return it.titleEn;
  if (lang === "zh") return it.titleZh;
  return it.titleEn;
}

function hubLeadSpans(spec, base) {
  const en = String(spec[base + "En"] ?? "").trim();
  const zh = String(spec[base + "Zh"] ?? "").trim();
  if (!en && !zh) return "";
  const inner = LOCALES.map((code) => {
    const text = code === "en" ? en : code === "zh" ? zh || en : en;
    return `<span class="lang-${code}">${esc(text)}</span>`;
  }).join("");
  return `      <p class="hub-screen-lead">${inner}</p>\n`;
}

/** Lead for social hot-mix strip (uses T() for ja/ko/fr/ru/ar when hub-ui keys exist). */
function hubHotMixLeadSpans(spec) {
  const en = String(spec.hotMixLeadEn ?? "").trim();
  const zh = String(spec.hotMixLeadZh ?? "").trim();
  if (!en && !zh) return "";
  const inner = LOCALES.map((code) => {
    const text = code === "en" ? en : code === "zh" ? zh || en : T(spec, "hotMixLead", code);
    return `<span class="lang-${code}">${esc(text)}</span>`;
  }).join("");
  return `      <p class="hub-screen-lead">${inner}</p>\n`;
}

function editorialBlocks7(spec) {
  let out = "";
  for (const code of LOCALES) {
    let html;
    if (code === "en") html = spec.editorialHtmlEn || "";
    else if (code === "zh") html = spec.editorialHtmlZh || spec.editorialHtmlEn || "";
    else html = EDITORIAL_I18N[spec.slug]?.[code] || spec.editorialHtmlEn || "";
    if (!String(html).trim()) continue;
    out += `      <div class="lang-${code} hub-prose">${html}</div>\n`;
  }
  return out;
}

function inlineTitleSpans(spec, key) {
  return LOCALES.map((code) => `<span class="lang-${code}">${esc(T(spec, key, code))}</span>`).join("");
}

function updatedSpans(spec) {
  const u = esc(spec.updated);
  const pfx = hubUi.global?.updatedPrefix || {};
  return LOCALES.map((code) => {
    let line;
    if (code === "en") line = `Updated ${u}`;
    else if (code === "zh") line = `更新 ${u}`;
    else line = `${pfx[code] || "Updated"} ${u}`;
    return `<span class="lang-${code}">${esc(line)}</span>`;
  }).join("");
}

function hubFaviconSrc(domain) {
  return faviconSrcForHtml(String(domain || "").replace(/^www\./, ""));
}

function hotMixThumbDomain(source) {
  const s = String(source || "").toLowerCase();
  if (s.includes("steam")) return "steampowered.com";
  if (s.includes("playstation")) return "playstation.com";
  if (s.includes("xbox")) return "xbox.com";
  if (s.includes("unreal") || s.includes("epic")) return "unrealengine.com";
  if (s.includes("techcrunch")) return "techcrunch.com";
  if (s.includes("linkedin")) return "linkedin.com";
  if (s.includes("facebook") || s.includes("meta")) return "meta.com";
  if (s.includes("youtube")) return "youtube.com";
  if (s.includes("instagram")) return "instagram.com";
  return "steampowered.com";
}

function hotMixItemImageUrl(it, spec) {
  const local = hotMixImageSrcForHtml(spec.slug, it);
  if (local) return local;
  return hubFaviconSrc(hotMixThumbDomain(it.source));
}

const NAV = [
  { href: "index.html#tools-directory", file: null, en: "AI frontier", zh: "AI 前沿", ja: "AI最前線", ko: "AI 최전선", fr: "IA — veille", ru: "ИИ — новинки", ar: "أحدث الذكاء الاصطناعي" },
  { href: "portal.html", file: "portal.html", en: "Top sites", zh: "全球站点", ja: "主要サイト", ko: "주요 사이트", fr: "Grands sites", ru: "Топ сайтов", ar: "أبرز المواقع" },
  { href: "brands.html", file: "brands.html", en: "Brands", zh: "品牌", ja: "ブランド", ko: "브랜드", fr: "Marques", ru: "Бренды", ar: "العلامات" },
  { href: "shopping.html", file: "shopping.html", en: "Shopping", zh: "购物", ja: "ショッピング", ko: "쇼핑", fr: "Shopping", ru: "Шопинг", ar: "التسوق" },
  { href: "life.html", file: "life.html", en: "Life", zh: "生活", ja: "ライフ", ko: "라이프", fr: "Vie", ru: "Сервисы", ar: "الحياة الرقمية" },
  { href: "social.html", file: "social.html", en: "Social", zh: "社交", ja: "ソーシャル", ko: "소셜", fr: "Social", ru: "Соцсети", ar: "التواصل" },
  { href: "tech.html", file: "tech.html", en: "Tech", zh: "科技", ja: "テック", ko: "테크", fr: "Tech", ru: "Техно", ar: "التقنية" },
  { href: "games.html", file: "games.html", en: "Games", zh: "游戏", ja: "ゲーム", ko: "게임", fr: "Jeux", ru: "Игры", ar: "الألعاب" },
  { href: "tools.html", file: "tools.html", en: "Utilities", zh: "工具", ja: "実用ツール", ko: "실용 도구", fr: "Utilitaires", ru: "Утилиты", ar: "أدوات مساعدة" },
];

function navLabel(n, lang) {
  return n[lang] || n.en;
}

function navHtml(activeFile) {
  return LOCALES.map(
    (lang) => `        <ul class="site-nav-list lang-${lang}">
${NAV.map((n) => {
          const isActive =
            (n.file != null && n.file === activeFile) || (n.file === null && activeFile === "index.html");
          const cur = isActive ? ' class="is-active"' : "";
          return `          <li${cur}><a href="${esc(n.href)}">${esc(navLabel(n, lang))}</a></li>`;
        }).join("\n")}
        </ul>`
  ).join("\n");
}

function jsonLdItemList(name, items) {
  return {
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name || it.nameEn || it.titleEn,
      url: it.url,
    })),
  };
}

function brandHeadings() {
  return `${LOCALES.map((code) => {
    const alt =
      code === "en"
        ? "aogl.cn — personal bookmarks for generative AI tools and LLM releases"
        : code === "zh"
          ? "aogl.cn — 生成式 AI 工具与大模型动态（个人书签）"
          : BRAND_IMG_ALT[code] || BRAND_IMG_ALT.ja;
    return `        <h1 class="lang-${code} brand-logo-heading">
          <a href="${esc(BASE)}/" class="brand-logo-link"
            ><img src="logo.svg" width="336" height="56" class="brand-logo-img" alt="${esc(alt)}" decoding="async" /></a>
        </h1>`;
  }).join("\n")}`;
}

function tenSearchTagsEn(spec) {
  const arr = Array.isArray(spec.searchTags) ? spec.searchTags.map(String).filter(Boolean) : [];
  while (arr.length < 10) arr.push(`${spec.slug} generative AI`);
  return arr.slice(0, 10);
}

function tenSearchTagsZh(spec) {
  const arr = Array.isArray(spec.searchTagsZh) ? spec.searchTagsZh.map(String).filter(Boolean) : [];
  if (arr.length >= 10) return arr.slice(0, 10);
  return tenSearchTagsEn(spec);
}

function hubNewsGroupHotSearchPills(g) {
  const pills = Array.isArray(g.hotSearchPills) ? g.hotSearchPills.slice(0, 20) : [];
  if (!pills.length) return "";
  const isYouTube = g.id === "ng-youtube";
  const isFb = g.id === "ng-fb";
  const isIg = g.id === "ng-ig";
  const isX = g.id === "ng-x";
  const aria = isYouTube
    ? {
        en: "Hot YouTube searches & trending",
        zh: "YouTube 热门搜索与趋势",
        ja: "YouTube 人気検索・トレンド",
        ko: "YouTube 인기 검색·트렌드",
        fr: "Recherches et tendances YouTube",
        ru: "Популярные запросы и тренды YouTube",
        ar: "عمليات بحث وترند YouTube",
      }
    : isFb
      ? {
          en: "Facebook & Meta news — hot topics and search",
          zh: "Facebook / Meta 热门博文与站内搜索",
          ja: "Facebook / Meta ニュース・人気トピック検索",
          ko: "Facebook·Meta 뉴스·인기 주제 검색",
          fr: "Facebook / Meta — actualités et recherche",
          ru: "Facebook / Meta — новости и популярные темы",
          ar: "Facebook وMeta — أخبار وبحث شائع",
        }
      : isIg
        ? {
            en: "Popular Instagram accounts, Popular feed, Reels & news",
            zh: "Instagram 热门账号、Popular 热门流、Reels 与官方动态",
            ja: "Instagram 人気アカウント・Popular・Reels・ニュース",
            ko: "Instagram 인기 계정·Popular·릴스·공식 소식",
            fr: "Comptes Instagram populaires, fil Popular, Reels et actus",
            ru: "Популярные аккаунты Instagram, лента Popular, Reels и новости",
            ar: "حسابات Instagram الشائعة وPopular وReels والأخبار",
          }
        : isX
          ? {
              en: "Popular X accounts, Explore & official updates",
              zh: "X 热门账号与发现页 / 官方动态",
              ja: "X 人気アカウント・探索・公式",
              ko: "X 인기 계정·탐색·공식 소식",
              fr: "Comptes X populaires, Explorer et actus officielles",
              ru: "Популярные аккаунты X, раздел «Обзор» и новости",
              ar: "حسابات X الشائعة واستكشاف والأخبار الرسمية",
            }
          : g.id === "ng-wiki"
            ? {
                en: "Popular Wikipedia searches & most-read pages",
                zh: "维基百科热门搜索与近期高浏览条目",
                ja: "Wikipedia 人気検索・高閲覧ページ",
                ko: "위키백과 인기 검색·조회수 상위",
                fr: "Recherches Wikipedia et pages les plus lues",
                ru: "Популярные запросы в Wikipedia и самые читаемые статьи",
                ar: "بحث Wikipedia الشائع والصفحات الأكثر قراءة",
              }
            : g.id === "ng-amz"
              ? {
                  en: "Popular Amazon searches & trending lists",
                  zh: "亚马逊热门搜索与榜单（畅销 / 飙升）",
                  ja: "Amazon 人気検索・ランキング",
                  ko: "Amazon 인기 검색·베스트셀러",
                  fr: "Recherches Amazon et listes tendance",
                  ru: "Популярные запросы Amazon и трендовые списки",
                  ar: "بحث Amazon الشائع وقوائم الأكثر مبيعًا",
                }
              : g.id === "ng-reddit"
                ? {
                    en: "Hot Reddit searches & communities",
                    zh: "Reddit 热门搜索与版块",
                    ja: "Reddit 人気検索・コミュニティ",
                    ko: "Reddit 인기 검색·커뮤니티",
                    fr: "Recherches et communautés Reddit populaires",
                    ru: "Популярные запросы и разделы Reddit",
                    ar: "بحث Reddit والمجتمعات الشائعة",
                  }
                : g.id === "ng-yahoo"
                  ? {
                      en: "Hot Yahoo searches",
                      zh: "Yahoo 热门搜索",
                      ja: "Yahoo 人気検索",
                      ko: "Yahoo 인기 검색",
                      fr: "Recherches Yahoo populaires",
                      ru: "Популярные запросы Yahoo",
                      ar: "بحث Yahoo الشائع",
                    }
                  : g.id === "ng-wa"
                    ? {
                        en: "WhatsApp features & help (web search)",
                        zh: "WhatsApp 功能与帮助（网页搜索）",
                        ja: "WhatsApp 機能・ヘルプ（ウェブ検索）",
                        ko: "WhatsApp 기능·도움말(웹 검색)",
                        fr: "Fonctions et aide WhatsApp (recherche web)",
                        ru: "Функции и справка WhatsApp (веб-поиск)",
                        ar: "ميزات ومساعدة WhatsApp (بحث ويب)",
                      }
                    : {
                        en: "Hot Google searches",
                        zh: "热门 Google 搜索",
                        ja: "Google 人気検索",
                        ko: "Google 인기 검색",
                        fr: "Recherches Google populaires",
                        ru: "Популярные запросы в Google",
                        ar: "عمليات بحث Google الشائعة",
                      };
  return LOCALES.map((lang) => {
    const links = pills
      .map((p) => {
        const urlExplicit = String(p.url || "").trim();
        let href;
        if (urlExplicit) {
          href = urlExplicit;
        } else {
          const q = String(p.q || p.labelZh || p.labelEn || "").trim();
          if (!q) return "";
          const eng = p.searchEngine || p.engine;
          if (eng === "youtube") {
            href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
          } else if (eng === "facebook") {
            href = "https://www.facebook.com/search/top?q=" + encodeURIComponent(q);
          } else if (eng === "wikipedia") {
            href = "https://en.wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(q);
          } else if (eng === "amazon") {
            href = "https://www.amazon.com/s?k=" + encodeURIComponent(q);
          } else if (eng === "reddit") {
            href = "https://www.reddit.com/search/?q=" + encodeURIComponent(q);
          } else if (eng === "yahoo") {
            href = "https://search.yahoo.com/search?p=" + encodeURIComponent(q);
          } else if (eng === "whatsapp") {
            href = "https://www.google.com/search?q=" + encodeURIComponent("WhatsApp " + q);
          } else {
            href = "https://www.google.com/search?q=" + encodeURIComponent(q);
          }
        }
        let label;
        if (lang === "en") label = String(p.labelEn || p.labelZh || p.q || "").trim();
        else if (lang === "zh") label = String(p.labelZh || p.labelEn || p.q || "").trim();
        else label = String(p.labelEn || p.labelZh || p.q || "").trim();
        if (!label) return "";
        return `<a class="pill" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
      })
      .filter(Boolean)
      .join("");
    return `          <div class="pill-row hub-pill-row hub-news-pill-row lang-${lang}" aria-label="${esc(aria[lang] || aria.en)}">${links}</div>`;
  }).join("\n");
}

function hubSearchPillRows(spec) {
  return LOCALES.map((lang) => {
    const tags = lang === "zh" ? tenSearchTagsZh(spec) : tenSearchTagsEn(spec);
    const pills = tags
      .map((t) => {
        const q = encodeURIComponent(t);
        return `<a class="pill" href="https://www.google.com/search?q=${q}" target="_blank" rel="noopener noreferrer">${esc(t)}</a>`;
      })
      .join("");
    return `      <div class="pill-row hub-pill-row lang-${lang}" aria-label="Related searches">${pills}</div>\n`;
  }).join("");
}

function footerLegal() {
  const about = LOCALES.map(
    (code) =>
      `        <a href="about.html" class="footer-legal-link lang-${code}">${esc(
        code === "en" ? "About" : code === "zh" ? "关于" : FOOTER_ABOUT[code]
      )}</a>`
  ).join("\n");
  const contact = LOCALES.map(
    (code) =>
      `        <a href="contact.html" class="footer-legal-link lang-${code}">${esc(
        code === "en" ? "Contact" : code === "zh" ? "联系我们" : FOOTER_CONTACT[code]
      )}</a>`
  ).join("\n");
  const log = LOCALES.map(
    (code) =>
      `        <a href="changelog.html" class="footer-legal-link lang-${code}">${esc(
        code === "en" ? "Changelog" : code === "zh" ? "更新记录" : FOOTER_CHANGELOG[code]
      )}</a>`
  ).join("\n");
  const priv = LOCALES.map(
    (code) =>
      `        <a href="privacy.html" class="footer-legal-link lang-${code}">${esc(
        code === "en" ? "Privacy" : code === "zh" ? "隐私政策" : FOOTER_PRIVACY[code]
      )}</a>`
  ).join("\n");
  return about + "\n" + contact + "\n" + log + "\n" + priv + "\n" + footerFriendLinkHtml(LOCALES, esc);
}

function renderPage(spec, activeFile) {
  const top10 = spec.top10 || [];
  const newsGroups = spec.newsGroups || [];
  const more = spec.more || [];
  const canonical = BASE + (spec.path || `/${activeFile}`);

  const graph = [
    {
      "@type": "WebPage",
      "@id": canonical + "#webpage",
      url: canonical,
      name: spec.titleEn,
      description: spec.descEn,
      inLanguage: ["en", "zh-CN", "ja", "ko", "fr", "ru", "ar"],
      isPartOf: { "@type": "WebSite", "@id": BASE + "/#website", name: "aogl.cn", url: BASE + "/" },
    },
    jsonLdItemList(spec.rankTitleEn || spec.h1En, top10.map((t) => ({ name: t.nameEn, url: t.url }))),
  ];

  const top10Lis = top10
    .map(
      (t, i) => `          <li class="hub-rank-item">
            <a class="hub-rank-link" href="${esc(resolveLocalHref(t.url))}"${localHrefAttr(resolveLocalHref(t.url))}>
              <span class="hub-rank-num">${i + 1}</span>
              <img class="hub-favicon" src="${esc(hubFaviconSrc(t.domain))}" width="40" height="40" alt="" loading="lazy" decoding="async" data-domain="${esc(t.domain)}" />
              <span class="hub-rank-text">${LOCALES.map((code) => `<span class="lang-${code}">${esc(displayName(t, code))}</span>`).join("")}</span>
            </a>
          </li>`
    )
    .join("\n");

  const newsBlocks = newsGroups
    .map(
      (g) => `        <section class="hub-news-group" aria-labelledby="${esc(g.id)}">
          <h3 id="${esc(g.id)}" class="hub-news-group-title">${LOCALES.map(
            (code) =>
              `<span class="lang-${code}">${esc(
                code === "en" ? g.labelEn : code === "zh" ? g.labelZh : entityName(g.labelEn, code) || g.labelEn
              )}</span>`
          ).join("")}</h3>
          <ul class="hub-news-list">
${(g.items || [])
  .map(
    (it) => `            <li>
              <a href="${esc(resolveLocalHref(it.url))}"${localHrefAttr(resolveLocalHref(it.url))}>${LOCALES.map(
                (code) => `<span class="lang-${code}">${esc(newsTitle(it, code))}</span>`
              ).join("")}</a>
              <span class="hub-news-meta">${esc(it.date || "")}</span>
            </li>`
  )
  .join("\n")}
          </ul>
${hubNewsGroupHotSearchPills(g)}        </section>`
    )
    .join("\n");

  const showNewsScreen = !spec.omitNewsScreen && newsGroups.length > 0;
  const newsSection = showNewsScreen
    ? `    <section class="hub-screen hub-screen-news" id="news" aria-labelledby="hub-news-title">
      <h2 id="hub-news-title" class="page-section-title">${inlineTitleSpans(spec, "newsTitle")}</h2>
${hubLeadSpans(spec, "newsLead")}      <div class="hub-news-wrap">
${newsBlocks}
      </div>
    </section>

`
    : "";

  const hotMixItems = Array.isArray(spec.hotMixItems) ? spec.hotMixItems : [];
  const showHotMix = hotMixItems.length > 0;
  const hotMixLis = hotMixItems
    .map(
      (it) => `        <li class="hub-hotmix-card">
          <a class="hub-hotmix-card-link" href="${esc(resolveLocalHref(it.url))}"${localHrefAttr(resolveLocalHref(it.url))} draggable="false">
            <div class="hub-hotmix-card-media">
              <img class="hub-hotmix-card-img" src="${esc(hotMixItemImageUrl(it, spec))}" width="400" height="225" alt="" loading="lazy" decoding="async" draggable="false" />
            </div>
            <div class="hub-hotmix-card-body">
              <div class="hub-hotmix-card-titles">${LOCALES.map(
                (code) => `<span class="lang-${code}">${esc(newsTitle(it, code))}</span>`
              ).join("")}</div>
              <div class="hub-hotmix-card-meta">${esc(it.date || "")}${it.source ? ` · ${esc(it.source)}` : ""}</div>
            </div>
          </a>
        </li>`
    )
    .join("\n");
  const hotMixUseCarousel = spec.slug === "games" || spec.slug === "social";
  const hotMixCarouselClass = hotMixUseCarousel ? " hub-hotmix-cards--carousel" : "";
  const hotMixUlOpen = hotMixUseCarousel
    ? `<ul class="hub-hotmix-cards${hotMixCarouselClass}" role="list" aria-label="Hot mix — swipe or scroll sideways for more">`
    : `<ul class="hub-hotmix-cards">`;
  const hotMixSection = showHotMix
    ? `    <section class="hub-screen hub-screen-hotmix" id="hot-mix" aria-labelledby="hub-hotmix-title">
      <h2 id="hub-hotmix-title" class="page-section-title">${inlineTitleSpans(spec, "hotMixTitle")}</h2>
${hubHotMixLeadSpans(spec)}      ${hotMixUlOpen}
${hotMixLis}
      </ul>
    </section>

`
    : "";

  const moreLis = more
    .map(
      (t) => `          <li class="hub-more-item">
            <a class="hub-more-link" href="${esc(resolveLocalHref(t.url))}"${localHrefAttr(resolveLocalHref(t.url))}>
              <img class="hub-favicon hub-favicon-sm" src="${esc(hubFaviconSrc(t.domain))}" width="28" height="28" alt="" loading="lazy" decoding="async" />
              ${LOCALES.map((code) => `<span class="lang-${code}">${esc(displayName(t, code))}</span>`).join("")}
            </a>
          </li>`
    )
    .join("\n");

  const pageJs = spec.pageScript || `js/pages/${spec.slug}.js`;

  const dataTitles = LOCALES.map((code) => `  data-title-${code}="${esc(T(spec, "title", code))}"`).join("\n");
  const dataDescs = LOCALES.map((code) => `  data-desc-${code}="${esc(T(spec, "desc", code))}"`).join("\n");

  return `<!DOCTYPE html>
<html
  lang="en"
${dataTitles}
${dataDescs}
>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="favicon.svg" type="image/svg+xml" sizes="any" />
  <meta name="description" content="${esc(spec.descEn)}" />
  <title>${esc(spec.titleEn)}</title>
  <link rel="canonical" href="${esc(canonical)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <meta name="author" content="aogl.cn" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${esc(canonical)}" />
  <meta property="og:title" content="${esc(spec.titleEn)}" />
  <meta property="og:description" content="${esc(spec.descEn)}" />
  <meta property="og:site_name" content="aogl.cn" />
  <meta property="og:image" content="${esc(BASE + "/og-default.png")}" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:locale:alternate" content="zh_CN" />
  <script type="application/ld+json">
${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2)}
  </script>
  <link rel="stylesheet" href="css/style.css" />
  <link rel="stylesheet" href="css/hub.css" />
  <script src="js/adsense.js"></script>
</head>
<body class="locale-en">
  <canvas id="bg-canvas" class="bg-canvas" aria-hidden="true"></canvas>
  <script src="js/bg-canvas.js"></script>
  <script src="js/i18n.js"></script>
  <header>
    <div class="head-row">
      <div class="brand">
${brandHeadings()}
      </div>
      <nav class="site-nav" aria-label="Primary">
${navHtml(activeFile)}
      </nav>
      <div class="lang-switch">
        <select class="aogl-lang-select" id="aogl-lang-header" aria-label="Language"></select>
      </div>
    </div>
  </header>

  <main class="hub-main wrap" id="main">
    <article class="hub-editorial prose-block">
      <h1 class="hub-page-title">${inlineTitleSpans(spec, "h1")}</h1>
      <p class="hub-updated">${updatedSpans(spec)}</p>
${editorialBlocks7(spec)}${hubSearchPillRows(spec)}
    </article>

    <section class="hub-screen hub-screen-rank" id="rank" aria-labelledby="hub-rank-title">
      <h2 id="hub-rank-title" class="page-section-title">${inlineTitleSpans(spec, "rankTitle")}</h2>
${hubLeadSpans(spec, "rankLead")}      <ol class="hub-rank-grid">
${top10Lis}
      </ol>
    </section>

${hotMixSection}${newsSection}    <section class="hub-screen hub-screen-more" id="more" aria-labelledby="hub-more-title">
      <h2 id="hub-more-title" class="page-section-title">${inlineTitleSpans(spec, "moreTitle")}</h2>
${hubLeadSpans(spec, "moreLead")}      <ul class="hub-more-grid">
${moreLis}
      </ul>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap footer-wrap">
      <div class="footer-top">
        <div class="footer-lang">
          <select class="aogl-lang-select" id="aogl-lang-footer" aria-label="Language"></select>
        </div>
      </div>
      <div class="footer-watermark" aria-hidden="true">
        <img
          src="footer-wordmark-outline.svg"
          width="448"
          height="92"
          class="footer-watermark-svg"
          alt=""
          decoding="async"
          loading="lazy"
        />
      </div>
      <div class="footer-legal">
${footerLegal()}
        <span class="footer-copy">© <span id="y"></span> aogl.cn</span>
      </div>
    </div>
  </footer>
  <script src="js/hub-common.js" defer></script>
  <script src="${esc(pageJs)}" defer></script>
</body>
</html>
`;
}

function loadSpecs() {
  const files = fs
    .readdirSync(HUB_DIR)
    .filter((f) => f.endsWith(".json") && f !== "news-feeds.json");
  return files.map((f) => {
    const spec = JSON.parse(fs.readFileSync(path.join(HUB_DIR, f), "utf8"));
    if (!spec.slug || !spec.outFile) throw new Error(`Invalid hub spec: ${f}`);
    return spec;
  });
}

function main() {
  if (!fs.existsSync(HUB_DIR)) fs.mkdirSync(HUB_DIR, { recursive: true });
  fs.mkdirSync(MULTILANG_DIR, { recursive: true });
  const specs = loadSpecs();
  for (const spec of specs) {
    const html = renderPage(spec, spec.outFile);
    fs.writeFileSync(path.join(MULTILANG_DIR, spec.outFile), html, "utf8");
    console.log("Wrote _multilang/" + spec.outFile);
  }
}

main();
