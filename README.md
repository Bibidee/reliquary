# Reliquary

A decentralized evidence vault built on [GenLayer](https://genlayer.com) Studionet. Evidence packages are deposited on-chain, fetched and evaluated by GenLayer's non-deterministic AI validators, and preserved with honest classifications around authenticity, manipulation risk, completeness, and historical significance.

**Live app:** https://reliquary-sigma.vercel.app

---

## What it does

- **Deposit** — submit an evidence package: title, claim, sources, file hashes, archive links, context, and sensitivity level
- **Classify** — GenLayer validators independently fetch source URLs, run an LLM evaluation, and reach consensus on a classification label
- **Challenge** — any wallet can submit a counter-claim with new evidence
- **Reclassify** — a second AI consensus round factors in the challenge and updates the record
- **Archive** — all packages are publicly browsable with search, filters, and significance sorting
- **Gallery** — records classified as high or historic significance are surfaced in a curated view

---

## Classification labels

| Label | Meaning |
|---|---|
| `authentic` | Strong alignment between claim, sources, and provenance |
| `weak` | Contains useful material but does not strongly support the claim |
| `manipulated` | Signs of alteration, fabrication, or misleading framing |
| `incomplete` | Lacks enough material for a confident classification |
| `historically_significant` | Archival importance even if interpretation requires care |
| `verified_significant` | Independently verified and of lasting public importance |
| `context_required` | Evidence may be real but needs surrounding context |
| `unverifiable` | Validators could not access or confirm the evidence |
| `disputed` | Credible competing interpretations or challenges exist |

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Blockchain | GenLayer Studionet (Chain ID: 961) |
| Smart contract | Python intelligent contract (`contract/reliquary_proof_vault.py`) |
| Contract client | genlayer-js 1.1.8 |
| Wallet | MetaMask / Rabby via EIP-1193 (`window.ethereum`) |
| Deployment | Vercel |

---

## Contract

**Address:** `0x7046aBF994D63a00cE11549007188b7f24f41Ecb`
**Network:** GenLayer Studionet
**RPC:** `https://studio.genlayer.com/api`

The contract uses:
- `TreeMap[u256, str]` + JSON encoding for tamper-evident package storage
- `gl.nondet.exec_prompt(prompt)` inside `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` for AI classification
- `gl.nondet.web.get(url)` to fetch primary source URLs during classification
- `DynArray[str]` for challenge and classification record storage

Public methods: `create_package`, `request_classification`, `submit_challenge`, `request_reclassification`, `get_package`, `get_packages_page`, `get_package_count`, `get_challenges`, `get_classification_records`, `get_packages_by_depositor`

---

## Local development

```bash
npm install
npm run dev
```

Create `.env.local`:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x7046aBF994D63a00cE11549007188b7f24f41Ecb
NEXT_PUBLIC_STUDIONET_RPC=https://studio.genlayer.com/api
```

Open http://localhost:3000

---

## Deploy contract

```bash
node scripts/deploy.mjs
```

Deploys a fresh contract to Studionet and writes the new address to `.env.local` automatically.

---

## End-to-end test

```bash
node scripts/test-contract.mjs
```

Creates a real package on Studionet, requests classification, and prints the AI consensus result.

---

## Add Studionet to MetaMask

| Field | Value |
|---|---|
| Network Name | `GenLayer Studionet` |
| RPC URL | `https://studio.genlayer.com/api` |
| Chain ID | `961` |
| Currency Symbol | `GEN` |
