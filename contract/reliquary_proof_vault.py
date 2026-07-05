# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from dataclasses import dataclass
import json

ALLOWED_CLASSIFICATIONS = (
    "authentic", "weak", "manipulated", "incomplete",
    "historically_significant", "verified_significant",
    "context_required", "unverifiable", "disputed",
)
ALLOWED_CONFIDENCE = ("low", "medium", "high")
ALLOWED_MANIPULATION_RISK = ("low", "medium", "high", "unknown")
ALLOWED_SIGNIFICANCE = ("none", "low", "medium", "high", "historic")
ALLOWED_SOURCE_ALIGNMENT = ("strong", "partial", "weak", "contradictory", "unverifiable")
ALLOWED_PRESERVATION_PRIORITY = ("standard", "elevated", "urgent", "restricted_review")
ALLOWED_EVIDENCE_TYPES = (
    "document", "screenshot", "video", "audio",
    "transaction", "statement", "archive", "mixed",
)
ALLOWED_SENSITIVITY = ("public", "limited", "sensitive")
ALLOWED_CHALLENGE_TYPES = (
    "manipulation_claim", "missing_context", "wrong_classification",
    "false_claim", "source_dead", "stronger_evidence_available",
    "privacy_or_safety_concern",
)


@allow_storage
@dataclass
class EvidencePackageData:
    id: u256
    depositor: str
    title: str
    claim: str
    evidence_type: str
    event_date: str
    capture_date: str
    submitted_at: str
    primary_sources: DynArray[str]
    supporting_sources: DynArray[str]
    file_hashes: DynArray[str]
    archive_links: DynArray[str]
    context_note: str
    sensitivity_level: str
    requested_classification: str
    known_limitations: str
    known_disputes: str
    why_matters: str
    historical_significance_note: str
    status: str
    current_classification: str
    confidence: str
    manipulation_risk: str
    significance: str
    source_alignment: str
    preservation_priority: str
    short_reason: str
    challenge_count: u256
    classification_count: u256


@allow_storage
@dataclass
class ChallengeData:
    id: u256
    package_id: u256
    challenger: str
    challenge_type: str
    counter_evidence: DynArray[str]
    archive_links: DynArray[str]
    hashes: DynArray[str]
    challenge_note: str
    status: str
    submitted_at: str


@allow_storage
@dataclass
class RecordData:
    id: u256
    package_id: u256
    classification: str
    confidence: str
    manipulation_risk: str
    significance: str
    source_alignment: str
    preservation_priority: str
    short_reason: str
    reason_type: str


