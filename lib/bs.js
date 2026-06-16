// Server-only Brawl Stars API client. The token never reaches the browser.
import "server-only";
import { cleanTag } from "./assets";

const BASE = process.env.BRAWL_API_BASE || "https://proxy.royaleapi.dev/v1";
const TOKEN = process.env.BRAWL_API_TOKEN;

async function bsFetch(path, { revalidate = 60 } = {}) {
  if (!TOKEN) {
    throw new ApiError(500, "BRAWL_API_TOKEN is not set. Add it to your .env.");
  }
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    // Cache lightly so we don't hammer the API / hit rate limits.
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

// "#" must be url-encoded as %23
const enc = (tag) => "%23" + cleanTag(tag);

export const getPlayer = (tag) => bsFetch(`/players/${enc(tag)}`, { revalidate: 60 });
export const getBattleLog = (tag) =>
  bsFetch(`/players/${enc(tag)}/battlelog`, { revalidate: 60 });
export const getClub = (tag) => bsFetch(`/clubs/${enc(tag)}`, { revalidate: 120 });
export const getBrawlers = () => bsFetch(`/brawlers`, { revalidate: 86400 });
export const getRankings = (country = "global", kind = "players", limit = 25) =>
  bsFetch(`/rankings/${country}/${kind}?limit=${limit}`, { revalidate: 600 });
