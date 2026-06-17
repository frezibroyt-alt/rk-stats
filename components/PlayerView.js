"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import SafeImg from "./SafeImg";
import TrophyChart from "./TrophyChart";
import {
  brawlerIcon, profileIcon, modeIcon, mapIcon, starPowerIcon, gadgetIcon, gearIcon,
  nameColorToHex, compact, timeAgo, rarityColor,
} from "@/lib/assets";
import { analyzeLog } from "@/lib/stats";
import { saveProfile, isMatchSaved, toggleMatch } from "@/lib/store";

const TABS = ["Profile", "Brawlers", "Battles", "Ranked", "History"];

export default function PlayerView({ player, battlelog, catalog = {}, tag, historyAvailable }) {
  const [tab, setTab] = useState("Profile");
  const color = nameColorToHex(player.nameColor);
  const a = useMemo(() => analyzeLog(battlelog, player.tag), [battlelog, player.tag]);
  const brawlerStats = useMemo(() => {
    const m = {};
    for (const b of a.byBrawler) m[b.id] = b;
    return m;
  }, [a]);
  const lastPlayed = useMemo(() => {
    const m = {};
    for (const it of a.items) if (it.brawler && !m[it.brawler.id]) m[it.brawler.id] = it.when;
    return m;
  }, [a]);

  useEffect(() => {
    saveProfile({ tag, name: player.name, icon: player.icon?.id, color });
  }, [tag]); // eslint-disable-line

  return (
    <div>
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
            <div className="trophy display" style={{ fontSize: 22, marginTop: 8 }}>🏆 {compact(player.trophies)}</div>
          </div>
        </div>
      </div>

      <div className="spacer-16" />
      <div className="seg rise rise-2">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}{t === "Ranked" && a.ranked.length ? ` (${a.ranked.length})` : ""}
          </button>
        ))}
      </div>
      <div className="spacer-16" />

      {tab === "Profile" && <ProfileTab player={player} a={a} tag={tag} historyAvailable={historyAvailable} />}
      {tab === "Brawlers" && <BrawlersTab player={player} catalog={catalog} brawlerStats={brawlerStats} lastPlayed={lastPlayed} />}
      {tab === "Battles" && <BattlesTab items={a.items} playerTag={player.tag} />}
      {tab === "Ranked" && <RankedTab a={a} playerTag={player.tag} />}
      {tab === "History" && <HistoryTab tag={tag} available={historyAvailable} />}
    </div>
  );
}

function Stat({ v, k, cls = "" }) {
  return <div className="stat"><span className={`v ${cls}`}>{v}</span><span className="k">{k}</span></div>;
}

