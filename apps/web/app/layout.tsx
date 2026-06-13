import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeON",
  description: "Trade Smarter. Move Faster.",
  icons: {
    icon: "/tradeon-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
