# Dynamic Field Note - Dev Container Dockerfile
# バイパス実行環境用のカスタムイメージ

FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

# ユーザーをnodeに設定
USER node

# Claude Codeバイパス実行用のエイリアス設定
# ⚠️ このエイリアスはDev Container内でのみ有効です
# ⚠️ ホストマシンでは通常モード（承認必要）で動作します
RUN echo 'alias claude="claude --dangerously-skip-permissions"' >> ~/.bashrc && \
    echo 'alias claude="claude --dangerously-skip-permissions"' >> ~/.zshrc || true

# 開発効率化用のエイリアス
RUN echo 'alias validate="npm run type-check && npm run lint && npm run format:check"' >> ~/.bashrc && \
    echo 'alias quicktest="npm run test:smoke"' >> ~/.bashrc && \
    echo 'alias fulltest="npm run validate && npm run test"' >> ~/.bashrc && \
    echo 'alias checkpoint="git add -A && git commit -m"' >> ~/.bashrc && \
    echo 'alias gdiff="git diff"' >> ~/.bashrc && \
    echo 'alias gstatus="git status"' >> ~/.bashrc && \
    echo 'alias cc="claude --dangerously-skip-permissions"' >> ~/.bashrc && \
    echo 'alias ccs="claude"' >> ~/.bashrc

# Git設定の最適化
RUN git config --global core.autocrlf input && \
    git config --global init.defaultBranch main

# タイムゾーン設定（日本時間）
ENV TZ=Asia/Tokyo

# Expo CLI のグローバルインストール
USER root
RUN npm install -g expo-cli @expo/ngrok

# 権限を戻す
USER node

# ウェルカムメッセージ
RUN echo 'echo "🚀 Dynamic Field Note Dev Container Ready!"' >> ~/.bashrc && \
    echo 'echo "📝 Claude Code bypass mode is ENABLED in this container"' >> ~/.bashrc && \
    echo 'echo "⚠️  Always run validate before commit: npm run validate"' >> ~/.bashrc && \
    echo 'echo ""' >> ~/.bashrc

WORKDIR /workspace
