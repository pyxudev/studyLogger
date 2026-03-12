import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    if (!name) return NextResponse.json({ active: false });

    const records = await readDB();
    const active = records.find((r) => r.name === name.trim() && !r.endTime);
    return NextResponse.json({ active: !!active, record: active || null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ active: false });
  }
}
