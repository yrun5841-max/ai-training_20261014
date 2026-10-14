FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Claude Code（ネイティブインストーラー）
RUN curl -fsSL https://claude.ai/install.sh | bash

EXPOSE 3000
