import { put, list } from "@vercel/blob";

export interface StudyRecord {
  id: string;
  name: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  durationMinutes?: number;
}

const DB_BLOB_KEY = "study-tracker/db.json";

export async function readDB(): Promise<StudyRecord[]> {
  try {
    const { blobs } = await list({ prefix: "study-tracker/db" });
    if (blobs.length === 0) return [];

    const blob = blobs.find((b) => b.pathname === DB_BLOB_KEY);
    if (!blob) return [];

    const res = await fetch(blob.url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function writeDB(records: StudyRecord[]): Promise<void> {
  await put(DB_BLOB_KEY, JSON.stringify(records), {
    access: "public",
    addRandomSuffix: false
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
