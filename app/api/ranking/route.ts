import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";

export async function GET() {
  try {
    const records = await readDB();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Filter completed records for current month
    const monthlyRecords = records.filter((r) => {
      if (!r.endTime || !r.durationMinutes) return false;
      const d = new Date(r.startTime);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    // Aggregate by name
    const totals: Record<string, number> = {};
    for (const r of monthlyRecords) {
      totals[r.name] = (totals[r.name] || 0) + (r.durationMinutes || 0);
    }

    const ranking = Object.entries(totals)
      .map(([name, totalMinutes]) => ({ name, totalMinutes }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);

    return NextResponse.json({ ranking, month: `${currentYear}年${currentMonth + 1}月` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
