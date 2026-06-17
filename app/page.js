import TopBar from "@/components/TopBar";
import SearchBar from "@/components/SearchBar";
import SavedProfiles from "@/components/SavedProfiles";
import SavedMatches from "@/components/SavedMatches";

export default function Home() {
  return (
    <>
      <TopBar />
      <main className="shell">
        <div className="rise" style={{ padding: "24px 4px 18px" }}>
          <div className="display" style={{ fontSize: 34, lineHeight: 1.05 }}>
            Track any<br />Brawl Stars player
          </div>
          <p className="muted" style={{ marginTop: 8, maxWidth: 440 }}>
            Profile, brawlers, battle log, win rate, ranked and trophy history — by tag.
          </p>
        </div>

        <div className="rise rise-2"><SearchBar autoFocus /></div>

        <div className="section-title">Saved players</div>
        <div className="rise rise-3"><SavedProfiles /></div>

        <div className="section-title">Saved matches</div>
        <div className="rise rise-3"><SavedMatches /></div>

        <div className="spacer-16" />
        <p className="muted" style={{ fontSize: 12, textAlign: "center" }}>
          Not affiliated with Supercell. Data from the official Brawl Stars API.
        </p>
      </main>
    </>
  );
}
