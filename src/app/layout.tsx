import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "中式梦核记录器 · dreamrecorder",
  description: "根据你的记忆关键词，生成独一无二的中式梦核影像",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="relative min-h-screen antialiased">{children}</body>
    </html>
  );
}
