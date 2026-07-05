"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChallengeType } from "@/lib/types";
import { useWallet } from "@/lib/wallet";
import { submitChallenge } from "@/lib/contract";

const challengeTypes: { value: ChallengeType; label: string; desc: string }[] = [
  { value: "manipulation_claim", label: "Manipulation Claim", desc: "Evidence has been altered, fabricated, or misrepresented." },
  { value: "missing_context", label: "Missing Context", desc: "Critical context has been omitted that would change interpretation." },
  { value: "wrong_classification", label: "Wrong Classification", desc: "The validator consensus reached an incorrect classification." },
  { value: "false_claim", label: "False Claim", desc: "The submitted claim is factually incorrect or misleading." },
  { value: "source_dead", label: "Source Dead", desc: "Primary sources are no longer accessible, reducing verifiability." },
  { value: "stronger_evidence_available", label: "Stronger Evidence Available", desc: "Better evidence exists that materially affects the classification." },
  { value: "privacy_or_safety_concern", label: "Privacy / Safety Concern", desc: "This package may expose private individuals or create safety risks." },
];

export default function ChallengePage({ params }: { params: Promise<{ packageId: string }> }) {
  const { packageId } = use(params);
  const pkgId = parseInt(packageId, 10);
  const router = useRouter();
  const { address, connect, connecting } = useWallet();

  const [challengeType, setChallengeType] = useState<ChallengeType | "">("");
  const [note, setNote] = useState("");
  const [counterLinks, setCounterLinks] = useState<string[]>([""]);
  const [archiveLinks, setArchiveLinks] = useState<string[]>([""]);
  const [hashes, setHashes] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const inputStyle = {
    background: "#161513",
    border: "1px solid rgba(232,221,197,0.1)",
    color: "#E8DDC5",
    fontFamily: "var(--font-inter)",
    fontSize: "13px",
    outline: "none",
    width: "100%",
    padding: "10px 12px",
  };

  const labelStyle = {
    fontFamily: "var(--font-inter)",
    fontSize: "10px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.2em",
    color: "#898176",
    marginBottom: "8px",
    display: "block",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeType || !note.trim()) return;
    if (!address) { connect(); return; }

    setSubmitting(true);
    setSubmitError("");
    try {
      await submitChallenge(
        pkgId,
        challengeType,
        counterLinks,
        note,
        archiveLinks,
        hashes,
        address,
        setSubmitStatus
      );
      setSubmitted(true);
    } catch (e: any) {
      setSubmitError(e?.message ?? "Challenge submission failed.");
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto flex items-center justify-center mb-4" style={{ border: "1.5px solid #8F2E2E" }}>
            <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "28px", color: "#8F2E2E" }}>⚐</span>
          </div>
          <h2 className="text-3xl mb-3" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>
            Challenge Submitted
          </h2>
          <p className="text-sm mb-6" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
            Your challenge has been sealed on GenLayer Studionet. This challenge does not erase the original package — it adds a competing interpretation.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/archive/${pkgId}`}
              className="px-6 py-2.5 text-xs uppercase tracking-[0.2em] border"
              style={{ fontFamily: "var(--font-inter)", color: "#C88A2D", borderColor: "rgba(200,138,45,0.3)" }}
            >
              View Package
            </Link>
            <Link
              href="/archive"
              className="px-6 py-2.5 text-xs uppercase tracking-[0.2em] border"
              style={{ fontFamily: "var(--font-inter)", color: "#898176", borderColor: "rgba(232,221,197,0.1)" }}
            >
              Back to Archive
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-[10px] uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
        <Link href="/archive" className="hover:text-[#C88A2D]">Archive</Link>
        <span>·</span>
        <Link href={`/archive/${pkgId}`} className="hover:text-[#C88A2D]">#{pkgId}</Link>
        <span>·</span>
        <span style={{ color: "#8F2E2E" }}>Challenge</span>
      </div>

      <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>
        Submit Challenge
      </h1>
      <p className="text-sm mb-2" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
        Challenging package <span style={{ fontFamily: "var(--font-ibm-mono)", color: "#C88A2D" }}>#{pkgId}</span>
      </p>
      <div
        className="mb-8 p-3 text-xs"
        style={{ fontFamily: "var(--font-inter)", color: "#898176", background: "rgba(232,221,197,0.03)", border: "1px solid rgba(232,221,197,0.08)" }}
      >
        A challenge does not erase the original package. It adds a competing interpretation to the archive and may trigger reclassification.
      </div>

      {!address && (
        <div className="mb-6 p-4 text-center" style={{ background: "rgba(200,138,45,0.04)", border: "1px solid rgba(200,138,45,0.15)" }}>
          <p className="text-xs mb-3" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Connect your wallet to submit this challenge on-chain.</p>
          <button
            onClick={connect}
            disabled={connecting}
            className="px-6 py-2 text-xs uppercase tracking-[0.15em]"
            style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600 }}
          >
            {connecting ? "Connecting…" : "Connect Wallet"}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Challenge Type */}
        <div>
          <label style={labelStyle}>Challenge Type *</label>
          <div className="flex flex-col gap-2">
            {challengeTypes.map((t) => (
              <label
                key={t.value}
                className="flex items-start gap-3 p-3 cursor-pointer transition-colors"
                style={{
                  background: challengeType === t.value ? "rgba(143,46,46,0.06)" : "#161513",
                  border: `1px solid ${challengeType === t.value ? "rgba(143,46,46,0.3)" : "rgba(232,221,197,0.06)"}`,
                }}
              >
                <input
                  type="radio"
                  name="challengeType"
                  value={t.value}
                  checked={challengeType === t.value}
                  onChange={() => setChallengeType(t.value)}
                  className="mt-0.5"
                  style={{ accentColor: "#8F2E2E" }}
                />
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ fontFamily: "var(--font-inter)", color: "#E8DDC5" }}>{t.label}</p>
                  <p className="text-[11px]" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>{t.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Challenge Note */}
        <div>
          <label style={labelStyle}>Challenge Note *</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            placeholder="Describe your challenge in detail. Be specific about what is incorrect, missing, or manipulated."
            style={inputStyle}
            required
          />
        </div>

        {/* Counter Evidence */}
        <div>
          <label style={labelStyle}>Counter-Evidence Links</label>
          {counterLinks.map((link, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="url" value={link} onChange={(e) => { const u = [...counterLinks]; u[i] = e.target.value; setCounterLinks(u); }} placeholder="https://..." style={{ ...inputStyle, marginBottom: 0 }} />
              {i === counterLinks.length - 1 && (
                <button type="button" onClick={() => setCounterLinks([...counterLinks, ""])} className="px-3 text-xs shrink-0" style={{ fontFamily: "var(--font-inter)", color: "#C88A2D", border: "1px solid rgba(200,138,45,0.3)", background: "transparent" }}>+ Add</button>
              )}
            </div>
          ))}
        </div>

        {/* Archive Links */}
        <div>
          <label style={labelStyle}>Archive Links</label>
          {archiveLinks.map((link, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="url" value={link} onChange={(e) => { const u = [...archiveLinks]; u[i] = e.target.value; setArchiveLinks(u); }} placeholder="https://web.archive.org/..." style={{ ...inputStyle, marginBottom: 0 }} />
              {i === archiveLinks.length - 1 && (
                <button type="button" onClick={() => setArchiveLinks([...archiveLinks, ""])} className="px-3 text-xs shrink-0" style={{ fontFamily: "var(--font-inter)", color: "#C88A2D", border: "1px solid rgba(200,138,45,0.3)", background: "transparent" }}>+ Add</button>
              )}
            </div>
          ))}
        </div>

        {/* Hashes */}
        <div>
          <label style={labelStyle}>Optional File Hashes</label>
          {hashes.map((hash, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" value={hash} onChange={(e) => { const u = [...hashes]; u[i] = e.target.value; setHashes(u); }} placeholder="sha256:..." style={{ ...inputStyle, marginBottom: 0, fontFamily: "var(--font-ibm-mono)" }} />
              {i === hashes.length - 1 && (
                <button type="button" onClick={() => setHashes([...hashes, ""])} className="px-3 text-xs shrink-0" style={{ fontFamily: "var(--font-inter)", color: "#C88A2D", border: "1px solid rgba(200,138,45,0.3)", background: "transparent" }}>+ Add</button>
              )}
            </div>
          ))}
        </div>

        {submitStatus && (
          <div className="p-3 text-center" style={{ background: "rgba(143,46,46,0.04)", border: "1px solid rgba(143,46,46,0.15)" }}>
            <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "#8F2E2E" }}>{submitStatus}</p>
          </div>
        )}

        {submitError && (
          <div className="p-3" style={{ background: "rgba(143,46,46,0.06)", border: "1px solid rgba(143,46,46,0.25)" }}>
            <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "#8F2E2E" }}>{submitError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!challengeType || !note.trim() || submitting}
          className="py-3 text-sm uppercase tracking-[0.2em] transition-colors disabled:opacity-40"
          style={{
            fontFamily: "var(--font-inter)",
            background: "#8F2E2E",
            color: "#F6F0E4",
            fontWeight: 600,
            cursor: (!challengeType || !note.trim() || submitting) ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Submitting…" : !address ? "Connect Wallet to Submit" : "Submit Challenge"}
        </button>
      </form>
    </div>
  );
}
