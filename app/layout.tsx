import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snjókallinn | Ljósmyndari í Reykjavík",
  description: "Portrett, headshots og myndir fyrir vörumerki með Alex Snæ, Snjókallinum.",
  icons: {
    icon: "/gold-model-icon-32.png",
    shortcut: "/gold-model-icon.ico",
    apple: "/gold-model-icon-180.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="is">
      <body className="antialiased">{children}</body>
    </html>
  );
}
