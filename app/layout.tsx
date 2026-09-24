import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skill Fusion — Smart Tech Worth Buying",
  description: "Discover smart technology, gadgets, smartphones and accessories ranked by Skill Fusion."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
