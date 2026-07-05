export type Classification =
  | "authentic"
  | "weak"
  | "manipulated"
  | "incomplete"
  | "historically_significant"
  | "context_required"
  | "unverifiable"
  | "disputed";

export type Confidence = "low" | "medium" | "high";
export type ManipulationRisk = "low" | "medium" | "high" | "unknown";
export type Significance = "none" | "low" | "medium" | "high" | "historic";
export type SourceAlignment = "strong" | "partial" | "weak" | "contradictory" | "unverifiable";
export type PreservationPriority = "standard" | "elevated" | "urgent" | "restricted_review";
export type PackageStatus = "pending" | "classified" | "challenged" | "reclassified" | "archived";
export type SensitivityLevel = "public" | "limited" | "sensitive";

export type EvidenceType =
  | "document"
  | "screenshot"
  | "video"
  | "audio"
  | "transaction"
  | "statement"
  | "archive"
  | "mixed";

export type ChallengeType =
  | "manipulation_claim"
  | "missing_context"
  | "wrong_classification"
  | "false_claim"
  | "source_dead"
  | "stronger_evidence_available"
  | "privacy_or_safety_concern";

export interface EvidencePackage {
  id: string;
  depositor: string;
  title: string;
  claim: string;
  evidenceType: EvidenceType;
  eventDate: string;
  captureDate: string;
  submittedAt: string;
  primarySources: string[];
  supportingSources: string[];
  fileHashes: string[];
  archiveLinks: string[];
  contextNote: string;
  knownLimitations?: string;
  knownDisputes?: string;
  whyMatters?: string;
  sensitivityLevel: SensitivityLevel;
  requestedClassification: Classification | "";
  historicalSignificanceNote?: string;
  status: PackageStatus;
  currentClassification: Classification | "";
  confidence: Confidence | "";
  manipulationRisk: ManipulationRisk | "";
  significance: Significance | "";
  sourceAlignment: SourceAlignment | "";
  preservationPriority: PreservationPriority | "";
  shortReason: string;
  challengeCount: number;
  classificationCount: number;
}

export interface Challenge {
  id: string;
  packageId: string;
  challenger: string;
  challengeType: ChallengeType;
  counterEvidence: string[];
  archiveLinks: string[];
  hashes: string[];
  challengeNote: string;
  status: "open" | "reviewed" | "resolved";
  submittedAt: string;
}

export interface ClassificationRecord {
  id: string;
  packageId: string;
  classification: Classification;
  confidence: Confidence;
  manipulationRisk: ManipulationRisk;
  significance: Significance;
  sourceAlignment: SourceAlignment;
  preservationPriority: PreservationPriority;
  shortReason: string;
  reasonType: "initial" | "reclassification";
  timestamp: string;
}
