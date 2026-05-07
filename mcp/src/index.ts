import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createClient } from "@supabase/supabase-js";
import { registerRecipeTools } from "./tools/recipes.js";
import { registerFixtureTools } from "./tools/fixtures.js";
import { registerStockTools } from "./tools/stocks.js";
import { registerCalendarTools } from "./tools/calendar.js";

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
    const base = `${url.protocol}//${url.host}`;

    // OAuth discovery — lets Anthropic find our token + registration endpoints
    if (url.pathname === "/.well-known/oauth-authorization-server") {
      return json({
        issuer: base,
        authorization_endpoint: `${base}/authorize`,
        token_endpoint: `${base}/token`,
        registration_endpoint: `${base}/register`,
        grant_types_supported: ["authorization_code", "client_credentials"],
        token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic", "none"],
        response_types_supported: ["code"],
        code_challenge_methods_supported: ["S256", "plain"],
      });
    }

    // OAuth dynamic client registration (RFC 7591)
    // Anthropic's backend registers here first; we hand back our secret as the client_secret
    if (url.pathname === "/register" && request.method === "POST") {
      return json({
        client_id: "dashboard-mcp",
        client_secret: env.MCP_AUTH_SECRET,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        grant_types: ["client_credentials"],
        token_endpoint_auth_method: "client_secret_post",
      }, 201);
    }

    // OAuth token endpoint — issue our secret as the access token
    if (url.pathname === "/token" && request.method === "POST") {
      const body = await request.text();
      const params = new URLSearchParams(body);
      const grantType = params.get("grant_type");

      // authorization_code grant: code IS the secret
      if (grantType === "authorization_code") {
        const code = params.get("code");
        if (code !== env.MCP_AUTH_SECRET) {
          return json({ error: "invalid_grant" }, 401);
        }
        return json({ access_token: env.MCP_AUTH_SECRET, token_type: "bearer", expires_in: 86400 });
      }

      // client_credentials grant: verify client_secret
      let clientSecret = params.get("client_secret");
      if (!clientSecret) {
        const authHeader = request.headers.get("Authorization") ?? "";
        if (authHeader.startsWith("Basic ")) {
          const decoded = atob(authHeader.slice(6));
          clientSecret = decoded.split(":")[1] ?? "";
        }
      }
      if (clientSecret !== env.MCP_AUTH_SECRET) {
        return json({ error: "invalid_client" }, 401);
      }
      return json({ access_token: env.MCP_AUTH_SECRET, token_type: "bearer", expires_in: 86400 });
    }

    // OAuth protected resource metadata
    if (url.pathname === "/.well-known/oauth-protected-resource") {
      return json({
        resource: `${base}/mcp`,
        authorization_servers: [base],
        bearer_methods_supported: ["header"],
        scopes_supported: ["mcp"],
      });
    }

    // OAuth authorize endpoint — auto-approves for this single-user server
    if (url.pathname === "/authorize") {
      const redirectUri = url.searchParams.get("redirect_uri") ?? "";
      const state = url.searchParams.get("state") ?? "";
      const code = env.MCP_AUTH_SECRET;
      const redirect = new URL(redirectUri);
      redirect.searchParams.set("code", code);
      if (state) redirect.searchParams.set("state", state);
      return Response.redirect(redirect.toString(), 302);
    }

    // MCP endpoint
    if (url.pathname !== "/mcp") {
      return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
    }

    // Auth is optional — accept valid Bearer token if present, but don't block without one.
    // The obscurity of the Worker URL is the primary protection for this personal server.

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
