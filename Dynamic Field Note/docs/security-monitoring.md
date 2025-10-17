# セキュリティ監視ワークフロー 🔒

**プロジェクト**: Dynamic Field Note
**最終更新**: 2025-10-18

---

## 📋 概要

Dynamic Field Note のセキュリティを継続的に監視し、脆弱性を早期に検出・対応するためのワークフローです。

---

## 🛡️ 自動監視システム

### 1. GitHub Dependabot

**設定ファイル**: `.github/dependabot.yml`

**監視内容**:

- npm パッケージの脆弱性
- GitHub Actions の脆弱性
- 週次自動チェック（毎週月曜 9:00 JST）

**動作**:

1. 脆弱性のある依存関係を検出
2. 自動的に更新 PR を作成
3. レビュー依頼を @Taguchi-1989 に通知

**PR のラベル**:

- `dependencies` - 依存関係の更新
- `security` - セキュリティアップデート

### 2. npm audit（手動実行）

**実行頻度**: 週次（Dependabot と併用）

**コマンド**:

```bash
npm audit
npm audit fix  # 自動修正可能な場合
```

---

## 📊 現在の脆弱性ステータス

### 検出済み脆弱性（2025-10-18 時点）

| パッケージ  | バージョン | 深刻度   | 状態   | 対応予定           |
| ----------- | ---------- | -------- | ------ | ------------------ |
| markdown-it | < 12.3.2   | Moderate | 監視中 | 依存パッケージ待ち |

**詳細**:

- **問題**: Uncontrolled Resource Consumption
- **CVE**: GHSA-6vfc-qv3f-vr6c
- **影響を受けるパッケージ**: `react-native-markdown-display`
- **修正版**: 現時点でなし

### リスク評価

| 項目                 | 評価     | 理由                                      |
| -------------------- | -------- | ----------------------------------------- |
| **実運用への影響**   | **低**   | Markdown コンテンツは信頼できるソースのみ |
| **悪用の可能性**     | **低**   | ユーザー入力を直接 Markdown 化していない  |
| **データ漏洩リスク** | **なし** | 脆弱性は DoS 系（リソース消費）           |

---

## 🔄 週次監視ワークフロー

### 毎週月曜 9:00 JST

#### 自動実行（Dependabot）

1. ✅ 依存関係の脆弱性スキャン
2. ✅ 更新可能なパッケージを検出
3. ✅ セキュリティアップデートの PR 作成
4. ✅ レビュー依頼通知

#### 手動確認（開発者）

1. **Dependabot PR を確認**
   - PR のタイトルと説明を読む
   - 変更内容（package.json, package-lock.json）を確認
   - CI/CD のテスト結果を確認

2. **npm audit を手動実行**

   ```bash
   npm audit
   ```

3. **脆弱性レポートを確認**
   - 新規脆弱性の有無
   - 深刻度の変化
   - 修正版の有無

4. **対応判断**
   - Critical/High → 即座に対応
   - Moderate → 週次レビューで検討
   - Low → 月次レビューで検討

---

## 🚨 緊急対応フロー

### Critical/High 脆弱性が検出された場合

#### ステップ 1: 影響範囲の特定（30 分以内）

```bash
# 影響を受けるパッケージを特定
npm audit

# 依存関係ツリーを確認
npm ls <vulnerable-package>
```

#### ステップ 2: 緊急パッチ適用（2 時間以内）

```bash
# 自動修正を試行
npm audit fix

# 自動修正できない場合は手動更新
npm update <package-name>

# メジャーバージョン更新が必要な場合
npm install <package-name>@latest
```

#### ステップ 3: テスト実行（1 時間以内）

```bash
# 型チェック
npm run type-check

# Lint
npm run lint

# フォーマット確認
npm run format:check

# アプリ起動テスト
npm start
```

#### ステップ 4: 緊急デプロイ（1 時間以内）

```bash
# 緊急コミット
git add package.json package-lock.json
git commit -m "security: 緊急パッチ適用 - <CVE-ID>"

# プッシュ
git push origin main
```

#### ステップ 5: 事後報告（24 時間以内）

- インシデントレポートを作成
- docs/security-incidents/ に記録
- チームに共有

