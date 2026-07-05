"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Classification, EvidenceType, SensitivityLevel } from "@/lib/types";
import { useWallet } from "@/lib/wallet";
import { createPackage, requestClassification, CreatePackageArgs } from "@/lib/contract";

const steps = [
  { n: 1, label: "Claim" },
  { n: 2, label: "Sources" },
  { n: 3, label: "Context" },
  { n: 4, label: "Sensitivity" },
  { n: 5, label: "Review" },
];

const evidenceTypes: EvidenceType[] = ["document", "screenshot", "video", "audio", "transaction", "statement", "archive", "mixed"];

const classificationOptions: { value: Classification | ""; label: string }[] = [
  { value: "", label: "No preference — let validators decide" },
  { value: "authentic", label: "Authentic" },
  { value: "weak", label: "Weak" },
  { value: "manipulated", label: "Manipulated" },
  { value: "incomplete", label: "Incomplete" },
  { value: "historically_significant", label: "Historically Significant" },
  { value: "verified_significant", label: "Verified Significant" },
  { value: "context_required", label: "Context Required" },
  { value: "unverifiable", label: "Unverifiable" },
  { value: "disputed", label: "Disputed" },
];

async function checkUrl(url: string): Promise<{ reachable: boolean; title?: string; error?: string }> {
  try {
    const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`);
    return await res.json();
  } catch {
    return { reachable: false };
  }
}

export default function DepositPage() {
  const router = useRouter();
  const { address, connect, connecting } = useWallet();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const [newPkgId, setNewPkgId] = useState<number | null>(null);

  // Step 1
  const [title, setTitle] = useState("");
  const [claim, setClaim] = useState("");
  const [evidenceType, setEvidenceType] = useState<EvidenceType | "">("");
  const [eventDate, setEventDate] = useState("");
  const [captureDate, setCaptureDate] = useState("");

  // Step 2
  const [primarySources, setPrimarySources] = useState([""]);
  const [supportingSources, setSupportingSources] = useState([""]);
  const [archiveLinks, setArchiveLinks] = useState([""]);
  const [fileHashes, setFileHashes] = useState([""]);
  const [urlChecks, setUrlChecks] = useState<Record<string, { reachable: boolean; title?: string }>>({});
  const [checkingUrl, setCheckingUrl] = useState<string | null>(null);

  // Step 3
  const [contextNote, setContextNote] = useState("");
  const [knownLimitations, setKnownLimitations] = useState("");
  const [knownDisputes, setKnownDisputes] = useState("");
  const [whyMatters, setWhyMatters] = useState("");

  // Step 4
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>("public");
  const [requestedClass, setRequestedClass] = useState<Classification | "">("");
  const [historicalNote, setHistoricalNote] = useState("");

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
    marginBottom: "6px",
    display: "block",
  };

  const addItem = (arr: string[], setArr: (v: string[]) => void) => setArr([...arr, ""]);
  const updateItem = (arr: string[], setArr: (v: string[]) => void, i: number, val: string) => {
    const updated = [...arr];
    updated[i] = val;
    setArr(updated);
  };

  const handleVerifyUrl = async (url: string) => {
    if (!url || !url.startsWith("http")) return;
    setCheckingUrl(url);
    const result = await checkUrl(url);
    setUrlChecks((prev) => ({ ...prev, [url]: result }));
    setCheckingUrl(null);
  };

  const UrlStatus = ({ url }: { url: string }) => {
    if (!url || !url.startsWith("http")) return null;
    const status = urlChecks[url];
    if (!status) {
      return (
        <button
          type="button"
          onClick={() => handleVerifyUrl(url)}
          disabled={checkingUrl === url}
          className="text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 shrink-0"
          style={{ fontFamily: "var(--font-inter)", color: "#4A7D9B", border: "1px solid rgba(74,125,155,0.3)", background: "transparent", cursor: "pointer" }}
        >
          {checkingUrl === url ? "…" : "Verify"}
        </button>
      );
    }
    return (
      <span className="text-[10px] shrink-0" style={{ fontFamily: "var(--font-inter)", color: status.reachable ? "#4F6F64" : "#8F2E2E" }}>
        {status.reachable ? `✓ ${status.title ? status.title.slice(0, 30) : "Reachable"}` : "✗ Unreachable"}
      </span>
    );
  };

  const ArrayInput = ({ arr, setArr, placeholder, mono, verifyUrls }: { arr: string[]; setArr: (v: string[]) => void; placeholder: string; mono?: boolean; verifyUrls?: boolean }) => (
    <div>
      {arr.map((val, i) => (
        <div key={i} className="mb-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={val}
              onChange={(e) => updateItem(arr, setArr, i, e.target.value)}
              placeholder={placeholder}
              style={{ ...inputStyle, fontFamily: mono ? "var(--font-ibm-mono)" : "var(--font-inter)", marginBottom: 0 }}
            />
            {i === arr.length - 1 && (
              <button
                type="button"
                onClick={() => addItem(arr, setArr)}
                className="px-3 text-xs shrink-0"
                style={{ fontFamily: "var(--font-inter)", color: "#C88A2D", border: "1px solid rgba(200,138,45,0.3)", background: "transparent", whiteSpace: "nowrap" }}
              >
                + Add
              </button>
            )}
          </div>
          {verifyUrls && val && <div className="mt-1 ml-1"><UrlStatus url={val} /></div>}
        </div>
      ))}
    </div>
  );

  const canAdvance1 = title.trim() && claim.trim() && evidenceType && eventDate;
  const canAdvance2 = primarySources.some((s) => s.trim()) || fileHashes.some((h) => h.trim()) || archiveLinks.some((a) => a.trim());

  const handleSeal = async () => {
    if (!address) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const args: CreatePackageArgs = {
        title,
        claim,
        evidenceType,
        eventDate,
        captureDate,
        primarySources,
        supportingSources,
        archiveLinks,
        fileHashes,
        contextNote,
        knownLimitations,
        knownDisputes,
        whyMatters,
        sensitivityLevel: sensitivity,
        requestedClassification: requestedClass,
        historicalSignificanceNote: historicalNote,
      };

      const pkgId = await createPackage(args, address, (s) => setSubmitState(s));
      setSubmitState("Package sealed. Requesting classification…");

      try {
        await requestClassification(pkgId, address, (s) => setSubmitState(s));
      } catch {
        setSubmitState("Sealed. Classification can be requested later.");
      }

      setNewPkgId(pkgId);
      setDone(true);
      setTimeout(() => router.push(`/archive/${pkgId}`), 1500);
    } catch (e: any) {
      setSubmitError(e?.message ?? "Sealing failed. Check wallet and try again.");
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center" style={{ border: "1.5px solid #C88A2D" }}>
          <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "28px", color: "#C88A2D" }}>§</span>
        </div>
        <h2 className="text-3xl mb-2" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>Package Sealed</h2>
        <p className="text-sm mb-4" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Package #{newPkgId} sealed on GenLayer Studionet.</p>
        <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Redirecting to package detail…</p>
      </div>
    );
  }

  // Not connected guard
  if (!address) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center" style={{ border: "1.5px solid rgba(200,138,45,0.4)" }}>
          <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "28px", color: "#C88A2D" }}>§</span>
        </div>
        <h2 className="text-3xl mb-3" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>Connect Your Wallet</h2>
        <p className="text-sm mb-6" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
          You need a connected wallet to deposit evidence packages on GenLayer Studionet.
        </p>
        <button
          onClick={connect}
          disabled={connecting}
          className="px-8 py-3 text-sm uppercase tracking-[0.2em]"
          style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600, cursor: connecting ? "wait" : "pointer" }}
        >
          {connecting ? "Connecting…" : "Connect Wallet"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-10">
        <h1 className="text-4xl mb-2" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>Deposit Evidence</h1>
        <p className="text-xs uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Prepare an evidence dossier</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-10">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-7 h-7 flex items-center justify-center text-xs font-bold"
                style={{
                  fontFamily: "var(--font-ibm-mono)",
                  background: step === s.n ? "#C88A2D" : step > s.n ? "rgba(200,138,45,0.2)" : "rgba(22,21,19,0.8)",
                  color: step === s.n ? "#0B0B0A" : step > s.n ? "#C88A2D" : "#898176",
                  border: `1px solid ${step >= s.n ? "#C88A2D" : "rgba(137,129,118,0.2)"}`,
                }}
              >
                {step > s.n ? "✓" : s.n}
              </div>
              <span className="text-[9px] uppercase tracking-[0.15em] mt-1 hidden sm:block" style={{ fontFamily: "var(--font-inter)", color: step === s.n ? "#C88A2D" : "#898176" }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mx-1" style={{ background: step > s.n ? "rgba(200,138,45,0.3)" : "rgba(137,129,118,0.15)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "#898176", background: "rgba(232,221,197,0.03)", border: "1px solid rgba(232,221,197,0.08)", padding: "10px 12px" }}>
            Describe what this evidence is supposed to support. Reliquary preserves the claim and the uncertainty around it.
          </p>
          <div>
            <label style={labelStyle}>Evidence Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. DAO Treasury Misallocation — Q3 2024" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Submitted Claim *</label>
            <textarea value={claim} onChange={(e) => setClaim(e.target.value)} rows={4} placeholder="Describe what this evidence is supposed to support..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Evidence Type *</label>
            <select value={evidenceType} onChange={(e) => setEvidenceType(e.target.value as EvidenceType)} style={inputStyle}>
              <option value="">Select type...</option>
              {evidenceTypes.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Event Date *</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Capture Date</label>
              <input type="date" value={captureDate} onChange={(e) => setCaptureDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!canAdvance1}
            className="py-3 text-sm uppercase tracking-[0.2em] disabled:opacity-40"
            style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600 }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "#898176", background: "rgba(232,221,197,0.03)", border: "1px solid rgba(232,221,197,0.08)", padding: "10px 12px" }}>
            Add source URLs — validators will attempt to fetch and verify them. Click Verify to pre-check reachability.
          </p>
          <div>
            <label style={labelStyle}>Primary Source Links *</label>
            <ArrayInput arr={primarySources} setArr={setPrimarySources} placeholder="https://..." verifyUrls />
          </div>
          <div>
            <label style={labelStyle}>Supporting Source Links</label>
            <ArrayInput arr={supportingSources} setArr={setSupportingSources} placeholder="https://..." verifyUrls />
          </div>
          <div>
            <label style={labelStyle}>Archive Links</label>
            <ArrayInput arr={archiveLinks} setArr={setArchiveLinks} placeholder="https://web.archive.org/..." verifyUrls />
          </div>
          <div>
            <label style={labelStyle}>File Hashes</label>
            <ArrayInput arr={fileHashes} setArr={setFileHashes} placeholder="sha256:..." mono />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 text-sm uppercase tracking-[0.2em] border" style={{ fontFamily: "var(--font-inter)", color: "#898176", borderColor: "rgba(232,221,197,0.1)" }}>← Back</button>
            <button onClick={() => setStep(3)} disabled={!canAdvance2} className="flex-1 py-3 text-sm uppercase tracking-[0.2em] disabled:opacity-40" style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600 }}>Continue →</button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div>
            <label style={labelStyle}>Context Note</label>
            <textarea value={contextNote} onChange={(e) => setContextNote(e.target.value)} rows={3} placeholder="Provide surrounding context that validators should know..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Known Limitations</label>
            <textarea value={knownLimitations} onChange={(e) => setKnownLimitations(e.target.value)} rows={2} placeholder="Acknowledge any weaknesses in your evidence..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Known Disputes</label>
            <textarea value={knownDisputes} onChange={(e) => setKnownDisputes(e.target.value)} rows={2} placeholder="List any known counter-arguments or disputes..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Why This Proof Matters</label>
            <textarea value={whyMatters} onChange={(e) => setWhyMatters(e.target.value)} rows={2} placeholder="Explain the archival or public importance of this evidence..." style={inputStyle} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 text-sm uppercase tracking-[0.2em] border" style={{ fontFamily: "var(--font-inter)", color: "#898176", borderColor: "rgba(232,221,197,0.1)" }}>← Back</button>
            <button onClick={() => setStep(4)} className="flex-1 py-3 text-sm uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600 }}>Continue →</button>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div className="flex flex-col gap-5">
          <div>
            <label style={labelStyle}>Sensitivity Level</label>
            <div className="flex gap-3">
              {(["public", "limited", "sensitive"] as SensitivityLevel[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSensitivity(s)}
                  className="flex-1 py-2.5 text-xs uppercase tracking-[0.15em] border transition-colors capitalize"
                  style={{
                    fontFamily: "var(--font-inter)",
                    background: sensitivity === s ? "rgba(200,138,45,0.08)" : "transparent",
                    color: sensitivity === s ? "#C88A2D" : "#898176",
                    borderColor: sensitivity === s ? "#C88A2D" : "rgba(232,221,197,0.1)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Requested Classification (optional)</label>
            <select value={requestedClass} onChange={(e) => setRequestedClass(e.target.value as Classification | "")} style={inputStyle}>
              {classificationOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Historical Significance Note (optional)</label>
            <textarea value={historicalNote} onChange={(e) => setHistoricalNote(e.target.value)} rows={2} placeholder="Why might this record have lasting historical importance?" style={inputStyle} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 py-3 text-sm uppercase tracking-[0.2em] border" style={{ fontFamily: "var(--font-inter)", color: "#898176", borderColor: "rgba(232,221,197,0.1)" }}>← Back</button>
            <button onClick={() => setStep(5)} className="flex-1 py-3 text-sm uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600 }}>Review Package →</button>
          </div>
        </div>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <div className="flex flex-col gap-6">
          <div className="p-5" style={{ background: "#161513", border: "1px solid rgba(200,138,45,0.15)" }}>
            <p className="text-[10px] uppercase tracking-[0.2em] mb-4" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Dossier Preview — Submitted Claim, not automatic fact</p>

            <h3 className="text-lg mb-2" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>{title}</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>{claim}</p>

            <div className="grid grid-cols-2 gap-3 mb-4 text-xs" style={{ fontFamily: "var(--font-inter)" }}>
              <div><span style={{ color: "#898176" }}>Type: </span><span className="capitalize" style={{ color: "#E8DDC5" }}>{evidenceType}</span></div>
              <div><span style={{ color: "#898176" }}>Event: </span><span style={{ color: "#E8DDC5" }}>{eventDate}</span></div>
              <div><span style={{ color: "#898176" }}>Sensitivity: </span><span className="capitalize" style={{ color: "#E8DDC5" }}>{sensitivity}</span></div>
              <div><span style={{ color: "#898176" }}>Sources: </span><span style={{ color: "#E8DDC5" }}>{primarySources.filter(Boolean).length + supportingSources.filter(Boolean).length}</span></div>
              <div><span style={{ color: "#898176" }}>Hashes: </span><span style={{ color: "#E8DDC5" }}>{fileHashes.filter(Boolean).length}</span></div>
              <div><span style={{ color: "#898176" }}>Archives: </span><span style={{ color: "#E8DDC5" }}>{archiveLinks.filter(Boolean).length}</span></div>
            </div>

            {contextNote && (
              <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: "rgba(232,221,197,0.06)", fontFamily: "var(--font-inter)", color: "#898176" }}>
                <strong style={{ color: "#E8DDC5" }}>Context: </strong>{contextNote}
              </div>
            )}

            <div className="mt-4 p-3" style={{ background: "rgba(143,46,46,0.05)", border: "1px solid rgba(143,46,46,0.15)" }}>
              <p className="text-[10px] uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-inter)", color: "#8F2E2E" }}>
                ⚠ Classification is not automatic truth. GenLayer validators will classify this package independently.
              </p>
            </div>
          </div>

          {submitState && (
            <div className="p-4 text-center" style={{ background: "rgba(200,138,45,0.04)", border: "1px solid rgba(200,138,45,0.15)" }}>
              <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "#C88A2D" }}>{submitState}</p>
            </div>
          )}

          {submitError && (
            <div className="p-4" style={{ background: "rgba(143,46,46,0.06)", border: "1px solid rgba(143,46,46,0.25)" }}>
              <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "#8F2E2E" }}>{submitError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(4)} disabled={submitting} className="flex-1 py-3 text-sm uppercase tracking-[0.2em] border disabled:opacity-40" style={{ fontFamily: "var(--font-inter)", color: "#898176", borderColor: "rgba(232,221,197,0.1)" }}>← Back</button>
            <button
              onClick={handleSeal}
              disabled={submitting}
              className="flex-1 py-3 text-sm uppercase tracking-[0.2em] disabled:opacity-40"
              style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600 }}
            >
              {submitting ? "Sealing…" : "Seal Evidence Package"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
