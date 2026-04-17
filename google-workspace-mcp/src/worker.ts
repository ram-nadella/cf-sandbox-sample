import { getSandbox, Sandbox } from "@cloudflare/sandbox";

type Env = {
  WorkspaceMcpSandbox: DurableObjectNamespace<WorkspaceMcpSandbox>;
  GOOGLE_OAUTH_CLIENT_ID: string;
  GOOGLE_OAUTH_CLIENT_SECRET: string;
  WORKSPACE_EXTERNAL_URL: string;
};

const MCP_PORT = 8000;
const MCP_PROCESS_ID = "workspace-mcp";

// Subclass Sandbox so onStart() fires every time the container boots, and we
// auto-launch the MCP server inside it. No /start endpoint, no ceremony — the
// Worker URL IS the MCP URL.
export class WorkspaceMcpSandbox extends Sandbox<Env> {
  override async onStart(): Promise<void> {
    try {
      await this.startProcess(
        "uvx workspace-mcp --transport streamable-http",
        {
          processId: MCP_PROCESS_ID,
          env: {
            GOOGLE_OAUTH_CLIENT_ID: this.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
            GOOGLE_OAUTH_CLIENT_SECRET:
              this.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
            WORKSPACE_EXTERNAL_URL: this.env.WORKSPACE_EXTERNAL_URL ?? "",
            WORKSPACE_MCP_PORT: String(MCP_PORT),
            WORKSPACE_MCP_HOST: "0.0.0.0",
            WORKSPACE_MCP_STATELESS_MODE: "true",
          },
        },
      );
    } catch (err) {
      // startProcess with a fixed processId throws if one is already running;
      // that's the normal case on subsequent onStart calls, ignore it.
      const msg = err instanceof Error ? err.message : String(err);
      if (!/already|exist/i.test(msg)) throw err;
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const sandbox = getSandbox(env.WorkspaceMcpSandbox, "singleton");
    // containerFetch auto-starts the container if it's not running, which
    // triggers onStart() → MCP launch. The SDK handles retries while the
    // app is still coming up on :8000.
    return sandbox.containerFetch(request, MCP_PORT);
  },
};
