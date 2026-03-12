import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";

export async function GET() {
  try {
    const records = await readDB();
    // Return completed records sorted by startTime desc
    const completed = records
      .filter((r) => r.endTime)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    return NextResponse.json({ records: completed });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
