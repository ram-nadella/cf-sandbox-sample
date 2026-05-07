import { getSandbox, parseSSEStream, Sandbox, type ExecEvent } from "@cloudflare/sandbox";

export class GoogleWorkspaceMCPSandbox extends Sandbox {
  sleepAfter = "5m";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // use an ID that represents user + agent session so that a new sandbox is not needed for each call
    // TODO: fix this, for demo purposes accept a MCP session ID param for sandbox identification, verify token
    const sessionId = request.headers.get("Mcp-Session-Id");
    const sandbox = getSandbox(env.GoogleWorkspaceMCPSandbox, `workspace-mcp-sandbox-${sessionId}`);

    const mcpServer = await sandbox.startProcess(
      "uvx workspace-mcp --transport streamable-http --tools gmail drive calendar",
    );
    console.log(
      `Workspace MCP server startup initiated. Process ID: ${mcpServer.id} PID: ${mcpServer.pid} Status: ${mcpServer.status}`,
    );
    // wait for health check
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const check = await sandbox.exec('curl -f http://localhost:8000/health || echo "not ready"');
      console.log(`Waited ${i + 1} seconds for server start`);
      if (check.stdout.includes("healthy")) {
        break;
      }
    }
    const logs = await mcpServer.getLogs();
    console.log(logs);

    // forward the /mcp requests to the workspace MCP server process
    if (url.pathname === "/mcp") {
      const upstream = new Request("http://localhost:8000/mcp", {
        method: request.method,
        // TODO: filter headers
        headers: request.headers,
        body: request.body,
      });

      return sandbox.containerFetch(upstream, 8000);
    }

    return new Response("MCP sandbox is running, send requests to /mcp");
  },
};
