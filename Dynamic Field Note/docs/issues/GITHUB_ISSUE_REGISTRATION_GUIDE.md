# GitHub Issue 登録ガイド 📝

**作成日**: 2025-10-19
**目的**: Phase 4の4つのissueをGitHubリポジトリに登録する手順

---

## 📋 登録するIssue一覧

### ✅ Issue #12: パフォーマンス監視ダッシュボード構築（完了済み）

**Status**: CLOSED（実装完了）
**Labels**: `enhancement`, `performance`, `monitoring`
**Milestone**: Phase 4
**Assignees**: TBD

**概要**:
Lighthouse測定結果を可視化し、READMEにパフォーマンスバッジを表示。時系列での推移を追跡できるようにする。

**実装内容**:

- ✅ `scripts/generate-performance-badge.js` 作成
- ✅ `scripts/update-performance-history.js` 作成
- ✅ `docs/performance-history.json` 初期化
- ✅ README.md にバッジ追加
- ✅ npm スクリプト追加

**関連PR**: #TBD（本コミットをPRにする場合）

**詳細**: [ISSUE_12_PERFORMANCE_DASHBOARD.md](ISSUE_12_PERFORMANCE_DASHBOARD.md)

---

### 🔜 Issue #13: Performance 90点達成のための追加最適化

**Status**: OPEN（未実装）
**Labels**: `enhancement`, `performance`, `optimization`
**Priority**: P2 (中優先度)
**Milestone**: Phase 4
**Assignees**: TBD
**工数**: 17時間

**概要**:
Performance スコアを78点→90点に引き上げる。5つのPhaseに分割して段階的に実装。

**実装内容**:

- [ ] Phase 1: 画像事前最適化（WebP、Blurhash）- 3時間
- [ ] Phase 2: フォント最適化 - 2時間
- [ ] Phase 3: Critical CSS 抽出 - 3時間
- [ ] Phase 4: バンドルサイズ最適化 - 4時間
- [ ] Phase 5: Service Worker / PWA化 - 5時間

**期待効果**: Performance 78→90点（+12点改善）

**詳細**: [ISSUE_13_PERFORMANCE_90.md](ISSUE_13_PERFORMANCE_90.md)

---

### 🔜 Issue #14: Flashlight セットアップ（Android）

**Status**: OPEN（未実装）
**Labels**: `enhancement`, `performance`, `mobile`, `android`
**Priority**: P3 (低優先度)
**Milestone**: Phase 4
**Assignees**: TBD
**工数**: 3時間

**概要**:
React Native（Android）アプリのパフォーマンスを測定し、ネイティブアプリの品質を保証する。

**実装内容**:

- [ ] Flashlightパッケージインストール
- [ ] Android実機/エミュレータセットアップ
- [ ] 4つのシナリオ測定実行
- [ ] レポート生成と可視化

**測定シナリオ**:

1. App Launch
2. Case List Navigation
3. Voice Recording
4. AI Summary Generation

**詳細**: [ISSUE_14_FLASHLIGHT_SETUP.md](ISSUE_14_FLASHLIGHT_SETUP.md)

---

### 🧊 [ICEBOX] Issue #11: CI/CD統合

**Status**: ICEBOX（後回し）
**Labels**: `enhancement`, `ci-cd`, `performance`, `automation`, `icebox`
**Priority**: ~~P0~~ → Icebox
**Milestone**: Phase 5（またはPerformance 90点達成後）
**Assignees**: TBD
**工数**: 3時間

**Icebox理由**:

- プロジェクトがまだ完璧ではない（Performance 78/100）
- ベースラインが確定していない
- 手動測定で十分な段階

**再検討タイミング**:

- Performance 90点以上達成後
- Phase 4完了後
- Phase 5（本番デプロイ準備）開始時

**概要**:
Lighthouse測定をGitHub Actionsに統合し、PR時に自動測定。パフォーマンス退行を検出する。

**詳細**: [ICEBOX_ISSUE_11_CICD.md](ICEBOX_ISSUE_11_CICD.md)

---

## 🚀 GitHub Issue 登録手順

### 方法1: GitHub CLI（推奨）

