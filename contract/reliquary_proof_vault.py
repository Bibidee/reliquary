# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
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


class ReliquaryProofVault(gl.Contract):
    packages: TreeMap[u256, str]
    challenges: DynArray[str]
    records: DynArray[str]
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

    def _get_pkg(self, key: u256) -> dict:
        return json.loads(self.packages[key])

    def _set_pkg(self, key: u256, pkg: dict) -> None:
        self.packages[key] = json.dumps(pkg)

    def _classify(self, prompt: str) -> dict:
        """Run LLM classification. Leader and validator each independently call the LLM."""
        def leader_fn():
            response = gl.nondet.exec_prompt(prompt)
            return json.loads(response)

        def validator_fn(leader_result) -> bool:
            # Sanity-check the leader's return envelope.
            if not isinstance(leader_result, gl.vm.Return):
                return False
            leader_data = leader_result.calldata
            if not isinstance(leader_data, dict):
                return False
            # Verify the leader's structured fields are well-formed before comparing.
            if not (
                leader_data.get("classification") in ALLOWED_CLASSIFICATIONS
                and leader_data.get("confidence") in ALLOWED_CONFIDENCE
                and leader_data.get("manipulation_risk") in ALLOWED_MANIPULATION_RISK
                and leader_data.get("significance") in ALLOWED_SIGNIFICANCE
                and leader_data.get("source_alignment") in ALLOWED_SOURCE_ALIGNMENT
                and leader_data.get("preservation_priority") in ALLOWED_PRESERVATION_PRIORITY
                and isinstance(leader_data.get("short_reason"), str)
            ):
                return False

            # ── Independent validator LLM judgment ──────────────────────────────
            # The validator evaluates the original evidence prompt directly —
            # the leader's classification is NOT included here, so the validator
            # cannot anchor on the leader's result.
            try:
                validator_response = gl.nondet.exec_prompt(prompt)
                validator_data = json.loads(validator_response)
            except Exception:
                return False

            # Verify the validator's own result is well-formed.
            if not (
                validator_data.get("classification") in ALLOWED_CLASSIFICATIONS
                and validator_data.get("confidence") in ALLOWED_CONFIDENCE
                and validator_data.get("manipulation_risk") in ALLOWED_MANIPULATION_RISK
                and validator_data.get("significance") in ALLOWED_SIGNIFICANCE
                and validator_data.get("source_alignment") in ALLOWED_SOURCE_ALIGNMENT
                and validator_data.get("preservation_priority") in ALLOWED_PRESERVATION_PRIORITY
            ):
                return False

            # ── Structured comparison ────────────────────────────────────────────
            # Consensus requires agreement on the primary classification label.
            # Secondary fields (confidence, risk scores, etc.) are validated for
            # schema correctness but excluded from the consensus gate — independent
            # LLM calls may legitimately assign different confidence levels to the
            # same substantive verdict, and requiring exact agreement on all fields
            # would cause valid consensus to fail due to LLM non-determinism.
            return validator_data.get("classification") == leader_data.get("classification")

        return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

    def _fetch_url(self, url: str) -> str:
        """Fetch a URL using the current GenLayer nondet web API."""
        try:
            def leader_fn():
                web_data = gl.nondet.web.get(url)
                return web_data.body
            def validator_fn(leader_result) -> bool:
                return isinstance(leader_result, gl.vm.Return)
            return gl.vm.run_nondet_unsafe(leader_fn, validator_fn) or ""
        except Exception:
            return ""

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
        pkg = {
            "id": int(pkg_id),
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
        self._set_pkg(pkg_id, pkg)
        self.package_count = self.package_count + u256(1)
        return int(pkg_id)

    @gl.public.write
    def request_classification(self, package_id: int) -> None:
        key = self._require_package(package_id)
        pkg = self._get_pkg(key)

        sources_summary = []
        for s in pkg.get("primary_sources", []):
            sources_summary.append(f"Primary source: {s}")
        for s in pkg.get("supporting_sources", []):
            sources_summary.append(f"Supporting source: {s}")
        for h in pkg.get("file_hashes", []):
            sources_summary.append(f"File hash: {h}")
        for a in pkg.get("archive_links", []):
            sources_summary.append(f"Archive link: {a}")

        fetched_content = ""
        for url in pkg.get("primary_sources", [])[:2]:
            if url.startswith("http"):
                content = self._fetch_url(url)
                if content:
                    fetched_content += f"\n--- Content from {url} ---\n{content[:2000]}\n"
                else:
                    fetched_content += f"\n--- Could not fetch: {url} ---\n"

        for url in pkg.get("archive_links", [])[:1]:
            if url.startswith("http"):
                content = self._fetch_url(url)
                if content:
                    fetched_content += f"\n--- Archive from {url} ---\n{content[:1500]}\n"

        sources_block = "\n".join(sources_summary) if sources_summary else "No sources provided."

        prompt = f"""You are a Reliquary evidence classification validator. Evaluate the submitted evidence package and classify its evidentiary strength and archival significance.

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

RULES:
- Do not overstate confidence.
- Do not classify as authentic unless evidence clearly supports the claim.
- If evidence cannot be accessed, classify as unverifiable or incomplete.
- Use high significance when the record matters even if uncertain.

Return a JSON object with exactly these keys:
classification: one of authentic|weak|manipulated|incomplete|historically_significant|verified_significant|context_required|unverifiable|disputed
confidence: one of low|medium|high
manipulation_risk: one of low|medium|high|unknown
significance: one of none|low|medium|high|historic
source_alignment: one of strong|partial|weak|contradictory|unverifiable
preservation_priority: one of standard|elevated|urgent|restricted_review
short_reason: one concise sentence explaining the classification"""

        result = self._classify(prompt)

        pkg["current_classification"] = result["classification"]
        pkg["confidence"] = result["confidence"]
        pkg["manipulation_risk"] = result["manipulation_risk"]
        pkg["significance"] = result["significance"]
        pkg["source_alignment"] = result["source_alignment"]
        pkg["preservation_priority"] = result["preservation_priority"]
        pkg["short_reason"] = result["short_reason"][:400]
        pkg["status"] = "classified"
        pkg["classification_count"] = pkg["classification_count"] + 1
        self._set_pkg(key, pkg)

        rec = {
            "id": int(self.record_count),
            "package_id": int(key),
            "classification": result["classification"],
            "confidence": result["confidence"],
            "manipulation_risk": result["manipulation_risk"],
            "significance": result["significance"],
            "source_alignment": result["source_alignment"],
            "preservation_priority": result["preservation_priority"],
            "short_reason": result["short_reason"][:400],
            "reason_type": "initial",
        }
        self.records.append(json.dumps(rec))
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

        challenge_id = int(self.challenge_count)
        c = {
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
        }
        self.challenges.append(json.dumps(c))
        self.challenge_count = self.challenge_count + u256(1)

        pkg = self._get_pkg(key)
        pkg["challenge_count"] = pkg["challenge_count"] + 1
        pkg["status"] = "challenged"
        self._set_pkg(key, pkg)

        return challenge_id

    @gl.public.write
    def request_reclassification(self, package_id: int, challenge_id: int) -> None:
        key = self._require_package(package_id)
        pkg = self._get_pkg(key)

        challenge = None
        for i in range(int(self.challenge_count)):
            c = json.loads(self.challenges[i])
            if c["id"] == challenge_id and c["package_id"] == package_id:
                challenge = c
                break
        assert challenge is not None, "Challenge not found"

        sources_summary = [f"Primary: {s}" for s in pkg.get("primary_sources", [])]
        counter_lines = [f"Counter: {s}" for s in challenge.get("counter_evidence", [])]

        counter_content = ""
        for url in challenge.get("counter_evidence", [])[:2]:
            if url.startswith("http"):
                content = self._fetch_url(url)
                if content:
                    counter_content += f"\n--- Counter evidence from {url} ---\n{content[:1500]}\n"

        prompt = f"""You are a Reliquary reclassification validator. A challenge has been filed. Review both the original evidence and the challenge.

ORIGINAL PACKAGE:
Title: {pkg["title"]}
Claim: {pkg["claim"]}
Current Classification: {pkg.get("current_classification", "none")} (confidence: {pkg.get("confidence", "none")})
Reason: {pkg.get("short_reason", "")}
Sources: {chr(10).join(sources_summary) if sources_summary else "None"}

CHALLENGE:
Type: {challenge["challenge_type"]}
Note: {challenge["challenge_note"]}
Counter Evidence: {chr(10).join(counter_lines) if counter_lines else "None"}

FETCHED COUNTER EVIDENCE:
{counter_content if counter_content else "No counter evidence fetched."}

RULES: If the challenge raises credible new information, update accordingly. If weak, keep similar but note dispute. Maintain epistemic honesty.

Return a JSON object with exactly these keys:
classification: one of authentic|weak|manipulated|incomplete|historically_significant|verified_significant|context_required|unverifiable|disputed
confidence: one of low|medium|high
manipulation_risk: one of low|medium|high|unknown
significance: one of none|low|medium|high|historic
source_alignment: one of strong|partial|weak|contradictory|unverifiable
preservation_priority: one of standard|elevated|urgent|restricted_review
short_reason: one concise sentence explaining the reclassification"""

        result = self._classify(prompt)

        pkg["current_classification"] = result["classification"]
        pkg["confidence"] = result["confidence"]
        pkg["manipulation_risk"] = result["manipulation_risk"]
        pkg["significance"] = result["significance"]
        pkg["source_alignment"] = result["source_alignment"]
        pkg["preservation_priority"] = result["preservation_priority"]
        pkg["short_reason"] = result["short_reason"][:400]
        pkg["status"] = "reclassified"
        pkg["classification_count"] = pkg["classification_count"] + 1
        self._set_pkg(key, pkg)

        for i in range(int(self.challenge_count)):
            c = json.loads(self.challenges[i])
            if c["id"] == challenge_id and c["package_id"] == package_id:
                c["status"] = "reviewed"
                self.challenges[i] = json.dumps(c)
                break

        rec = {
            "id": int(self.record_count),
            "package_id": int(key),
            "classification": result["classification"],
            "confidence": result["confidence"],
            "manipulation_risk": result["manipulation_risk"],
            "significance": result["significance"],
            "source_alignment": result["source_alignment"],
            "preservation_priority": result["preservation_priority"],
            "short_reason": result["short_reason"][:400],
            "reason_type": "reclassification",
        }
        self.records.append(json.dumps(rec))
        self.record_count = self.record_count + u256(1)

    # ── view methods ──────────────────────────────────────────────────────────

    @gl.public.view
    def get_package(self, package_id: int) -> dict:
        key = self._require_package(package_id)
        return self._get_pkg(key)

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
                result.append(self._get_pkg(key))
        return result

    @gl.public.view
    def get_challenges(self, package_id: int) -> list:
        self._require_package(package_id)
        result = []
        for i in range(int(self.challenge_count)):
            c = json.loads(self.challenges[i])
            if c["package_id"] == package_id:
                result.append(c)
        return result

    @gl.public.view
    def get_classification_records(self, package_id: int) -> list:
        self._require_package(package_id)
        result = []
        for i in range(int(self.record_count)):
            r = json.loads(self.records[i])
            if r["package_id"] == package_id:
                result.append(r)
        return result

    @gl.public.view
    def get_packages_by_depositor(self, depositor: str) -> list:
        result = []
        for i in range(int(self.package_count)):
            key = u256(i)
            if key in self.packages:
                pkg = self._get_pkg(key)
                if pkg.get("depositor", "").lower() == depositor.lower():
                    result.append(pkg)
        return result
