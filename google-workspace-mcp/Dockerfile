FROM docker.io/cloudflare/sandbox:0.9.4-python

ENV PATH="/root/.local/bin:${PATH}"
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

RUN uv tool install workspace-mcp==1.20

ENV WORKSPACE_MCP_PORT=8000 \
    WORKSPACE_MCP_HOST=localhost \
    WORKSPACE_MCP_STATELESS_MODE=true \
    MCP_ENABLE_OAUTH21=true
    # GOOGLE_OAUTH_CLIENT_ID=placeholder.apps.googleusercontent.com \
    # GOOGLE_OAUTH_CLIENT_SECRET=placeholder

# COPY entrypoint.sh /entrypoint.sh
# RUN chmod +x /entrypoint.sh

EXPOSE 8000
# ENTRYPOINT ["/entrypoint.sh"]
