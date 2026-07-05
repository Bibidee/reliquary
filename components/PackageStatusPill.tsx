import { PackageStatus } from "@/lib/types";

const statusConfig: Record<PackageStatus, { label: string; color: string; dot: string }> = {
  pending: { label: "Pending", color: "#898176", dot: "#898176" },
  classified: { label: "Classified", color: "#4F6F64", dot: "#4F6F64" },
  challenged: { label: "Challenged", color: "#8F2E2E", dot: "#8F2E2E" },
  reclassified: { label: "Reclassified", color: "#4A7D9B", dot: "#4A7D9B" },
  archived: { label: "Archived", color: "#C88A2D", dot: "#C88A2D" },
};

export default function PackageStatusPill({ status }: { status: string }) {
  const cfg = statusConfig[status as PackageStatus] ?? { label: status, color: "#898176", dot: "#898176" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em]"
      style={{
        fontFamily: "var(--font-inter)",
        color: cfg.color,
        border: `1px solid ${cfg.color}`,
        background: `${cfg.color}0f`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}
