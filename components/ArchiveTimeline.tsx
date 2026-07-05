import { EvidencePackage } from "@/lib/types";

interface TimelineEvent {
  date: string;
  label: string;
  color: string;
}

export default function ArchiveTimeline({ pkg }: { pkg: EvidencePackage }) {
  const events: TimelineEvent[] = [
    { date: pkg.eventDate, label: "Event Occurred", color: "#898176" },
    { date: pkg.captureDate, label: "Evidence Captured", color: "#4A7D9B" },
    { date: pkg.submittedAt.split("T")[0], label: "Package Deposited", color: "#C88A2D" },
  ];

  if (pkg.status !== "pending") {
    events.push({ date: pkg.submittedAt.split("T")[0], label: "Classification Received", color: "#4F6F64" });
  }
  if (pkg.status === "challenged" || pkg.status === "disputed") {
    events.push({ date: "—", label: "Challenge Submitted", color: "#8F2E2E" });
  }

  return (
    <div className="flex flex-col gap-0">
      {events.map((event, i) => (
        <div key={i} className="relative flex gap-4">
          {/* Line */}
          {i < events.length - 1 && (
            <div
              className="absolute left-[5px] top-4 bottom-0 w-px"
              style={{ background: "rgba(232,221,197,0.1)" }}
            />
          )}
          {/* Dot */}
          <div
            className="w-3 h-3 rounded-full shrink-0 mt-1 border-2"
            style={{ borderColor: event.color, background: "#0B0B0A" }}
          />
          <div className="pb-5">
            <p
              className="text-[10px] uppercase tracking-[0.15em]"
              style={{ fontFamily: "var(--font-inter)", color: "#898176" }}
            >
              {event.label}
            </p>
            <p
              className="text-xs"
              style={{ fontFamily: "var(--font-ibm-mono)", color: "#E8DDC5" }}
            >
              {event.date}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
