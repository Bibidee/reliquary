import { TransactionStatus } from "genlayer-js/types";
import { getReadClient, getWriteClient, CONTRACT_ADDRESS } from "./genlayer";
import type { EvidencePackage, Challenge, ClassificationRecord } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapPackage(raw: any): EvidencePackage {
  return {
    id: String(raw.id ?? raw.pkg_id ?? ""),
    depositor: raw.depositor ?? "",
    title: raw.title ?? "",
    claim: raw.claim ?? "",
    evidenceType: raw.evidence_type ?? "document",
    eventDate: raw.event_date ?? "",
    captureDate: raw.capture_date ?? "",
    submittedAt: raw.submitted_at ?? "",
    primarySources: raw.primary_sources ?? [],
    supportingSources: raw.supporting_sources ?? [],
    fileHashes: raw.file_hashes ?? [],
    archiveLinks: raw.archive_links ?? [],
    contextNote: raw.context_note ?? "",
    knownLimitations: raw.known_limitations || undefined,
    knownDisputes: raw.known_disputes || undefined,
    whyMatters: raw.why_matters || undefined,
    sensitivityLevel: raw.sensitivity_level ?? "public",
    requestedClassification: raw.requested_classification || undefined,
    historicalSignificanceNote: raw.historical_significance_note || undefined,
    status: raw.status ?? "pending",
    currentClassification: raw.current_classification || undefined,
    confidence: raw.confidence || undefined,
    manipulationRisk: raw.manipulation_risk || undefined,
    significance: raw.significance || undefined,
    sourceAlignment: raw.source_alignment || undefined,
    preservationPriority: raw.preservation_priority || undefined,
    shortReason: raw.short_reason || undefined,
    challengeCount: Number(raw.challenge_count ?? 0),
    classificationCount: Number(raw.classification_count ?? 0),
  };
}

function mapChallenge(raw: any): Challenge {
  return {
    id: String(raw.id ?? ""),
    packageId: String(raw.package_id ?? ""),
    challenger: raw.challenger ?? "",
    challengeType: raw.challenge_type ?? "manipulation_claim",
    counterEvidence: raw.counter_evidence ?? [],
    archiveLinks: raw.archive_links ?? [],
    hashes: raw.hashes ?? [],
    challengeNote: raw.challenge_note ?? "",
    status: raw.status ?? "open",
    submittedAt: raw.submitted_at ?? "",
  };
}

function mapRecord(raw: any): ClassificationRecord {
  return {
    id: String(raw.id ?? ""),
    packageId: String(raw.package_id ?? ""),
    classification: raw.classification ?? "unverifiable",
    confidence: raw.confidence ?? "low",
    manipulationRisk: raw.manipulation_risk ?? "unknown",
    significance: raw.significance ?? "none",
    sourceAlignment: raw.source_alignment ?? "unverifiable",
    preservationPriority: raw.preservation_priority ?? "standard",
    shortReason: raw.short_reason ?? "",
    reasonType: raw.reason_type ?? "initial",
    timestamp: raw.timestamp ?? "",
  };
}

async function waitForFinalized(hash: `0x${string}`, address: string) {
  const client = getWriteClient(address);
  return client.waitForTransactionReceipt({
    hash: hash as any,
    status: TransactionStatus.FINALIZED,
    retries: 80,
    interval: 4000,
  });
}

// ─── Read functions ────────────────────────────────────────────────────────────

export async function getPackageCount(): Promise<number> {
  const client = getReadClient();
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_package_count",
    args: [],
  });
  return Number(result ?? 0);
}

export async function getPackage(packageId: number): Promise<EvidencePackage> {
  const client = getReadClient();
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_package",
    args: [packageId],
  });
  return mapPackage(result);
}

export async function getPackagesPage(start: number, count: number): Promise<EvidencePackage[]> {
  const client = getReadClient();
  const result: any[] = (await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_packages_page",
    args: [start, count],
  })) as any[];
  return (result ?? []).map(mapPackage);
}

export async function getAllPackages(): Promise<EvidencePackage[]> {
  const total = await getPackageCount();
  if (total === 0) return [];
  return getPackagesPage(0, total);
}

