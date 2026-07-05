import { ClassificationRecord } from "@/lib/types";
import ClassificationStamp from "./ClassificationStamp";
import ConfidenceMeter from "./ConfidenceMeter";
import ManipulationRiskTag from "./ManipulationRiskTag";

export default function ClassificationHistory({ records }: { records: ClassificationRecord[] }) {
  if (records.length === 0) {
    return (
      <div
        className="py-8 text-center text-sm"
        style={{ fontFamily: "var(--font-inter)", color: "#898176" }}
      >
        No classification records yet.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div
        className="absolute left-4 top-0 bottom-0 w-px"
        style={{ background: "rgba(200,138,45,0.15)" }}
      />

      <div className="flex flex-col gap-0">
        {records.map((record, i) => (
          <div key={record.id} className="relative pl-12 pb-8">
            {/* Timeline dot */}
            <div
              className="absolute left-3 top-1.5 w-2.5 h-2.5 rounded-full border"
              style={{
                background: "#0B0B0A",
                borderColor: "#C88A2D",
              }}
            />

            {/* Record number */}
            <div
              className="text-[9px] uppercase tracking-[0.2em] mb-2"
              style={{ fontFamily: "var(--font-inter)", color: "#898176" }}
            >
              Classification #{records.length - i} ·{" "}
              {record.reasonType === "reclassification" ? "Reclassification" : "Initial Classification"} ·{" "}
              {new Date(record.timestamp).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>

            <div
              className="p-4"
              style={{
                background: "#161513",
                border: "1px solid rgba(232,221,197,0.08)",
              }}
            >
              <div className="mb-3">
                <ClassificationStamp classification={record.classification} size="sm" animate />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <ConfidenceMeter confidence={record.confidence} />
                <ManipulationRiskTag risk={record.manipulationRisk} />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]" style={{ fontFamily: "var(--font-inter)" }}>
                <div>
                  <span style={{ color: "#898176" }}>Significance: </span>
                  <span style={{ color: "#E8DDC5" }} className="capitalize">{record.significance}</span>
                </div>
                <div>
                  <span style={{ color: "#898176" }}>Source Alignment: </span>
                  <span style={{ color: "#E8DDC5" }} className="capitalize">{record.sourceAlignment.replace("_", " ")}</span>
                </div>
                <div>
                  <span style={{ color: "#898176" }}>Preservation: </span>
                  <span style={{ color: "#E8DDC5" }} className="capitalize">{record.preservationPriority.replace("_", " ")}</span>
                </div>
              </div>

              <p
                className="text-xs italic leading-relaxed"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: "#898176",
                  borderLeft: "2px solid rgba(200,138,45,0.3)",
                  paddingLeft: "10px",
                }}
              >
                &ldquo;{record.shortReason}&rdquo;
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
