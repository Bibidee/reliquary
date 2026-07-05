import Link from "next/link";
import { EvidencePackage } from "@/lib/types";
import ClassificationStamp from "./ClassificationStamp";
import PackageStatusPill from "./PackageStatusPill";
import ManipulationRiskTag from "./ManipulationRiskTag";
import SignificanceSeal from "./SignificanceSeal";

const cardBorderColor: Record<string, string> = {
  authentic: "#C88A2D",
  weak: "#898176",
  manipulated: "#8F2E2E",
  incomplete: "#898176",
  historically_significant: "#C88A2D",
  context_required: "#4A7D9B",
  unverifiable: "#3A2D24",
  disputed: "#8F2E2E",
  "": "#2a2723",
};

export default function EvidencePackageCard({ pkg }: { pkg: EvidencePackage }) {
  const borderColor = pkg.currentClassification
    ? cardBorderColor[pkg.currentClassification]
    : "#2a2723";

  const isHistoric = pkg.currentClassification === "historically_significant" || pkg.significance === "historic";

  return (
    <Link href={`/archive/${pkg.id}`} className="block group">
      <article
        className="relative p-5 transition-all duration-200 hover:translate-y-[-2px]"
        style={{
          background: "linear-gradient(135deg, #1a1814 0%, #161513 100%)",
          border: `1px solid ${borderColor}40`,
          borderLeftWidth: "3px",
          borderLeftColor: borderColor,
          boxShadow: isHistoric ? `0 0 20px ${borderColor}20` : undefined,
        }}
      >
        {/* Historic gold frame accent */}
        {isHistoric && (
          <div
            className="absolute top-0 right-0 w-8 h-8"
            style={{
              borderTop: `2px solid #C88A2D`,
              borderRight: `2px solid #C88A2D`,
            }}
          />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3
              className="text-base mb-1 group-hover:text-[#E8DDC5] transition-colors line-clamp-2"
              style={{ fontFamily: "var(--font-cormorant)", color: "#D4C9A8" }}
            >
              {pkg.title}
            </h3>
            <span
              className="text-[10px] uppercase tracking-[0.15em]"
              style={{ fontFamily: "var(--font-inter)", color: "#898176" }}
            >
              {pkg.evidenceType} · {pkg.eventDate}
            </span>
          </div>
          <PackageStatusPill status={pkg.status} />
        </div>

        {/* Claim preview */}
        <p
          className="text-xs mb-4 line-clamp-2 leading-relaxed"
          style={{ fontFamily: "var(--font-inter)", color: "#898176" }}
        >
          {pkg.claim}
        </p>

        {/* Classification stamp */}
        {pkg.currentClassification && (
          <div className="mb-3">
            <ClassificationStamp classification={pkg.currentClassification} size="sm" />
          </div>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {pkg.manipulationRisk && (
            <ManipulationRiskTag risk={pkg.manipulationRisk} />
          )}
          {pkg.significance && pkg.significance !== "none" && (
            <SignificanceSeal significance={pkg.significance} />
          )}
          {pkg.confidence && (
            <span
              className="text-[10px] uppercase tracking-[0.1em] px-1.5 py-0.5"
              style={{
                fontFamily: "var(--font-inter)",
                color: "#898176",
                border: "1px solid rgba(137,129,118,0.2)",
              }}
            >
              {pkg.confidence} confidence
            </span>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: "rgba(232,221,197,0.06)" }}
        >
          <span
            className="text-[10px]"
            style={{ fontFamily: "var(--font-ibm-mono)", color: "#4A2D24" === "#4A2D24" ? "#898176" : "#898176" }}
          >
            {pkg.depositor}
          </span>
          <div className="flex items-center gap-3">
            {pkg.challengeCount > 0 && (
              <span
                className="text-[10px] uppercase tracking-[0.1em]"
                style={{ fontFamily: "var(--font-inter)", color: "#8F2E2E" }}
              >
                {pkg.challengeCount} challenge{pkg.challengeCount > 1 ? "s" : ""}
              </span>
            )}
            <span
              className="text-[10px] uppercase tracking-[0.15em] group-hover:text-[#C88A2D] transition-colors"
              style={{ fontFamily: "var(--font-inter)", color: "#898176" }}
            >
              View →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
