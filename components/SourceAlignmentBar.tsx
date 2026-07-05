import { SourceAlignment } from "@/lib/types";

const alignConfig: Record<SourceAlignment, { label: string; fill: number; color: string }> = {
  strong: { label: "Strong Alignment", fill: 100, color: "#4F6F64" },
  partial: { label: "Partial Alignment", fill: 60, color: "#C88A2D" },
  weak: { label: "Weak Alignment", fill: 30, color: "#898176" },
  contradictory: { label: "Contradictory", fill: 20, color: "#8F2E2E" },
  unverifiable: { label: "Unverifiable", fill: 0, color: "#898176" },
};

export default function SourceAlignmentBar({ alignment }: { alignment: SourceAlignment }) {
  const cfg = alignConfig[alignment];
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1"
        style={{ background: "rgba(137,129,118,0.15)" }}
      >
        <div
          className="h-full transition-all"
          style={{ width: `${cfg.fill}%`, background: cfg.color }}
        />
      </div>
      <span
        className="text-[10px] uppercase tracking-[0.1em] whitespace-nowrap"
        style={{ fontFamily: "var(--font-inter)", color: cfg.color }}
      >
        {cfg.label}
      </span>
    </div>
  );
}