/* ── Profile ─────────────────────────────────────────────── */
function ProfileTab({ player, a, tag, historyAvailable }) {
  const c = a.counts;
  return (
    <div className="rise rise-3">
      {historyAvailable && <SummaryPanel tag={tag} />}
      <div className="stat-grid">
        <Stat v={`${a.winRate}%`} k={`Win rate · last ${c.total}`} cls={a.winRate >= 50 ? "win" : "loss"} />
        <Stat v={c.today} k="Battles today" />
        <Stat v={`${a.starRate}%`} k="Star player rate" />
        <Stat v={`${c.trophies >= 0 ? "+" : ""}${c.trophies}`} k="Trophy change (log)" cls={c.trophies >= 0 ? "win" : "loss"} />
        <Stat v={compact(player.highestTrophies)} k="Highest trophies" />
        <Stat v={player.expLevel} k="Experience level" />
        <Stat v={compact(player["3vs3Victories"])} k="3v3 victories" />
        <Stat v={compact(player.soloVictories)} k="Solo victories" />
        <Stat v={compact(player.duoVictories)} k="Duo victories" />
        <Stat v={`${c.w}-${c.l}${c.d ? "-" + c.d : ""}`} k="W · L" />
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

/* compact history summary cards shown on Profile when tracking is on */
function SummaryPanel({ tag }) {
  const [d, setD] = useState(null);
  useEffect(() => {
    fetch(`/api/history/${tag}`).then((r) => r.json()).then(setD).catch(() => {});
  }, [tag]);
  if (!d || !d.summary || !d.summary.battlesTracked) return null;
  const s = d.summary;
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="eyebrow" style={{ margin: "0 4px 8px" }}>Battle history summary</div>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Stat v={s.battlesTracked} k="Battles" />
        <Stat v={s.wins} k="Wins" cls="win" />
        <Stat v={s.losses} k="Losses" cls="loss" />
        <Stat v={`${s.winRate}%`} k="Win rate" cls={s.winRate >= 50 ? "win" : "loss"} />
        <Stat v={`${s.netTrophies >= 0 ? "+" : ""}${s.netTrophies}`} k="Net trophies" cls={s.netTrophies >= 0 ? "win" : "loss"} />
        <Stat v={s.daysTracked} k="Days tracked" />
      </div>
    </div>
  );
}

/* ── Brawlers + hover/tap card ───────────────────────────── */
function BrawlersTab({ player, catalog, brawlerStats, lastPlayed }) {
  const [sort, setSort] = useState("trophies");
  const [pop, setPop] = useState(null);   // { b, rect }
  const [pinned, setPinned] = useState(false);

  const brawlers = [...(player.brawlers || [])].sort((x, y) => {
    if (sort === "trophies") return y.trophies - x.trophies;
    if (sort === "power") return y.power - x.power;
    if (sort === "rank") return y.rank - x.rank;
    return x.name.localeCompare(y.name);
  });

  const hover = (b, el) => { if (!pinned) setPop({ b, rect: el.getBoundingClientRect() }); };
  const leave = () => { if (!pinned) setPop(null); };
  const pin = (b, el) => { setPop({ b, rect: el.getBoundingClientRect() }); setPinned(true); };
  const close = () => { setPinned(false); setPop(null); };

  return (
    <div className="rise rise-3">
      <div className="seg" style={{ marginBottom: 14 }}>
        {[["trophies", "Trophies"], ["power", "Power"], ["rank", "Rank"], ["name", "Name"]].map(([k, l]) => (
          <button key={k} className={sort === k ? "active" : ""} onClick={() => setSort(k)}>{l}</button>
        ))}
      </div>
      <div className="muted" style={{ margin: "0 4px 10px", fontSize: 13 }}>
        {brawlers.length} brawlers · hover or tap one for details
      </div>
      <div className="bgrid">
        {brawlers.map((b) => {
          const cat = catalog[b.id] || {};
          const rc = cat.rarityColor || rarityColor(cat.rarity);
          return (
            <div
              key={b.id}
              className="brawler"
              onMouseEnter={(e) => hover(b, e.currentTarget)}
              onMouseLeave={leave}
              onClick={(e) => pin(b, e.currentTarget)}
              style={{ cursor: "pointer", borderColor: pop?.b.id === b.id ? rc : undefined }}
            >
              <SafeImg className="port" src={brawlerIcon(b.id)} alt={b.name} />
              <span className="pw">{b.power}</span>
              <span className="tr">🏆{compact(b.trophies)}</span>
              <span className="bar" style={{ background: rc }} />
            </div>
          );
        })}
      </div>

      {pop && (
        <>
          {pinned && <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 40 }} />}
          <BrawlerCard
            b={pop.b}
            anchor={pop.rect}
            pinned={pinned}
            cat={catalog[pop.b.id] || {}}
            stats={brawlerStats[pop.b.id]}
            lastPlayed={lastPlayed[pop.b.id]}
            onClose={close}
          />
        </>
      )}
    </div>
  );
}

