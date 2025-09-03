# 20250902_AI実行ワークフロー改修計画レビュー（codex_ai-api_review）

**作成日**: 2025-09-02  
**最終更新**: 2025-09-02  
対象ドキュメント: API_WORKFLOW_ANALYSIS.md / FILE_STRUCTURE_REFERENCE.md / AI_EXECUTION_IMPROVEMENT_PLAN.md

## 要約
- 現状把握と原因仮説、改善フェーズ分割（短・中・長期）が明確で妥当。特に「本番では環境変数フォールバック無効」「SecureStorage を唯一の真実源にする」方針は一貫性と安全性の両立に有効。
- 最優先は「取得元の統一（アカウント名含む）」「実行前検証」「詳細ログ」で、これにより設定→実行の不整合を解消し、原因特定もしやすくなる。
- いくつかの補強点（ログの秘匿化、IPC/型の整合、移行対応、fallbackの暗号化姿勢など）を追加すると、計画の堅牢性が上がる。

## 良い点（計画の強み）
- 明確なステージング: Phase1/2/3 で即効性と持続的改善を両立。
- 単一の真実源: 本番での環境変数フォールバック無効化により、設定経路をSecureStorageに収束。
- 可観測性向上: determineProvider などに詳細ログを入れる提案でデバッグ容易化。
- 事前検証: 実行前のAPIキー確認でUXと失敗防止を両立。
- UIフィードバック: 設定画面から状態を見える化する方針が運用トラブルを減らす。

## リスク/ギャップ（補強提案）
- ログの取り扱い: キー先頭数文字のログ出力は本番では抑制（マスキング/レベル制御）。ログレベルとビルド時の切替（dev=詳細、本番=要約）を規定。
- IPC/型の整合性: `electronAPI.security.getApiConfigStatus` / `ai.getAvailableProviders` の型/戻り値スキーマを `shared/types` に定義し、main/preload/rendererで共通化。戻り値に boolean だけでなく `source`（secure/fallback）も含めると診断が容易。
- 移行互換性: 既存バージョンで保存済みの `account` 名/`service` 名が不一致の場合のマイグレーション（旧キーの読込→新命名へ保存→旧削除）を追加。
- 初期化順序の競合: `ensureSecureStorageReady` の完了前に `determineProvider` が呼ばれる競合を回避。サービス初期化バリア（ready Promise）で順序保証。
- Fallbackの実効安全性: Base64は暗号ではない。可能ならアプリ内KDF＋OS固有情報で簡易暗号化（最低限、平文は保持しない）し、ドキュメントに安全上の注意点を明記。
- 二重の情報源: SettingsModal の一時保存（localStorage等）と SecureStorage の二重管理を避ける。UI は常に SecureStorage の現在値を単方向取得し表示更新。
- 複数キー同時存在時の選択: Gemini/OpenAI両方ある場合の優先規則とUIの選択手段（既にモデル選択があるなら、provider選択も同一所作で一貫）を明文化。
- エラーメッセージ管理: ユーザー向け文言は i18n 対応/一元管理し、内部例外詳細はログ側へ。トリアージ容易なエラーコードも付与。
- テスト観点の拡充: Integration に加えて、SecureStorage（keytarモック）とprovider決定のユニットテスト、IPC のコントラクトテストを追加。

## 優先度付きアクション（改修順）
1) 即時（Phase 1 内で強化）
- 取得経路の統一: `getCredential/setCredential` の `id/service/account` 命名の標準化＋`getApiKey(provider)` 追加。
- 実行前検証: renderer 側で `getApiConfigStatus` → provider可用性チェック→ガイド表示。
- ログ整備: devのみ詳細、本番は要約。キー値は完全非表示（有無/長さのみ）。

2) 短期（Phase 2）
- 初期化順序保証: `ensureSecureStorageReady` を app起動時にawait。`AIProcessingService` 公開APIは `ready` 待ちを内包。
- 設定画面の状態反映: SecureStorageを単一ソースにし、ポーリング/イベントで反映。
- エラーUX: 典型失敗（未設定/クォータ/ネットワーク）を分岐し、行動可能な対処法を提示。

3) 中期〜（Phase 3）
- コントラクトテスト: preload経由のIPC APIの型/戻り値を固定化し回帰を防止。
- マイグレーション: 旧命名／旧保存場所からの自動移行と監査ログを実装。

## 受け入れ基準（Acceptance Criteria）
- 本番ビルドで環境変数フォールバック無しでも、設定画面→テスト→実行が成功（Gemini/OpenAIいずれか）。
- APIキー未設定時、実行ボタンは明確なエラーと導線（設定へ）を提示し、処理は安全に中断する。
- SecureStorage 初期化前に provider 判定/実行が行われない（ready待ちが保証）。
- ログに秘匿情報（キー値）が出力されない（自動テストで検査可）。
- IPC の `getApiConfigStatus` と `getAvailableProviders` が型定義通りに動作し、renderer での分岐に十分な情報を返す。
- 旧バージョンからの移行時、既存キーが無操作で利用可能（監査ログに移行記録）。

## 変更影響範囲と最小差分方針
- `app/src/main/services/SecureStorageService.ts`: `getApiKey(provider)` 追加、命名標準化、health/initializeの順序保証、移行ロジック（旧キー検出→新保存）。
- `app/src/main/services/AIProcessingService.ts`: `determineProvider` のログ強化＋`secureStorage.ready` 待ち。エラー文言は内部→ログ、ユーザーは要約。
- `app/src/renderer/components/AIExecutionSection.tsx`: 実行前検証＋トースト/ガイド。
- `app/src/renderer/components/SettingsModal.tsx`: 状態表示は SecureStorage の値を単方向反映。localStorageの冗長な保持は撤廃/縮小。
- `app/src/shared/types/api.ts`: IPC返却型（status, providers, source 等）を確立し共通利用。
- 既存構造/命名を極力踏襲し、差分を局所化（関数追加/置換中心）。

## 実装チェックリスト（抜粋）
- [ ] `getApiKey(provider)` 実装とユニットテスト（keytarモック）。
- [ ] `determineProvider()` が `ready` 待ちを内包／devとprodの挙動がテストで担保。
- [ ] IPC: `getApiConfigStatus`/`getAvailableProviders` を型定義・実装・テストで固定。
- [ ] ログレベル切替（DEV: debug/trace, PROD: info/warn）。キー値は出力禁止。
- [ ] 設定画面：API状態の周期更新 or イベント反映、UIの単一ソース化。
- [ ] 移行: 旧`account`/`service`名の検出・移行・監査ログ記録。

## 次アクション（具体）
- Phase1の差分を最小実装としてPR化（3ファイル中心: SecureStorageService / AIProcessingService / AIExecutionSection）。
- 並行で `shared/types` を先行確定し、IPCコントラクトを固定。
- PR後に本番パッケージで回帰確認（ポータブル版）とログの安全性チェック。

---
本レビューは既存計画の方向性を支持しつつ、運用安全性（秘匿/移行/初期化順序）と契約の強度（型/IPC）を補強する提案です。まずは Phase1 を最小差分で入れ、実機で観測可能性を高めた上でPhase2/3に進めることを推奨します。
