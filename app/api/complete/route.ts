import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "名前を入力してください" }, { status: 400 });
    }

    const records = await readDB();
    const idx = records.findIndex((r) => r.name === name.trim() && !r.endTime);

    if (idx === -1) {
      return NextResponse.json(
        { error: "勉強中のセッションが見つかりません。先に開始してください。" },
        { status: 400 }
      );
    }

    const endTime = new Date();
    const startTime = new Date(records[idx].startTime);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    records[idx] = {
      ...records[idx],
      endTime: endTime.toISOString(),
      durationMinutes,
    };

    await writeDB(records);

    return NextResponse.json({ success: true, record: records[idx] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
