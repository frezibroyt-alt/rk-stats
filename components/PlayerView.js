"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SafeImg from "./SafeImg";
import TrophyChart from "./TrophyChart";
import {
  brawlerIcon, profileIcon, modeIcon, mapIcon, starPowerIcon, gadgetIcon,
  nameColorToHex, compact, timeAgo, rarityColor,
} from "@/lib/assets";
import { analyzeLog } from "@/lib/stats";
import { saveProfile, isMatchSaved, toggleMatch } from "@/lib/store";

const TABS = ["Profile", "Brawlers", "Battles", "Ranked", "History"];

export default function PlayerView({ player, battlelog, tag, historyAvailable }) {
  const [tab, setTab] = useState("Profile");
  const color = nameColorToHex(player.nameColor);
  const a = useMemo(() => analyzeLog(battlelog, player.tag), [battlelog, player.tag]);

  // remember this profile locally
  useEffect(() => {
    saveProfile({ tag, name: player.name, icon: player.icon?.id, color });
  }, [tag]); // eslint-disable-line

  return (
    <div>
      {/* header */}
      <div className="panel rise" style={{ marginTop: 4 }}>
        <div className="phead">
          <SafeImg className="avatar" src={profileIcon(player.icon?.id)} alt="" />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ color }}>{player.name}</h1>
            <div className="row" style={{ gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <span className="pill">#{tag}</span>
              {player.club?.name && (
                <Link href={`/club/${(player.club.tag || "").replace("#", "")}`} className="pill">
                  🛡 {player.club.name}
                </Link>
              )}
            </div>
            <div className="trophy display" style={{ fontSize: 22, marginTop: 8 }}>
              🏆 {compact(player.trophies)}
            </div>
          </div>
        </div>
      </div>

      <div className="spacer-16" />
      <div className="seg rise rise-2">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
            {t === "Ranked" && a.ranked.length ? ` (${a.ranked.length})` : ""}
          </button>
        ))}
      </div>
      <div className="spacer-16" />

      {tab === "Profile" && <ProfileTab player={player} a={a} />}
      {tab === "Brawlers" && <BrawlersTab player={player} />}
      {tab === "Battles" && <BattlesTab items={a.items} playerTag={player.tag} />}
      {tab === "Ranked" && <RankedTab a={a} playerTag={player.tag} />}
      {tab === "History" && <HistoryTab tag={tag} available={historyAvailable} />}
    </div>
  );
}