class ReliquaryProofVault(gl.Contract):
    packages: TreeMap[u256, EvidencePackageData]
    challenges: DynArray[ChallengeData]
    records: DynArray[RecordData]
    package_count: u256
    challenge_count: u256
    record_count: u256

    def __init__(self) -> None:
        self.package_count = u256(0)
        self.challenge_count = u256(0)
        self.record_count = u256(0)

    # ── helpers ───────────────────────────────────────────────────────────────

    def _require_package(self, package_id: int) -> u256:
        key = u256(package_id)
        assert key in self.packages, "Package not found"
        return key

    def _pkg_to_dict(self, pkg: EvidencePackageData) -> dict:
        return {
            "id": int(pkg.id),
            "depositor": pkg.depositor,
            "title": pkg.title,
            "claim": pkg.claim,
            "evidence_type": pkg.evidence_type,
            "event_date": pkg.event_date,
            "capture_date": pkg.capture_date,
            "submitted_at": pkg.submitted_at,
            "primary_sources": list(pkg.primary_sources),
            "supporting_sources": list(pkg.supporting_sources),
            "file_hashes": list(pkg.file_hashes),
            "archive_links": list(pkg.archive_links),
            "context_note": pkg.context_note,
            "sensitivity_level": pkg.sensitivity_level,
            "requested_classification": pkg.requested_classification,
            "known_limitations": pkg.known_limitations,
            "known_disputes": pkg.known_disputes,
            "why_matters": pkg.why_matters,
            "historical_significance_note": pkg.historical_significance_note,
            "status": pkg.status,
            "current_classification": pkg.current_classification,
            "confidence": pkg.confidence,
            "manipulation_risk": pkg.manipulation_risk,
            "significance": pkg.significance,
            "source_alignment": pkg.source_alignment,
            "preservation_priority": pkg.preservation_priority,
            "short_reason": pkg.short_reason,
            "challenge_count": int(pkg.challenge_count),
            "classification_count": int(pkg.classification_count),
        }

    def _challenge_to_dict(self, c: ChallengeData) -> dict:
        return {
            "id": int(c.id),
            "package_id": int(c.package_id),
            "challenger": c.challenger,
            "challenge_type": c.challenge_type,
            "counter_evidence": list(c.counter_evidence),
            "archive_links": list(c.archive_links),
            "hashes": list(c.hashes),
            "challenge_note": c.challenge_note,
            "status": c.status,
            "submitted_at": c.submitted_at,
        }

    def _record_to_dict(self, r: RecordData) -> dict:
        return {
            "id": int(r.id),
            "package_id": int(r.package_id),
            "classification": r.classification,
            "confidence": r.confidence,
            "manipulation_risk": r.manipulation_risk,
            "significance": r.significance,
            "source_alignment": r.source_alignment,
            "preservation_priority": r.preservation_priority,
            "short_reason": r.short_reason,
            "reason_type": r.reason_type,
        }

    # ── write methods ─────────────────────────────────────────────────────────

    @gl.public.write
    def create_package(
        self,
        title: str,
        claim: str,
        evidence_type: str,
        event_date: str,
        capture_date: str,
        primary_sources_json: str,
        supporting_sources_json: str,
        file_hashes_json: str,
        archive_links_json: str,
        context_note: str,
        sensitivity_level: str,
        requested_classification: str,
        known_limitations: str,
        known_disputes: str,
        why_matters: str,
        historical_significance_note: str,
    ) -> int:
        assert title.strip(), "Title cannot be empty"
        assert claim.strip(), "Claim cannot be empty"
        assert evidence_type in ALLOWED_EVIDENCE_TYPES, "Invalid evidence type"
        assert sensitivity_level in ALLOWED_SENSITIVITY, "Invalid sensitivity level"
        assert requested_classification == "" or requested_classification in ALLOWED_CLASSIFICATIONS, "Invalid requested classification"

        primary_sources = json.loads(primary_sources_json) if primary_sources_json else []
        supporting_sources = json.loads(supporting_sources_json) if supporting_sources_json else []
        file_hashes = json.loads(file_hashes_json) if file_hashes_json else []
        archive_links = json.loads(archive_links_json) if archive_links_json else []

        assert (
            len(primary_sources) + len(archive_links) + len(file_hashes) > 0
        ), "At least one primary source, archive link, or file hash is required"

        pkg_id = self.package_count
        pkg = EvidencePackageData(
            id=pkg_id,
            depositor=str(gl.message.sender_address),
            title=title,
            claim=claim,
            evidence_type=evidence_type,
            event_date=event_date,
            capture_date=capture_date,
            submitted_at=str(gl.message.timestamp) if hasattr(gl.message, "timestamp") else "",
            primary_sources=DynArray[str](),
            supporting_sources=DynArray[str](),
            file_hashes=DynArray[str](),
            archive_links=DynArray[str](),
            context_note=context_note,
            sensitivity_level=sensitivity_level,
            requested_classification=requested_classification,
            known_limitations=known_limitations,
            known_disputes=known_disputes,
            why_matters=why_matters,
            historical_significance_note=historical_significance_note,
            status="pending",
            current_classification="",
            confidence="",
            manipulation_risk="",
            significance="",
            source_alignment="",
            preservation_priority="",
            short_reason="",
            challenge_count=u256(0),
            classification_count=u256(0),
        )
        for s in primary_sources:
            pkg.primary_sources.append(str(s))
        for s in supporting_sources:
            pkg.supporting_sources.append(str(s))
        for h in file_hashes:
            pkg.file_hashes.append(str(h))
        for a in archive_links:
            pkg.archive_links.append(str(a))

        self.packages[pkg_id] = pkg
        self.package_count = self.package_count + u256(1)
        return int(pkg_id)

    @gl.public.write
    def request_classification(self, package_id: int) -> None:
        key = self._require_package(package_id)
        pkg = self.packages[key]

        sources_summary = []
        for s in pkg.primary_sources:
            sources_summary.append(f"Primary source: {s}")
        for s in pkg.supporting_sources:
            sources_summary.append(f"Supporting source: {s}")
        for h in pkg.file_hashes:
            sources_summary.append(f"File hash: {h}")
        for a in pkg.archive_links:
            sources_summary.append(f"Archive link: {a}")

        fetched_content = ""
        for url in list(pkg.primary_sources)[:2]:
            try:
                if url.startswith("http"):
                    page = gl.get_webpage(url, mode="text")
                    fetched_content += f"\n--- Content from {url} ---\n{str(page)[:2000]}\n"
            except Exception:
                fetched_content += f"\n--- URL could not be fetched: {url} ---\n"

        for url in list(pkg.archive_links)[:1]:
            try:
                if url.startswith("http"):
                    page = gl.get_webpage(url, mode="text")
                    fetched_content += f"\n--- Archive content from {url} ---\n{str(page)[:1500]}\n"
            except Exception:
                fetched_content += f"\n--- Archive URL could not be fetched: {url} ---\n"

        sources_block = "\n".join(sources_summary) if sources_summary else "No sources provided."

        prompt = f"""You are a Reliquary evidence classification validator. Your task is to evaluate the submitted evidence package and classify its evidentiary strength and archival significance.

EVIDENCE PACKAGE:
Title: {pkg.title}
Claim: {pkg.claim}
Evidence Type: {pkg.evidence_type}
Event Date: {pkg.event_date}
Capture Date: {pkg.capture_date}
Sensitivity: {pkg.sensitivity_level}
Requested Classification: {pkg.requested_classification or "None specified"}
Context Note: {pkg.context_note or "None"}
Known Limitations: {pkg.known_limitations or "None stated"}
Known Disputes: {pkg.known_disputes or "None stated"}
Why It Matters: {pkg.why_matters or "Not provided"}

SOURCES:
{sources_block}

FETCHED CONTENT:
{fetched_content if fetched_content else "No source content could be fetched."}

EVALUATION CRITERIA:
1. Does the evidence support the stated claim?
2. Is the evidence authentic, weak, manipulated, incomplete, historically significant, verified significant, context-dependent, unverifiable, or disputed?
3. Do the sources align with the claim?
4. Are there signs of manipulation, selective framing, missing context, or unsupported inference?
5. Does this record have public, governance, cultural, historical, legal, or institutional significance?
6. Should preservation priority be standard, elevated, urgent, or restricted review?

RULES:
- Do not decide based on sympathy for the depositor.
- Do not erase uncertainty.
- Do not overstate confidence.
- Do not classify as authentic unless the evidence clearly supports the stated claim.
- Do not classify as manipulated unless there are strong signs of alteration, fabrication, or misleading presentation.
- If the evidence cannot be accessed or checked, classify as unverifiable or incomplete.
- If the evidence is important even though uncertain, use a high significance value while keeping classification and confidence honest.

Return ONLY valid JSON with this exact structure, no markdown, no extra text:
{{"classification": "authentic|weak|manipulated|incomplete|historically_significant|verified_significant|context_required|unverifiable|disputed", "confidence": "low|medium|high", "manipulation_risk": "low|medium|high|unknown", "significance": "none|low|medium|high|historic", "source_alignment": "strong|partial|weak|contradictory|unverifiable", "preservation_priority": "standard|elevated|urgent|restricted_review", "short_reason": "One concise sentence explaining the classification."}}"""

        result_str = gl.exec_prompt(prompt)
        result = json.loads(result_str.strip())

        assert result.get("classification") in ALLOWED_CLASSIFICATIONS, "Invalid classification returned"
        assert result.get("confidence") in ALLOWED_CONFIDENCE, "Invalid confidence returned"
        assert result.get("manipulation_risk") in ALLOWED_MANIPULATION_RISK, "Invalid manipulation_risk returned"
        assert result.get("significance") in ALLOWED_SIGNIFICANCE, "Invalid significance returned"
        assert result.get("source_alignment") in ALLOWED_SOURCE_ALIGNMENT, "Invalid source_alignment returned"
        assert result.get("preservation_priority") in ALLOWED_PRESERVATION_PRIORITY, "Invalid preservation_priority returned"
        assert isinstance(result.get("short_reason"), str), "Invalid short_reason returned"

        pkg.current_classification = result["classification"]
        pkg.confidence = result["confidence"]
        pkg.manipulation_risk = result["manipulation_risk"]
        pkg.significance = result["significance"]
        pkg.source_alignment = result["source_alignment"]
        pkg.preservation_priority = result["preservation_priority"]
        pkg.short_reason = result["short_reason"][:400]
        pkg.status = "classified"
        pkg.classification_count = pkg.classification_count + u256(1)

        rec = RecordData(
            id=self.record_count,
            package_id=key,
            classification=result["classification"],
            confidence=result["confidence"],
            manipulation_risk=result["manipulation_risk"],
            significance=result["significance"],
            source_alignment=result["source_alignment"],
            preservation_priority=result["preservation_priority"],
            short_reason=result["short_reason"][:400],
            reason_type="initial",
        )
        self.records.append(rec)
        self.record_count = self.record_count + u256(1)

    @gl.public.write
    def submit_challenge(
        self,
        package_id: int,
        challenge_type: str,
        counter_evidence_json: str,
        challenge_note: str,
        archive_links_json: str,
        hashes_json: str,
    ) -> int:
        key = self._require_package(package_id)
        assert challenge_type in ALLOWED_CHALLENGE_TYPES, "Invalid challenge type"
        assert challenge_note.strip(), "Challenge note cannot be empty"

        counter_evidence = json.loads(counter_evidence_json) if counter_evidence_json else []
        archive_links = json.loads(archive_links_json) if archive_links_json else []
        hashes = json.loads(hashes_json) if hashes_json else []

        challenge_id = self.challenge_count
        c = ChallengeData(
            id=challenge_id,
            package_id=key,
            challenger=str(gl.message.sender_address),
            challenge_type=challenge_type,
            counter_evidence=DynArray[str](),
            archive_links=DynArray[str](),
            hashes=DynArray[str](),
            challenge_note=challenge_note,
            status="open",
            submitted_at=str(gl.message.timestamp) if hasattr(gl.message, "timestamp") else "",
        )
        for s in counter_evidence:
            c.counter_evidence.append(str(s))
        for a in archive_links:
            c.archive_links.append(str(a))
        for h in hashes:
            c.hashes.append(str(h))

        self.challenges.append(c)
        self.challenge_count = self.challenge_count + u256(1)

        pkg = self.packages[key]
        pkg.challenge_count = pkg.challenge_count + u256(1)
        pkg.status = "challenged"

        return int(challenge_id)

    @gl.public.write
    def request_reclassification(self, package_id: int, challenge_id: int) -> None:
        key = self._require_package(package_id)
        pkg = self.packages[key]

        challenge = None
        for i in range(int(self.challenge_count)):
            c = self.challenges[i]
            if int(c.id) == challenge_id and int(c.package_id) == package_id:
                challenge = c
                break
        assert challenge is not None, "Challenge not found"

        sources_summary = []
        for s in pkg.primary_sources:
            sources_summary.append(f"Primary: {s}")
        for s in pkg.supporting_sources:
            sources_summary.append(f"Supporting: {s}")
        for h in pkg.file_hashes:
            sources_summary.append(f"Hash: {h}")

        counter_lines = []
        for s in challenge.counter_evidence:
            counter_lines.append(f"Counter-evidence: {s}")
        for a in challenge.archive_links:
            counter_lines.append(f"Counter archive: {a}")

        counter_content = ""
        for url in list(challenge.counter_evidence)[:2]:
            try:
                if url.startswith("http"):
                    page = gl.get_webpage(url, mode="text")
                    counter_content += f"\n--- Counter evidence from {url} ---\n{str(page)[:1500]}\n"
            except Exception:
                counter_content += f"\n--- Counter URL could not be fetched: {url} ---\n"

        prompt = f"""You are a Reliquary evidence reclassification validator.

A challenge has been filed against this evidence package. Review both the original evidence and the challenge, then issue a new classification.

ORIGINAL PACKAGE:
Title: {pkg.title}
Claim: {pkg.claim}
Evidence Type: {pkg.evidence_type}
Context: {pkg.context_note or "None"}
Original Sources:
{chr(10).join(sources_summary) if sources_summary else "None"}

CURRENT CLASSIFICATION:
Classification: {pkg.current_classification or "none"}
Confidence: {pkg.confidence or "none"}
Reason: {pkg.short_reason or ""}

CHALLENGE:
Type: {challenge.challenge_type}
Note: {challenge.challenge_note}
Counter Evidence:
{chr(10).join(counter_lines) if counter_lines else "None"}

FETCHED COUNTER EVIDENCE:
{counter_content if counter_content else "No counter evidence could be fetched."}

RULES:
- A challenge does not erase the original package — it adds a competing interpretation.
- If the challenge raises credible new information, update the classification accordingly.
- If the challenge is weak or unfounded, keep the classification similar but note the dispute.
- Always maintain epistemic honesty.

Return ONLY valid JSON with this exact structure, no markdown, no extra text:
{{"classification": "authentic|weak|manipulated|incomplete|historically_significant|verified_significant|context_required|unverifiable|disputed", "confidence": "low|medium|high", "manipulation_risk": "low|medium|high|unknown", "significance": "none|low|medium|high|historic", "source_alignment": "strong|partial|weak|contradictory|unverifiable", "preservation_priority": "standard|elevated|urgent|restricted_review", "short_reason": "One concise sentence explaining the reclassification."}}"""

        result_str = gl.exec_prompt(prompt)
        result = json.loads(result_str.strip())

        assert result.get("classification") in ALLOWED_CLASSIFICATIONS
        assert result.get("confidence") in ALLOWED_CONFIDENCE
        assert result.get("manipulation_risk") in ALLOWED_MANIPULATION_RISK
        assert result.get("significance") in ALLOWED_SIGNIFICANCE
        assert result.get("source_alignment") in ALLOWED_SOURCE_ALIGNMENT
        assert result.get("preservation_priority") in ALLOWED_PRESERVATION_PRIORITY

        pkg.current_classification = result["classification"]
        pkg.confidence = result["confidence"]
        pkg.manipulation_risk = result["manipulation_risk"]
        pkg.significance = result["significance"]
        pkg.source_alignment = result["source_alignment"]
        pkg.preservation_priority = result["preservation_priority"]
        pkg.short_reason = result["short_reason"][:400]
        pkg.status = "reclassified"
        pkg.classification_count = pkg.classification_count + u256(1)

        challenge.status = "reviewed"

        rec = RecordData(
            id=self.record_count,
            package_id=key,
            classification=result["classification"],
            confidence=result["confidence"],
            manipulation_risk=result["manipulation_risk"],
            significance=result["significance"],
            source_alignment=result["source_alignment"],
            preservation_priority=result["preservation_priority"],
            short_reason=result["short_reason"][:400],
            reason_type="reclassification",
        )
        self.records.append(rec)
        self.record_count = self.record_count + u256(1)

    # ── view methods ──────────────────────────────────────────────────────────

    @gl.public.view
    def get_package(self, package_id: int) -> dict:
        key = self._require_package(package_id)
        return self._pkg_to_dict(self.packages[key])

    @gl.public.view
    def get_package_count(self) -> int:
        return int(self.package_count)

    @gl.public.view
    def get_packages_page(self, start: int, count: int) -> list:
        result = []
        end = min(start + count, int(self.package_count))
        for i in range(start, end):
            key = u256(i)
            if key in self.packages:
                result.append(self._pkg_to_dict(self.packages[key]))
        return result

    @gl.public.view
    def get_challenges(self, package_id: int) -> list:
        self._require_package(package_id)
        result = []
        for i in range(int(self.challenge_count)):
            c = self.challenges[i]
            if int(c.package_id) == package_id:
                result.append(self._challenge_to_dict(c))
        return result

    @gl.public.view
    def get_classification_records(self, package_id: int) -> list:
        self._require_package(package_id)
        result = []
        for i in range(int(self.record_count)):
            r = self.records[i]
            if int(r.package_id) == package_id:
                result.append(self._record_to_dict(r))
        return result

    @gl.public.view
    def get_packages_by_depositor(self, depositor: str) -> list:
        result = []
        for i in range(int(self.package_count)):
            key = u256(i)
            if key in self.packages:
                pkg = self.packages[key]
                if pkg.depositor.lower() == depositor.lower():
                    result.append(self._pkg_to_dict(pkg))
        return result