function BrawlerCard({ b, cat, stats, lastPlayed, anchor, pinned, onClose }) {
  const rc = cat.rarityColor || rarityColor(cat.rarity);
  const ownedSP = new Set((b.starPowers || []).map((x) => x.id));
  const ownedG = new Set((b.gadgets || []).map((x) => x.id));
  const allSP = cat.starPowers?.length ? cat.starPowers : (b.starPowers || []);
  const allG = cat.gadgets?.length ? cat.gadgets : (b.gadgets || []);
  const powerPct = Math.min(100, (b.power / 11) * 100);

  const ref = useRef(null);
  const [pos, setPos] = useState({ left: -9999, top: -9999 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !anchor) return;
    const W = el.offsetWidth, H = el.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight, gap = 8;
    let left, top;
    if (anchor.right + gap + W <= vw - gap) {        // room on the right -> beside
      left = anchor.right + gap; top = anchor.top;
    } else if (anchor.left - gap - W >= gap) {       // room on the left -> beside
      left = anchor.left - W - gap; top = anchor.top;
    } else {                                         // narrow screen -> under/over the tile
      left = Math.min(Math.max(gap, anchor.left + anchor.width / 2 - W / 2), vw - W - gap);
      if (anchor.bottom + gap + H <= vh - gap) top = anchor.bottom + gap;     // below
      else if (anchor.top - gap - H >= gap) top = anchor.top - H - gap;       // above
      else top = vh - H - gap;
    }
    if (top + H > vh - gap) top = vh - H - gap;      // keep fully on screen
    if (top < gap) top = gap;
    setPos({ left, top });
  }, [anchor, b]);

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed", left: pos.left, top: pos.top, zIndex: 41,
        width: "min(320px, calc(100vw - 24px))", maxHeight: "92vh", overflowY: "auto",
        background: "var(--panel)", border: `1px solid var(--line)`, borderRadius: 18,
        padding: 16, boxShadow: "0 16px 50px rgba(0,0,0,.5)",
        animation: "rise .16s cubic-bezier(.2,.7,.3,1) both",
        pointerEvents: pinned ? "auto" : "none",
      }}
    >
        <div className="row" style={{ gap: 12 }}>
          <SafeImg src={brawlerIcon(b.id)} alt="" style={{ width: 56, height: 56, borderRadius: 12, border: `2px solid ${rc}` }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="display" style={{ fontSize: 20, color: rc }}>{b.name}</div>
            <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
              {cat.rarity || "Brawler"} · rank {b.rank}
            </div>
          </div>
          <div className="trophy display" style={{ fontSize: 20 }}>🏆 {compact(b.trophies)}</div>
          <button className="save-dot" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={{ margin: "14px 0 4px", display: "flex", alignItems: "center", gap: 10 }}>
          <span className="display" style={{ fontSize: 14 }}>P{b.power}</span>
          <div className="bar-track" style={{ flex: 1, height: 10 }}>
            <div className="bar-fill" style={{ width: `${powerPct}%` }} />
          </div>
          <span className="muted" style={{ fontSize: 12 }}>{b.power}/11</span>
        </div>

        {!!allG.length && (
          <Row label="Gadgets">
            {allG.map((g) => <Slot key={g.id} src={gadgetIcon(g.id)} on={ownedG.has(g.id)} title={g.name} />)}
          </Row>
        )}
        {!!allSP.length && (
          <Row label="Star Powers">
            {allSP.map((s) => <Slot key={s.id} src={starPowerIcon(s.id)} on={ownedSP.has(s.id)} title={s.name} />)}
          </Row>
        )}
        {!!(b.gears || []).length && (
          <Row label="Gears">
            {b.gears.map((g) => <Slot key={g.id} src={gearIcon(g.id)} on title={g.name} />)}
          </Row>
        )}

        <div style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 12 }}>
          {stats ? (
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted" style={{ fontSize: 13 }}>Recent (last 25)</span>
              <span style={{ fontWeight: 700 }}>
                <span style={{ color: "var(--win)" }}>{stats.w}W</span>{" "}
                <span style={{ color: "var(--loss)" }}>{stats.l}L</span>{" · "}
                <span className={stats.winRate >= 50 ? "" : ""} style={{ color: stats.winRate >= 50 ? "var(--win)" : "var(--loss)" }}>{stats.winRate}%</span>
              </span>
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 13 }}>No recent battles on this brawler.</div>
          )}
          <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
            <span className="muted" style={{ fontSize: 13 }}>Last played</span>
            <span style={{ fontSize: 13 }}>{lastPlayed ? timeAgo(lastPlayed) : "—"}</span>
          </div>
          <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
            <span className="muted" style={{ fontSize: 13 }}>Highest</span>
            <span className="trophy" style={{ fontSize: 13 }}>🏆 {compact(b.highestTrophies)}</span>
          </div>
        </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}