/* ── Profile ─────────────────────────────────────────────────────── */
function ProfileTab({ player, a }) {
  const c = a.counts;
  return (
    <div className="rise rise-3">
      <div className="stat-grid">
        <Stat v={`${a.winRate}%`} k={`Win rate · last ${c.total} battles`} cls={a.winRate >= 50 ? "win" : "loss"} />
        <Stat v={c.today} k="Battles today" />
        <Stat v={`${a.starRate}%`} k="Star player rate" />
        <Stat v={`${c.trophies >= 0 ? "+" : ""}${c.trophies}`} k="Trophy change (log)" cls={c.trophies >= 0 ? "win" : "loss"} />
        <Stat v={compact(player.highestTrophies)} k="Highest trophies" />
        <Stat v={player.expLevel} k="Experience level" />
        <Stat v={compact(player["3vs3Victories"])} k="3v3 victories" />
        <Stat v={compact(player.soloVictories)} k="Solo victories" />
        <Stat v={compact(player.duoVictories)} k="Duo victories" />
        <Stat v={`${c.w}-${c.l}${c.d ? "-" + c.d : ""}`} k="W · L" cls="" />
      </div>

      <div className="section-title">By mode · last {c.total}</div>
      <div className="panel">
        {a.byMode.map((m) => (
          <div className="bar-row" key={m.mode}>
            <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.mode}</span>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${m.winRate}%` }} /></div>
            <span className="muted" style={{ textAlign: "right", fontSize: 13 }}>{m.winRate}%</span>
          </div>
        ))}
        {!a.byMode.length && <div className="empty">No recent battles.</div>}
      </div>
    </div>
  );
}

function Stat({ v, k, cls = "" }) {
  return (
    <div className="stat">
      <span className={`v ${cls}`}>{v}</span>
      <span className="k">{k}</span>
    </div>
  );
}

/* ── Brawlers ────────────────────────────────────────────────────── */
function BrawlersTab({ player }) {
  const [sort, setSort] = useState("trophies");
  const brawlers = [...(player.brawlers || [])].sort((x, y) => {
    if (sort === "trophies") return y.trophies - x.trophies;
    if (sort === "power") return y.power - x.power;
    if (sort === "rank") return y.rank - x.rank;
    return x.name.localeCompare(y.name);
  });

  return (
    <div className="rise rise-3">
      <div className="seg" style={{ marginBottom: 14 }}>
        {[["trophies", "Trophies"], ["power", "Power"], ["rank", "Rank"], ["name", "Name"]].map(([k, label]) => (
          <button key={k} className={sort === k ? "active" : ""} onClick={() => setSort(k)}>{label}</button>
        ))}
      </div>
      <div className="muted" style={{ margin: "0 4px 10px", fontSize: 13 }}>
        {brawlers.length} brawlers unlocked
      </div>
      <div className="bgrid">
        {brawlers.map((b) => (
          <div className="brawler" key={b.id} title={`${b.name} · ${b.rank} rank`}>
            <SafeImg className="port" src={brawlerIcon(b.id)} alt={b.name} />
            <span className="pw">{b.power}</span>
            <span className="tr">🏆{compact(b.trophies)}</span>
            <span className="bar" style={{ background: rarityColor(b.rarity?.name) }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Battles ─────────────────────────────────────────────────────── */
function BattlesTab({ items, playerTag }) {
  const [filter, setFilter] = useState("all"); // all | today | week
  const [, force] = useState(0);
  const now = Date.now();
  const list = items.filter((it) => {
    if (filter === "today") return it.when && new Date(it.when).toDateString() === new Date().toDateString();
    if (filter === "week") return it.when && now - it.when.getTime() < 7 * 864e5;
    return true;
  });

  return (
    <div className="rise rise-3">
      <div className="seg" style={{ marginBottom: 14 }}>
        {[["all", "All"], ["today", "Today"], ["week", "This week"]].map(([k, l]) => (
          <button key={k} className={filter === k ? "active" : ""} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>
      <div className="notice" style={{ marginBottom: 12 }}>
        The official API keeps only the last ~25 battles. Older history needs the database layer (see History tab).
      </div>
      {list.map((it, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <BattleRow it={it} playerTag={playerTag} onToggle={() => force((n) => n + 1)} />
        </div>
      ))}
      {!list.length && <div className="empty">No battles in this range.</div>}
    </div>
  );
}

function BattleRow({ it, playerTag, onToggle }) {
  const id = `${playerTag}:${it.raw.battleTime}`;
  const saved = typeof window !== "undefined" && isMatchSaved(id);
  const change = it.trophyChange;
  return (
    <div className={`battle ${it.result || "draw"}`}>
      <SafeImg className="mode-ic" src={modeIcon(it.modeId || it.raw.event?.id || 0)} fallback={mapIcon(it.mapId)} alt="" />
      <div className="meta">
        <div className="t">
          {it.mode}{" "}
          {it.ranked && <span className="pill" style={{ padding: "1px 7px", marginLeft: 4 }}>Ranked</span>}
          {it.starPlayerIsMe && <span className="star" title="Star player"> ★</span>}
        </div>
        <div className="s">
          {it.map?.name && <span>{it.map.name}</span>}
          {it.brawler && <span>· {it.brawler.name}</span>}
          {it.when && <span>· {timeAgo(it.when)}</span>}
        </div>
      </div>
      {typeof change === "number" && (
        <span className={`change ${change > 0 ? "up" : change < 0 ? "down" : ""}`}>
          {change > 0 ? "+" : ""}{change}
        </span>
      )}
      <button
        className={`save-dot ${saved ? "on" : ""}`}
        title={saved ? "Saved" : "Save match"}
        onClick={() => {
          toggleMatch({ id, tag: playerTag, mode: it.mode, map: it.map?.name, result: it.result, when: it.when, brawler: it.brawler?.name });
          onToggle && onToggle();
        }}
      >
        {saved ? "★" : "☆"}
      </button>
    </div>
  );
}

/* ── Ranked ──────────────────────────────────────────────────────── */
function RankedTab({ a, playerTag }) {
  if (!a.ranked.length)
    return <div className="empty rise rise-3">No ranked battles in the recent log.</div>;
  const brawlers = {};
  for (const it of a.ranked) {
    if (it.brawler) {
      const b = (brawlers[it.brawler.id] ||= { id: it.brawler.id, name: it.brawler.name, w: 0, l: 0 });
      if (it.result === "victory") b.w++;
      else if (it.result === "defeat") b.l++;
    }
  }
  const wr = (() => {
    const w = a.ranked.filter((i) => i.result === "victory").length;
    const l = a.ranked.filter((i) => i.result === "defeat").length;
    return w + l ? Math.round((w / (w + l)) * 100) : 0;
  })();

  return (
    <div className="rise rise-3">
      <div className="stat-grid">
        <Stat v={a.ranked.length} k="Ranked battles (log)" />
        <Stat v={`${wr}%`} k="Ranked win rate" cls={wr >= 50 ? "win" : "loss"} />
      </div>
      <div className="section-title">Brawlers used in ranked</div>
      <div className="bgrid">
        {Object.values(brawlers).map((b) => (
          <div className="brawler" key={b.id} title={`${b.name} · ${b.w}W ${b.l}L`}>
            <SafeImg className="port" src={brawlerIcon(b.id)} alt={b.name} />
            <span className="tr">{b.w}-{b.l}</span>
          </div>
        ))}
      </div>
      <div className="spacer-16" />
      {a.ranked.map((it, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <BattleRow it={it} playerTag={playerTag} />
        </div>
      ))}
    </div>
  );
}

/* ── History (Supabase) ──────────────────────────────────────────── */
function HistoryTab({ tag, available }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    fetch(`/api/history/${tag}`)
      .then((r) => r.json())
      .then((d) => on && setData(d))
      .catch(() => on && setData({ error: true }))
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [tag]);

  if (!available)
    return (
      <div className="notice rise rise-3">
        History, daily trophy-push tables and graphs are powered by the optional Supabase layer.
        Add your Supabase keys and the hourly cron (see README) to start recording snapshots — the chart
        will fill in over the following days.
      </div>
    );
  if (loading) return <div className="empty rise rise-3">Loading history…</div>;
  if (!data || data.error || !data.points?.length)
    return (
      <div className="notice rise rise-3">
        No snapshots recorded yet for #{tag}. Once this player is tracked and the cron has run a few times,
        the trophy graph and daily push table appear here.
      </div>
    );

  return (
    <div className="rise rise-3">
      <div className="panel">
        <div className="eyebrow">Trophy history</div>
        <div className="spacer-8" />
        <TrophyChart points={data.points} />
      </div>
      <div className="section-title">Daily trophy push</div>
      <div className="panel">
        {data.daily?.map((d) => (
          <div className="bar-row" key={d.day} style={{ gridTemplateColumns: "120px 1fr 64px" }}>
            <span style={{ fontWeight: 600 }}>{d.day}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${Math.min(100, Math.abs(d.delta) / (data.maxDelta || 1) * 100)}%`, background: d.delta >= 0 ? "linear-gradient(90deg,#1d9b57,#2fd87a)" : "linear-gradient(90deg,#b5293a,#ff4d5e)" }} />
            </div>
            <span style={{ textAlign: "right", fontWeight: 700, color: d.delta >= 0 ? "var(--win)" : "var(--loss)" }}>
              {d.delta >= 0 ? "+" : ""}{d.delta}
            </span>
          </div>
        ))}
        {!data.daily?.length && <div className="empty">Not enough data yet.</div>}
      </div>
    </div>
  );
}
