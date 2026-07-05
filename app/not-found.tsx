import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div
        className="w-20 h-20 mx-auto mb-6 flex items-center justify-center"
        style={{ border: "1.5px solid rgba(200,138,45,0.3)" }}
      >
        <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "32px", color: "#C88A2D" }}>§</span>
      </div>
      <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
        404 — Record Not Found
      </p>
      <h1 className="text-4xl mb-4" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>
        Package Not in Archive
      </h1>
      <p className="text-sm mb-8 max-w-md" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
        This evidence package does not exist or has not been sealed on GenLayer Studionet.
      </p>
      <div className="flex gap-3">
        <Link
          href="/archive"
          className="px-6 py-2.5 text-xs uppercase tracking-[0.2em] border"
          style={{ fontFamily: "var(--font-inter)", color: "#C88A2D", borderColor: "rgba(200,138,45,0.3)" }}
        >
          Browse Archive
        </Link>
        <Link
          href="/deposit"
          className="px-6 py-2.5 text-xs uppercase tracking-[0.2em]"
          style={{ fontFamily: "var(--font-inter)", background: "#C88A2D", color: "#0B0B0A", fontWeight: 600 }}
        >
          Deposit Evidence
        </Link>
      </div>
    </div>
  );
}
