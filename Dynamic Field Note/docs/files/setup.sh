#!/bin/bash

# Claude Code DevContainer セットアップスクリプト（既存プロジェクト向け）
# 使用方法: bash setup.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  Claude Code - 既存プロジェクト導入"
echo "=========================================="
echo ""

# プロジェクトルートを確認
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  警告: Gitリポジトリが見つかりません${NC}"
    echo "   プロジェクトルートで実行していることを確認してください"
    read -p "続行しますか? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ステップ1: バックアップ
echo -e "${BLUE}📦 Step 1: プロジェクトのバックアップ${NC}"
echo ""

# 変更があるか確認
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  コミットされていない変更があります${NC}"
    git status -s
    echo ""
    read -p "これらをコミットしてからバックアップを作成しますか? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        git commit -m "chore: Claude Code導入前のスナップショット"
    fi
fi

# タグを作成
if git rev-parse pre-claude-code >/dev/null 2>&1; then
    echo -e "${YELLOW}タグ 'pre-claude-code' は既に存在します${NC}"
else
    git tag pre-claude-code
    echo -e "${GREEN}✓ バックアップタグ 'pre-claude-code' を作成しました${NC}"
fi
echo ""

# ステップ2: ディレクトリ構造を作成
echo -e "${BLUE}📁 Step 2: ディレクトリ構造を作成${NC}"
mkdir -p .devcontainer
mkdir -p .claude/commands
mkdir -p .claude/backups
echo -e "${GREEN}✓ ディレクトリを作成しました${NC}"
echo ""

# ステップ3: 設定ファイルをコピー
echo -e "${BLUE}📝 Step 3: 設定ファイルをコピー${NC}"
echo ""

# .devcontainerファイル
copy_with_confirm() {
    local file=$1
    local dest=$2
    
    if [ -f "$dest" ]; then
        echo -e "${YELLOW}⚠️  $dest が既に存在します${NC}"
        read -p "上書きしますか? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cp "$file" "$dest"
            echo -e "${GREEN}✓ $dest を更新しました${NC}"
        else
            echo -e "${YELLOW}→ $dest はスキップしました${NC}"
        fi
    else
        cp "$file" "$dest"
        echo -e "${GREEN}✓ $dest を作成しました${NC}"
    fi
}

# 各ファイルをコピー
if [ -f "devcontainer.json" ]; then
    copy_with_confirm "devcontainer.json" ".devcontainer/devcontainer.json"
fi

if [ -f "Dockerfile" ]; then
    copy_with_confirm "Dockerfile" ".devcontainer/Dockerfile"
fi

if [ -f "init-firewall.sh" ]; then
    cp "init-firewall.sh" ".devcontainer/"
    chmod +x ".devcontainer/init-firewall.sh"
    echo -e "${GREEN}✓ init-firewall.sh を作成しました${NC}"
fi

if [ -f ".claude.json" ]; then
    copy_with_confirm ".claude.json" ".claude.json"
fi

if [ -f "CLAUDE.md" ]; then
    if [ -f "CLAUDE.md" ] && [ -s "CLAUDE.md" ]; then
        echo -e "${YELLOW}⚠️  CLAUDE.md が既に存在し、内容があります${NC}"
        read -p "上書きしますか? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cp "CLAUDE.md" "./CLAUDE.md"
            echo -e "${GREEN}✓ CLAUDE.md を更新しました${NC}"
        else
            echo -e "${BLUE}ℹ️  既存のCLAUDE.mdをそのまま使用します${NC}"
        fi
    else
        cp "CLAUDE.md" "./CLAUDE.md"
        echo -e "${GREEN}✓ CLAUDE.md を作成しました${NC}"
        echo -e "${YELLOW}⚠️  CLAUDE.md を編集してプロジェクト情報を追加してください${NC}"
    fi
fi

# カスタムコマンド
if [ -d ".claude/commands" ] && [ -n "$(ls -A .claude/commands 2>/dev/null)" ]; then
    echo -e "${BLUE}ℹ️  .claude/commands/ は既に存在し、ファイルがあります${NC}"
    read -p "サンプルコマンドを追加しますか? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .claude/commands/*.md .claude/commands/ 2>/dev/null || true
        echo -e "${GREEN}✓ サンプルコマンドを追加しました${NC}"
    fi
else
    cp .claude/commands/*.md .claude/commands/ 2>/dev/null || true
    echo -e "${GREEN}✓ カスタムコマンドをコピーしました${NC}"
fi

echo ""

# ステップ4: .gitignoreを更新
echo -e "${BLUE}📝 Step 4: .gitignore を更新${NC}"

GITIGNORE_ENTRIES="
# Claude Code
.claude/backups/
.claude/error.log
*.backup-*
"

if [ -f ".gitignore" ]; then
    if ! grep -q ".claude/backups/" .gitignore; then
        echo "$GITIGNORE_ENTRIES" >> .gitignore
        echo -e "${GREEN}✓ .gitignore を更新しました${NC}"
    else
        echo -e "${BLUE}ℹ️  .gitignore は既に更新済みです${NC}"
    fi
else
    echo "$GITIGNORE_ENTRIES" > .gitignore
    echo -e "${GREEN}✓ .gitignore を作成しました${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}  ✅ セットアップ完了！${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}次のステップ:${NC}"
echo ""
echo "1. CLAUDE.md を編集してプロジェクト情報を追加:"
echo "   code CLAUDE.md"
echo ""
echo "2. VS Codeでプロジェクトを開く:"
echo "   code ."
echo ""
echo "3. 「Reopen in Container」をクリック"
echo "   または Ctrl+Shift+P → 'Dev Containers: Reopen in Container'"
echo ""
echo "4. コンテナ内でClaude Codeを認証:"
echo "   export ANTHROPIC_API_KEY='your-api-key'"
echo "   # または"
echo "   claude login"
echo ""
echo "5. 小さなタスクでテスト:"
echo "   cc 'READMEのtypoを修正して'"
echo "   git diff"
echo ""
echo "6. 問題なければコミット:"
echo "   git add ."
echo "   git commit -m 'chore: Claude Code設定を追加'"
echo ""
echo -e "${YELLOW}📚 詳細は README.md と QUICKSTART.md を参照してください${NC}"
echo ""
echo -e "${RED}⚠️  重要: 作業前に必ず 'checkpoint \"作業名\"' でバックアップを取ってください${NC}"
echo ""
