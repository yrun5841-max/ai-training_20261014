FROM node:22-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /home/node/app

# Claude Code(ネイティブインストーラー)
RUN curl -fsSL https://claude.ai/install.sh | bash
ENV PATH=/home/node/.local/bin:$PATH

EXPOSE 3000