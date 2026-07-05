import { ManipulationRisk } from "@/lib/types";

const riskConfig: Record<ManipulationRisk, { label: string; color: string }> = {
  low: { label: "Risk: Low", color: "#4F6F64" },
  medium: { label: "Risk: Medium", color: "#C88A2D" },
  high: { label: "Risk: High", color: "#8F2E2E" },
  unknown: { label: "Risk: Unknown", color: "#898176" },
};

export default function ManipulationRiskTag({ risk }: { risk: ManipulationRisk }) {
  const cfg = riskConfig[risk];
  return (
    <span
      className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]"
      style={{
        fontFamily: "var(--font-inter)",
        color: cfg.color,
        border: `1px solid ${cfg.color}`,
        background: `${cfg.color}0d`,
      }}
    >
      {cfg.label}
    </span>
  );
}
