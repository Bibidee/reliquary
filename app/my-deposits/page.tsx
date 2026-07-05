"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ClassificationStamp from "@/components/ClassificationStamp";
import PackageStatusPill from "@/components/PackageStatusPill";
import SignificanceSeal from "@/components/SignificanceSeal";
import { useWallet } from "@/lib/wallet";
import { getPackagesByDepositor, requestClassification } from "@/lib/contract";
import { EvidencePackage } from "@/lib/types";

export default function MyDepositsPage() {
  const { address, connect, connecting } = useWallet();
  const [packages, setPackages] = useState<EvidencePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classifyingId, setClassifyingId] = useState<string | null>(null);
  const [classifyStatus, setClassifyStatus] = useState("");

  useEffect(() => {
    if (!address) { setPackages([]); return; }
    setLoading(true);
    setError(null);
    getPackagesByDepositor(address)
      .then(setPackages)
      .catch((e) => setError(e?.message ?? "Failed to load deposits."))
      .finally(() => setLoading(false));
  }, [address]);

  const handleClassify = async (pkgId: string) => {
    if (!address) return;
    setClassifyingId(pkgId);
    setClassifyStatus("Requesting classification…");
    try {
      await requestClassification(Number(pkgId), address, setClassifyStatus);
      // Reload packages
      const updated = await getPackagesByDepositor(address);
      setPackages(updated);
    } catch (e: any) {
      setClassifyStatus(`Failed: ${e?.message ?? "Unknown error"}`);
    } finally {
      setClassifyingId(null);
    }
  };

  if (!address) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-10">
          <h1 className="text-4xl mb-2" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>My Deposits</h1>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Connect your wallet to view your packages</p>
        </div>
        <div className="py-24 text-center">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center" style={{ border: "1.5px solid rgba(200,138,45,0.3)" }}>
            <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "28px", color: "#C88A2D" }}>§</span>
          </div>
          <p className="text-sm mb-6" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
            Connect your MetaMask or Rabby wallet to view evidence packages deposited by your address.
          </p>
          <button
            onClick={connect}
            disabled={connecting}
            className="px-8 py-3 text-sm uppercase tracking-[0.2em]"
            style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600 }}
          >
            {connecting ? "Connecting…" : "Connect Wallet"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-4xl mb-2" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>My Deposits</h1>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
            Packages deposited by <span style={{ fontFamily: "var(--font-ibm-mono)", color: "#C88A2D" }}>{address.slice(0, 10)}…{address.slice(-6)}</span>
          </p>
        </div>
        <Link
          href="/deposit"
          className="px-5 py-2.5 text-xs uppercase tracking-[0.2em] transition-all"
          style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600 }}
        >
          + Deposit
        </Link>
      </div>

      {loading && (
        <div className="py-20 text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-t border-[#C88A2D] rounded-full animate-spin" />
          <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Loading your deposits…</p>
        </div>
      )}

      {!loading && error && (
        <div className="p-4 mb-6" style={{ background: "rgba(143,46,46,0.06)", border: "1px solid rgba(143,46,46,0.2)" }}>
          <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "#8F2E2E" }}>{error}</p>
        </div>
      )}

      {classifyStatus && (
        <div className="p-3 mb-6 text-center" style={{ background: "rgba(200,138,45,0.04)", border: "1px solid rgba(200,138,45,0.15)" }}>
          <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "#C88A2D" }}>{classifyStatus}</p>
        </div>
      )}

      {!loading && !error && packages.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-2xl mb-3" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>No packages deposited yet.</p>
          <p className="text-sm mb-6" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Deposit your first evidence package.</p>
          <Link href="/deposit" className="px-6 py-3 text-xs uppercase tracking-[0.2em] inline-block" style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600 }}>
            Deposit Evidence
          </Link>
        </div>
      )}

      {!loading && packages.length > 0 && (
        <div className="flex flex-col gap-3">
          {packages.map((pkg) => {
            const actionNeeded =
              pkg.status === "pending"
                ? "Awaiting classification"
                : pkg.status === "challenged"
                ? "Challenge requires response"
                : null;

            return (
              <div
                key={pkg.id}
                className="p-5"
                style={{
                  background: "#161513",
                  border: "1px solid rgba(232,221,197,0.08)",
                  borderLeftWidth: "3px",
                  borderLeftColor: actionNeeded ? "#8F2E2E" : "#C88A2D",
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <PackageStatusPill status={pkg.status} />
                      {pkg.currentClassification && <ClassificationStamp classification={pkg.currentClassification} size="sm" />}
                      {pkg.significance && pkg.significance !== "none" && <SignificanceSeal significance={pkg.significance} />}
                    </div>
                    <h3 className="text-base mb-1 line-clamp-1" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>
                      {pkg.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-[10px]" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
                      <span>ID: <span style={{ fontFamily: "var(--font-ibm-mono)" }}>#{pkg.id}</span></span>
                      <span>Challenges: {pkg.challengeCount}</span>
                      <span>Classifications: {pkg.classificationCount}</span>
                    </div>
                    {actionNeeded && (
                      <p className="text-[10px] uppercase tracking-[0.15em] mt-2" style={{ fontFamily: "var(--font-inter)", color: "#8F2E2E" }}>
                        ⚠ {actionNeeded}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link
                      href={`/archive/${pkg.id}`}
                      className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] border"
                      style={{ fontFamily: "var(--font-inter)", color: "#E8DDC5", borderColor: "rgba(232,221,197,0.15)" }}
                    >
                      View
                    </Link>
                    {pkg.status === "pending" && (
                      <button
                        onClick={() => handleClassify(pkg.id)}
                        disabled={classifyingId === pkg.id}
                        className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] disabled:opacity-50"
                        style={{ fontFamily: "var(--font-inter)", color: "#0B0B0A", background: "#C88A2D", fontWeight: 600, cursor: classifyingId === pkg.id ? "wait" : "pointer" }}
                      >
                        {classifyingId === pkg.id ? "Classifying…" : "Request Classification"}
                      </button>
                    )}
                    {pkg.challengeCount > 0 && (
                      <Link
                        href={`/archive/${pkg.id}`}
                        className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] border"
                        style={{ fontFamily: "var(--font-inter)", color: "#8F2E2E", borderColor: "rgba(143,46,46,0.3)" }}
                      >
                        View Challenges
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
