# Review Response — Reliquary Proof Vault

## Issues Raised and How They Were Resolved

---

### 1. Multiple Equivalence Principle rounds in the explorer

**Issue:** The contract was producing 4 separate Equivalence Principle outputs per `request_classification` call — one round per URL fetch plus one for the final LLM classification. This was caused by wrapping each `_fetch_url` call in its own `gl.vm.run_nondet_unsafe`.

**Fix:** Collapsed all evidence fetching, summarization, and classification into a single `run_nondet_unsafe` call inside `_classify`. The helper `_gather_evidence_block` is called directly from `leader_fn`/`validator_fn` (one call-frame deep), matching the pattern used in `disputeOS`. The explorer now shows exactly one Equivalence Principle round per classification or reclassification.

---

### 2. Raw HTML dumped as the Equivalence Principle output

**Issue:** Fetched web pages were being returned as raw HTML in the EP output panel — unreadable in the explorer and wasteful of LLM context.

**Fix:** Added `_extract_readable_text` to strip scripts, styles, nav boilerplate, and HTML tags before passing content to the LLM. The LLM then summarizes each page into 2–3 factual sentences. Only the final classification JSON appears as the EP output, not any fetched content.

---

### 3. `gl.nondet.*` calls not reachable from the equivalence principle block (linter error)

**Issue:** The GenVM linter requires `gl.nondet.*` calls to be exactly one call-frame deep from `leader_fn`/`validator_fn`. An earlier version nested the nondet calls inside a standalone helper method called transitively, causing the linter to reject the contract.

**Fix:** `_gather_evidence_block` is now called directly from inside `leader_fn` and `validator_fn` — not through any intermediate closure or helper — satisfying the linter's reachability requirement.

---

### 4. Validator not running an independent evaluation

**Issue:** The validator function was not performing its own independent fetch and LLM judgment — it was effectively rubber-stamping the leader's result.

**Fix:** The validator now independently re-fetches every evidence URL, re-summarizes each page with its own LLM calls, builds its own classification prompt, and makes its own `exec_prompt` call. It never reads the leader's fetched content. Only after producing its own judgment does it compare results with the leader.

---

### 5. Consensus failures from exact-string label comparison

**Issue:** With the leader and validator each independently fetching and summarizing evidence (7+ chained stochastic operations per run), minor wording differences between their generated summaries were pushing borderline LLM judgments to neighboring labels (e.g. `unverifiable` vs `incomplete`), breaking exact-string equality and causing spurious consensus failures even on unambiguous evidence.

**Fix:** Added `CLASSIFICATION_BANDS` grouping the 9 classification labels into 3 substantive bands — `confirmed` (authentic, historically_significant, verified_significant), `questionable` (weak, incomplete, context_required, unverifiable), and `flagged` (manipulated, disputed). Validators now agree on the band rather than the exact label. Genuine disagreements (e.g. `authentic` vs `manipulated`) still land in different bands and correctly block consensus. This mirrors the band-based agreement logic used in `disputeOS`.

---

## Architecture After Fixes

```
request_classification / request_reclassification
  └─ _classify(header, labeled_urls, rules_and_schema)
       └─ run_nondet_unsafe(leader_fn, validator_fn)   ← single EP round
            ├─ leader_fn()
            │    ├─ _gather_evidence_block(labeled_urls)
            │    │    ├─ gl.nondet.web.get(url)         ← fetch
            │    │    └─ gl.nondet.exec_prompt(summary) ← summarize
            │    └─ gl.nondet.exec_prompt(classify)     ← classify
            └─ validator_fn(leader_result)
                 ├─ validate leader schema
                 ├─ _gather_evidence_block(labeled_urls) ← independent fetch + summarize
                 ├─ gl.nondet.exec_prompt(classify)      ← independent classify
                 └─ compare bands (not exact labels)
```

---

## Reference Contracts Consulted

- `ometere123/meritra` — web fetch pattern, compact value derivation from fetched body
- `ometere123/disputeOS` — single `run_nondet_unsafe` combining fetch and LLM judgment, band-based agreement logic

---

## Deployed Contract

**Address:** `0xB9a3019464e04C0c15721D2AA49512041C302c6f`  
**Network:** GenLayer Studionet  
**Commit:** `aa42733` — "Collapse evidence fetch + classification into a single nondet round"

Two consecutive end-to-end tests confirmed both `request_classification` transactions finalized with `status: classified` and a single Equivalence Principle round.
