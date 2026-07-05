"use client";
import { useState, useMemo, useEffect } from "react";
import EvidencePackageCard from "@/components/EvidencePackageCard";
import { Classification, PackageStatus, EvidencePackage } from "@/lib/types";
import { getAllPackages } from "@/lib/contract";

const classificationOptions: { value: Classification | "all"; label: string }[] = [
  { value: "all", label: "All Classifications" },
  { value: "authentic", label: "Authentic" },
  { value: "weak", label: "Weak" },
  { value: "manipulated", label: "Manipulated" },
  { value: "incomplete", label: "Incomplete" },
  { value: "historically_significant", label: "Historically Significant" },
  { value: "context_required", label: "Context Required" },
  { value: "unverifiable", label: "Unverifiable" },
  { value: "disputed", label: "Disputed" },
];

const statusOptions: { value: PackageStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "classified", label: "Classified" },
  { value: "challenged", label: "Challenged" },
  { value: "reclassified", label: "Reclassified" },
  { value: "archived", label: "Archived" },
];

export default function ArchivePage() {
  const [packages, setPackages] = useState<EvidencePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<Classification | "all">("all");
  const [statusFilter, setStatusFilter] = useState<PackageStatus | "all">("all");
  const [challengedOnly, setChallengedOnly] = useState(false);
  const [sort, setSort] = useState<"newest" | "significant">("newest");

  useEffect(() => {
    getAllPackages()
      .then(setPackages)
      .catch((e) => setError(e?.message ?? "Failed to load archive."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let pkgs = [...packages];

    if (search) {
      const q = search.toLowerCase();
      pkgs = pkgs.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.claim.toLowerCase().includes(q) ||
          p.depositor.toLowerCase().includes(q) ||
          p.fileHashes.some((h) => h.toLowerCase().includes(q)) ||
          p.primarySources.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (classFilter !== "all") {
      pkgs = pkgs.filter((p) => p.currentClassification === classFilter);
    }

    if (statusFilter !== "all") {
      pkgs = pkgs.filter((p) => p.status === statusFilter);
    }

    if (challengedOnly) {
      pkgs = pkgs.filter((p) => p.challengeCount > 0);
    }

    if (sort === "significant") {
      const sigOrder = { historic: 0, high: 1, medium: 2, low: 3, none: 4, "": 5 };
      pkgs.sort((a, b) => (sigOrder[a.significance as keyof typeof sigOrder] ?? 5) - (sigOrder[b.significance as keyof typeof sigOrder] ?? 5));
    } else {
      pkgs.sort((a, b) => Number(b.id) - Number(a.id));
    }

    return pkgs;
  }, [packages, search, classFilter, statusFilter, challengedOnly, sort]);

  const inputStyle = {
    background: "#161513",
    border: "1px solid rgba(232,221,197,0.1)",
    color: "#E8DDC5",
    fontFamily: "var(--font-inter)",
    fontSize: "12px",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-10">
        <h1 className="text-4xl mb-2" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>
          Evidence Archive
        </h1>
        <p className="text-xs uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
          {loading ? "Loading…" : `${filtered.length} package${filtered.length !== 1 ? "s" : ""} · Public record`}
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <input
          type="text"
          placeholder="Search title, claim, hash, depositor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 col-span-1 sm:col-span-2 lg:col-span-1 outline-none"
          style={inputStyle}
        />
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value as any)} className="px-3 py-2 outline-none" style={inputStyle}>
          {classificationOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-2 outline-none" style={inputStyle}>
          {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="px-3 py-2 outline-none" style={inputStyle}>
          <option value="newest">Newest First</option>
          <option value="significant">Most Significant</option>
        </select>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setChallengedOnly(!challengedOnly)}
          className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] px-3 py-1.5 border transition-colors"
          style={{
            fontFamily: "var(--font-inter)",
            color: challengedOnly ? "#8F2E2E" : "#898176",
            borderColor: challengedOnly ? "rgba(143,46,46,0.4)" : "rgba(232,221,197,0.1)",
            background: challengedOnly ? "rgba(143,46,46,0.06)" : "transparent",
          }}
        >
          {challengedOnly ? "✓ " : ""}Challenged Only
        </button>
      </div>

      {/* States */}
      {loading && (
        <div className="py-20 text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-t border-[#C88A2D] rounded-full animate-spin" />
          <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Loading archive from studionet…</p>
        </div>
      )}

      {!loading && error && (
        <div className="py-16 text-center">
          <p className="text-2xl mb-3" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>Archive unavailable</p>
          <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>{error}</p>
          <p className="text-xs mt-2" style={{ fontFamily: "var(--font-inter)", color: "#4F6F64" }}>Make sure the contract is deployed and NEXT_PUBLIC_CONTRACT_ADDRESS is set.</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-2xl mb-3" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>
            {packages.length === 0 ? "No proofs have been sealed yet." : "No packages match your filters."}
          </p>
          <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
            {packages.length === 0 ? "Deposit the first evidence package and let Reliquary classify its strength." : "Try adjusting your search or filters."}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((pkg) => (
            <EvidencePackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </div>
  );
}
