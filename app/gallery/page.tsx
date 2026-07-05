"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ClassificationStamp from "@/components/ClassificationStamp";
import SignificanceSeal from "@/components/SignificanceSeal";
import { getAllPackages } from "@/lib/contract";
import { EvidencePackage } from "@/lib/types";

const galleryFilters = [
  "all",
  "historically_significant",
  "authentic",
  "disputed",
  "context_required",
];

export default function GalleryPage() {
  const [packages, setPackages] = useState<EvidencePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getAllPackages()
      .then((pkgs) => {
        const sig = pkgs.filter((p) => p.significance === "high" || p.significance === "historic");
        setPackages(sig);
      })
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return packages;
    return packages.filter((p) => p.currentClassification === filter);
  }, [packages, filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-12 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
          Significance Gallery
        </p>
        <h1 className="text-5xl sm:text-6xl mb-4" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>
          Public Memory Archive
        </h1>
        <p className="max-w-xl mx-auto text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
          Records of lasting importance — preserved not because they are certain, but because they matter.
        </p>
        <div className="w-24 h-px mx-auto mt-6" style={{ background: "#C88A2D" }} />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-12 justify-center">
        {galleryFilters.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] border transition-colors capitalize"
            style={{
              fontFamily: "var(--font-inter)",
              color: filter === t ? "#C88A2D" : "#898176",
              borderColor: filter === t ? "rgba(200,138,45,0.4)" : "rgba(232,221,197,0.08)",
              background: filter === t ? "rgba(200,138,45,0.05)" : "transparent",
            }}
          >
            {t.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* States */}
      {loading && (
        <div className="py-20 text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-t border-[#C88A2D] rounded-full animate-spin" />
          <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Loading significant records…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-2xl mb-3" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>No historically significant records yet.</p>
          <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Records classified as high significance or historically significant will appear here.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((pkg) => (
            <Link key={pkg.id} href={`/archive/${pkg.id}`} className="block group">
              <article
                className="relative p-8 transition-all duration-300 hover:translate-y-[-3px]"
                style={{
                  background: "linear-gradient(135deg, #1c1a16 0%, #161513 100%)",
                  border: "1px solid rgba(200,138,45,0.2)",
                  boxShadow: pkg.significance === "historic"
                    ? "0 0 30px rgba(200,138,45,0.1), inset 0 0 30px rgba(200,138,45,0.02)"
                    : "0 0 10px rgba(200,138,45,0.05)",
                }}
              >
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-6 h-6" style={{ borderTop: "1.5px solid #C88A2D", borderLeft: "1.5px solid #C88A2D" }} />
                <div className="absolute top-0 right-0 w-6 h-6" style={{ borderTop: "1.5px solid #C88A2D", borderRight: "1.5px solid #C88A2D" }} />
                <div className="absolute bottom-0 left-0 w-6 h-6" style={{ borderBottom: "1.5px solid #C88A2D", borderLeft: "1.5px solid #C88A2D" }} />
                <div className="absolute bottom-0 right-0 w-6 h-6" style={{ borderBottom: "1.5px solid #C88A2D", borderRight: "1.5px solid #C88A2D" }} />

                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
                    {pkg.evidenceType}
                  </span>
                  <span className="text-[10px]" style={{ fontFamily: "var(--font-ibm-mono)", color: "#898176" }}>
                    {pkg.eventDate}
                  </span>
                </div>

                <h2 className="text-2xl mb-3 leading-snug group-hover:text-[#E8DDC5] transition-colors" style={{ fontFamily: "var(--font-cormorant)", color: "#D4C9A8" }}>
                  {pkg.title}
                </h2>

                <p className="text-sm leading-relaxed mb-6 line-clamp-3" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
                  {pkg.claim}
                </p>

                <div className="flex flex-wrap gap-3 mb-4">
                  {pkg.currentClassification && <ClassificationStamp classification={pkg.currentClassification} size="sm" />}
                  {pkg.significance && <SignificanceSeal significance={pkg.significance} />}
                </div>

                {pkg.shortReason && (
                  <p className="text-xs italic mb-4" style={{ fontFamily: "var(--font-inter)", color: "#898176", borderLeft: "2px solid rgba(200,138,45,0.25)", paddingLeft: "10px" }}>
                    &ldquo;{pkg.shortReason}&rdquo;
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t text-[10px]" style={{ borderColor: "rgba(232,221,197,0.06)", fontFamily: "var(--font-inter)", color: "#898176" }}>
                  <span style={{ fontFamily: "var(--font-ibm-mono)" }}>{pkg.depositor.slice(0, 10)}…</span>
                  <span className="group-hover:text-[#C88A2D] transition-colors uppercase tracking-[0.15em]">Open Record →</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
