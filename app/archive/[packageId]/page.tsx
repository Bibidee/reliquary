import { notFound } from "next/navigation";
import Link from "next/link";
import { getPackage, getChallenges, getClassificationRecords } from "@/lib/contract";
import ClassificationStamp from "@/components/ClassificationStamp";
import PackageStatusPill from "@/components/PackageStatusPill";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import ManipulationRiskTag from "@/components/ManipulationRiskTag";
import SignificanceSeal from "@/components/SignificanceSeal";
import SourceAlignmentBar from "@/components/SourceAlignmentBar";
import PreservationPriorityBadge from "@/components/PreservationPriorityBadge";
import EvidenceSourceList from "@/components/EvidenceSourceList";
import ClassificationHistory from "@/components/ClassificationHistory";
import ChallengeCard from "@/components/ChallengeCard";
import ArchiveTimeline from "@/components/ArchiveTimeline";
import ClassifyButton from "@/components/ClassifyButton";
import ReclassifyButton from "@/components/ReclassifyButton";

export default async function PackageDetailPage({ params }: { params: Promise<{ packageId: string }> }) {
  const { packageId } = await params;
  const id = parseInt(packageId, 10);

  let pkg;
  try {
    pkg = await getPackage(isNaN(id) ? 0 : id);
  } catch {
    notFound();
  }

  if (!pkg) notFound();

  const [challenges, history] = await Promise.all([
    getChallenges(isNaN(id) ? 0 : id).catch(() => []),
    getClassificationRecords(isNaN(id) ? 0 : id).catch(() => []),
  ]);

  const isClassified = !!pkg.currentClassification;
  const sectionLabel = "text-[10px] uppercase tracking-[0.2em] mb-3";
  const sectionStyle = { fontFamily: "var(--font-inter)" as const, color: "#898176" };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-[10px] uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
        <Link href="/archive" className="hover:text-[#C88A2D] transition-colors">Archive</Link>
        <span>·</span>
        <span style={{ color: "#E8DDC5" }}>#{pkg.id}</span>
      </div>

      {/* Header */}
      <div className="mb-10 pb-8 border-b" style={{ borderColor: "rgba(232,221,197,0.08)" }}>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <PackageStatusPill status={pkg.status} />
          {isClassified && pkg.currentClassification && <ClassificationStamp classification={pkg.currentClassification} size="lg" animate />}
          {pkg.significance && pkg.significance !== "none" && <SignificanceSeal significance={pkg.significance} />}
        </div>
        <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "var(--font-cormorant)", color: "#E8DDC5" }}>
          {pkg.title}
        </h1>
        <div className="flex flex-wrap gap-4 text-xs" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
          <span>Package <span style={{ fontFamily: "var(--font-ibm-mono)" }}>#{pkg.id}</span></span>
          <span>·</span>
          <span>Deposited by <span style={{ fontFamily: "var(--font-ibm-mono)" }}>{pkg.depositor.slice(0, 10)}…{pkg.depositor.slice(-6)}</span></span>
          <span>·</span>
          <span>Event: {pkg.eventDate}</span>
          {pkg.captureDate && <><span>·</span><span>Captured: {pkg.captureDate}</span></>}
        </div>
      </div>

      {/* Sensitivity warning */}
      {pkg.sensitivityLevel && pkg.sensitivityLevel !== "public" && (
        <div className="mb-8 p-4" style={{ background: "rgba(143,46,46,0.06)", border: "1px solid rgba(143,46,46,0.2)" }}>
          <p className="text-xs uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-inter)", color: "#8F2E2E" }}>
            ⚠ Sensitivity Level: {pkg.sensitivityLevel.toUpperCase()} — Review content carefully before interpretation.
          </p>
        </div>
      )}

      {/* Challenge alert */}
      {challenges.length > 0 && (
        <div className="mb-8 p-4" style={{ background: "rgba(143,46,46,0.04)", border: "1px solid rgba(143,46,46,0.25)", borderLeftWidth: "3px", borderLeftColor: "#8F2E2E" }}>
          <p className="text-xs uppercase tracking-[0.15em] mb-1" style={{ fontFamily: "var(--font-inter)", color: "#8F2E2E" }}>
            ⚠ This package has {challenges.length} active challenge{challenges.length > 1 ? "s" : ""}
          </p>
          <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
            Review classification history and challenges before drawing conclusions.
          </p>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Claim panel */}
          <div className="p-6" style={{ background: "#161513", border: "1px solid rgba(232,221,197,0.08)" }}>
            <div className="mb-4 pb-3 border-b" style={{ borderColor: "rgba(232,221,197,0.06)" }}>
              <p className={sectionLabel} style={sectionStyle}>Submitted Claim</p>
              <p className="text-[10px] px-2 py-1 inline-block" style={{ fontFamily: "var(--font-inter)", color: "#898176", background: "rgba(137,129,118,0.08)", border: "1px solid rgba(137,129,118,0.15)" }}>
                Submitted claim, not automatic fact.
              </p>
            </div>
            <p className="text-base leading-relaxed mb-6" style={{ fontFamily: "var(--font-inter)", color: "#E8DDC5" }}>
              {pkg.claim}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className={sectionLabel} style={sectionStyle}>Evidence Type</p>
                <p className="text-sm capitalize" style={{ fontFamily: "var(--font-inter)", color: "#E8DDC5" }}>{pkg.evidenceType}</p>
              </div>
              {pkg.requestedClassification && (
                <div>
                  <p className={sectionLabel} style={sectionStyle}>Requested Classification</p>
                  <p className="text-sm capitalize" style={{ fontFamily: "var(--font-inter)", color: "#E8DDC5" }}>{pkg.requestedClassification.replace(/_/g, " ")}</p>
                </div>
              )}
              {pkg.sensitivityLevel && (
                <div>
                  <p className={sectionLabel} style={sectionStyle}>Sensitivity</p>
                  <p className="text-sm capitalize" style={{ fontFamily: "var(--font-inter)", color: "#E8DDC5" }}>{pkg.sensitivityLevel}</p>
                </div>
              )}
            </div>

            {pkg.contextNote && (
              <div className="mt-6 pt-4 border-t" style={{ borderColor: "rgba(232,221,197,0.06)" }}>
                <p className={sectionLabel} style={sectionStyle}>Context Note</p>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>{pkg.contextNote}</p>
              </div>
            )}
            {pkg.knownLimitations && (
              <div className="mt-4">
                <p className={sectionLabel} style={sectionStyle}>Known Limitations</p>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>{pkg.knownLimitations}</p>
              </div>
            )}
            {pkg.knownDisputes && (
              <div className="mt-4">
                <p className={sectionLabel} style={sectionStyle}>Known Disputes</p>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>{pkg.knownDisputes}</p>
              </div>
            )}
            {pkg.whyMatters && (
              <div className="mt-4">
                <p className={sectionLabel} style={sectionStyle}>Why This Proof Matters</p>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>{pkg.whyMatters}</p>
              </div>
            )}
          </div>

          {/* Source panel */}
          <div className="p-6" style={{ background: "#161513", border: "1px solid rgba(232,221,197,0.08)" }}>
            <p className={sectionLabel} style={sectionStyle}>Evidence Sources</p>
            <EvidenceSourceList
              primarySources={pkg.primarySources}
              supportingSources={pkg.supportingSources}
              archiveLinks={pkg.archiveLinks}
              fileHashes={pkg.fileHashes}
            />
          </div>

          {/* Classification History */}
          <div className="p-6" style={{ background: "#161513", border: "1px solid rgba(232,221,197,0.08)" }}>
            <p className={sectionLabel} style={sectionStyle}>Classification History — {history.length} record{history.length !== 1 ? "s" : ""}</p>
            <ClassificationHistory records={history} />
          </div>

          {/* Challenges */}
          <div className="p-6" style={{ background: "#161513", border: "1px solid rgba(232,221,197,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className={sectionLabel} style={sectionStyle}>Challenges — {challenges.length}</p>
              <Link
                href={`/archive/${pkg.id}/challenge`}
                className="text-xs uppercase tracking-[0.15em] px-3 py-1.5 border transition-colors"
                style={{ fontFamily: "var(--font-inter)", color: "#8F2E2E", borderColor: "rgba(143,46,46,0.3)" }}
              >
                Submit Challenge
              </Link>
            </div>
            {challenges.length === 0 ? (
              <p className="text-xs py-4" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
                No one has challenged this classification yet.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {challenges.map((ch) => <ChallengeCard key={ch.id} challenge={ch} />)}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-6">
          <div className="p-6 sticky top-20" style={{ background: "#161513", border: "1px solid rgba(232,221,197,0.08)" }}>
            <p className={sectionLabel} style={sectionStyle}>Classification Panel</p>

            {!isClassified ? (
              <div className="py-6 text-center">
                <p className="text-sm mb-4" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
                  This package is sealed but not yet classified. Request GenLayer classification to generate its first archival label.
                </p>
                <ClassifyButton packageId={Number(pkg.id)} />
              </div>
            ) : (
              <div>
                <div className="mb-6 p-4" style={{ background: "rgba(22,21,19,0.8)", border: "1px solid rgba(232,221,197,0.06)" }}>
                  <p className="text-[9px] uppercase tracking-[0.2em] mb-3" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Consensus Result</p>
                  <div className="mb-3">
                    {pkg.currentClassification && <ClassificationStamp classification={pkg.currentClassification} size="lg" animate />}
                  </div>
                  {pkg.confidence && <div className="mb-3"><ConfidenceMeter confidence={pkg.confidence} /></div>}
                  {pkg.manipulationRisk && <div className="mb-3"><ManipulationRiskTag risk={pkg.manipulationRisk} /></div>}
                  {pkg.significance && pkg.significance !== "none" && <div className="mb-2"><SignificanceSeal significance={pkg.significance} /></div>}
                </div>

                <div className="flex flex-col gap-3 mb-6">
                  {pkg.sourceAlignment && (
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Source Alignment</p>
                      <SourceAlignmentBar alignment={pkg.sourceAlignment} />
                    </div>
                  )}
                  {pkg.preservationPriority && (
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>Preservation Priority</p>
                      <PreservationPriorityBadge priority={pkg.preservationPriority} />
                    </div>
                  )}
                </div>

                {pkg.shortReason && (
                  <div className="p-3 mb-4" style={{ background: "rgba(232,221,197,0.03)", border: "1px solid rgba(232,221,197,0.06)", borderLeft: "2px solid rgba(200,138,45,0.3)" }}>
                    <p className="text-xs italic leading-relaxed" style={{ fontFamily: "var(--font-inter)", color: "#898176" }}>
                      &ldquo;{pkg.shortReason}&rdquo;
                    </p>
                  </div>
                )}

                {challenges.length > 0 && (
                  <ReclassifyButton packageId={Number(pkg.id)} challengeId={0} />
                )}
              </div>
            )}
          </div>

          <div className="p-6" style={{ background: "#161513", border: "1px solid rgba(232,221,197,0.08)" }}>
            <p className={sectionLabel} style={sectionStyle}>Archival Timeline</p>
            <ArchiveTimeline pkg={pkg} />
          </div>
        </div>
      </div>
    </div>
  );
}
