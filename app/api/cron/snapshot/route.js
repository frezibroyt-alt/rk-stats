import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getPlayer, getBattleLog } from "@/lib/bs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Runs hourly (see vercel.json). Records a trophy snapshot + new battles
// for every tracked player so the History tab can show graphs over time.
export async function GET(req) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET> automatically
  // when CRON_SECRET env is set. Also allow ?secret= for manual triggers.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const url = new URL(req.url);
    if (auth !== `Bearer ${secret}` && url.searchParams.get("secret") !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
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
      const rows = (log.items || []).map((b) => ({
        tag,
        battle_time: b.battleTime,
        mode: b.event?.mode || b.battle?.mode || "Unknown",
        map: b.event?.map || null,
        type: b.battle?.type || null,
        result: b.battle?.result || null,
        rank: b.battle?.rank ?? null,
        trophy_change: b.battle?.trophyChange ?? null,
        raw: b,
      }));
      if (rows.length) {
        // dedup on (tag, battle_time)
        const { error } = await supa
          .from("battles")
          .upsert(rows, { onConflict: "tag,battle_time", ignoreDuplicates: true });
        if (!error) battles += rows.length;
      }
    } catch {
      // skip this player, keep going
    }
  }

  return NextResponse.json({ ok: true, tracked: tags.length, snaps, battles });
}
