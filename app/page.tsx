import Link from "next/link";
import ClassificationStamp from "@/components/ClassificationStamp";
import { getPackageCount, getPackagesPage } from "@/lib/contract";

const classificationDescriptions = [
  { key: "authentic", label: "Authentic", desc: "Strong alignment between claim, sources, and provenance.", color: "#C88A2D" },
  { key: "weak", label: "Weak", desc: "May contain useful material, but does not strongly support the stated claim.", color: "#898176" },
  { key: "manipulated", label: "Manipulated", desc: "Signs of alteration, fabrication, misleading framing, or contradiction.", color: "#8F2E2E" },
  { key: "incomplete", label: "Incomplete", desc: "Lacks enough material for a confident classification.", color: "#898176" },
  { key: "historically_significant", label: "Historically Significant", desc: "Archival importance even if interpretation may require care.", color: "#C88A2D" },
  { key: "context_required", label: "Context Required", desc: "Evidence may be real, but needs surrounding context before safe interpretation.", color: "#4A7D9B" },
  { key: "unverifiable", label: "Unverifiable", desc: "Validators could not access or confirm the evidence.", color: "#4F6F64" },
  { key: "disputed", label: "Disputed", desc: "Credible competing interpretations or challenges exist.", color: "#8F2E2E" },
];

