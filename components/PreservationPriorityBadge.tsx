import { PreservationPriority } from "@/lib/types";

const priorityConfig: Record<PreservationPriority, { label: string; color: string }> = {
  standard: { label: "Standard Priority", color: "#898176" },
  elevated: { label: "Elevated Priority", color: "#4A7D9B" },
  urgent: { label: "Urgent Priority", color: "#C88A2D" },
  restricted_review: { label: "Restricted Review", color: "#8F2E2E" },
};

export default function PreservationPriorityBadge({ priority }: { priority: PreservationPriority }) {
  const cfg = priorityConfig[priority];
  return (
    <span
      className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]"
      style={{
        fontFamily: "var(--font-inter)",
        color: cfg.color,
        border: `1px solid ${cfg.color}20`,
        background: `${cfg.color}0a`,
      }}
    >
      {cfg.label}
    </span>
  );
}
