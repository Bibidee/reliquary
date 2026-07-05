import Link from "next/link";
import ClassificationStamp from "@/components/ClassificationStamp";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <div className="mb-16 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>About the Protocol</p>
        <h1 className="text-5xl mb-6" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>Reliquary</h1>
        <div className="w-12 h-px mx-auto mb-6" style={{ background: "#C88A2D" }} />
        <p className="text-base leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
          A decentralized evidence vault for preserving important proofs — with honest classifications around authenticity, weakness, manipulation risk, completeness, and historical significance.
        </p>
      </div>

      {/* Core principle */}
      <div
        className="p-8 mb-12 text-center"
        style={{ background: "#161513", border: "1px solid rgba(200,138,45,0.15)" }}
      >
        <p
          className="text-2xl leading-relaxed"
          style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}
        >
          &ldquo;Preserve the proof. Preserve the uncertainty too.&rdquo;
        </p>
      </div>

      {/* What it is */}
      <section className="mb-12">
        <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>What Reliquary Does</h2>
        <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
          Reliquary is not a truth machine. It is a protocol for preserving important evidence and letting decentralized validators classify its evidentiary strength.
        </p>
        <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
          A package being preserved does not mean the claim is true. A classification of &ldquo;authentic&rdquo; does not mean the evidence is legally conclusive. A classification of &ldquo;weak&rdquo; does not mean the evidence should be ignored.
        </p>
        <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
          The protocol says: <em style={{ color: "#C88A2D" }}>This record exists. Here is what it claims. Here is how decentralized validators classified its strength, risk, and significance.</em>
        </p>
      </section>

      {/* Why GenLayer */}
      <section className="mb-12">
        <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>Why GenLayer</h2>
        <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
          Evidence classification is interpretive. A normal smart contract can store a hash or timestamp, but it cannot judge whether a screenshot looks manipulated, whether a document has enough provenance, or whether the source context supports the claim.
        </p>
        <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
          GenLayer validators independently interpret each package and return a consensus classification. Multiple independent interpretations reach agreement — or disagree and produce a <em>disputed</em> classification.
        </p>
      </section>

      {/* Classification reference */}
      <section className="mb-12">
        <h2 className="text-2xl mb-6" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>Classification Reference</h2>
        <div className="flex flex-col gap-4">
          {(["authentic", "weak", "manipulated", "incomplete", "historically_significant", "context_required", "unverifiable", "disputed"] as const).map((c) => (
            <div key={c} className="flex items-start gap-4 py-3 border-b" style={{ borderColor: "rgba(232,221,197,0.06)" }}>
              <div className="shrink-0 mt-0.5">
                <ClassificationStamp classification={c} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety */}
      <section className="mb-12">
        <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>Safety and Responsibility</h2>
        <div className="p-4 mb-4" style={{ background: "rgba(143,46,46,0.04)", border: "1px solid rgba(143,46,46,0.15)" }}>
          <p className="text-xs uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "var(--font-inter)", color: "#8F2E2E" }}>
            Important Disclaimer
          </p>
          <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
            Reliquary can be used to preserve sensitive content. Packages are submitted by third parties and do not represent endorsed claims. A classification does not constitute legal, editorial, or factual endorsement.
          </p>
        </div>
        <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
          Abuse cases — including doxxing, harassment archives, false accusations, and manipulated screenshots — are actively monitored. Packages classified as sensitive receive restricted review status and additional warnings.
        </p>
      </section>

      {/* CTA */}
      <div className="text-center">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/deposit" className="px-8 py-3 text-sm uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600 }}>
            Deposit Evidence
          </Link>
          <Link href="/archive" className="px-8 py-3 text-sm uppercase tracking-[0.2em] border" style={{ fontFamily: "var(--font-inter)", borderColor: "rgba(232,221,197,0.2)", color: "#E8DDC5" }}>
            Browse Archive
          </Link>
        </div>
      </div>
    </div>
  );
}
