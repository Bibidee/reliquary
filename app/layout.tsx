import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { WalletProvider } from "@/lib/wallet";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Reliquary — Decentralized Evidence Vault",
  description: "Preserve proof. Classify uncertainty. A decentralized evidence vault powered by GenLayer validators.",
  keywords: ["evidence", "proof", "decentralized", "GenLayer", "archive", "classification"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${ibmPlexMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased" style={{ background: "#0B0B0A", color: "#E8DDC5" }}>
        <WalletProvider>
          <Nav />
          <main className="flex-1">
            {children}
          </main>
        </WalletProvider>
        <footer className="border-t border-[rgba(232,221,197,0.08)] py-6 px-6 text-center text-xs text-[#898176]" style={{ fontFamily: "var(--font-inter)" }}>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
            <span style={{ fontFamily: "var(--font-cormorant)" }} className="text-sm text-[#C88A2D]">
              Reliquary
            </span>
            <span>Preserve the proof. Preserve the uncertainty.</span>
            <span>Powered by GenLayer</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
