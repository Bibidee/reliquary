"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@/lib/wallet";

const navLinks = [
  { href: "/archive", label: "Archive" },
  { href: "/gallery", label: "Gallery" },
  { href: "/deposit", label: "Deposit" },
  { href: "/my-deposits", label: "My Deposits" },
  { href: "/about", label: "About" },
];

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { address, connecting, connect, disconnect } = useWallet();

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: "rgba(11,11,10,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(232,221,197,0.06)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 flex items-center justify-center"
            style={{ border: "1.5px solid rgba(200,138,45,0.5)" }}
          >
            <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "14px", color: "#C88A2D" }}>R</span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "17px",
              color: "#E8DDC5",
              letterSpacing: "0.06em",
            }}
          >
            Reliquary
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: pathname === link.href ? "#C88A2D" : "#898176",
                transition: "color 0.15s",
              }}
              className="hover:text-[#C88A2D]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Wallet button */}
        <div className="hidden md:flex items-center gap-3">
          {address ? (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5"
                style={{
                  border: "1px solid rgba(200,138,45,0.25)",
                  background: "rgba(200,138,45,0.06)",
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4F6F64" }} />
                <span
                  style={{
                    fontFamily: "var(--font-ibm-mono)",
                    fontSize: "11px",
                    color: "#C88A2D",
                  }}
                >
                  {truncateAddress(address)}
                </span>
              </div>
              <button
                onClick={disconnect}
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#898176",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
                className="hover:text-[#E8DDC5]"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#C88A2D",
                border: "1px solid rgba(200,138,45,0.3)",
                background: "transparent",
                cursor: connecting ? "wait" : "pointer",
                padding: "6px 16px",
                opacity: connecting ? 0.6 : 1,
                transition: "all 0.15s",
              }}
            >
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-5 h-px transition-all"
            style={{ background: "#898176", transform: menuOpen ? "rotate(45deg) translateY(4px)" : "none" }}
          />
          <span
            className="block w-5 h-px transition-all"
            style={{ background: "#898176", opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className="block w-5 h-px transition-all"
            style={{ background: "#898176", transform: menuOpen ? "rotate(-45deg) translateY(-4px)" : "none" }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-4 pb-4 flex flex-col gap-4"
          style={{ borderTop: "1px solid rgba(232,221,197,0.06)" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: pathname === link.href ? "#C88A2D" : "#898176",
              }}
            >
              {link.label}
            </Link>
          ))}
          {address ? (
            <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(232,221,197,0.06)" }}>
              <span style={{ fontFamily: "var(--font-ibm-mono)", fontSize: "11px", color: "#C88A2D" }}>
                {truncateAddress(address)}
              </span>
              <button
                onClick={() => { disconnect(); setMenuOpen(false); }}
                style={{ fontFamily: "var(--font-inter)", fontSize: "10px", color: "#898176", background: "transparent", border: "none", cursor: "pointer" }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => { connect(); setMenuOpen(false); }}
              disabled={connecting}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#C88A2D",
                border: "1px solid rgba(200,138,45,0.3)",
                background: "transparent",
                cursor: "pointer",
                padding: "8px 16px",
                textAlign: "left",
              }}
            >
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
