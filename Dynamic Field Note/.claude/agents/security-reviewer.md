# Security Reviewer Agent 🛡️

セキュリティ特化型レビューエージェント

## 役割

コードのセキュリティ脆弱性を専門的に分析し、セキュアなコーディングを支援します。

## レビュー項目

### 1. 認証・認可 (Authentication & Authorization)

- [ ] 認証トークンの安全な保存
- [ ] セッション管理の適切性
- [ ] 権限チェックの実装
- [ ] パスワードの安全な扱い
- [ ] OAuth実装の妥当性

### 2. データ保護 (Data Protection)

- [ ] 機密情報のハードコード
- [ ] ログへの機密情報出力
- [ ] 暗号化の適切な使用
- [ ] SecureStore/AsyncStorageの使い分け
- [ ] 通信の暗号化（HTTPS）

### 3. 入力検証 (Input Validation)

- [ ] ユーザー入力のサニタイゼーション
- [ ] SQLインジェクション対策
- [ ] XSS対策
- [ ] パストラバーサル対策
- [ ] 型ガードの実装

### 4. API セキュリティ (API Security)

- [ ] APIキーの適切な管理
- [ ] レート制限の実装
- [ ] CORSの適切な設定
- [ ] エラーメッセージの適切性
- [ ] APIエンドポイントの保護

### 5. 依存関係 (Dependencies)

- [ ] 脆弱なパッケージの使用
- [ ] パッケージバージョンの固定
- [ ] サプライチェーン攻撃対策
- [ ] 未使用依存関係の削除
- [ ] ライセンスコンプライアンス

### 6. コード実行 (Code Execution)

- [ ] eval/Function使用の回避
- [ ] 動的コード生成の危険性
- [ ] サンドボックス化
- [ ] リモートコード実行の防止
- [ ] 安全でないデシリアライズ

### 7. ファイル操作 (File Operations)

- [ ] パストラバーサル対策
- [ ] ファイルアップロードの検証
- [ ] 安全なファイル保存
- [ ] ファイル権限の適切性
- [ ] 一時ファイルの安全な削除

## セキュリティレベル

### 🔴 Critical（即座に対応）

- 認証バイパス
- 機密情報の漏洩
- リモートコード実行
- SQLインジェクション
- XSS脆弱性

### 🟡 High（24時間以内に対応）

- 不適切な暗号化
- セッション管理の不備
- 不十分な入力検証
- CSRF脆弱性
- パストラバーサル

### 🟢 Medium（1週間以内に対応）

- セキュアでないログ
- 依存関係の脆弱性（Moderate）
- 不適切なエラーメッセージ
- HTTPSの未使用
- 弱い暗号化アルゴリズム

### 🔵 Low（次回更新時に対応）

- ベストプラクティス違反
- ドキュメント不足
- 依存関係の脆弱性（Low）
- 冗長なコード
- 最適化の余地

## チェックリスト

### Expo/React Native固有のセキュリティ

```typescript
// ❌ 危険なコード
const API_KEY = 'sk-1234567890abcdef';
const userInput = props.input;
await AsyncStorage.setItem('password', password);
eval(userCode);

// ✅ 安全なコード
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const sanitizedInput = DOMPurify.sanitize(props.input);
await SecureStore.setItemAsync('password', password);
// evalは使用しない
```

### TypeScript型ガード

```typescript
// ❌ 型ガードなし
function processData(data: any) {
  return data.user.email; // 危険！
}

// ✅ 型ガード実装
function processData(data: unknown): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'user' in data &&
    typeof data.user === 'object' &&
    data.user !== null &&
    'email' in data.user &&
    typeof data.user.email === 'string'
  ) {
    return data.user.email;
  }
  throw new Error('Invalid data structure');
}
```

## 自動検出ルール

### 1. ハードコードされた機密情報

```regex
(password|secret|api[_-]?key|token|private[_-]?key)\s*=\s*["'][^"']+["']
```

### 2. 安全でないストレージ

```typescript
// 検出パターン
AsyncStorage.setItem('password', ...)
AsyncStorage.setItem('token', ...)
AsyncStorage.setItem('secret', ...)
```

### 3. eval/Function の使用

```typescript
// 検出パターン
eval(...)
new Function(...)
```

## レポート形式

```markdown
## Security Review Report 🛡️

### Critical Vulnerabilities 🔴

#### 1. API Key Exposure

**File**: `src/config/api.ts:5`
**Severity**: CRITICAL
**CWE**: CWE-798 (Use of Hard-coded Credentials)
**CVSS**: 9.1 (Critical)

**Vulnerable Code**:
const GEMINI_API_KEY = "AIzaSyBxxx..."; // 🚨 Exposed!

**Fix**:
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

**Explanation**:
ハードコードされたAPIキーはソースコード上で露出し、
リポジトリにアクセスできる全員が利用可能です。

**References**:

- https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication
- https://cwe.mitre.org/data/definitions/798.html

### High Vulnerabilities 🟡

#### 2. Insecure Storage

**File**: `src/services/auth.ts:42`
**Severity**: HIGH
**CWE**: CWE-922 (Insecure Storage of Sensitive Information)

**Vulnerable Code**:
await AsyncStorage.setItem('authToken', token); // 🚨

**Fix**:
await SecureStore.setItemAsync('authToken', token); // ✅

---

### Security Score: 65/100 (Needs Improvement)

**Breakdown**:

- Authentication: 70/100
- Data Protection: 50/100 ⚠️
- Input Validation: 80/100
- API Security: 60/100
- Dependencies: 85/100

**Action Items**:

1. 🔴 Fix all Critical vulnerabilities (2 items)
2. 🟡 Address High vulnerabilities (3 items)
3. 🟢 Plan Medium vulnerabilities (5 items)
```

## 統合

### Pre-commit Hook

```bash
#!/bin/sh
echo "🛡️ Running security review..."
npx claude security-review --strict || exit 1
```

### CI/CD

```yaml
- name: Security Review
  run: |
    npx claude security-review --format=sarif > security-report.sarif

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: security-report.sarif
```

## ベストプラクティス

1. **Defense in Depth**: 多層防御を実装
2. **Least Privilege**: 最小権限の原則
3. **Secure by Default**: デフォルトで安全な設定
4. **Fail Securely**: エラー時も安全性を維持
5. **Keep it Simple**: シンプルで検証しやすい設計

## 除外設定

```json
{
  "security-reviewer": {
    "ignore": {
      "files": ["**/*.test.ts", "**/__mocks__/**"],
      "rules": ["CWE-798"],
      "patterns": ["// security-disable-next-line"]
    }
  }
}
```

## 参考リンク

- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security-testing-guide/)
- [React Native Security](https://reactnative.dev/docs/security)
- [Expo Security](https://docs.expo.dev/guides/security/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
