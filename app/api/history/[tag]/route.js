import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { cleanTag } from "@/lib/assets";

export async function GET(_req, { params }) {
  const { tag: raw } = await params;
  const tag = cleanTag(raw);
  const supa = getSupabase();
  if (!supa) return NextResponse.json({ enabled: false, points: [] });

  // ensure this player gets tracked from now on
  await supa.from("tracked_players").upsert({ tag }, { onConflict: "tag" });

  const { data, error } = await supa
    .from("snapshots")
    .select("captured_at, trophies")
    .eq("tag", tag)
    .order("captured_at", { ascending: true })
    .limit(2000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const points = (data || []).map((r) => ({
    t: new Date(r.captured_at).getTime(),
    v: r.trophies,
  }));

  // daily push: last trophies value per day, then diff vs previous day
  const lastByDay = new Map();
  for (const r of data || []) {
    const day = new Date(r.captured_at).toISOString().slice(0, 10);
    lastByDay.set(day, r.trophies);
  }
  const days = [...lastByDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const daily = [];
  for (let i = 1; i < days.length; i++) {
    daily.push({ day: days[i][0].slice(5), delta: days[i][1] - days[i - 1][1] });
  }
  daily.reverse();
  const maxDelta = Math.max(1, ...daily.map((d) => Math.abs(d.delta)));

  return NextResponse.json({ enabled: true, points, daily: daily.slice(0, 30), maxDelta });
}
