export default function manifest() {
  return {
    name: "RK/stats — Brawl Stars Tracker",
    short_name: "RK/stats",
    description: "Brawl Stars player stats, battle log and trophy history.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0f13",
    theme_color: "#0e0f13",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
