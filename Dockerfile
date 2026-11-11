FROM node:22-slim

# curl と git を入れる
RUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*

# gh（GitHub CLI）を入れる（GitHub 公式の手順）
RUN mkdir -p -m 755 /etc/apt/keyrings \
 && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg -o /etc/apt/keyrings/githubcli-archive-keyring.gpg \
 && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
 && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
 && apt-get update && apt-get install -y gh && rm -rf /var/lib/apt/lists/*

USER node
# フォルダの持ち主の番号が違っても、git が止まらないようにする
RUN git config --global --add safe.directory /home/node/app

# コンテナに入ったとき、最初から src の中にいるようにする
WORKDIR /home/node/app/ai-training/src

# Claude Code（ネイティブインストーラー）
RUN curl -fsSL https://claude.ai/install.sh | bash
ENV PATH=/home/node/.local/bin:$PATH

EXPOSE 3000
