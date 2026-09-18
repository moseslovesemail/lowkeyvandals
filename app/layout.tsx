import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOWKEYVANDALS",
  description: "A quiet index of photographers worth knowing."
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
