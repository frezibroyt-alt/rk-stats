import Link from "next/link";
import TopBar from "@/components/TopBar";
import SafeImg from "@/components/SafeImg";
import { getClub, ApiError } from "@/lib/bs";
import { clubIcon, profileIcon, compact, nameColorToHex, cleanTag } from "@/lib/assets";

export const dynamic = "force-dynamic";

export default async function ClubPage({ params }) {
  const { tag: rawTag } = await params;
  const tag = cleanTag(rawTag);
  let club;
  try {
    club = await getClub(tag);
  } catch (e) {
    return (
      <>
        <TopBar back />
        <main className="shell">
          <div className="panel rise" style={{ marginTop: 16 }}>
            <div className="display" style={{ fontSize: 22 }}>
              {e instanceof ApiError && e.status === 404 ? "Club not found" : "Something went wrong"}
            </div>
            <p className="muted">No club with tag #{tag}.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar back />
      <main className="shell">
        <div className="panel rise" style={{ marginTop: 4 }}>
          <div className="phead">
            <SafeImg className="avatar" src={clubIcon(club.badgeId)} alt="" />
            <div>
              <h1>{club.name}</h1>
              <div className="trophy display" style={{ fontSize: 20, marginTop: 6 }}>🏆 {compact(club.trophies)}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                #{tag} · {club.members?.length || 0} members · {club.type}
              </div>
            </div>
          </div>
          {club.description && <p className="muted" style={{ marginTop: 12 }}>{club.description}</p>}
        </div>

        <div className="section-title">Members</div>
        <div className="rise rise-2">
          {(club.members || []).map((m) => (
            <Link href={`/player/${(m.tag || "").replace("#", "")}`} key={m.tag} className="battle" style={{ borderLeftWidth: 1, marginBottom: 8 }}>
              <SafeImg className="mode-ic" src={profileIcon(m.icon?.id)} alt="" style={{ width: 40, height: 40, borderRadius: 10 }} />
              <div className="meta">
                <div className="t" style={{ color: nameColorToHex(m.nameColor) }}>{m.name}</div>
                <div className="s">{m.role?.replace("vicePresident", "VP")}</div>
              </div>
              <span className="trophy">🏆 {compact(m.trophies)}</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
