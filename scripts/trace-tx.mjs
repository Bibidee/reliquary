const RPC = "https://studio.genlayer.com/api";
const hash = "0x4149d0d646737e45ed422fc47a18a1ab0fc2fb0070c18ef3fa1735cf070d9a30";

// Try the debug trace method
const res = await fetch(RPC, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "gen_dbg_traceTransaction",
    params: [hash],
  }),
});

const data = await res.json();
if (data.error) {
  // Try eth_getTransactionReceipt instead
  const res2 = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 2,
      method: "eth_getTransactionReceipt",
      params: [hash],
    }),
  });
  const d2 = await res2.json();
  console.log("eth_getTransactionReceipt:", JSON.stringify(d2?.result, null, 2));

  // Also try getting the raw transaction
  const res3 = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 3,
      method: "eth_getTransactionByHash",
      params: [hash],
    }),
  });
  const d3 = await res3.json();
  console.log("\neth_getTransactionByHash:", JSON.stringify(d3?.result, null, 2));
} else {
  const safe = JSON.stringify(data?.result, (_, v) => typeof v === "bigint" ? v.toString() : v, 2);
  console.log("trace:", safe);
}
