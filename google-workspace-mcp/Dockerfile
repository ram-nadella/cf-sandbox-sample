FROM docker.io/cloudflare/sandbox:0.9.4-python

ENV PATH="/root/.local/bin:${PATH}"
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

RUN uv tool install workspace-mcp==1.20

ENV WORKSPACE_MCP_PORT=8000 \
    WORKSPACE_MCP_HOST=0.0.0.0 \
    WORKSPACE_MCP_STATELESS_MODE=true \
    MCP_ENABLE_OAUTH21=true

EXPOSE 8000
