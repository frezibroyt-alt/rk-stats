import TopBar from "@/components/TopBar";
import PlayerView from "@/components/PlayerView";
import { getPlayer, getBattleLog, ApiError } from "@/lib/bs";
import { historyEnabled } from "@/lib/supabase";
import { cleanTag } from "@/lib/assets";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }) {
  const { tag: rawTag } = await params;
  const tag = cleanTag(rawTag);

  let player, battlelog;
  try {
    [player, battlelog] = await Promise.all([
      getPlayer(tag),
      getBattleLog(tag).catch(() => ({ items: [] })),
    ]);
  } catch (e) {
    // diagnostics (server-side env, token masked)
    const base = process.env.BRAWL_API_BASE || "(unset -> default proxy)";
    const tok = process.env.BRAWL_API_TOKEN || "";
    const tokInfo = tok
      ? `set, length ${tok.length}, ends "...${tok.slice(-4)}"`
      : "MISSING";
    const usingProxy = base.includes("proxy.royaleapi.dev");

    return (
      <>
        <TopBar back />
        <main className="shell">
          <div className="panel rise" style={{ marginTop: 16 }}>
            <div className="display" style={{ fontSize: 22, marginBottom: 6 }}>
              {e instanceof ApiError && e.status === 404 ? "Player not found" : "Something went wrong"}
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {e instanceof ApiError && e.status === 404
                ? `No player with tag #${tag}. Check the tag and try again.`
                : e instanceof ApiError && e.status === 403
                ? "API key rejected. Check BRAWL_API_TOKEN and that the proxy IP is whitelisted (see README)."
                : "Couldn't reach the Brawl Stars API. Try again in a moment."}
            </p>
            <pre
              style={{
                marginTop: 14,
                padding: "12px 14px",
                background: "var(--bg-2)",
                border: "1px dashed var(--line)",
                borderRadius: 12,
                color: "var(--orange)",
                fontSize: 12,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              status: {String(e?.status ?? "?")}
              {"\n"}message: {String(e?.message || "(none)")}
              {"\n"}base: {base}
              {"\n"}usingProxy: {usingProxy ? "YES" : "NO  <- problema tut"}
              {"\n"}token: {tokInfo}
            </pre>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar back />
      <main className="shell">
        <PlayerView
          player={player}
          battlelog={battlelog}
          tag={tag}
          historyAvailable={historyEnabled()}
        />
      </main>
    </>
  );
}
