# Pin to the matching @cloudflare/sandbox SDK version. The `-python` variant
# already bundles Python 3.11 (PGO+LTO), pip, numpy/pandas/matplotlib, and
# keeps the sandbox control server as the ENTRYPOINT — do NOT override CMD
# or ENTRYPOINT or you'll break the SDK.
FROM docker.io/cloudflare/sandbox:0.8.11-python

# uv is the package manager workspace-mcp is installed/run with. Use the
# official standalone installer so the binary lands at a known location
# (/root/.local/bin/uv) regardless of the base image's Python layout.
ENV PATH="/root/.local/bin:${PATH}"
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Warm the uv tool cache with workspace-mcp so the first `uvx workspace-mcp`
# call in the running container is fast.
RUN uv tool install workspace-mcp

# Defaults for the MCP server; Worker can override per-invocation via startProcess env.
ENV WORKSPACE_MCP_PORT=8000 \
    WORKSPACE_MCP_HOST=0.0.0.0 \
    WORKSPACE_MCP_STATELESS_MODE=true

EXPOSE 8000