```bash
# 認証（初回のみ）
gh auth login

# Issue #12登録（完了済みissueとして）
gh issue create \
  --title "Issue #12: パフォーマンス監視ダッシュボード構築 ✅" \
  --label "enhancement,performance,monitoring" \
  --milestone "Phase 4" \
  --body "$(cat docs/issues/ISSUE_12_PERFORMANCE_DASHBOARD.md)"

# issueを即座にクローズ（実装済みのため）
gh issue close 12 --comment "実装完了: acda147"

# Issue #13登録
gh issue create \
  --title "Issue #13: Performance 90点達成のための追加最適化" \
  --label "enhancement,performance,optimization" \
  --milestone "Phase 4" \
  --body "$(cat docs/issues/ISSUE_13_PERFORMANCE_90.md)"

# Issue #14登録
gh issue create \
  --title "Issue #14: Flashlight セットアップ（Android）" \
  --label "enhancement,performance,mobile,android" \
  --milestone "Phase 4" \
  --body "$(cat docs/issues/ISSUE_14_FLASHLIGHT_SETUP.md)"

# Issue #11をIceboxとして登録
gh issue create \
  --title "[ICEBOX] Issue #11: CI/CD統合" \
  --label "enhancement,ci-cd,performance,automation,icebox" \
  --milestone "Phase 5" \
  --body "$(cat docs/issues/ICEBOX_ISSUE_11_CICD.md)"
```

### 方法2: GitHub Web UI（手動）

1. **リポジトリに移動**

   ```
   https://github.com/Taguchi-1989/dynamic-field-note/issues
   ```

2. **"New Issue"をクリック**

3. **各Issueの情報を入力**

   **Issue #12: パフォーマンス監視ダッシュボード構築**
   - Title: `Issue #12: パフォーマンス監視ダッシュボード構築 ✅`
   - Labels: `enhancement`, `performance`, `monitoring`
   - Milestone: `Phase 4`
   - Assignees: （自分を割り当て）
   - Body: `docs/issues/ISSUE_12_PERFORMANCE_DASHBOARD.md` の内容をコピー&ペースト
   - **即座にClose**: "Close issue"をクリックし、コメント欄に`実装完了: acda147`と入力

   **Issue #13: Performance 90点達成のための追加最適化**
   - Title: `Issue #13: Performance 90点達成のための追加最適化`
   - Labels: `enhancement`, `performance`, `optimization`
   - Milestone: `Phase 4`
   - Body: `docs/issues/ISSUE_13_PERFORMANCE_90.md` の内容をコピー&ペースト

   **Issue #14: Flashlight セットアップ（Android）**
   - Title: `Issue #14: Flashlight セットアップ（Android）`
   - Labels: `enhancement`, `performance`, `mobile`, `android`
   - Milestone: `Phase 4`
   - Body: `docs/issues/ISSUE_14_FLASHLIGHT_SETUP.md` の内容をコピー&ペースト

   **[ICEBOX] Issue #11: CI/CD統合**
   - Title: `[ICEBOX] Issue #11: CI/CD統合`
   - Labels: `enhancement`, `ci-cd`, `performance`, `automation`, `icebox`
   - Milestone: `Phase 5`
   - Body: `docs/issues/ICEBOX_ISSUE_11_CICD.md` の内容をコピー&ペースト

---

## 📊 Milestone 設定

以下のMilestoneを作成（まだ存在しない場合）：

### Phase 4: パフォーマンス最適化

- **Due Date**: TBD
- **Description**: Lighthouse & Flashlight導入、Performance 90点達成
- **Issues**: #12, #13, #14

### Phase 5: 本番デプロイ準備

- **Due Date**: TBD
- **Description**: CI/CD統合、セキュリティ強化、本番環境構築
- **Issues**: #11（Iceboxから復活時）

---

## 📝 Project Board 設定（Optional）

GitHubのProject Boardでタスク管理を行う場合：

### Columns（カラム）

1. **Icebox** 🧊
   - Issue #11（CI/CD統合）

2. **Todo** 📋
   - Issue #13（Performance 90点）
   - Issue #14（Flashlight）

3. **In Progress** 🚧
   - （現在作業中のissue）

4. **Done** ✅
   - Issue #12（監視ダッシュボード）

---

## 🎯 次のアクション

1. **GitHub CLI認証**（初回のみ）

   ```bash
   gh auth login
   ```

2. **Issue登録**
   - 上記のコマンドを実行
   - または、Web UIで手動登録

3. **Issue #13実装開始**
   - Phase 1: 画像事前最適化から開始

---

**作成日**: 2025-10-19
**最終更新**: 2025-10-19
