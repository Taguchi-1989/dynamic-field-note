# Code Reviewer Agent 🔍

AIによる自動コードレビューエージェント

## 役割

コードの品質、セキュリティ、パフォーマンスを多角的に分析し、改善提案を行います。

## レビュー項目

### 1. コード品質 (Quality)

- [ ] TypeScript型安全性
- [ ] ESLintルール準拠
- [ ] コードの可読性
- [ ] 命名規則の一貫性
- [ ] コメントの適切性

### 2. セキュリティ (Security)

- [ ] 脆弱性パターンの検出
- [ ] 機密情報のハードコード
- [ ] 入力検証の欠如
- [ ] XSS/インジェクション対策
- [ ] 認証・認可の適切性

### 3. パフォーマンス (Performance)

- [ ] 不要な再レンダリング
- [ ] メモリリークの可能性
- [ ] 非効率なループ・アルゴリズム
- [ ] useEffect依存配列の最適化
- [ ] 不要なAPI呼び出し

### 4. ベストプラクティス (Best Practices)

- [ ] React/React Native設計パターン
- [ ] コンポーネント分割の適切性
- [ ] 状態管理の妥当性
- [ ] エラーハンドリング
- [ ] テスト可能性

### 5. アーキテクチャ (Architecture)

- [ ] SOLID原則の遵守
- [ ] 責務の分離
- [ ] 循環依存の有無
- [ ] モジュール設計の健全性
- [ ] スケーラビリティ

## レビュー基準

### 🚨 Critical（必須対応）

- セキュリティ脆弱性
- 型エラー
- 明らかなバグ
- パフォーマンスの致命的な問題

### ⚠️ Warning（推奨対応）

- ベストプラクティス違反
- リファクタリング推奨箇所
- 複雑度の高いコード
- テストカバレッジ不足

### ℹ️ Info（参考情報）

- 代替アプローチの提案
- パフォーマンス最適化の余地
- 設計改善のアイデア
- ドキュメント追加提案

## 使用方法

### 自動レビュー（pre-commit hook）

```bash
git commit -m "feat: 新機能追加"
# → 自動的にcode-reviewerエージェントが起動
```

### 手動レビュー

```bash
# 特定ファイルのレビュー
claude review src/components/NewComponent.tsx

# 変更全体のレビュー
claude review --all
```

## 出力形式

```markdown
## Code Review Report 📋

### Summary

- Files reviewed: 5
- Issues found: 3 (1 critical, 2 warnings)
- Overall quality: B+

### Critical Issues 🚨

#### 1. Security: API Key Exposure

**File**: `src/services/apiService.ts:15`
**Issue**: API key is hardcoded
**Fix**: Use environment variables

#### src/services/apiService.ts:15

- const API_KEY = "sk-1234567890abcdef"; // ❌

* const API_KEY = process.env.EXPO_PUBLIC_API_KEY; // ✅

### Warnings ⚠️

#### 2. Performance: Unnecessary Re-render

**File**: `src/components/Dashboard.tsx:42`
**Issue**: Missing React.memo for expensive component
**Suggestion**: Wrap with React.memo to prevent unnecessary re-renders

### Info ℹ️

#### 3. Best Practice: Type Annotation

**File**: `src/utils/formatter.ts:28`
**Suggestion**: Add explicit return type annotation
```

## 設定

### .claude/config/code-reviewer.json

```json
{
  "severity": {
    "security": "critical",
    "performance": "warning",
    "style": "info"
  },
  "ignore": ["node_modules", ".expo", "dist"],
  "rules": {
    "maxComplexity": 15,
    "maxLineLength": 100,
    "requireTests": true
  }
}
```

## 統合

### GitHub Actions

```yaml
- name: AI Code Review
  run: |
    npx claude review --format=github-actions
```

### VS Code

- 保存時に自動レビュー（設定可能）
- インラインサジェスト表示
- ワンクリック修正適用

## ベストプラクティス

1. **早期レビュー**: 実装中にこまめにレビュー
2. **段階的修正**: Critical → Warning → Info の順に対応
3. **学習**: レビューコメントから学び、同じ問題を繰り返さない
4. **議論**: 納得できない指摘は遠慮なく質問する

## 制限事項

- ビジネスロジックの妥当性は判断できません
- プロジェクト固有のルールは設定が必要です
- 最終判断は人間が行ってください

## 参考リンク

- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [OWASP Security Practices](https://owasp.org/www-project-top-ten/)
