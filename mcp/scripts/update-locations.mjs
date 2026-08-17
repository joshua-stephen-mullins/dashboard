const SECRET = process.env.MCP_AUTH_SECRET;
if (!SECRET) {
  console.error("MCP_AUTH_SECRET env var is required");
  process.exit(1);
}
const MCP_URL = `http://localhost:8787/mcp/${SECRET}`;

async function call(method, params) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now() + Math.random(), method, params }),
  });
  const json = await res.json();
  return JSON.parse(json.result.content[0].text);
}

const events = await call("tools/call", { name: "list_events", arguments: { from: "2020-01-01", to: "2030-12-31" } });

// Academic imports all have the pattern "Task — COURSE 12345"
const coursePattern = /—\s+[A-Z]{2,5}\s+\d{5}$/;
const academic = events.filter(e => coursePattern.test(e.title));

console.log(`Found ${academic.length} academic events to update...`);

let ok = 0;
for (const e of academic) {
  await fetch(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now() + Math.random(),
      method: "tools/call",
      params: { name: "update_event", arguments: { id: e.id, location: "TCU, TX" } },
    }),
  });
  ok++;
  if (ok % 50 === 0) console.log(`  ${ok}/${academic.length}...`);
}

console.log(`Done: ${ok} events updated.`);