function Slot({ src, on, title }) {
  return (
    <div title={title} style={{
      width: 38, height: 38, borderRadius: 10, background: "var(--panel-2)",
      border: "1px solid var(--line)", display: "grid", placeItems: "center",
      filter: on ? "none" : "grayscale(1) brightness(.4)", transition: "filter .15s",
    }}>
      <SafeImg src={src} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
    </div>
  );
}

/* ── Battles ─────────────────────────────────────────────── */
function BattlesTab({ items, playerTag }) {
  const [filter, setFilter] = useState("all");
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
        The official API keeps only the last ~25 battles. Older history fills in over time (History tab).
      </div>
      {list.map((it, i) => (
        <div key={i} style={{ marginBottom: 8 }}><BattleRow it={it} playerTag={playerTag} /></div>
      ))}
      {!list.length && <div className="empty">No battles in this range.</div>}
    </div>
  );
}

function BattleRow({ it, playerTag }) {
  const id = `${playerTag}:${it.raw.battleTime}`;
  const [saved, setSaved] = useState(false);
  useEffect(() => { setSaved(isMatchSaved(id)); }, [id]);
  const change = it.trophyChange;
  return (
    <div className={`battle ${it.result || "draw"}`}>
      <SafeImg className="mode-ic" src={modeIcon(it.raw.event?.id || 0)} fallback={mapIcon(it.mapId)} alt="" />
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
        <span className={`change ${change > 0 ? "up" : change < 0 ? "down" : ""}`}>{change > 0 ? "+" : ""}{change}</span>
      )}
      <button className={`save-dot ${saved ? "on" : ""}`} title={saved ? "Saved" : "Save match"}
        onClick={() => {
          const now = toggleMatch({ id, tag: playerTag, mode: it.mode, map: it.map?.name, result: it.result, when: it.when, brawler: it.brawler?.name });
          setSaved(now);
        }}>
        {saved ? "★" : "☆"}
      </button>
    </div>
  );
}

/* ── Ranked ──────────────────────────────────────────────── */
function RankedTab({ a, playerTag }) {
  if (!a.ranked.length) return <div className="empty rise rise-3">No ranked battles in the recent log.</div>;
  const brawlers = {};
  for (const it of a.ranked) if (it.brawler) {
    const b = (brawlers[it.brawler.id] ||= { id: it.brawler.id, name: it.brawler.name, w: 0, l: 0 });
    if (it.result === "victory") b.w++; else if (it.result === "defeat") b.l++;
  }
  const w = a.ranked.filter((i) => i.result === "victory").length;
  const l = a.ranked.filter((i) => i.result === "defeat").length;
  const wr = w + l ? Math.round((w / (w + l)) * 100) : 0;
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
      {a.ranked.map((it, i) => <div key={i} style={{ marginBottom: 8 }}><BattleRow it={it} playerTag={playerTag} /></div>)}
    </div>
  );
}

