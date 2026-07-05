# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

ALLOWED_CLASSIFICATIONS = (
    "authentic", "weak", "manipulated", "incomplete",
    "historically_significant", "context_required", "unverifiable", "disputed",
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


class ReliquaryProofVault(gl.Contract):
    packages: dict
    challenges: dict
    classification_records: dict
    package_count: int

    def __init__(self) -> None:
        self.packages = {}
        self.challenges = {}
        self.classification_records = {}
        self.package_count = 0

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
        self.packages[pkg_id] = {
            "id": pkg_id,
            "depositor": str(gl.message.sender_address),
            "title": title,
            "claim": claim,
            "evidence_type": evidence_type,
            "event_date": event_date,
            "capture_date": capture_date,
            "submitted_at": str(gl.message.timestamp) if hasattr(gl.message, "timestamp") else "",
            "primary_sources": primary_sources,
            "supporting_sources": supporting_sources,
            "file_hashes": file_hashes,
            "archive_links": archive_links,
            "context_note": context_note,
            "sensitivity_level": sensitivity_level,
            "requested_classification": requested_classification,
            "known_limitations": known_limitations,
            "known_disputes": known_disputes,
            "why_matters": why_matters,
            "historical_significance_note": historical_significance_note,
            "status": "pending",
            "current_classification": "",
            "confidence": "",
            "manipulation_risk": "",
            "significance": "",
            "source_alignment": "",
            "preservation_priority": "",
            "short_reason": "",
            "challenge_count": 0,
            "classification_count": 0,
        }
        self.challenges[pkg_id] = []
        self.classification_records[pkg_id] = []
        self.package_count += 1
        return pkg_id

    @gl.public.write
    def request_classification(self, package_id: int) -> None:
        assert package_id in self.packages, "Package not found"
        pkg = self.packages[package_id]

        sources_summary = []
        for s in pkg["primary_sources"]:
            sources_summary.append(f"Primary source: {s}")
        for s in pkg["supporting_sources"]:
            sources_summary.append(f"Supporting source: {s}")
        for h in pkg["file_hashes"]:
            sources_summary.append(f"File hash: {h}")
        for a in pkg["archive_links"]:
            sources_summary.append(f"Archive link: {a}")

        fetched_content = ""
        for url in pkg["primary_sources"][:2]:
            try:
                if url.startswith("http"):
                    page = gl.get_webpage(url, mode="text")
                    fetched_content += f"\n--- Content from {url} ---\n{str(page)[:2000]}\n"
            except Exception:
                fetched_content += f"\n--- URL could not be fetched: {url} ---\n"

        for url in pkg["archive_links"][:1]:
            try:
                if url.startswith("http"):
                    page = gl.get_webpage(url, mode="text")
                    fetched_content += f"\n--- Archive content from {url} ---\n{str(page)[:1500]}\n"
            except Exception:
                fetched_content += f"\n--- Archive URL could not be fetched: {url} ---\n"

        sources_block = "\n".join(sources_summary) if sources_summary else "No sources provided."

        prompt = f"""You are a Reliquary evidence classification validator. Your task is to evaluate the submitted evidence package and classify its evidentiary strength and archival significance.

EVIDENCE PACKAGE:
Title: {pkg["title"]}
Claim: {pkg["claim"]}
Evidence Type: {pkg["evidence_type"]}
Event Date: {pkg["event_date"]}
Capture Date: {pkg["capture_date"]}
Sensitivity: {pkg["sensitivity_level"]}
Requested Classification: {pkg["requested_classification"] or "None specified"}
Context Note: {pkg["context_note"] or "None"}
Known Limitations: {pkg["known_limitations"] or "None stated"}
Known Disputes: {pkg["known_disputes"] or "None stated"}
Why It Matters: {pkg["why_matters"] or "Not provided"}

SOURCES:
{sources_block}

FETCHED CONTENT:
{fetched_content if fetched_content else "No source content could be fetched."}

EVALUATION CRITERIA:
1. Does the evidence support the stated claim?
2. Is the evidence authentic, weak, manipulated, incomplete, historically significant, context-dependent, unverifiable, or disputed?
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
{{"classification": "authentic|weak|manipulated|incomplete|historically_significant|context_required|unverifiable|disputed", "confidence": "low|medium|high", "manipulation_risk": "low|medium|high|unknown", "significance": "none|low|medium|high|historic", "source_alignment": "strong|partial|weak|contradictory|unverifiable", "preservation_priority": "standard|elevated|urgent|restricted_review", "short_reason": "One concise sentence explaining the classification."}}"""

        result_str = gl.exec_prompt(prompt)
        result = json.loads(result_str.strip())

        assert result.get("classification") in ALLOWED_CLASSIFICATIONS, "Invalid classification returned"
        assert result.get("confidence") in ALLOWED_CONFIDENCE, "Invalid confidence returned"
        assert result.get("manipulation_risk") in ALLOWED_MANIPULATION_RISK, "Invalid manipulation_risk returned"
        assert result.get("significance") in ALLOWED_SIGNIFICANCE, "Invalid significance returned"
        assert result.get("source_alignment") in ALLOWED_SOURCE_ALIGNMENT, "Invalid source_alignment returned"
        assert result.get("preservation_priority") in ALLOWED_PRESERVATION_PRIORITY, "Invalid preservation_priority returned"
        assert isinstance(result.get("short_reason"), str), "Invalid short_reason returned"

        pkg["current_classification"] = result["classification"]
        pkg["confidence"] = result["confidence"]
        pkg["manipulation_risk"] = result["manipulation_risk"]
        pkg["significance"] = result["significance"]
        pkg["source_alignment"] = result["source_alignment"]
        pkg["preservation_priority"] = result["preservation_priority"]
        pkg["short_reason"] = result["short_reason"][:400]
        pkg["status"] = "classified"
        pkg["classification_count"] = pkg["classification_count"] + 1
        self.packages[package_id] = pkg

        record_id = len(self.classification_records[package_id])
        self.classification_records[package_id].append({
            "id": record_id,
            "package_id": package_id,
            "classification": result["classification"],
            "confidence": result["confidence"],
            "manipulation_risk": result["manipulation_risk"],
            "significance": result["significance"],
            "source_alignment": result["source_alignment"],
            "preservation_priority": result["preservation_priority"],
            "short_reason": result["short_reason"][:400],
            "reason_type": "initial",
        })

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
        assert package_id in self.packages, "Package not found"
        assert challenge_type in ALLOWED_CHALLENGE_TYPES, "Invalid challenge type"
        assert challenge_note.strip(), "Challenge note cannot be empty"

        counter_evidence = json.loads(counter_evidence_json) if counter_evidence_json else []
        archive_links = json.loads(archive_links_json) if archive_links_json else []
        hashes = json.loads(hashes_json) if hashes_json else []

        challenge_id = len(self.challenges[package_id])
        self.challenges[package_id].append({
            "id": challenge_id,
            "package_id": package_id,
            "challenger": str(gl.message.sender_address),
            "challenge_type": challenge_type,
            "counter_evidence": counter_evidence,
            "archive_links": archive_links,
            "hashes": hashes,
            "challenge_note": challenge_note,
            "status": "open",
            "submitted_at": str(gl.message.timestamp) if hasattr(gl.message, "timestamp") else "",
        })

        pkg = self.packages[package_id]
        pkg["challenge_count"] = pkg["challenge_count"] + 1
        pkg["status"] = "challenged"
        self.packages[package_id] = pkg

        return challenge_id

    @gl.public.write
    def request_reclassification(self, package_id: int, challenge_id: int) -> None:
        assert package_id in self.packages, "Package not found"
        challenges_list = self.challenges.get(package_id, [])
        assert challenge_id < len(challenges_list), "Challenge not found"

        pkg = self.packages[package_id]
        challenge = challenges_list[challenge_id]

        sources_summary = []
        for s in pkg["primary_sources"]:
            sources_summary.append(f"Primary: {s}")
        for s in pkg["supporting_sources"]:
            sources_summary.append(f"Supporting: {s}")
        for h in pkg["file_hashes"]:
            sources_summary.append(f"Hash: {h}")

        counter_lines = []
        for s in challenge["counter_evidence"]:
            counter_lines.append(f"Counter-evidence: {s}")
        for a in challenge["archive_links"]:
            counter_lines.append(f"Counter archive: {a}")

        counter_content = ""
        for url in challenge["counter_evidence"][:2]:
            try:
                if url.startswith("http"):
                    page = gl.get_webpage(url, mode="text")
                    counter_content += f"\n--- Counter evidence from {url} ---\n{str(page)[:1500]}\n"
            except Exception:
                counter_content += f"\n--- Counter URL could not be fetched: {url} ---\n"

        prompt = f"""You are a Reliquary evidence reclassification validator.

A challenge has been filed against this evidence package. Review both the original evidence and the challenge, then issue a new classification.

ORIGINAL PACKAGE:
Title: {pkg["title"]}
Claim: {pkg["claim"]}
Evidence Type: {pkg["evidence_type"]}
Context: {pkg["context_note"] or "None"}
Original Sources:
{chr(10).join(sources_summary) if sources_summary else "None"}

CURRENT CLASSIFICATION:
Classification: {pkg.get("current_classification", "none")}
Confidence: {pkg.get("confidence", "none")}
Reason: {pkg.get("short_reason", "")}

CHALLENGE:
Type: {challenge["challenge_type"]}
Note: {challenge["challenge_note"]}
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
{{"classification": "authentic|weak|manipulated|incomplete|historically_significant|context_required|unverifiable|disputed", "confidence": "low|medium|high", "manipulation_risk": "low|medium|high|unknown", "significance": "none|low|medium|high|historic", "source_alignment": "strong|partial|weak|contradictory|unverifiable", "preservation_priority": "standard|elevated|urgent|restricted_review", "short_reason": "One concise sentence explaining the reclassification."}}"""

        result_str = gl.exec_prompt(prompt)
        result = json.loads(result_str.strip())

        assert result.get("classification") in ALLOWED_CLASSIFICATIONS
        assert result.get("confidence") in ALLOWED_CONFIDENCE
        assert result.get("manipulation_risk") in ALLOWED_MANIPULATION_RISK
        assert result.get("significance") in ALLOWED_SIGNIFICANCE
        assert result.get("source_alignment") in ALLOWED_SOURCE_ALIGNMENT
        assert result.get("preservation_priority") in ALLOWED_PRESERVATION_PRIORITY

        pkg["current_classification"] = result["classification"]
        pkg["confidence"] = result["confidence"]
        pkg["manipulation_risk"] = result["manipulation_risk"]
        pkg["significance"] = result["significance"]
        pkg["source_alignment"] = result["source_alignment"]
        pkg["preservation_priority"] = result["preservation_priority"]
        pkg["short_reason"] = result["short_reason"][:400]
        pkg["status"] = "reclassified"
        pkg["classification_count"] = pkg["classification_count"] + 1
        self.packages[package_id] = pkg

        self.challenges[package_id][challenge_id]["status"] = "reviewed"

        record_id = len(self.classification_records[package_id])
        self.classification_records[package_id].append({
            "id": record_id,
            "package_id": package_id,
            "classification": result["classification"],
            "confidence": result["confidence"],
            "manipulation_risk": result["manipulation_risk"],
            "significance": result["significance"],
            "source_alignment": result["source_alignment"],
            "preservation_priority": result["preservation_priority"],
            "short_reason": result["short_reason"][:400],
            "reason_type": "reclassification",
        })

    @gl.public.view
    def get_package(self, package_id: int) -> dict:
        assert package_id in self.packages, "Package not found"
        return self.packages[package_id]

    @gl.public.view
    def get_package_count(self) -> int:
        return self.package_count

    @gl.public.view
    def get_packages_page(self, start: int, count: int) -> list:
        result = []
        end = min(start + count, self.package_count)
        for i in range(start, end):
            if i in self.packages:
                result.append(self.packages[i])
        return result

    @gl.public.view
    def get_challenge(self, package_id: int, challenge_id: int) -> dict:
        assert package_id in self.packages, "Package not found"
        challenges_list = self.challenges.get(package_id, [])
        assert challenge_id < len(challenges_list), "Challenge not found"
        return challenges_list[challenge_id]

    @gl.public.view
    def get_challenges(self, package_id: int) -> list:
        assert package_id in self.packages, "Package not found"
        return self.challenges.get(package_id, [])

    @gl.public.view
    def get_classification_records(self, package_id: int) -> list:
        assert package_id in self.packages, "Package not found"
        return self.classification_records.get(package_id, [])

    @gl.public.view
    def get_packages_by_depositor(self, depositor: str) -> list:
        result = []
        for i in range(self.package_count):
            if i in self.packages:
                pkg = self.packages[i]
                if pkg.get("depositor", "").lower() == depositor.lower():
                    result.append(pkg)
        return result
