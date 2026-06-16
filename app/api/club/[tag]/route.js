import { NextResponse } from "next/server";
import { getClub, ApiError } from "@/lib/bs";
import { cleanTag } from "@/lib/assets";

export async function GET(_req, { params }) {
  const { tag } = await params;
  try {
    const data = await getClub(cleanTag(tag));
    return NextResponse.json(data);
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}
