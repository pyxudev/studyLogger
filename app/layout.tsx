import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StudyLog - 勉強打刻アプリ",
  description: "勉強の開始・終了を記録して、学習時間を管理しよう",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
