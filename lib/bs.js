// Server-only Brawl Stars API client. The token never reaches the browser.
import "server-only";
import { cleanTag } from "./assets";

// IMPORTANT: Brawl Stars uses the *bsproxy* host, not the Clash Royale "proxy" host.
//   Brawl Stars   -> https://bsproxy.royaleapi.dev/v1
//   Clash Royale  -> https://proxy.royaleapi.dev/v1
//   Clash of Clans-> https://cocproxy.royaleapi.dev/v1
// All three share the same whitelisted IP: 45.79.218.79
const BASE = (process.env.BRAWL_API_BASE || "https://bsproxy.royaleapi.dev/v1").trim();
const TOKEN = (process.env.BRAWL_API_TOKEN || "").trim();

async function bsFetch(path, { revalidate = 60 } = {}) {
  if (!TOKEN) {
    throw new ApiError(500, "BRAWL_API_TOKEN is not set. Add it to your .env.");
  }
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    next: { revalidate },
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.message || "";
    } catch {}
    throw new ApiError(res.status, detail || res.statusText);
  }
  return res.json();
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const enc = (tag) => "%23" + cleanTag(tag);

export const getPlayer = (tag) => bsFetch(`/players/${enc(tag)}`, { revalidate: 60 });
export const getBattleLog = (tag) =>
  bsFetch(`/players/${enc(tag)}/battlelog`, { revalidate: 60 });
export const getClub = (tag) => bsFetch(`/clubs/${enc(tag)}`, { revalidate: 120 });
export const getBrawlers = () => bsFetch(`/brawlers`, { revalidate: 86400 });
export const getRankings = (country = "global", kind = "players", limit = 25) =>
  bsFetch(`/rankings/${country}/${kind}?limit=${limit}`, { revalidate: 600 });
