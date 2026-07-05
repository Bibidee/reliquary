import { Classification } from "@/lib/types";

const stampConfig: Record<
  Classification,
  { label: string; color: string; bg: string; border: string; rotate: string }
> = {
  authentic: {
    label: "Authentic",
    color: "#C88A2D",
    bg: "rgba(200,138,45,0.08)",
    border: "#C88A2D",
    rotate: "-2deg",
  },
  weak: {
    label: "Weak",
    color: "#898176",
    bg: "rgba(137,129,118,0.06)",
    border: "#898176",
    rotate: "1deg",
  },
  manipulated: {
    label: "Manipulated",
    color: "#8F2E2E",
    bg: "rgba(143,46,46,0.08)",
    border: "#8F2E2E",
    rotate: "-1.5deg",
  },
  incomplete: {
    label: "Incomplete",
    color: "#898176",
    bg: "rgba(137,129,118,0.04)",
    border: "#898176",
    rotate: "0.5deg",
  },
  historically_significant: {
    label: "Historically Significant",
    color: "#C88A2D",
    bg: "rgba(200,138,45,0.1)",
    border: "#C88A2D",
    rotate: "-1deg",
  },
  context_required: {
    label: "Context Required",
    color: "#4A7D9B",
    bg: "rgba(74,125,155,0.08)",
    border: "#4A7D9B",
    rotate: "1.5deg",
  },
  unverifiable: {
    label: "Unverifiable",
    color: "#4F6F64",
    bg: "rgba(79,111,100,0.06)",
    border: "#4F6F64",
    rotate: "-0.5deg",
  },
  disputed: {
    label: "Disputed",
    color: "#8F2E2E",
    bg: "rgba(74,125,155,0.05)",
    border: "#8F2E2E",
    rotate: "2deg",
  },
};

interface Props {
  classification: Classification;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export default function ClassificationStamp({ classification, size = "md", animate = false }: Props) {
  const cfg = stampConfig[classification];

  const sizeStyles = {
    sm: { fontSize: "9px", padding: "2px 6px", letterSpacing: "0.2em" },
    md: { fontSize: "10px", padding: "4px 10px", letterSpacing: "0.2em" },
    lg: { fontSize: "13px", padding: "8px 18px", letterSpacing: "0.25em" },
  };

  return (
    <span
      className={animate ? "stamp-press inline-block" : "inline-block"}
      style={{
        ...sizeStyles[size],
        fontFamily: "var(--font-inter)",
        fontWeight: 700,
        textTransform: "uppercase",
        color: cfg.color,
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        transform: `rotate(${cfg.rotate})`,
        opacity: classification === "weak" || classification === "unverifiable" ? 0.7 : 1,
        borderStyle: classification === "incomplete" ? "dashed" : "solid",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}
