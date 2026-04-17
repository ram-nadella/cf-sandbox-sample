# google-workspace-mcp (Cloudflare Sandbox)

Self-hosted [Google Workspace MCP server](https://workspacemcp.com/) (upstream
[`taylorwilsdon/google_workspace_mcp`](https://github.com/taylorwilsdon/google_workspace_mcp))
running inside a [Cloudflare Sandbox](https://developers.cloudflare.com/sandbox/)
container, exposed to remote MCP clients (Claude Code, Claude Desktop, etc.)
via a Cloudflare-managed preview URL.

## How it works

**The Worker URL _is_ the MCP URL.** No `/start` endpoint, no bootstrap step.

- `WorkspaceMcpSandbox` subclasses the SDK's `Sandbox` class and overrides
  `onStart()` to launch `uvx workspace-mcp --transport streamable-http` as a
  background process (fixed `processId: "workspace-mcp"`) every time the
  container boots. OAuth secrets are pulled from the DO's `env` and injected
  into the MCP process.
- The Worker's `fetch()` is a one-liner: `sandbox.containerFetch(request, 8000)`.
  First hit auto-starts the container, which triggers `onStart`, which starts
  the MCP. The SDK retries `containerFetch` while the app is still coming up.
- Same container, same DO → same long-lived MCP process across requests.
  When the container sleeps and wakes, `onStart` runs again and relaunches it.

## Prerequisites

- Node.js 20+, Docker running locally (wrangler builds the image)
- A Cloudflare account on the **Workers Paid** plan (required for Containers)
- An OAuth 2.0 Web application client in Google Cloud Console with the
  Workspace APIs you want to use (Gmail, Calendar, Drive, …) enabled

## First-time setup

```bash
cd google-workspace-mcp
npm install
cp .dev.vars.example .dev.vars   # fill in OAuth client id/secret
npm run dev                      # first build ~2-3 min (docker), later seconds
```

Local flow (the Worker itself is the MCP endpoint):

```bash
# First hit boots the container + launches MCP (can take ~10-30s cold).
curl http://localhost:8787/health

# Subsequent requests are fast.
```

## Deploy

```bash
npx wrangler secret put GOOGLE_OAUTH_CLIENT_ID
npx wrangler secret put GOOGLE_OAUTH_CLIENT_SECRET
# Set WORKSPACE_EXTERNAL_URL to the Worker's public URL (or custom domain).
npx wrangler secret put WORKSPACE_EXTERNAL_URL
npx wrangler deploy
# Wait ~2-3 min for container provisioning on first deploy, then just hit it.
curl https://google-workspace-mcp.<your-subdomain>.workers.dev/health
```

## Google OAuth (one-time, manual)

1. In Google Cloud Console → OAuth 2.0 Client ID → Web application.
2. Register `<worker-url>/oauth2callback` as an authorized redirect URI.
3. Set `WORKSPACE_EXTERNAL_URL` to `<worker-url>` so `workspace-mcp`
   constructs the same redirect URI it registered.

The Worker URL is stable (unlike preview URLs), so this is a one-time setup.
For a custom domain, bind it in the Cloudflare dashboard and use that instead.

## Connect a client

```bash
# In Claude Code — the Worker URL is the MCP URL.
claude mcp add --transport http workspace https://google-workspace-mcp.<subdomain>.workers.dev
```

Then `/mcp` should list Gmail/Calendar/Drive tools, and a read call like
`list_calendars` should return Google data.

## Files

- `src/worker.ts` — `WorkspaceMcpSandbox` subclass (auto-launch in `onStart`) + proxy `fetch`
- `Dockerfile` — extends `cloudflare/sandbox:0.8.11-python`, adds `uv` + `workspace-mcp`
- `wrangler.jsonc` — container binding + Durable Object binding
- `.dev.vars.example` — required secrets

## Known limits

- Cold start: first hit after idle boots the container (seconds).
- Stateless mode: client must supply Google bearer tokens per request. For
  server-side token storage, mount R2 into the container — v2 concern.
- Single user / single sandbox DO (id `"singleton"`). Multi-tenant would key
  the DO by user id derived from the bearer token.
