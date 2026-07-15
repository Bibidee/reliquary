import { createClient, generatePrivateKey, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const CONTRACT_ADDRESS = "0x43895fA4c6072a4BcD399f819E87ac0499f905D0";

const privateKey = generatePrivateKey();
const account = createAccount(privateKey);

console.log("=== Reliquary End-to-End Test ===\n");
console.log("Deployer:", account.address);
console.log("Contract:", CONTRACT_ADDRESS);
console.log("Network:  studionet\n");

const client = createClient({ chain: studionet, account });

async function readContract(functionName, args = []) {
  return client.readContract({ address: CONTRACT_ADDRESS, functionName, args });
}

async function writeContract(functionName, args = []) {
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    value: 0n,
  });
  console.log(`  tx hash: ${hash}`);
  console.log("  waiting for finalization (this can take 2–5 min)…");
  await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    retries: 100,
    interval: 4000,
  });
  console.log("  finalized ✓");
  return hash;
}

async function run() {
  // ── 1. Check current package count ────────────────────────────────────────
  console.log("── Step 1: read current package count");
  const countBefore = Number(await readContract("get_package_count"));
  console.log(`  package_count before = ${countBefore}`);
  const expectedId = countBefore;
  console.log(`  new package will be at id = ${expectedId}\n`);

  // ── 2. Create package with real BBC/OPCW evidence ─────────────────────────
  console.log("── Step 2: create_package");
  const title = "Syrian Chemical Attack — Douma, April 2018";
  const claim =
    "Chlorine cylinders were dropped from helicopters on residential buildings on 7 April 2018, killing at least 43 civilians. Footage and medical reports corroborate mass casualties consistent with chemical exposure.";
  const primarySources = JSON.stringify([
    "https://www.bbc.com/news/world-middle-east-43695066",
    "https://www.hrw.org/news/2019/02/13/syria-new-evidence-douma-chemical-attack",
  ]);
  const supportingSources = JSON.stringify([
    "https://www.opcw.org/sites/default/files/documents/2019/03/s-1731-2019(e).pdf",
  ]);
  const fileHashes = JSON.stringify([]);
  const archiveLinks = JSON.stringify([
    "https://web.archive.org/web/20180410/https://www.bbc.com/news/world-middle-east-43695066",
  ]);

  await writeContract("create_package", [
    title,
    claim,
    "video",
    "2018-04-07",
    "2018-04-08",
    primarySources,
    supportingSources,
    fileHashes,
    archiveLinks,
    "Footage filmed by the Syrian Civil Defence (White Helmets) and local journalists. OPCW investigation confirmed chlorinated organic chemicals at the site.",
    "public",
    "historically_significant",
    "Chain of custody for cylinder fragments contested by Russian and Syrian delegations.",
    "Russian Federation presented alternative scenario at UNSC; disputed by OPCW FFM.",
    "First confirmed use of chemical weapons in an urban environment post-2013, with documented international legal implications.",
    "Triggered US/UK/France coordinated airstrikes on Syrian chemical weapons infrastructure (14 April 2018).",
  ]);

  // ── 3. Confirm package exists ──────────────────────────────────────────────
  console.log("\n── Step 3: verify package exists via get_package");
  const pkg = await readContract("get_package", [expectedId]);
  console.log("  title:     ", pkg.title ?? pkg["title"]);
  console.log("  depositor: ", pkg.depositor ?? pkg["depositor"]);
  console.log("  status:    ", pkg.status ?? pkg["status"]);
  console.log("  id:        ", pkg.id ?? pkg["id"]);
  console.log("  ✓ package confirmed on-chain\n");

  // ── 4. Request classification (AI evaluation) ──────────────────────────────
  console.log("── Step 4: request_classification (AI + validators)");
  await writeContract("request_classification", [expectedId]);

  // ── 5. Read final classified state ────────────────────────────────────────
  console.log("\n── Step 5: read final package state");
  const classified = await readContract("get_package", [expectedId]);
  console.log("  status:              ", classified.status ?? classified["status"]);
  console.log("  classification:      ", classified.current_classification ?? classified["current_classification"]);
  console.log("  confidence:          ", classified.confidence ?? classified["confidence"]);
  console.log("  manipulation_risk:   ", classified.manipulation_risk ?? classified["manipulation_risk"]);
  console.log("  significance:        ", classified.significance ?? classified["significance"]);
  console.log("  source_alignment:    ", classified.source_alignment ?? classified["source_alignment"]);
  console.log("  preservation:        ", classified.preservation_priority ?? classified["preservation_priority"]);
  console.log("  short_reason:        ", classified.short_reason ?? classified["short_reason"]);

  // ── 6. Read classification records ────────────────────────────────────────
  console.log("\n── Step 6: get_classification_records");
  const records = await readContract("get_classification_records", [expectedId]);
  console.log(`  ${records.length} record(s)`);
  for (const r of records) {
    console.log("  record:", JSON.stringify(r, null, 2));
  }

  // ── 7. Final count ────────────────────────────────────────────────────────
  const countAfter = Number(await readContract("get_package_count"));
  console.log(`\n── Done. package_count is now ${countAfter}`);
  console.log(`   Package ${expectedId} is live on studionet.`);
  console.log(`   View at: https://reliquary-sigma.vercel.app/archive/${expectedId}`);
}

run().catch((err) => {
  console.error("\n✗ Test failed:", err?.message ?? err);
  process.exit(1);
});
