export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-t border-[#C88A2D] rounded-full animate-spin" />
      <p
        className="text-[10px] uppercase tracking-[0.3em]"
        style={{ fontFamily: "var(--font-inter)", color: "#898176" }}
      >
        Loading archive…
      </p>
    </div>
  );
}
