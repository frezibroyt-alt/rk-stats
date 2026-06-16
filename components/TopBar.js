import Link from "next/link";

export default function TopBar({ back = false }) {
  return (
    <div className="topbar">
      {back && (
        <Link href="/" className="btn ghost" style={{ padding: "8px 12px", boxShadow: "0 3px 0 #0c0d11" }} aria-label="Home">
          ←
        </Link>
      )}
      <Link href="/" className="brand">
        RK<span className="slash">/</span>stats
      </Link>
    </div>
  );
}
