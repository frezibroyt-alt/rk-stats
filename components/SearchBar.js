"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cleanTag } from "@/lib/assets";

export default function SearchBar({ kind = "player", autoFocus = false }) {
  const router = useRouter();
  const [val, setVal] = useState("");
  const [mode, setMode] = useState(kind);

  function go(e) {
    e.preventDefault();
    const tag = cleanTag(val);
    if (tag.length < 3) return;
    router.push(`/${mode}/${tag}`);
  }

  return (
    <form className="search" onSubmit={go}>
      <span className="muted" aria-hidden>#</span>
      <input
        autoFocus={autoFocus}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={mode === "player" ? "Player tag (e.g. 8PGPUQQG0)" : "Club tag"}
        aria-label="Search by tag"
        spellCheck={false}
        autoCapitalize="characters"
      />
      <button
        type="button"
        className="btn ghost"
        style={{ padding: "9px 12px", fontSize: 13 }}
        onClick={() => setMode((m) => (m === "player" ? "club" : "player"))}
        title="Switch player / club"
      >
        {mode === "player" ? "Player" : "Club"}
      </button>
      <button className="btn" type="submit">Search</button>
    </form>
  );
}
