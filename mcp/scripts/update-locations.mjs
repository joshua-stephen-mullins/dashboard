const MCP_URL = "http://localhost:8787/mcp";
const AUTH = "Bearer c46fdc6fc068e3c681a9bbe86ad91e64b8c33611990afe14e2aba7e5c8cc901b";

async function call(method, params) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
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
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
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