export default async function LandingPage() {
  let packageCount = 0;
  let classifiedCount = 0;

  try {
    packageCount = await getPackageCount();
    if (packageCount > 0) {
      const recent = await getPackagesPage(0, Math.min(packageCount, 50));
      classifiedCount = recent.filter((p) => p.status !== "pending").length;
    }
  } catch {
    // Contract not deployed yet — show zeros
  }

  return (
    <div style={{ background: "#0B0B0A" }}>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(232,221,197,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(232,221,197,0.025) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="float-capsule mb-10 relative">
          <div
            className="w-24 h-36 mx-auto flex items-center justify-center"
            style={{
              border: "1.5px solid #C88A2D",
              background: "linear-gradient(180deg, rgba(200,138,45,0.06) 0%, rgba(11,11,10,0.4) 100%)",
              boxShadow: "0 0 40px rgba(200,138,45,0.12), inset 0 0 20px rgba(200,138,45,0.04)",
            }}
          >
            <div className="text-center">
              <div className="text-2xl mb-1" style={{ fontFamily: "var(--font-cormorant)", color: "#C88A2D" }}>§</div>
              <div className="text-[8px] uppercase tracking-[0.25em]" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Evidence</div>
            </div>
          </div>
          <div className="absolute -top-2 -left-2 w-4 h-4" style={{ borderTop: "1px solid #C88A2D", borderLeft: "1px solid #C88A2D" }} />
          <div className="absolute -bottom-2 -right-2 w-4 h-4" style={{ borderBottom: "1px solid #C88A2D", borderRight: "1px solid #C88A2D" }} />
        </div>

        <h1 className="text-5xl sm:text-7xl mb-4 leading-tight" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>
          Preserve proof.
          <br />
          <span style={{ color: "#C88A2D" }}>Classify uncertainty.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm leading-relaxed mb-8" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
          Reliquary is a decentralized evidence vault where important records are deposited, examined by GenLayer validators, and preserved with honest classifications around authenticity, weakness, manipulation risk, completeness, and historical significance.
        </p>

        <div className="flex items-center gap-6 mb-10">
          <div className="text-center">
            <div className="text-3xl" style={{ fontFamily: "var(--font-cormorant)", color: "#C88A2D" }}>{packageCount}</div>
            <div className="text-[10px] uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Packages Sealed</div>
          </div>
          <div className="w-px h-8" style={{ background: "rgba(232,221,197,0.1)" }} />
          <div className="text-center">
            <div className="text-3xl" style={{ fontFamily: "var(--font-cormorant)", color: "#C88A2D" }}>{classifiedCount}</div>
            <div className="text-[10px] uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Classified</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/deposit"
            className="px-8 py-3 text-sm uppercase tracking-[0.2em] transition-all"
            style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600 }}
          >
            Deposit Evidence
          </Link>
          <Link
            href="/archive"
            className="px-8 py-3 text-sm uppercase tracking-[0.2em] transition-all border"
            style={{ fontFamily: "var(--font-inter)", borderColor: "rgba(232,221,197,0.2)", color: "#E8DDC5" }}
          >
            Explore Archive
          </Link>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <div className="w-px h-8" style={{ background: "rgba(200,138,45,0.3)" }} />
          <span className="text-[10px] uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Scroll</span>
        </div>
      </section>

      {/* What Reliquary preserves */}
      <section className="px-6 py-20 border-t" style={{ borderColor: "rgba(232,221,197,0.06)" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl mb-2" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>What Reliquary Preserves</h2>
          <p className="text-xs uppercase tracking-[0.2em] mb-10" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Records worth keeping — even when uncertain</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {["Records of public promises", "DAO governance evidence", "Incident reports", "Whistleblower packages", "Community memory records", "Historical documents", "Screenshots of deleted content", "Proof of authorship", "Proof of misconduct", "Protocol failure evidence", "Event archives", "Signed agreements"].map((item) => (
              <div key={item} className="p-3 text-xs" style={{ fontFamily: "var(--font-inter)", color: "#898176", border: "1px solid rgba(232,221,197,0.06)", background: "rgba(22,21,19,0.5)" }}>{item}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Why hashes alone are not enough */}
      <section className="px-6 py-20 border-t" style={{ borderColor: "rgba(232,221,197,0.06)", background: "#0e0d0c" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl mb-4" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>Why Hashes Alone Are Not Enough</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
            A normal smart contract can store a hash or timestamp. But it cannot judge whether a screenshot looks manipulated, whether a document has enough provenance, whether the evidence is complete or selectively edited, or whether the source context supports the claim.
          </p>
          <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
            GenLayer validators independently interpret each evidence package and return a consensus classification. Reliquary uses GenLayer for{" "}
            <em style={{ color: "#C88A2D" }}>evidence interpretation</em>, not file storage.
          </p>
        </div>
      </section>

      {/* Classification categories */}
      <section className="px-6 py-20 border-t" style={{ borderColor: "rgba(232,221,197,0.06)" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl mb-2" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>Classification Categories</h2>
          <p className="text-xs uppercase tracking-[0.2em] mb-10" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Eight archival labels assigned by GenLayer validators</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classificationDescriptions.map((c) => (
              <div key={c.key} className="p-4 flex items-start gap-4" style={{ background: "#161513", border: `1px solid ${c.color}25`, borderLeftWidth: "3px", borderLeftColor: c.color }}>
                <div className="shrink-0"><ClassificationStamp classification={c.key as any} size="sm" /></div>
                <p className="text-xs leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How GenLayer classifies */}
      <section className="px-6 py-20 border-t" style={{ borderColor: "rgba(232,221,197,0.06)", background: "#0e0d0c" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl mb-10" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>How GenLayer Classifies Evidence</h2>
          <div className="flex flex-col gap-0">
            {[
              { n: "01", label: "Deposit Package", desc: "Submit title, claim, sources, hashes, and context." },
              { n: "02", label: "Request Classification", desc: "Trigger non-deterministic GenLayer evaluation." },
              { n: "03", label: "Validator Consensus", desc: "Independent validators inspect and reason about the package." },
              { n: "04", label: "Classification Stored", desc: "Consensus result is written on-chain with confidence and risk scores." },
              { n: "05", label: "Challenge & Reclassify", desc: "Viewers can challenge with counter-evidence. New classifications are layered on top." },
            ].map((step) => (
              <div key={step.n} className="flex gap-6 pb-8">
                <div className="w-8 h-8 flex items-center justify-center shrink-0 text-xs font-bold" style={{ fontFamily: "var(--font-ibm-mono)", color: "#C88A2D", border: "1px solid rgba(200,138,45,0.3)", background: "rgba(200,138,45,0.06)" }}>{step.n}</div>
                <div className="pt-1">
                  <h3 className="text-base mb-1" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>{step.label}</h3>
                  <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t text-center" style={{ borderColor: "rgba(232,221,197,0.06)" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl mb-4" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>Start Archiving Evidence</h2>
          <p className="text-sm mb-8" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
            Connect your wallet and deposit your first evidence package.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/deposit" className="px-8 py-3 text-sm uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600 }}>
              Deposit Evidence
            </Link>
            <Link href="/archive" className="px-8 py-3 text-sm uppercase tracking-[0.2em] border" style={{ fontFamily: "var(--font-inter)", borderColor: "rgba(232,221,197,0.2)", color: "#E8DDC5" }}>
              Browse Archive →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
