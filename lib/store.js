"use client";
// Tiny localStorage store for saved profiles and pinned matches.
// No backend needed for these — they live in the user's browser.

const PROFILES = "rkstats:profiles";
const MATCHES = "rkstats:matches";

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function write(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export function getProfiles() {
  return read(PROFILES);
}
export function saveProfile(p) {
  const list = read(PROFILES).filter((x) => x.tag !== p.tag);
  list.unshift({ tag: p.tag, name: p.name, icon: p.icon, color: p.color });
  write(PROFILES, list.slice(0, 30));
}
export function removeProfile(tag) {
  write(PROFILES, read(PROFILES).filter((x) => x.tag !== tag));
}

export function getMatches() {
  return read(MATCHES);
}
export function isMatchSaved(id) {
  return read(MATCHES).some((m) => m.id === id);
}
export function toggleMatch(match) {
  const list = read(MATCHES);
  const exists = list.some((m) => m.id === match.id);
  const next = exists
    ? list.filter((m) => m.id !== match.id)
    : [match, ...list].slice(0, 100);
  write(MATCHES, next);
  return !exists;
}
