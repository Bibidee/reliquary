import { Confidence } from "@/lib/types";

const levels: Record<Confidence, { bars: number; color: string; label: string }> = {
  low: { bars: 1, color: "#8F2E2E", label: "Low Confidence" },
  medium: { bars: 2, color: "#C88A2D", label: "Medium Confidence" },
  high: { bars: 3, color: "#4F6F64", label: "High Confidence" },
};

export default function ConfidenceMeter({ confidence }: { confidence: Confidence }) {
  const cfg = levels[confidence];
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-2 h-4"
            style={{
              background: i <= cfg.bars ? cfg.color : "rgba(137,129,118,0.15)",
            }}
          />
        ))}
      </div>
      <span
        className="text-[10px] uppercase tracking-[0.1em]"
        style={{ fontFamily: "var(--font-inter)", color: cfg.color }}
      >
        {cfg.label}
      </span>
    </div>
  );
}
