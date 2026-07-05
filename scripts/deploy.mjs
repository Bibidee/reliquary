import { createClient, generatePrivateKey, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function deploy() {
  console.log("=== Reliquary Proof Vault Deployment ===\n");

  // Generate deployer account
  const privateKey = generatePrivateKey();
  const account = createAccount(privateKey);
  console.log("Deployer address:", account.address);
  console.log("Private key:", privateKey);
  console.log("\nConnecting to GenLayer Studionet...");

  const client = createClient({
    chain: studionet,
    account,
  });

  // Read contract source
  const contractPath = join(__dirname, "../contract/reliquary_proof_vault.py");
  const contractCode = readFileSync(contractPath, "utf-8");
  console.log("Contract source loaded:", contractPath);

  console.log("\nDeploying contract...");
  const deployHash = await client.deployContract({
    code: contractCode,
    args: [],
  });
  console.log("Deploy transaction hash:", deployHash);

  console.log("\nWaiting for deployment to finalize...");
  const { TransactionStatus } = await import("genlayer-js/types");
  const receipt = await client.waitForTransactionReceipt({
    hash: deployHash,
    status: TransactionStatus.FINALIZED,
    retries: 60,
    interval: 5000,
  });

  const contractAddress =
    receipt.contract_address ||
    receipt.contractAddress ||
    receipt?.data?.contract_address ||
    receipt?.to_address;
  if (!contractAddress) {
    console.error("Deployment failed — no contract address in receipt.");
    console.error("Receipt:", JSON.stringify(receipt, null, 2));
    process.exit(1);
  }

  // Check if execution actually succeeded
  const leaderReceipt = receipt?.consensus_data?.leader_receipt?.[0];
  if (leaderReceipt?.execution_result === "ERROR") {
    const stderr = leaderReceipt?.genvm_result?.stderr || "(no stderr)";
    console.error("Contract execution failed during deployment:");
    console.error(stderr);
    process.exit(1);
  }

  console.log("\n✓ Contract deployed successfully!");
  console.log("Contract address:", contractAddress);

  // Save to .env.local
  const envPath = join(__dirname, "../.env.local");
  const envContent = `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}\nNEXT_PUBLIC_STUDIONET_RPC=https://studio.genlayer.com:8080\n`;
  writeFileSync(envPath, envContent);
  console.log("\n✓ .env.local updated with contract address.");

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    deployerAddress: account.address,
    deployHash,
    timestamp: new Date().toISOString(),
    network: "studionet",
  };
  const deploymentPath = join(__dirname, "../deployment.json");
  writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("✓ deployment.json saved.");

  console.log("\n=== Deployment Complete ===");
  console.log("Contract address:", contractAddress);
  console.log("Add to .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);

  return contractAddress;
}

deploy().catch((err) => {
  console.error("Deployment error:", err);
  process.exit(1);
});
