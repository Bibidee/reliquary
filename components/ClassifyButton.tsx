"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet";
import { requestClassification } from "@/lib/contract";

export default function ClassifyButton({ packageId }: { packageId: number }) {
  const { address, connect, connecting } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleClassify = async () => {
    if (!address) { connect(); return; }
    setLoading(true);
    setError("");
    try {
      await requestClassification(packageId, address, setStatus);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Classification request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {status && (
        <p className="text-xs mb-3 text-center" style={{ fontFamily: "var(--font-inter)", color: "#C88A2D" }}>{status}</p>
      )}
      {error && (
        <p className="text-xs mb-3 text-center" style={{ fontFamily: "var(--font-inter)", color: "#8F2E2E" }}>{error}</p>
      )}
      <button
        onClick={handleClassify}
        disabled={loading || connecting}
        className="w-full py-3 text-xs uppercase tracking-[0.2em] transition-colors disabled:opacity-50"
        style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600, cursor: loading ? "wait" : "pointer" }}
      >
        {!address ? "Connect Wallet to Classify" : loading ? "Classifying…" : "Request GenLayer Classification"}
      </button>
    </div>
  );
}
