# Guardrails - 品質チェック実行

プロジェクトの品質基準を満たしているか、全項目をチェックします。

## 実行内容

1. **TypeScript 型チェック**
2. **ESLint コードスタイルチェック**
3. **Prettier フォーマットチェック**
4. **Smoke Tests 実行**

## コマンド

```bash
npm run guardrails
```

## 期待される結果

```
✅ TypeScript: 0エラー
✅ ESLint: 0警告
✅ Prettier: All files formatted
✅ Tests: 4 passed
```

すべてパスすればコミット可能です。
