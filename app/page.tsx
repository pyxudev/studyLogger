"use client";

import { useState, useEffect, useCallback } from "react";

interface StudyRecord {
  id: string;
  name: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
}

interface RankingEntry {
  name: string;
  totalMinutes: number;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}時間${m}分` : `${h}時間`;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Home() {
  const [name, setName] = useState("");
  const [isStudying, setIsStudying] = useState(false);
  const [studyStart, setStudyStart] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [rankingMonth, setRankingMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchRecords = useCallback(async () => {
    const res = await fetch("/api/records");
    const data = await res.json();
    if (data.records) setRecords(data.records);
  }, []);

  const fetchRanking = useCallback(async () => {
    const res = await fetch("/api/ranking");
    const data = await res.json();
    if (data.ranking) {
      setRanking(data.ranking);
      setRankingMonth(data.month);
    }
  }, []);

  const checkStatus = useCallback(async (n: string) => {
    if (!n.trim()) return;
    const res = await fetch(`/api/status?name=${encodeURIComponent(n.trim())}`);
    const data = await res.json();
    if (data.active && data.record) {
      setIsStudying(true);
      setStudyStart(new Date(data.record.startTime));
    } else {
      setIsStudying(false);
      setStudyStart(null);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchRanking();
  }, [fetchRecords, fetchRanking]);

  useEffect(() => {
    if (!isStudying || !studyStart) { setElapsed(0); return; }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - studyStart.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isStudying, studyStart]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setName(v);
    if (v.trim()) checkStatus(v);
    else { setIsStudying(false); setStudyStart(null); }
  };

  const handleStart = async () => {
    if (!name.trim()) { showMessage("名前を入力してください", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { showMessage(data.error || "エラーが発生しました", "error"); return; }
      setIsStudying(true);
      setStudyStart(new Date(data.record.startTime));
      showMessage(`${name.trim()}さん、勉強開始！頑張って！`, "success");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!name.trim()) { showMessage("名前を入力してください", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { showMessage(data.error || "エラーが発生しました", "error"); return; }
      setIsStudying(false);
      setStudyStart(null);
      setElapsed(0);
      showMessage(`お疲れ様！${formatDuration(data.record.durationMinutes)}勉強しました 🎉`, "success");
      await fetchRecords();
      await fetchRanking();
    } finally {
      setLoading(false);
    }
  };

  const elapsedStr = (() => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  })();

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-inner">
          <span className="header-icon">📚</span>
          <h1 className="header-title">StudyLogger</h1>
          <span className="header-sub">学習時間を可視化</span>
        </div>
      </header>

      <main className="main-content">
        {/* Input + Buttons card */}
        <section className="card punch-card">
          <div className="name-row">
            <label className="name-label" htmlFor="name-input">あなたの名前</label>
            <input
              id="name-input"
              className="name-input"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="例：田中太郎"
              maxLength={30}
              autoComplete="off"
            />
          </div>

          {isStudying && (
            <div className="studying-badge">
              <span className="pulse-dot" />
              勉強中… {elapsedStr}
            </div>
          )}

          {message && (
            <div className={`message-bar ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="btn-row">
            <button
              className="btn btn-start"
              onClick={handleStart}
              disabled={loading || isStudying}
            >
              {loading && !isStudying ? "⏳" : "▶"} 勉強開始
            </button>
            <button
              className="btn btn-complete"
              onClick={handleComplete}
              disabled={loading || !isStudying}
            >
              {loading && isStudying ? "⏳" : "✓"} 勉強完了
            </button>
          </div>
        </section>

        {/* Records table */}
        <section className="card records-card">
          <h2 className="section-title">📋 勉強記録</h2>
          {records.length === 0 ? (
            <p className="empty-text">まだ記録がありません</p>
          ) : (
            <div className="table-wrap">
              <table className="records-table">
                <thead>
                  <tr>
                    <th>名前</th>
                    <th>開始時刻</th>
                    <th>終了時刻</th>
                    <th>勉強時間</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td className="td-name">{r.name}</td>
                      <td className="td-time">{formatTime(r.startTime)}</td>
                      <td className="td-time">{r.endTime ? formatTime(r.endTime) : "—"}</td>
                      <td className="td-duration">
                        {r.durationMinutes != null ? formatDuration(r.durationMinutes) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Ranking */}
        <section className="card ranking-card">
          <h2 className="section-title">🏆 {rankingMonth} 月間ランキング</h2>
          {ranking.length === 0 ? (
            <p className="empty-text">今月の記録はまだありません</p>
          ) : (
            <ol className="ranking-list">
              {ranking.map((entry, i) => (
                <li key={entry.name} className={`ranking-item rank-${i + 1}`}>
                  <span className="rank-medal">{MEDALS[i] || `${i + 1}`}</span>
                  <span className="rank-name">{entry.name}</span>
                  <span className="rank-time">{formatDuration(entry.totalMinutes)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0f1117;
          --surface: #1a1d27;
          --surface2: #22263a;
          --border: #2e3249;
          --accent: #6c63ff;
          --accent2: #ff6584;
          --green: #43e97b;
          --text: #e8eaf0;
          --text-muted: #7b82a6;
          --radius: 16px;
        }

        html, body { height: 100%; }
        body {
          font-family: 'Noto Sans JP', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          background-image: radial-gradient(ellipse at 20% 20%, rgba(108,99,255,0.12) 0%, transparent 60%),
                            radial-gradient(ellipse at 80% 80%, rgba(255,101,132,0.08) 0%, transparent 60%);
        }

        .app-root { min-height: 100vh; display: flex; flex-direction: column; }

        .app-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          background: rgba(26,29,39,0.8);
          backdrop-filter: blur(12px);
          position: sticky; top: 0; z-index: 10;
        }
        .header-inner { max-width: 720px; margin: 0 auto; display: flex; align-items: center; gap: 12px; }
        .header-icon { font-size: 28px; }
        .header-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 24px; font-weight: 700;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .header-sub { color: var(--text-muted); font-size: 13px; margin-left: auto; }

        .main-content {
          max-width: 720px; margin: 0 auto; padding: 32px 20px 60px;
          width: 100%; display: flex; flex-direction: column; gap: 24px;
        }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 28px;
        }

        /* Punch card */
        .punch-card { display: flex; flex-direction: column; gap: 16px; }

        .name-row { display: flex; flex-direction: column; gap: 8px; }
        .name-label { font-size: 13px; color: var(--text-muted); font-weight: 500; letter-spacing: 0.04em; }
        .name-input {
          background: var(--surface2);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          padding: 14px 16px;
          color: var(--text);
          font-size: 16px;
          font-family: 'Noto Sans JP', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none; width: 100%;
        }
        .name-input::placeholder { color: var(--text-muted); }
        .name-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(108,99,255,0.18);
        }

        .studying-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(67,233,123,0.1);
          border: 1px solid rgba(67,233,123,0.3);
          color: var(--green);
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 14px; font-weight: 500;
          font-variant-numeric: tabular-nums;
        }
        .pulse-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--green);
          animation: pulse 1.4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .message-bar {
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 14px;
          animation: fadeIn 0.3s ease;
        }
        .message-bar.success {
          background: rgba(67,233,123,0.12);
          border: 1px solid rgba(67,233,123,0.3);
          color: var(--green);
        }
        .message-bar.error {
          background: rgba(255,101,132,0.12);
          border: 1px solid rgba(255,101,132,0.3);
          color: var(--accent2);
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

        .btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 16px;
          border-radius: 12px;
          border: none; cursor: pointer;
          font-size: 15px; font-weight: 700;
          font-family: 'Noto Sans JP', sans-serif;
          transition: transform 0.12s, box-shadow 0.12s, opacity 0.2s;
          letter-spacing: 0.02em;
        }
        .btn:active:not(:disabled) { transform: scale(0.97); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-start {
          background: linear-gradient(135deg, #6c63ff, #a78bfa);
          color: #fff;
          box-shadow: 0 4px 20px rgba(108,99,255,0.35);
        }
        .btn-start:hover:not(:disabled) { box-shadow: 0 6px 28px rgba(108,99,255,0.5); transform: translateY(-1px); }
        .btn-complete {
          background: linear-gradient(135deg, #43e97b, #38f9d7);
          color: #0f1117;
          box-shadow: 0 4px 20px rgba(67,233,123,0.3);
        }
        .btn-complete:hover:not(:disabled) { box-shadow: 0 6px 28px rgba(67,233,123,0.45); transform: translateY(-1px); }

        /* Section title */
        .section-title {
          font-size: 16px; font-weight: 700;
          margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }
        .empty-text { color: var(--text-muted); font-size: 14px; text-align: center; padding: 20px 0; }

        /* Table */
        .records-card {}
        .table-wrap { overflow-x: auto; }
        .records-table {
          width: 100%; border-collapse: collapse; font-size: 14px;
        }
        .records-table th {
          text-align: left;
          padding: 10px 12px;
          color: var(--text-muted);
          font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
          border-bottom: 1px solid var(--border);
        }
        .records-table td {
          padding: 13px 12px;
          border-bottom: 1px solid rgba(46,50,73,0.5);
        }
        .records-table tr:last-child td { border-bottom: none; }
        .records-table tr:hover td { background: rgba(108,99,255,0.04); }
        .td-name { font-weight: 500; }
        .td-time { color: var(--text-muted); font-variant-numeric: tabular-nums; font-size: 13px; }
        .td-duration {
          font-weight: 700; color: var(--accent);
          font-variant-numeric: tabular-nums;
        }

        /* Ranking */
        .ranking-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .ranking-item {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px;
          border-radius: 12px;
          background: var(--surface2);
          border: 1px solid var(--border);
          transition: transform 0.1s;
        }
        .ranking-item:hover { transform: translateX(3px); }
        .rank-1 { border-color: rgba(255,215,0,0.4); background: rgba(255,215,0,0.05); }
        .rank-2 { border-color: rgba(192,192,192,0.4); background: rgba(192,192,192,0.04); }
        .rank-3 { border-color: rgba(205,127,50,0.4); background: rgba(205,127,50,0.04); }
        .rank-medal { font-size: 22px; flex-shrink: 0; width: 28px; text-align: center; }
        .rank-name { flex: 1; font-weight: 600; font-size: 15px; }
        .rank-time {
          font-weight: 700; font-size: 16px;
          font-variant-numeric: tabular-nums;
          color: var(--accent);
        }
        .rank-1 .rank-time { color: #ffd700; }

        @media (max-width: 480px) {
          .main-content { padding: 20px 14px 48px; }
          .card { padding: 20px; }
          .btn-row { grid-template-columns: 1fr 1fr; }
          .btn { padding: 14px 10px; font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
