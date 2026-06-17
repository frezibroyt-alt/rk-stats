import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getPlayer, getBattleLog } from "@/lib/bs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const clean = (t) => String(t || "").toUpperCase().replace(/^#/, "");

function resultOf(b) {
  const battle = b.battle || {};
  if (battle.rank != null) {
    const solo = (battle.mode || "").toLowerCase().includes("solo");
    return battle.rank <= (solo ? 4 : 2) ? "victory" : "defeat";
  }
  return battle.result || null;
}
function myBrawler(b, tag) {
  const teams = b.battle?.teams || (b.battle?.players ? [b.battle.players] : []);
  for (const team of teams) for (const p of team) if (clean(p.tag) === clean(tag)) return p.brawler;
  return null;
}

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const url = new URL(req.url);
    if (auth !== `Bearer ${secret}` && url.searchParams.get("secret") !== secret)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supa = getSupabase();
  if (!supa) return NextResponse.json({ error: "supabase not configured" }, { status: 400 });

  const { data: tracked } = await supa.from("tracked_players").select("tag");
  const tags = (tracked || []).map((t) => t.tag);
  let snaps = 0, battles = 0;

  for (const tag of tags) {
    try {
      const player = await getPlayer(tag);
      await supa.from("snapshots").insert({
        tag,
        trophies: player.trophies,
        highest_trophies: player.highestTrophies,
        exp_level: player.expLevel,
        brawlers_count: (player.brawlers || []).length,
      });
      snaps++;

      const log = await getBattleLog(tag).catch(() => ({ items: [] }));
      const rows = (log.items || []).map((b) => {
        const br = myBrawler(b, tag);
        return {
          tag,
          battle_time: b.battleTime,
          mode: b.event?.mode || b.battle?.mode || "Unknown",
          map: b.event?.map || null,
          type: b.battle?.type || null,
          result: resultOf(b),
          rank: b.battle?.rank ?? null,
          trophy_change: b.battle?.trophyChange ?? null,
          brawler_id: br?.id ?? null,
          brawler_name: br?.name ?? null,
          raw: b,
        };
      });
      if (rows.length) {
        const { error } = await supa.from("battles").upsert(rows, { onConflict: "tag,battle_time", ignoreDuplicates: true });
        if (!error) battles += rows.length;
      }
    } catch {}
  }
  return NextResponse.json({ ok: true, tracked: tags.length, snaps, battles });
}
