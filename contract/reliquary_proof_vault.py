# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json
import re

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

# Classification labels grouped into agreement bands. Each validator now
# independently fetches and summarizes evidence URLs inside its own nondet
# round (see _gather_evidence_block), which introduces normal LLM/summary
# wording variance between the leader and validator runs. Requiring exact
# string equality on one of nine fine-grained labels is too strict for that
# variance and causes spurious consensus failures even on unambiguous
# evidence. Validators only need to agree on the substantive band - e.g.
# "unverifiable" vs "incomplete" vs "context_required" are all a validator
# saying "I can't confidently confirm this," which is real agreement even
# if the exact word differs. A genuine split (e.g. "authentic" vs
# "manipulated") still lands in different bands and correctly blocks
# consensus.
CLASSIFICATION_BANDS = {
    "authentic": "confirmed",
    "historically_significant": "confirmed",
    "verified_significant": "confirmed",
    "weak": "questionable",
    "incomplete": "questionable",
    "context_required": "questionable",
    "unverifiable": "questionable",
    "manipulated": "flagged",
    "disputed": "flagged",
}


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

    # -- helpers ---------------------------------------------------------------

    def _require_package(self, package_id: int) -> u256:
        key = u256(package_id)
        assert key in self.packages, "Package not found"
        return key

    def _get_pkg(self, key: u256) -> dict:
        return json.loads(self.packages[key])

    def _set_pkg(self, key: u256, pkg: dict) -> None:
        self.packages[key] = json.dumps(pkg)

    def _validate_judgment_schema(self, data) -> bool:
        if not isinstance(data, dict):
            return False
        return (
            data.get("classification") in ALLOWED_CLASSIFICATIONS
            and data.get("confidence") in ALLOWED_CONFIDENCE
            and data.get("manipulation_risk") in ALLOWED_MANIPULATION_RISK
            and data.get("significance") in ALLOWED_SIGNIFICANCE
            and data.get("source_alignment") in ALLOWED_SOURCE_ALIGNMENT
            and data.get("preservation_priority") in ALLOWED_PRESERVATION_PRIORITY
            and isinstance(data.get("short_reason"), str)
        )

    def _extract_readable_text(self, html: str, max_chars: int = 2000) -> str:
        """
        Reduce a raw HTML page down to its readable body text.

        Dumping an entire fetched HTML document (scripts, styles, nav
        boilerplate, inline JSON blobs) as the nondet equivalence-principle
        result is unreadable in any block explorer and wastes most of the
        LLM's context on markup instead of the actual page content. This
        strips non-content elements and tags, collapses whitespace, and
        truncates to a bounded, human-readable snippet - which is what
        both the explorer displays and the classification prompt receives.
        """
        text = re.sub(r"(?is)<(script|style|noscript|svg|head)[^>]*>.*?</\1>", " ", html)
        text = re.sub(r"(?s)<!--.*?-->", " ", text)
        text = re.sub(r"(?s)<[^>]+>", " ", text)
        text = text.replace("&nbsp;", " ").replace("&amp;", "&")
        text = re.sub(r"\s+", " ", text).strip()
        return text[:max_chars]

    def _gather_evidence_block(self, labeled_urls: list) -> str:
        """
        Fetch and summarize each (label, url) pair into a readable block.

        gl.nondet.web.get and gl.nondet.exec_prompt are themselves
        non-deterministic operations, so this must only ever be called
        directly from inside a run_nondet_unsafe leader_fn/validator_fn (one
        call frame deep, matching the team's other GenLayer contracts, e.g.
        disputeOS's `_fetch_evidence_block`) - it is not wrapped in its own
        run_nondet_unsafe here. Fetching, summarizing, and classifying all
        happen inside one shared nondet round (see _classify below) rather
        than each producing its own separate equivalence-principle round.
        """
        lines = []
        for label, url in labeled_urls:
            if not url.startswith("http"):
                continue
            summary = ""
            try:
                web_data = gl.nondet.web.get(url)
                if web_data.body is not None:
                    html = web_data.body.decode("utf-8", errors="replace")
                    text = self._extract_readable_text(html, max_chars=6000)
                    if text:
                        summary_prompt = (
                            "Summarize the following webpage content in 2-3 factual sentences. "
                            "Ignore navigation menus, cookie banners, and unrelated site links. "
                            "If this looks like a 404 or error page, say so explicitly instead of summarizing.\n\n"
                            f"PAGE CONTENT:\n{text}"
                        )
                        summary = gl.nondet.exec_prompt(summary_prompt) or ""
            except Exception:
                summary = ""
            if summary:
                lines.append(f"- {label} ({url}): {summary}")
            else:
                lines.append(f"- {label} ({url}): could not be fetched or read")
        return "\n".join(lines) if lines else "No source content could be fetched."

    def _classify(self, header: str, labeled_urls: list, rules_and_schema: str) -> dict:
        """
        Comparative Equivalence Principle, single nondet round.

        The leader fetches every evidence URL, summarizes each one, builds
        the full classification prompt from those summaries, and gets an
        LLM judgment - all inside one leader_fn. The validator independently
        repeats the entire pipeline (its own fetches, its own summaries, its
        own LLM judgment) on the same original package/challenge data, never
        seeing the leader's fetched content or judgment. Because every nondet
        operation (fetch, summarize, classify) is nested inside this single
        run_nondet_unsafe call, it produces exactly one Equivalence
        Principle round instead of one round per fetch plus one for the
        judgment.

        Agreement is checked at the classification-band level (see
        CLASSIFICATION_BANDS), not exact label equality: since the leader
        and validator each independently re-fetch and re-summarize evidence,
        minor wording differences between their generated summaries can
        legitimately push a borderline LLM judgment to a neighboring label
        (e.g. "incomplete" vs "unverifiable") without indicating real
        disagreement about the evidence's substance.
        """
        def leader_fn():
            evidence_block = self._gather_evidence_block(labeled_urls)
            prompt = f"{header}\n\nFETCHED CONTENT:\n{evidence_block}\n\n{rules_and_schema}"
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            leader_data = leader_result.calldata
            if not self._validate_judgment_schema(leader_data):
                return False

            evidence_block = self._gather_evidence_block(labeled_urls)
            prompt = f"{header}\n\nFETCHED CONTENT:\n{evidence_block}\n\n{rules_and_schema}"
            validator_data = gl.nondet.exec_prompt(prompt, response_format="json")
            if not self._validate_judgment_schema(validator_data):
                return False

            leader_band = CLASSIFICATION_BANDS.get(leader_data.get("classification"))
            validator_band = CLASSIFICATION_BANDS.get(validator_data.get("classification"))
            return leader_band is not None and leader_band == validator_band

        return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

    # -- write methods ---------------------------------------------------------

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

        sources_block = "\n".join(sources_summary) if sources_summary else "No sources provided."

        header = f"""You are a Reliquary evidence classification validator. Evaluate the submitted evidence package and classify its evidentiary strength and archival significance.

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
{sources_block}"""

        rules_and_schema = """RULES:
- Do not overstate confidence.
- Do not classify as authentic unless evidence clearly supports the claim.
- If evidence cannot be accessed, classify as unverifiable or incomplete.
- Use high significance when the record matters even if uncertain.

Return ONLY a valid JSON object on a single line, no prose, no markdown, no code fences. Required keys and allowed values:
classification: authentic | weak | manipulated | incomplete | historically_significant | verified_significant | context_required | unverifiable | disputed
confidence: low | medium | high
manipulation_risk: low | medium | high | unknown
significance: none | low | medium | high | historic
source_alignment: strong | partial | weak | contradictory | unverifiable
preservation_priority: standard | elevated | urgent | restricted_review
short_reason: one concise sentence"""

        labeled_urls = [("Primary source", u) for u in pkg.get("primary_sources", [])[:2]]
        labeled_urls += [("Archive link", u) for u in pkg.get("archive_links", [])[:1]]

        result = self._classify(header, labeled_urls, rules_and_schema)

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

        header = f"""You are a Reliquary reclassification validator. A challenge has been filed. Review both the original evidence and the challenge.

ORIGINAL PACKAGE:
Title: {pkg["title"]}
Claim: {pkg["claim"]}
Current Classification: {pkg.get("current_classification", "none")} (confidence: {pkg.get("confidence", "none")})
Reason: {pkg.get("short_reason", "")}
Sources: {chr(10).join(sources_summary) if sources_summary else "None"}

CHALLENGE:
Type: {challenge["challenge_type"]}
Note: {challenge["challenge_note"]}
Counter Evidence: {chr(10).join(counter_lines) if counter_lines else "None"}"""

        rules_and_schema = """RULES: If the challenge raises credible new information, update accordingly. If weak, keep similar but note dispute. Maintain epistemic honesty.

Return ONLY a valid JSON object on a single line, no prose, no markdown, no code fences. Required keys and allowed values:
classification: authentic | weak | manipulated | incomplete | historically_significant | verified_significant | context_required | unverifiable | disputed
confidence: low | medium | high
manipulation_risk: low | medium | high | unknown
significance: none | low | medium | high | historic
source_alignment: strong | partial | weak | contradictory | unverifiable
preservation_priority: standard | elevated | urgent | restricted_review
short_reason: one concise sentence"""

        labeled_urls = [("Counter evidence", u) for u in challenge.get("counter_evidence", [])[:2]]

        result = self._classify(header, labeled_urls, rules_and_schema)

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

    # -- view methods ----------------------------------------------------------

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
