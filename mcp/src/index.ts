import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createClient } from "@supabase/supabase-js";
import { registerRecipeTools } from "./tools/recipes.js";
import { registerFixtureTools } from "./tools/fixtures.js";
import { registerStockTools } from "./tools/stocks.js";
import { registerCalendarTools } from "./tools/calendar.js";
import { registerBookTools } from "./tools/books.js";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  MCP_AUTH_SECRET: string;
  USER_ID: string;
  FOOTBALL_API_KEY: string;
}

export const ok = (text: string) => ({ content: [{ type: "text" as const, text }] });
export const err = (text: string) => ({ content: [{ type: "text" as const, text: `Error: ${text}` }], isError: true as const });

type JsonRpcRequest = { jsonrpc: "2.0"; id: string | number; method: string; params?: unknown };
type JsonRpcNotification = { jsonrpc: "2.0"; method: string; params?: unknown };

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, mcp-session-id",
};

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: CORS_HEADERS });

function respond(id: string | number, result: unknown): Response {
  return json({ jsonrpc: "2.0", id, result });
}

function respondError(id: string | number, code: number, message: string): Response {
  return json({ jsonrpc: "2.0", id, error: { code, message } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // MCP endpoint — the secret in the path is the auth
    if (url.pathname !== `/mcp/${env.MCP_AUTH_SECRET}`) {
      return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
    }

    const body = await request.json() as JsonRpcRequest | JsonRpcNotification;

    if (!("id" in body)) {
      return new Response(null, { status: 202 });
    }

    const { id, method, params } = body as JsonRpcRequest;

    if (method === "initialize") {
      return respond(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "dashboard", version: "1.0.0" },
      });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const server = new McpServer({ name: "dashboard", version: "1.0.0" });
    registerRecipeTools(server, supabase, env);
    registerFixtureTools(server, supabase, env);
    registerStockTools(server, supabase, env);
    registerCalendarTools(server, supabase, env);
    registerBookTools(server, supabase, env);

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    const client = new Client({ name: "proxy", version: "1.0.0" });
    await client.connect(clientTransport);

    if (method === "tools/list") {
      const result = await client.listTools();
      return respond(id, result);
    }

    if (method === "tools/call") {
      const { name, arguments: args } = params as { name: string; arguments: Record<string, unknown> };
      const result = await client.callTool({ name, arguments: args ?? {} });
      return respond(id, result);
    }

    return respondError(id, -32601, "Method not found");
  },
};
