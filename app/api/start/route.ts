import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, generateId } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "名前を入力してください" }, { status: 400 });
    }

    const records = await readDB();

    // Check if there's already an active session for this name
    const active = records.find((r) => r.name === name.trim() && !r.endTime);
    if (active) {
      return NextResponse.json(
        { error: "すでに勉強中です。先に完了してください。" },
        { status: 400 }
      );
    }

    const newRecord = {
      id: generateId(),
      name: name.trim(),
      startTime: new Date().toISOString(),
    };

    records.push(newRecord);
    await writeDB(records);

    return NextResponse.json({ success: true, record: newRecord });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