/* ── History (Supabase) ──────────────────────────────────── */
function HistoryTab({ tag, available }) {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true;
    fetch(`/api/history/${tag}`).then((r) => r.json()).then((x) => on && setD(x)).catch(() => on && setD({ error: true })).finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [tag]);

  if (!available) return <div className="notice rise rise-3">History panels are powered by the optional Supabase layer. Add Supabase keys + the hourly cron (README); they fill in over the following days.</div>;
  if (loading) return <div className="empty rise rise-3">Loading history…</div>;
  if (!d || d.error) return <div className="notice rise rise-3">Couldn't load history.</div>;

  const s = d.summary || {};
  const hasData = (d.points || []).length > 0 || s.battlesTracked > 0;
  if (!hasData) return <div className="notice rise rise-3">No snapshots recorded yet for #{tag}. Once the cron runs a few times, these panels appear and grow over time.</div>;

  const twoWeek = (d.points || []).filter((p) => Date.now() - p.t < 15 * 864e5);

  return (
    <div className="rise rise-3">
      {s.battlesTracked > 0 && (
        <>
          <div className="eyebrow" style={{ margin: "0 4px 8px" }}>Battle history summary</div>
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            <Stat v={s.battlesTracked} k="Battles" />
            <Stat v={s.wins} k="Wins" cls="win" />
            <Stat v={s.losses} k="Losses" cls="loss" />
            <Stat v={`${s.winRate}%`} k="Win rate" cls={s.winRate >= 50 ? "win" : "loss"} />
            <Stat v={`${s.netTrophies >= 0 ? "+" : ""}${s.netTrophies}`} k="Net trophies" cls={s.netTrophies >= 0 ? "win" : "loss"} />
            <Stat v={s.daysTracked} k="Days tracked" />
          </div>
          {s.from && <div className="muted" style={{ textAlign: "center", fontSize: 12, marginTop: 8 }}>{s.from} → {s.to}</div>}
        </>
      )}

      {twoWeek.length > 1 && (
        <>
          <div className="section-title">2-week trend</div>
          <div className="panel"><TrophyChart points={twoWeek} height={120} /></div>
        </>
      )}

      {(d.activity || []).length > 0 && <ActivityCalendar activity={d.activity} />}

      {(d.points || []).length > 1 && (
        <>
          <div className="section-title">Trophy progression</div>
          <div className="panel"><TrophyChart points={d.points} /></div>
        </>
      )}

      {(d.mostPlayed || []).length > 0 && (
        <>
          <div className="section-title">Most played brawlers</div>
          <div className="bgrid">
            {d.mostPlayed.map((b, i) => (
              <div className="brawler" key={b.id} title={`${b.name} · ${b.games} games`} style={{ overflow: "visible" }}>
                <SafeImg className="port" src={brawlerIcon(b.id)} alt={b.name} />
                {i === 0 && <span className="pw" style={{ background: "var(--yellow)", color: "#1a1205" }}>#1</span>}
                <span className="tr" style={{ color: b.winRate >= 50 ? "var(--win)" : "var(--loss)" }}>{b.winRate}%</span>
              </div>
            ))}
          </div>
        </>
      )}

      {(d.daily || []).length > 0 && (
        <>
          <div className="section-title">Daily trophy push</div>
          <div className="panel">
            {d.daily.map((x) => (
              <div className="bar-row" key={x.day} style={{ gridTemplateColumns: "120px 1fr 64px" }}>
                <span style={{ fontWeight: 600 }}>{x.day}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.min(100, Math.abs(x.delta) / (d.maxDelta || 1) * 100)}%`, background: x.delta >= 0 ? "linear-gradient(90deg,#1d9b57,#2fd87a)" : "linear-gradient(90deg,#b5293a,#ff4d5e)" }} />
                </div>
                <span style={{ textAlign: "right", fontWeight: 700, color: x.delta >= 0 ? "var(--win)" : "var(--loss)" }}>{x.delta >= 0 ? "+" : ""}{x.delta}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ActivityCalendar({ activity }) {
  const map = {};
  for (const a of activity) map[a.date] = a.count;
  const days = [];
  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const dt = new Date(today); dt.setDate(today.getDate() - i);
    const key = dt.toISOString().slice(0, 10);
    days.push({ key, count: map[key] || 0, d: dt });
  }
  const max = Math.max(1, ...days.map((x) => x.count));
  const color = (c) => {
    if (!c) return "var(--panel-2)";
    const r = c / max;
    if (r > 0.66) return "#2fd87a";
    if (r > 0.33) return "#b9e04a";
    return "#7a8b3a";
  };
  return (
    <>
      <div className="section-title">Activity · 28 days</div>
      <div className="panel">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
          {days.map((x) => (
            <div key={x.key} title={`${x.key}: ${x.count} battles`} style={{ aspectRatio: "1", borderRadius: 7, background: color(x.count), display: "grid", placeItems: "center", fontSize: 11, color: x.count ? "#0e0f13" : "var(--muted-2)", fontWeight: 600 }}>
              {x.d.getDate()}
            </div>
          ))}
        </div>
        <div className="row" style={{ gap: 6, marginTop: 10, fontSize: 11 }}>
          <span className="muted">Less</span>
          {["var(--panel-2)", "#7a8b3a", "#b9e04a", "#2fd87a"].map((c) => (
            <span key={c} style={{ width: 14, height: 14, borderRadius: 4, background: c }} />
          ))}
          <span className="muted">More</span>
        </div>
      </div>
    </>
  );
}
