import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const rows = [
  [1, "B08JHCVHTY", "blink plus plan with monthly auto-renewal", "Blink Plus 计划（按月自动续订）", 4.4, 277246, "TWD 381.85"],
  [2, "B0B1N7LJD3", "Blink Outdoor 4 – Wireless smart security camera, two-year battery life, two-way talk. Required Sync Module not included – Add-on camera", "Blink Outdoor 4 无线安防摄像头（Add-on）", 4.2, 29381, "From TWD 2,228.97"],
  [3, "B0GJTFXNRX", "Apple AirTag (2nd Generation): Tracker for Keychain, Wallet, and More; Locator with Sound; Simple One-Tap Setup with iPhone or iPad; Key Finder with up to 1.5X Precision Finding Range", "Apple AirTag（第二代）", 4.6, 5627, "From TWD 710.83"],
  [4, "B0FQFB8FMG", "Apple AirPods Pro 3 Wireless Earbuds, Active Noise Cancellation, Live Translation, Heart Rate Sensing, Hearing Aid Feature, Bluetooth Headphones, Spatial Audio, High-Fidelity Sound, USB-C Charging", "Apple AirPods Pro 3", 4.5, 10996, "From TWD 5,563.67"],
  [5, "B09B8V1LZ3", "Amazon Echo Dot (newest model) - Vibrant sounding speaker, Designed for Alexa+, Great for bedrooms, dining rooms and offices, Charcoal", "Amazon Echo Dot（最新款）", 4.7, 194509, "TWD 1,592.03"],
  [6, "B0BFC7WQ6R", "Amazon Echo Spot (newest model), Great for nightstands, offices and kitchens, Smart alarm clock, Designed for Alexa+, Black", "Amazon Echo Spot（最新款）", 4.5, 43053, "TWD 2,547.44"],
  [7, "B0FQF9ZX7P", "Apple Watch Series 11 [GPS 42mm] Smartwatch with Rose Gold Aluminum Case with Light Blush Sport Band - S/M. Sleep Score, Fitness Tracker, Health Monitoring, Always-On Display, Water Resistant", "Apple Watch Series 11（GPS 42mm）", 4.7, 5538, "From TWD 8,085.63"],
  [8, "B0H6GX9QQ6", "Ring Battery Doorbell (newest model), Speckled Gray with Indoor Cam, White", "Ring Battery Doorbell（最新款）", 2.2, 4, "TWD 4,776.41"],
  [9, "B0DJGDC3BD", "Amazon Fire TV Stick HD (newest model), free & live TV, Alexa Voice Remote, powered by the TV, effortless setup, find shows faster with Alexa+", "Amazon Fire TV Stick HD（最新款）", 4.1, 1161, "TWD 1,114.33"],
  [10, "B0C6W3D4RM", "Amazon Fire TV Stick 4K Select (newest model), start streaming in 4K, AI-powered search, and free & live TV, find shows faster with Alexa+", "Amazon Fire TV Stick 4K Select", 4.2, 10965, "TWD 1,273.56"],
  [11, "B0DCH8VDXF", "Apple EarPods Headphones with USB-C Plug, Wired Ear Buds with Built-in Remote to Control Music, Phone Calls, and Volume", "Apple EarPods（USB-C）", 4.6, 14775, "From TWD 559.87"],
  [12, "B0DGHMNQ5Z", "Apple AirPods 4 Wireless Earbuds, Bluetooth Headphones, Personalized Spatial Audio, Sweat and Water Resistant, USB-C Charging Case, H2 Chip, Up to 30 Hours of Battery Life, Effortless Setup for iPhone", "Apple AirPods 4", 4.6, 31165, "From TWD 4,398.39"],
  [13, "B0CZPLV566", "Beats Solo 4 - Wireless On-Ear Bluetooth Headphones, Up to 50-Hour Battery Life, Ultra-Lightweight Comfort, Powerful and Balanced Sound, Apple & Android Compatible - Matte Black", "Beats Solo 4", 4.6, 27072, "From TWD 2,993.62"],
  [14, "B0F7Z4QZTT", "Amazon Fire TV Stick 4K Plus (newest model) with AI-powered Fire TV Search, Wi-Fi 6, stream hundreds of thousands of movies and shows, free & live TV, find shows faster with Alexa+", "Amazon Fire TV Stick 4K Plus", 4.6, 110429, "TWD 1,592.03"],
  [15, "B0DZ77D5HL", "Apple iPad 11-inch: A16 chip, 11-inch Model, Liquid Retina Display, 128GB, Wi-Fi 6, 12MP Front/12MP Back Camera, Touch ID, All-Day Battery Life — Silver", "Apple iPad 11 英寸（A16）", 4.7, 25405, "TWD 14,858.22"],
  [16, "B0F1DGM1TM", "INSIGNIA 50\" Class F50 Series LED 4K UHD Smart Fire TV with Alexa Voice Remote (NS-50F502NA26)", "INSIGNIA 50\" Fire TV 4K", 4.4, 9884, "TWD 5,732.14"],
  [17, "B0D9WVWXR1", "Oura Ring 4 Sizing Kit - Before You Buy the Unique Sizing, Not Standard US Sizes - Receive Credit for Purchase, Sizing Kit, Oura App", "Oura Ring 4 尺码套装", 4.5, 3698, "From TWD 270.38"],
  [18, "B0DC91H3JK", "Amazon Echo Show 11 (newest model), Vibrant Full-HD 11\" display with more viewing area and spatial audio, Designed for Alexa+, Graphite", "Amazon Echo Show 11", 4.4, 5445, "TWD 7,006.02"],
  [19, "B0BP9SNVH9", "Amazon Fire TV Stick 4K Max (newest model), streaming device, with AI-powered Fire TV Search, supports Wi-Fi 6E, free & live TV without cable or satellite, find shows faster with Alexa+", "Amazon Fire TV Stick 4K Max", 4.6, 79002, "TWD 1,910.50"],
  [20, "B0CFPJYX7P", "Amazon Kindle Paperwhite 16GB (newest model) – 20% faster, with new 7\" glare-free display and weeks of battery life – Black", "Kindle Paperwhite 16GB（最新款）", 4.7, 19368, "From TWD 3,821.32"],
  [21, "B0DGQZ8JZK", "Blink Video Doorbell – Head-to-toe HD view, two-year battery life, and simple setup. Sync Module Core included – System (Black)", "Blink Video Doorbell 套装", 4.2, 14065, "From TWD 1,623.88"],
  [22, "B09PDLBFKY", "6 Ft Surge Protector Power Strip - 8 Widely Outlets with 4 USB Ports, 3 Side Outlet Extender with 6 Feet Extension Cord, Flat Plug, Wall Mount, Desk USB Charging Station, ETL,White", "6 英尺插线板（8 孔 + 4 USB）", 4.6, 50620, "From TWD 413.37"],
  [23, "B0CCZ26B5V", "Bose QuietComfort Headphones - Wireless Bluetooth Headphones, Active Over Ear Noise Cancelling and Mic, USB-C Charging, Deep Bass, Up to 24 Hours of Playtime, Black", "Bose QuietComfort 头戴耳机", 4.6, 20495, "From TWD 5,700.61"],
  [24, "B0CTNWBT1Z", "JBL Go 4 - Ultra-Portable, Waterproof and Dustproof Bluetooth Speaker, Big JBL Pro Sound with Punchy bass, 7-Hour Built-in Battery, Made in Part with Recycled Materials (Black)", "JBL Go 4 蓝牙音箱", 4.7, 17290, "From TWD 1,590.76"],
  [25, "B0CNVCQZG1", "Amazon Kindle 16 GB (newest model) - Lightest and most compact Kindle, now with faster page turns, and higher contrast ratio, for an enhanced reading experience - Matcha", "Kindle 16GB（最新款）", 4.6, 16991, "From TWD 2,239.80"],
  [26, "B0D9C2V83V", "Amazon Smart Plug, Works with Alexa, Simple Setup, Endless Possibilities (2-Pack)", "Amazon Smart Plug（2 件装）", 4.7, 570989, "TWD 1,273.24"],
  [27, "B0DXXYS4BJ", "Roku Streaming Stick HD — HD Streaming Device for TV with Roku Voice Remote, Free & Live TV", "Roku Streaming Stick HD", 4.7, 20867, "TWD 907.32"],
  [28, "B0D2HKCMBP", "SHOKZ New OpenRun Pro 2- Bone Conduction Headphones, Open-Ear Bluetooth Wireless Sport Earphones for Running, Workouts - Sweat Resistant, Secure Comfortable Fit -Deep Bass, Smart Mic, Reflective Strip", "SHOKZ OpenRun Pro 2 骨传导耳机", 4.5, 10651, "From TWD 5,730.87"],
  [29, "B01MTB55WH", "Anker Soundcore 2 Portable Bluetooth Speaker with Stereo Sound, Bluetooth 5, Bassup, IPX7 Waterproof, 24-Hour Playtime, Wireless, Speaker for Home, Outdoors, Travel", "Anker Soundcore 2 蓝牙音箱", 4.5, 152616, "From TWD 955.09"],
  [30, "B0FVXMHHRP", "Samsung Galaxy Tab A11+ 6GB RAM, 128GB Storage, Optimized Performance, Long Lasting Battery, Expandable Storage, Large Display, Dolby Atmos Speakers, AI Assist, Slim, Light, 2 Year Warranty, Gray", "Samsung Galaxy Tab A11+", 4.6, 1360, "From TWD 5,413.67"],
  [31, "B0BS1PRC4L", "Sony WH-CH520 Wireless Headphones Bluetooth On-Ear Headset with Microphone and up to 50 Hours Battery Life with Quick Charging, Black", "Sony WH-CH520 无线耳机", 4.5, 33217, "MSRP"],
  [32, "B08R6S1M1K", "Wall Charger, Surge Protector, QINLIANF 5 Outlet Extender with 4 USB Charging Ports, 3-Sided 1680J Power Strip Multi Plug Adapter Spaced for Home Travel Office", "QINLIANF 墙插扩展器（5 孔 + 4 USB）", 4.7, 114878, "TWD 318.15"],
  [33, "B0CRTYZG5C", "Soundcore P30i by Anker Noise Cancelling Earbuds, Strong and Smart Noise Cancelling, Powerful Bass, 45H Playtime, 2-in-1 Case and Phone Stand, IP54, Wireless Earbuds, Bluetooth 5.4 (Black)", "Soundcore P30i 降噪耳塞", 4.4, 36374, "TWD 891.40"],
  [34, "B0C8PR4W22", "Beats Studio Pro Premium Wireless Over-Ear Headphones- Up to 40-Hour Battery Life, Active Noise Cancelling, Great for Travel & Commuting, USB-C Lossless Audio, Apple & Android Compatible -Black", "Beats Studio Pro", 4.5, 28292, "From TWD 4,345.52"],
  [35, "B0CYN6TKMB", "JLab Go Air Pop+ True Wireless Bluetooth Earbuds, in Ear Headphones with Microphone, 35H Playtime, USB-C Charging Case, Dual Connect, EQ3 Sound, Lilac", "JLab Go Air Pop+ 真无线耳塞", 4.4, 1143, "TWD 673.56"],
  [36, "B0DZ254SSR", "10Ft Extension Cord with Multiple Outlets, Flat Plug Surge Protector Power Strip 10 Ft Long Cord, 8 Outlets & 4 USB Ports (2 USB C), Desk Charging Station for Home Office, College Dorm Room Essentials", "10 英尺插线板（8 孔 + 4 USB）", 4.8, 5891, "TWD 445.54"],
  [37, "B0FQFNRH72", "Apple Watch SE 3 [GPS 40mm] Smartwatch with Starlight Aluminum Case with Starlight Sport Band - S/M. Fitness and Sleep Trackers, Heart Rate Monitor, Always-On Display, Water Resistant", "Apple Watch SE 3（GPS 40mm）", 4.7, 3424, "From TWD 5,957.30"],
  [38, "B0C3HCD34R", "Soundcore by Anker Q20i Hybrid Active Noise Cancelling Headphones, Wireless Over-Ear Bluetooth, 40H Long ANC Playtime, Hi-Res Audio, Big Bass, Customize via an App, Transparency Mode (Black)", "Soundcore Q20i 头戴降噪耳机", 4.6, 67230, "From TWD 1,273.56"],
  [39, "B0C2W1KLSS", "Beats Studio Buds + | True Wireless Noise Cancelling Earbuds, Enhanced Apple & Android Compatibility, Built-in Microphone, Sweat Resistant Bluetooth Headphones, Spatial Audio - Black/Gold", "Beats Studio Buds +", 4.0, 6880, "From TWD 2,492.35"],
  [40, "B0BLBLRLJB", "Amazon Fire 7 Kids tablet, ages 3-7. Top-selling 7\" kids tablet on Amazon. Includes ad-free and exclusive content, easy parental controls, 10-hr battery, 16 GB, Blue", "Amazon Fire 7 Kids 儿童平板", 4.4, 33967, "TWD 3,502.85"],
  [41, "B0D6SX8VLQ", "Amazon Echo Dot Max (newest model), Alexa speaker with room-filling sound and nearly 3x bass, Great for living rooms and medium-sized spaces, Designed for Alexa+, Graphite", "Amazon Echo Dot Max", 4.4, 3778, "TWD 3,184.38"],
  [42, "B0GR1JTFP8", "Apple 2026 MacBook Air 13-inch Laptop with M5 chip: Built for AI, 13.6-inch Liquid Retina Display, 16GB Unified Memory, 512GB SSD, 12MP Center Stage Camera, Touch ID, Wi-Fi 7; Midnight", "Apple MacBook Air 13\" M5（2026）", 4.8, 636, "TWD 41,369.25"],
  [43, "B0C1QWWZR4", "JBL Tune Buds - True wireless Noise Cancelling earbuds, JBL Pure Bass Sound, Bluetooth 5.3, 4-Mic technology for Crisp, Clear Calls, Up to 48 hours of battery life, Water and dust resistant (Black)", "JBL Tune Buds", 4.2, 10208, "From TWD 1,909.23"],
  [44, "B09Z6Q2MLC", "(Pack of 2) Replacement Remote Control Only for Roku TV, Compatible for TCL Roku/Hisense Roku/Onn Roku/Sharp Roku/Element Roku/Westinghouse Roku/Philips Roku Smart TVs (Not for Roku Stick and Box)", "Roku TV 替换遥控器（2 件装）", 4.5, 66081, "TWD 285.67"],
  [45, "B0DZ218NW4", "Ring Outdoor Cam Plus, Battery (newest model), Home or business security, Wide-Angle 2K Video with Ring Vision, Low-Light Sight for full-color night vision, Mount-Anywhere Versatility, 2-pack, White", "Ring Outdoor Cam Plus（2 件装）", 4.5, 7287, "TWD 3,184.06"],
  [46, "B092CP8ZH4", "JBL Tune 510BT - Bluetooth headphones with up to 40 hours battery, microphone for call, foldable and comfortable, Android and iOs compatible (Rose)", "JBL Tune 510BT", 4.5, 92232, "From TWD 953.82"],
  [47, "B0D6J5B98H", "ROVE R2-4K DUAL Dash Cam Front and Rear, STARVIS 2 Sensor, FREE 128GB Card Included, 5G WiFi - up to 20MB/s Fastest Download Speed with App, 4K 2160P/FHD Dash Camera for Cars, 3\" IPS, 24H Parking Mode", "ROVE R2-4K DUAL 行车记录仪", 4.5, 12503, "From TWD 3,184.38"],
  [48, "B0BL5SZ3VV", "Amazon Fire HD 10 Kids tablet (newest model) ages 3-7 | Bright 10.1\" HD screen with included ad-free and exclusive content, robust parental controls, 13-hr battery, 32 GB, Blue", "Amazon Fire HD 10 Kids 儿童平板", 4.6, 7966, "TWD 6,050.61"],
  [49, "B0F2TQBG6T", "Tile by Life360 Mate - Bluetooth Tracker, Keys Finder and Item Locator for Keys, Bags and More. Phone Finder. Both iOS and Android Compatible. 4-Pack (Colors)", "Tile Mate 蓝牙追踪器（4 件装）", 4.3, 14740, "TWD 2,605.08"],
  [50, "B0C8RR4WN3", "Amazon Kindle Paperwhite Signature Edition 32GB (newest model) – 20% faster with auto-adjusting front light, wireless charging, and weeks of battery life – Metallic Black", "Kindle Paperwhite Signature 32GB", 4.7, 11569, "From TWD 4,385.01"],
];

const snapshot = {
  fetchedAt: "2026-06-29",
  fetchStatus: "manual",
  fetchNote: "Archived from Amazon.com Best Sellers in Electronics (Top 50). Source chart UI June 2026.",
  chartTitleEn: "Best Sellers in Electronics",
  chartTitleZh: "电子产品 Best Sellers",
  geo: "US",
  geoLabelEn: "United States (Amazon.com)",
  geoLabelZh: "美国（Amazon.com）",
  sourceChartUrl: "https://www.amazon.com/gp/bestsellers/electronics/ref=zg_bs_electronics_sm",
  heroAsin: "B08JHCVHTY",
  heroProductUrl: "https://www.amazon.com/dp/B08JHCVHTY",
  entries: rows.map(([rank, asin, titleEn, titleZh, rating, reviewCount, priceDisplay]) => ({
    rank,
    asin,
    titleEn,
    titleZh,
    productUrl: `https://www.amazon.com/dp/${asin}`,
    rating,
    reviewCount,
    priceDisplay,
  })),
};

const out = path.join(ROOT, "data", "amazon-bestsellers-electronics-20260629-snapshot.json");
fs.writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n");
console.log("Wrote", out, "entries:", snapshot.entries.length);
