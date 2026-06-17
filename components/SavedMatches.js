"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getMatches, toggleMatch } from "@/lib/store";

export default function SavedMatches() {
  const [list, setList] = useState([]);
  useEffect(() => setList(getMatches()), []);
  if (!list.length)
    return <div className="empty">No saved matches yet. Tap ☆ on any battle to save it.</div>;

  const remove = (m) => { toggleMatch(m); setList(getMatches()); };

  return (
    <div>
      {list.map((m) => (
        <div className={`battle ${m.result || "draw"}`} key={m.id} style={{ marginBottom: 8 }}>
          <div className="meta">
            <div className="t">{m.mode || "Battle"}</div>
            <div className="s">
              {m.map && <span>{m.map}</span>}
              {m.brawler && <span>· {m.brawler}</span>}
              {m.result && <span style={{ textTransform: "capitalize" }}>· {m.result}</span>}
            </div>
          </div>
          <Link href={`/player/${m.tag}`} className="pill" style={{ marginRight: 6 }}>#{m.tag}</Link>
          <button className="save-dot on" title="Remove" onClick={() => remove(m)}>★</button>
        </div>
      ))}
    </div>
  );
}
