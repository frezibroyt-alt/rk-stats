import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { cleanTag } from "@/lib/assets";

export async function GET(_req, { params }) {
  const { tag: raw } = await params;
  const tag = cleanTag(raw);
  const supa = getSupabase();
  if (!supa) return NextResponse.json({ enabled: false, points: [] });

  await supa.from("tracked_players").upsert({ tag }, { onConflict: "tag" });

  const [{ data: snaps }, { data: battles }] = await Promise.all([
    supa.from("snapshots").select("captured_at, trophies").eq("tag", tag).order("captured_at", { ascending: true }).limit(5000),
    supa.from("battles").select("battle_time, result, trophy_change, brawler_id, brawler_name").eq("tag", tag).limit(8000),
  ]);

  // trophy series
  const points = (snaps || []).map((r) => ({ t: new Date(r.captured_at).getTime(), v: r.trophies }));

  // daily push (last trophies per day -> diff)
  const lastByDay = new Map();
  for (const r of snaps || []) lastByDay.set(new Date(r.captured_at).toISOString().slice(0, 10), r.trophies);
  const dayEntries = [...lastByDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const daily = [];
  for (let i = 1; i < dayEntries.length; i++) daily.push({ day: dayEntries[i][0].slice(5), delta: dayEntries[i][1] - dayEntries[i - 1][1] });
  daily.reverse();
  const maxDelta = Math.max(1, ...daily.map((x) => Math.abs(x.delta)));

  // battle aggregates
  const B = battles || [];
  let wins = 0, losses = 0, net = 0;
  const byBrawler = {};
  const byDay = {};
  for (const b of B) {
    if (b.result === "victory") wins++;
    else if (b.result === "defeat") losses++;
    if (typeof b.trophy_change === "number") net += b.trophy_change;
    if (b.brawler_id != null) {
      const x = (byBrawler[b.brawler_id] ||= { id: b.brawler_id, name: b.brawler_name, games: 0, w: 0, l: 0 });
      x.games++;
      if (b.result === "victory") x.w++; else if (b.result === "defeat") x.l++;
    }
    const day = parseBT(b.battle_time);
    if (day) byDay[day] = (byDay[day] || 0) + 1;
  }
  const decided = wins + losses;

  // days tracked: span from first snapshot/battle to now
  const firstTimes = [];
  if (dayEntries.length) firstTimes.push(new Date(dayEntries[0][0]).getTime());
  const battleDays = Object.keys(byDay).sort();
  if (battleDays.length) firstTimes.push(new Date(battleDays[0]).getTime());
  const start = firstTimes.length ? Math.min(...firstTimes) : Date.now();
  const daysTracked = Math.max(1, Math.round((Date.now() - start) / 864e5) + 1);

  const summary = {
    battlesTracked: B.length,
    wins, losses,
    winRate: decided ? Math.round((wins / decided) * 100) : 0,
    netTrophies: net,
    daysTracked,
    from: battleDays[0] || (dayEntries[0] && dayEntries[0][0]) || null,
    to: new Date().toISOString().slice(0, 10),
  };

  const mostPlayed = Object.values(byBrawler)
    .map((x) => ({ id: x.id, name: x.name, games: x.games, winRate: x.w + x.l ? Math.round((x.w / (x.w + x.l)) * 100) : 0 }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 12);

  // activity last 28 days
  const activity = [];
  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const dt = new Date(today); dt.setUTCDate(today.getUTCDate() - i);
    const key = dt.toISOString().slice(0, 10);
    activity.push({ date: key, count: byDay[key] || 0 });
  }

  return NextResponse.json({ enabled: true, points, daily: daily.slice(0, 30), maxDelta, summary, mostPlayed, activity });
}

function parseBT(t) {
  if (!t) return null;
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(t);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
