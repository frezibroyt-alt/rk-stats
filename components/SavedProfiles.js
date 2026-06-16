"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import SafeImg from "./SafeImg";
import { getProfiles, removeProfile } from "@/lib/store";
import { profileIcon as iconUrl } from "@/lib/assets";

export default function SavedProfiles() {
  const [list, setList] = useState([]);
  useEffect(() => setList(getProfiles()), []);
  if (!list.length)
    return <div className="empty">No saved players yet. Search a tag to get started.</div>;
  return (
    <div>
      {list.map((p) => (
        <div className="battle" key={p.tag} style={{ borderLeftWidth: 1, marginBottom: 8 }}>
          <SafeImg className="mode-ic" src={iconUrl(p.icon)} alt="" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <Link href={`/player/${p.tag}`} className="meta">
            <div className="t" style={{ color: p.color || "#fff" }}>{p.name}</div>
            <div className="s">#{p.tag}</div>
          </Link>
          <button
            className="save-dot"
            title="Remove"
            onClick={() => { removeProfile(p.tag); setList(getProfiles()); }}
          >✕</button>
        </div>
      ))}
    </div>
  );
}
