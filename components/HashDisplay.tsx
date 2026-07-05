"use client";
import { useState } from "react";

export default function HashDisplay({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const display = hash.length > 40 ? hash.slice(0, 20) + "…" + hash.slice(-8) : hash;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-none"
      style={{
        background: "rgba(22,21,19,0.8)",
        border: "1px solid rgba(232,221,197,0.08)",
      }}
    >
      <span
        className="text-[11px] flex-1 truncate"
        style={{ fontFamily: "var(--font-ibm-mono)", color: "#898176" }}
      >
        {display}
      </span>
      <button
        onClick={copy}
        className="text-[10px] uppercase tracking-[0.1em] transition-colors shrink-0"
        style={{
          fontFamily: "var(--font-inter)",
          color: copied ? "#4F6F64" : "#C88A2D",
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