export async function getChallenges(packageId: number): Promise<Challenge[]> {
  const client = getReadClient();
  const result: any[] = (await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_challenges",
    args: [packageId],
  })) as any[];
  return (result ?? []).map(mapChallenge);
}

export async function getClassificationRecords(packageId: number): Promise<ClassificationRecord[]> {
  const client = getReadClient();
  const result: any[] = (await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_classification_records",
    args: [packageId],
  })) as any[];
  return (result ?? []).map(mapRecord);
}

export async function getPackagesByDepositor(depositor: string): Promise<EvidencePackage[]> {
  const client = getReadClient();
  const result: any[] = (await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_packages_by_depositor",
    args: [depositor],
  })) as any[];
  return (result ?? []).map(mapPackage);
}

// ─── Write functions ───────────────────────────────────────────────────────────

export interface CreatePackageArgs {
  title: string;
  claim: string;
  evidenceType: string;
  eventDate: string;
  captureDate: string;
  primarySources: string[];
  supportingSources: string[];
  fileHashes: string[];
  archiveLinks: string[];
  contextNote: string;
  sensitivityLevel: string;
  requestedClassification: string;
  knownLimitations: string;
  knownDisputes: string;
  whyMatters: string;
  historicalSignificanceNote: string;
}

export async function createPackage(
  args: CreatePackageArgs,
  address: string,
  onStatus?: (status: string) => void
): Promise<number> {
  // Read count BEFORE creating — the new package will occupy this index
  onStatus?.("Reading current state…");
  const expectedId = await getPackageCount();

  const client = getWriteClient(address);
  onStatus?.("Broadcasting to studionet…");
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "create_package",
    args: [
      args.title,
      args.claim,
      args.evidenceType,
      args.eventDate,
      args.captureDate,
      JSON.stringify(args.primarySources.filter(Boolean)),
      JSON.stringify(args.supportingSources.filter(Boolean)),
      JSON.stringify(args.fileHashes.filter(Boolean)),
      JSON.stringify(args.archiveLinks.filter(Boolean)),
      args.contextNote,
      args.sensitivityLevel,
      args.requestedClassification,
      args.knownLimitations,
      args.knownDisputes,
      args.whyMatters,
      args.historicalSignificanceNote,
    ],
    value: 0n,
  });
  onStatus?.("Awaiting finalization…");
  await waitForFinalized(hash, address);

  // Confirm the package exists on-chain before returning its id
  onStatus?.("Confirming package on-chain…");
  await getPackage(expectedId); // throws if not found

  return expectedId;
}

export async function requestClassification(
  packageId: number,
  address: string,
  onStatus?: (status: string) => void
): Promise<void> {
  const client = getWriteClient(address);
  onStatus?.("Requesting AI classification…");
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "request_classification",
    args: [packageId],
    value: 0n,
  });
  onStatus?.("Validators evaluating evidence…");
  await waitForFinalized(hash, address);
  onStatus?.("Classification complete.");
}

export async function submitChallenge(
  packageId: number,
  challengeType: string,
  counterEvidence: string[],
  challengeNote: string,
  archiveLinks: string[],
  hashes: string[],
  address: string,
  onStatus?: (status: string) => void
): Promise<number> {
  const client = getWriteClient(address);
  onStatus?.("Submitting challenge…");
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "submit_challenge",
    args: [
      packageId,
      challengeType,
      JSON.stringify(counterEvidence.filter(Boolean)),
      challengeNote,
      JSON.stringify(archiveLinks.filter(Boolean)),
      JSON.stringify(hashes.filter(Boolean)),
    ],
    value: 0n,
  });
  onStatus?.("Awaiting finalization…");
  const receipt = await waitForFinalized(hash, address);
  const challengeId = (receipt as any).result;
  return Number(challengeId ?? 0);
}

export async function requestReclassification(
  packageId: number,
  challengeId: number,
  address: string,
  onStatus?: (status: string) => void
): Promise<void> {
  const client = getWriteClient(address);
  onStatus?.("Requesting reclassification…");
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "request_reclassification",
    args: [packageId, challengeId],
    value: 0n,
  });
  onStatus?.("Validators re-evaluating evidence…");
  await waitForFinalized(hash, address);
  onStatus?.("Reclassification complete.");
}
