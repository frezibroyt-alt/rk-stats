// Pure functions that turn the raw battle log into the numbers the UI shows.
// Works on the API-provided last ~25 battles (no DB needed).
import { parseBattleTime, isToday, isRanked } from "./assets";

function resultOf(b, playerTag) {
  const battle = b.battle || {};
  // Showdown: ranked is 1..N → win if top half.
  if (battle.rank != null) {
    const mode = (battle.mode || "").toLowerCase();
    const solo = mode.includes("solo");
    const cutoff = solo ? 4 : 2; // solo: top4 win, duo/trio: top2 win
    return battle.rank <= cutoff ? "victory" : "defeat";
  }
  if (battle.result) return battle.result; // "victory" | "defeat" | "draw"
  return null;
}

function myBrawler(b, playerTag) {
  const teams = b.battle?.teams || (b.battle?.players ? [b.battle.players] : []);
  for (const team of teams) {
    for (const p of team) {
      if (cleanish(p.tag) === cleanish(playerTag)) return p.brawler;
    }
  }
  // solo showdown players[]
  return null;
}
const cleanish = (t) => String(t || "").toUpperCase().replace(/^#/, "");

export function analyzeLog(log, playerTag) {
  const items = (log?.items || []).map((b) => ({
    raw: b,
    when: parseBattleTime(b.battleTime),
    result: resultOf(b, playerTag),
    ranked: isRanked(b),
    mode: b.event?.mode || b.battle?.mode || "Unknown",
    map: b.event?.map || null,
    mapId: b.event?.id || null,
    modeId: null,
    starPlayerIsMe:
      b.battle?.starPlayer && cleanish(b.battle.starPlayer.tag) === cleanish(playerTag),
    trophyChange: b.battle?.trophyChange ?? null,
    brawler: myBrawler(b, playerTag),
  }));

  let w = 0, l = 0, d = 0, today = 0, star = 0, trophies = 0;
  const byMode = {};
  const byBrawler = {};

  for (const it of items) {
    if (it.result === "victory") w++;
    else if (it.result === "defeat") l++;
    else if (it.result === "draw") d++;
    if (isToday(it.when)) today++;
    if (it.starPlayerIsMe) star++;
    if (typeof it.trophyChange === "number") trophies += it.trophyChange;

    const m = (byMode[it.mode] ||= { w: 0, l: 0, d: 0, total: 0 });
    m.total++;
    if (it.result === "victory") m.w++;
    else if (it.result === "defeat") m.l++;
    else if (it.result === "draw") m.d++;

    if (it.brawler) {
      const key = it.brawler.id;
      const br = (byBrawler[key] ||= {
        id: it.brawler.id,
        name: it.brawler.name,
        w: 0, l: 0, d: 0, total: 0,
      });
      br.total++;
      if (it.result === "victory") br.w++;
      else if (it.result === "defeat") br.l++;
      else if (it.result === "draw") br.d++;
    }
  }

  const decided = w + l;
  const winRate = decided ? Math.round((w / decided) * 100) : 0;
  const starRate = items.length ? Math.round((star / items.length) * 100) : 0;

  return {
    items,
    counts: { w, l, d, total: items.length, today, star, trophies },
    winRate,
    starRate,
    byMode: Object.entries(byMode)
      .map(([mode, v]) => ({ mode, ...v, winRate: v.w + v.l ? Math.round((v.w / (v.w + v.l)) * 100) : 0 }))
      .sort((a, b) => b.total - a.total),
    byBrawler: Object.values(byBrawler)
      .map((v) => ({ ...v, winRate: v.w + v.l ? Math.round((v.w / (v.w + v.l)) * 100) : 0 }))
      .sort((a, b) => b.total - a.total),
    ranked: items.filter((i) => i.ranked),
  };
}
