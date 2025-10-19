#!/bin/bash

# GitHub Issue 登録スクリプト
# 使用方法: ./scripts/register-github-issues.sh

set -e

echo "📋 GitHub Issue 登録スクリプト"
echo "================================"
echo ""

# GitHub CLI 認証確認
if ! gh auth status &>/dev/null; then
  echo "⚠️  GitHub CLI の認証が必要です"
  echo ""
  echo "以下のコマンドを実行して認証してください："
  echo "  gh auth login"
  echo ""
  echo "認証後、再度このスクリプトを実行してください。"
  exit 1
fi

echo "✅ GitHub CLI 認証済み"
echo ""

# Issue #12: パフォーマンス監視ダッシュボード構築（完了済み）
echo "📝 Issue #12: パフォーマンス監視ダッシュボード構築（完了済み）"
gh issue create \
  --title "Issue #12: パフォーマンス監視ダッシュボード構築 ✅" \
  --label "enhancement,performance,monitoring" \
  --body "$(cat docs/issues/ISSUE_12_PERFORMANCE_DASHBOARD.md)" \
  --assignee "@me" || echo "Issue #12 作成失敗（既に存在する可能性あり）"

# 作成したissue番号を取得してクローズ
ISSUE_12=$(gh issue list --label "performance,monitoring" --limit 1 --json number --jq '.[0].number')
if [ -n "$ISSUE_12" ]; then
  echo "  → Issue #$ISSUE_12 を即座にクローズ"
  gh issue close "$ISSUE_12" --comment "✅ 実装完了: acda147"
fi

echo ""

# Issue #13: Performance 90点達成のための追加最適化
echo "📝 Issue #13: Performance 90点達成のための追加最適化"
gh issue create \
  --title "Issue #13: Performance 90点達成のための追加最適化" \
  --label "enhancement,performance,optimization" \
  --body "$(cat docs/issues/ISSUE_13_PERFORMANCE_90.md)" \
  --assignee "@me" || echo "Issue #13 作成失敗"

echo ""

# Issue #14: Flashlight セットアップ（Android）
echo "📝 Issue #14: Flashlight セットアップ（Android）"
gh issue create \
  --title "Issue #14: Flashlight セットアップ（Android）" \
  --label "enhancement,performance,mobile,android" \
  --body "$(cat docs/issues/ISSUE_14_FLASHLIGHT_SETUP.md)" \
  --assignee "@me" || echo "Issue #14 作成失敗"

echo ""

# Issue #11: CI/CD統合（Icebox）
echo "📝 [ICEBOX] Issue #11: CI/CD統合"
gh issue create \
  --title "[ICEBOX] Issue #11: CI/CD統合" \
  --label "enhancement,ci-cd,performance,automation,icebox" \
  --body "$(cat docs/issues/ICEBOX_ISSUE_11_CICD.md)" \
  --assignee "@me" || echo "Issue #11 作成失敗"

echo ""
echo "✅ GitHub Issue 登録完了"
echo ""
echo "📊 登録されたIssue一覧:"
gh issue list --limit 10
