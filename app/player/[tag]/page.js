import TopBar from "@/components/TopBar";
import PlayerView from "@/components/PlayerView";
import { getPlayer, getBattleLog, ApiError } from "@/lib/bs";
import { historyEnabled } from "@/lib/supabase";
import { cleanTag } from "@/lib/assets";

export const dynamic = "force-dynamic";

// Static brawler catalog from Brawlify (rarity, star powers, gadgets per brawler).
// Cached for a day; used to show locked/unlocked slots on the brawler card.
async function getCatalog() {
  try {
    const data = await fetch("https://api.brawlify.com/v1/brawlers", {
      next: { revalidate: 86400 },
    }).then((r) => r.json());
    const map = {};
    for (const b of data.list || data.items || []) {
      map[b.id] = {
        name: b.name,
        rarity: b.rarity?.name || null,
        rarityColor: b.rarity?.color || null,
        starPowers: (b.starPowers || []).map((s) => ({ id: s.id, name: s.name })),
        gadgets: (b.gadgets || []).map((g) => ({ id: g.id, name: g.name })),
      };
    }
    return map;
  } catch {
    return {};
  }
}

export default async function PlayerPage({ params }) {
  const { tag: rawTag } = await params;
  const tag = cleanTag(rawTag);

  let player, battlelog, catalog;
  try {
    [player, battlelog, catalog] = await Promise.all([
      getPlayer(tag),
      getBattleLog(tag).catch(() => ({ items: [] })),
      getCatalog(),
    ]);
  } catch (e) {
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
                : "Couldn't reach the Brawl Stars API. Try again in a moment."}
            </p>
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
          catalog={catalog}
          tag={tag}
          historyAvailable={historyEnabled()}
        />
      </main>
    </>
  );
}
