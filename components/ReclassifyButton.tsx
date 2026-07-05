"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet";
import { requestReclassification } from "@/lib/contract";

export default function ReclassifyButton({ packageId, challengeId }: { packageId: number; challengeId: number }) {
  const { address, connect, connecting } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleReclassify = async () => {
    if (!address) { connect(); return; }
    setLoading(true);
    setError("");
    try {
      await requestReclassification(packageId, challengeId, address, setStatus);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Reclassification request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {status && (
        <p className="text-xs mb-2 text-center" style={{ fontFamily: "var(--font-inter)", color: "#4A7D9B" }}>{status}</p>
      )}
      {error && (
        <p className="text-xs mb-2 text-center" style={{ fontFamily: "var(--font-inter)", color: "#8F2E2E" }}>{error}</p>
      )}
      <button
        onClick={handleReclassify}
        disabled={loading || connecting}
        className="w-full py-2.5 text-xs uppercase tracking-[0.2em] border transition-colors disabled:opacity-50"
        style={{ fontFamily: "var(--font-inter)", color: "#4A7D9B", borderColor: "rgba(74,125,155,0.3)", cursor: loading ? "wait" : "pointer" }}
      >
        {!address ? "Connect to Reclassify" : loading ? "Reclassifying…" : "Request Reclassification"}
      </button>
    </div>
  );
}
