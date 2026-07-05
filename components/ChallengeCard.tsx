import { Challenge } from "@/lib/types";

const challengeTypeLabels: Record<string, string> = {
  manipulation_claim: "Manipulation Claim",
  missing_context: "Missing Context",
  wrong_classification: "Wrong Classification",
  false_claim: "False Claim",
  source_dead: "Source Dead",
  stronger_evidence_available: "Stronger Evidence Available",
  privacy_or_safety_concern: "Privacy / Safety Concern",
};

const statusColors: Record<string, string> = {
  open: "#8F2E2E",
  reviewed: "#C88A2D",
  resolved: "#4F6F64",
};

export default function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const typeLabel = challengeTypeLabels[challenge.challengeType] || challenge.challengeType;
  const statusColor = statusColors[challenge.status] || "#898176";

  return (
    <div
      className="p-4"
      style={{
        background: "#161513",
        border: "1px solid rgba(143,46,46,0.2)",
        borderLeftWidth: "3px",
        borderLeftColor: "#8F2E2E",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span
            className="text-[10px] uppercase tracking-[0.15em] px-2 py-0.5"
            style={{
              fontFamily: "var(--font-inter)",
              color: "#8F2E2E",
              border: "1px solid rgba(143,46,46,0.3)",
              background: "rgba(143,46,46,0.05)",
            }}
          >
            {typeLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] uppercase tracking-[0.12em]"
            style={{ fontFamily: "var(--font-inter)", color: statusColor }}
          >
            {challenge.status}
          </span>
        </div>
      </div>

      <p
        className="text-xs mb-3 leading-relaxed"
        style={{ fontFamily: "var(--font-inter)", color: "#E8DDC5" }}
      >
        {challenge.challengeNote}
      </p>

      {challenge.counterEvidence.length > 0 && (
        <div className="mb-3">
          <p
            className="text-[10px] uppercase tracking-[0.15em] mb-1"
            style={{ fontFamily: "var(--font-inter)", color: "#898176" }}
          >
            Counter-Evidence
          </p>
          {challenge.counterEvidence.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs hover:underline truncate"
              style={{ fontFamily: "var(--font-ibm-mono)", color: "#4A7D9B" }}
            >
              {url}
            </a>
          ))}
        </div>
      )}

      <div
        className="flex items-center justify-between pt-2 border-t text-[10px]"
        style={{ borderColor: "rgba(232,221,197,0.06)", fontFamily: "var(--font-inter)", color: "#898176" }}
      >
        <span style={{ fontFamily: "var(--font-ibm-mono)" }}>{challenge.challenger}</span>
        <span>{new Date(challenge.submittedAt).toLocaleDateString()}</span>
      </div>

      <div
        className="mt-3 p-2 text-[10px]"
        style={{
          fontFamily: "var(--font-inter)",
          color: "#898176",
          background: "rgba(232,221,197,0.03)",
          border: "1px solid rgba(232,221,197,0.06)",
        }}
      >
        A challenge does not erase the original package. It adds a competing interpretation to the archive.
      </div>
    </div>
  );
}
