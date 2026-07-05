"use client";
import { useState } from "react";
import HashDisplay from "./HashDisplay";

interface Props {
  primarySources: string[];
  supportingSources: string[];
  archiveLinks: string[];
  fileHashes: string[];
}

function SourceRow({ url, type }: { url: string; type: string }) {
  const [copied, setCopied] = useState(false);
  const display = url.length > 55 ? url.slice(0, 40) + "…" : url;

  return (
    <div
      className="flex items-start gap-3 py-2.5 border-b"
      style={{ borderColor: "rgba(232,221,197,0.06)" }}
    >
      <span
        className="text-[9px] uppercase tracking-[0.15em] mt-0.5 shrink-0 px-1.5 py-0.5"
        style={{
          fontFamily: "var(--font-inter)",
          color: "#898176",
          border: "1px solid rgba(137,129,118,0.2)",
        }}
      >
        {type}
      </span>
      <span
        className="text-[11px] flex-1 break-all"
        style={{ fontFamily: "var(--font-ibm-mono)", color: "#E8DDC5" }}
      >
        {display}
      </span>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="text-[10px] uppercase tracking-[0.1em] transition-colors"
          style={{ fontFamily: "var(--font-inter)", color: copied ? "#4F6F64" : "#898176" }}
        >
          {copied ? "✓" : "Copy"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] uppercase tracking-[0.1em]"
          style={{ fontFamily: "var(--font-inter)", color: "#C88A2D" }}
        >
          Open ↗
        </a>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h4
        className="text-[10px] uppercase tracking-[0.2em] mb-3"
        style={{ fontFamily: "var(--font-inter)", color: "#898176" }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

export default function EvidenceSourceList({ primarySources, supportingSources, archiveLinks, fileHashes }: Props) {
  return (
    <div>
      {primarySources.length > 0 && (
        <Section title="Primary Sources">
          {primarySources.map((s, i) => <SourceRow key={i} url={s} type="Primary" />)}
        </Section>
      )}
      {supportingSources.length > 0 && (
        <Section title="Supporting Sources">
          {supportingSources.map((s, i) => <SourceRow key={i} url={s} type="Supporting" />)}
        </Section>
      )}
      {archiveLinks.length > 0 && (
        <Section title="Archive Links">
          {archiveLinks.map((s, i) => <SourceRow key={i} url={s} type="Archive" />)}
        </Section>
      )}
      {fileHashes.length > 0 && (
        <Section title="File Hashes">
          <div className="flex flex-col gap-2">
            {fileHashes.map((h, i) => <HashDisplay key={i} hash={h} />)}
          </div>
        </Section>
      )}
    </div>
  );
}
