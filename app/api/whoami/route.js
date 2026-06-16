import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Temporary helper: shows the outbound IP Vercel uses, so you can
// whitelist it on your Brawl Stars key for a direct (no-proxy) test.
export async function GET() {
  try {
    const data = await fetch("https://api.ipify.org?format=json", {
      cache: "no-store",
    }).then((r) => r.json());
    return NextResponse.json({ vercelOutboundIp: data.ip });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
