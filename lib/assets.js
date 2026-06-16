// Client-safe helpers: icon URLs, colors, formatting.
// Brawlify CDN is free to use (no credit required, follow Supercell ToS).

const CDN = "https://cdn.brawlify.com";

// Brawler portrait by OFFICIAL api id (e.g. 16000000 = Shelly)
export const brawlerIcon = (id) => `${CDN}/brawlers/borderless/${id}.png`;
// Profile icon by player.icon.id (e.g. 28000000)
export const profileIcon = (id) => `${CDN}/profile/${id}.png`;
// Club badge
export const clubIcon = (id) => `${CDN}/club/${id}.png`;
// Map image by id
export const mapIcon = (id) => `${CDN}/maps/regular/${id}.png`;
// Game mode icon by id (with safe fallback handled via onError in UI)
export const modeIcon = (id) => `${CDN}/game-modes/${id}.png`;
export const starPowerIcon = (id) => `${CDN}/star-powers/${id}.png`;
export const gadgetIcon = (id) => `${CDN}/gadgets/${id}.png`;
export const gearIcon = (id) => `${CDN}/gears/${id}.png`;

// Brawl Stars rarity → accent color
export const RARITY = {
  "Starting Brawler": { name: "Common", color: "#bfc6cf" },
  Common: { color: "#bfc6cf" },
  Rare: { color: "#43d977" },
  "Super Rare": { color: "#3ba4ff" },
  Epic: { color: "#b65aff" },
  Mythic: { color: "#fe5e72" },
  Legendary: { color: "#ffd21e" },
};
export const rarityColor = (name) =>
  (RARITY[name] && RARITY[name].color) || "#bfc6cf";

// Supercell sends nameColor like "0xfff05637" → "#f05637"
export function nameColorToHex(raw) {
  if (!raw || typeof raw !== "string") return "#ffffff";
  const hex = raw.replace(/^0x/i, "");
  // formats: AARRGGBB (8) or RRGGBB (6)
  if (hex.length === 8) return "#" + hex.slice(2);
  if (hex.length === 6) return "#" + hex;
  return "#ffffff";
}

// "#2PP" → "2PP" ; uppercase ; strip leading # and stray chars
export function cleanTag(tag) {
  return String(tag || "")
    .toUpperCase()
    .replace(/^#/, "")
    .replace(/[^0289PYLQGRJCUV]/g, "");
}

// Compact numbers: 40512 → "40.5K"
export function compact(n) {
  if (n == null || isNaN(n)) return "0";
  const num = Number(n);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(num);
}

// Battle time in API form "20240617T184500.000Z" → Date
export function parseBattleTime(t) {
  if (!t) return null;
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(t);
  if (!m) return new Date(t);
  const [, y, mo, d, h, mi, s] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
}

export function timeAgo(date) {
  if (!date) return "";
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

export function isToday(date) {
  if (!date) return false;
  const n = new Date();
  return (
    date.getFullYear() === n.getFullYear() &&
    date.getMonth() === n.getMonth() &&
    date.getDate() === n.getDate()
  );
}

// A battle is "ranked" when type contains "ranked" (e.g. soloRanked)
export function isRanked(battle) {
  const t = (battle && battle.battle && battle.battle.type) || "";
  return /rank/i.test(t);
}