---

## 📝 脆弱性対応の記録

### テンプレート

```markdown
## 脆弱性 ID: <CVE-ID or GHSA-ID>

**検出日**: YYYY-MM-DD
**深刻度**: Critical / High / Moderate / Low
**影響を受けるパッケージ**: <package-name>@<version>

### 問題の詳細

<脆弱性の説明>

### 対応内容

- [ ] 影響範囲の特定
- [ ] パッチ適用
- [ ] テスト実施
- [ ] デプロイ
- [ ] 事後確認

### 対応結果

- **対応日**: YYYY-MM-DD
- **対応者**: @username
- **パッチバージョン**: <package-name>@<new-version>
- **テスト結果**: ✅ 合格 / ❌ 失敗

### 教訓

<今後の改善点>
```

---

## 🔍 定期レビュー

### 月次レビュー（毎月第 1 月曜）

1. **脆弱性トレンド分析**
   - 過去 1 ヶ月の脆弱性検出数
   - 深刻度の分布
   - 対応時間の平均

2. **依存関係の健全性チェック**

   ```bash
   npm outdated
   npx depcheck
   ```

3. **未使用パッケージの削減**
   - Phase 3 で使用予定のパッケージを確認
   - 不要なパッケージを削除

4. **セキュリティポリシーの更新**
   - 新しい脆弱性パターンに対応
   - ワークフローの改善

### 四半期レビュー（3 ヶ月ごと）

1. **外部セキュリティ監査**
   - SonarQube によるコード品質分析
   - OWASP 依存関係チェック

2. **セキュリティトレーニング**
   - 最新の脆弱性トレンド学習
   - セキュアコーディングのベストプラクティス更新

---

## 🛠️ ツールと設定

### 使用ツール

| ツール         | 用途                   | 実行頻度 |
| -------------- | ---------------------- | -------- |
| Dependabot     | 依存関係の自動監視     | 週次     |
| npm audit      | 手動脆弱性スキャン     | 週次     |
| SonarQube      | コード品質・脆弱性分析 | 月次     |
| Snyk（検討中） | リアルタイム脆弱性監視 | -        |

### 設定ファイル

- `.github/dependabot.yml` - Dependabot 設定
- `sonar-project.properties` - SonarQube 設定（作成予定）
- `.codeclimate.yml` - CodeClimate 設定（作成予定）

---

## 📞 緊急連絡先

### セキュリティインシデント報告先

- **GitHub Issues**: [セキュリティラベル](https://github.com/Taguchi-1989/dynamic-field-note/labels/security)
- **開発者**: @Taguchi-1989

### エスカレーション基準

| 深刻度   | 対応時間       | エスカレーション先         |
| -------- | -------------- | -------------------------- |
| Critical | 即座（1 時間） | プロジェクトマネージャー   |
| High     | 2 時間以内     | リードデベロッパー         |
| Moderate | 24 時間以内    | 開発チーム                 |
| Low      | 1 週間以内     | 次回定期ミーティングで報告 |

---

## 📚 参考リンク

### 公式ドキュメント

- [GitHub Dependabot](https://docs.github.com/en/code-security/dependabot)
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/)

### 脆弱性データベース

- [GitHub Advisory Database](https://github.com/advisories)
- [npm Security Advisories](https://www.npmjs.com/advisories)
- [CVE Database](https://cve.mitre.org/)

### ベストプラクティス

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## 🎯 目標

### 短期目標（Phase 2-3）

- ✅ Dependabot の有効化
- ✅ 週次監視ワークフローの確立
- [ ] markdown-it 脆弱性の解決（依存パッケージ更新待ち）

### 中期目標（Phase 4-5）

- [ ] SonarQube の統合
- [ ] セキュリティテストの自動化
- [ ] ゼロデイ脆弱性への対応プロセス確立

### 長期目標（運用フェーズ）

- [ ] セキュリティ監査の外部委託
- [ ] バグバウンティプログラムの開始
- [ ] SOC 2 Type II 準拠

---

**最終更新**: 2025-10-18
**更新者**: AI Assistant
**次回レビュー**: Phase 3 完了時
