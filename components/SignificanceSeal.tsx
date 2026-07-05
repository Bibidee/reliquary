import { Significance } from "@/lib/types";

const sigConfig: Record<Significance, { label: string; color: string; glow?: boolean }> = {
  none: { label: "No Significance", color: "#898176" },
  low: { label: "Low Significance", color: "#898176" },
  medium: { label: "Medium Significance", color: "#4A7D9B" },
  high: { label: "High Significance", color: "#C88A2D" },
  historic: { label: "Historic Record", color: "#C88A2D", glow: true },
};

export default function SignificanceSeal({ significance }: { significance: Significance }) {
  const cfg = sigConfig[significance];
  if (significance === "none") return null;
  return (
    <span
      className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]"
      style={{
        fontFamily: "var(--font-inter)",
        color: cfg.color,
        border: `1px solid ${cfg.color}`,
        background: `${cfg.color}10`,
        boxShadow: cfg.glow ? `0 0 8px ${cfg.color}40` : undefined,
      }}
    >
      ◆ {cfg.label}
    </span>
  );
}
