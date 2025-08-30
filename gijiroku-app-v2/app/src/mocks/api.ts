/**
 * API Mock Service
 * 開発・デモ用のモックAPIレスポンス
 */

export interface MockHealthResponse {
  status: 'healthy' | 'unhealthy';
  message: string;
  timestamp: string;
  version: string;
  uptime: number;
}

export interface MockPromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// モックデータ - 実際のテンプレートを基にした高品質なプロンプト
export const mockPromptTemplates: MockPromptTemplate[] = [
  {
    id: 'general_meeting',
    name: '一般会議用（Q&A重視）',
    description: '質疑応答を重視した一般会議の議事録作成',
    prompt: 'あなたはプロの議事録編集者です。以下のテキストは会議の音声認識結果です。\n以下のルールに従って、**実務で使える一般的な議事録**に修正し、Markdown形式で出力してください。\n\n# ルール\n- 誤字脱字を修正してください\n- 文脈に合わない単語を修正してください\n- 「えーと」「あのー」など話し言葉は削除してください\n- **出席者情報は、VTTに記載されている名前やチーム名をそのまま使用してください（役職表記は不要）**\n- 「誰が発言したか」を会議内容に反映してください\n- **質疑応答は「Q:」「A:」形式で明確に記載してください**\n- **重要な決定事項は太字で強調してください**\n- **アクションアイテムは表形式（誰が／何を／いつまでに）で記載してください**\n- 出力はMarkdown形式のみとし、余計な説明は不要です\n\n# 出力フォーマット\n# 会議情報\n- **会議名**: [会議タイトル]\n- **開催日時**: [YYYY年MM月DD日 HH:MM-HH:MM]\n- **出席者**: [VTTに記載された名前／チーム名を全員列挙]\n- **欠席者**: [該当する場合]\n\n# 会議内容\n## 議題1: [議題タイトル]\n### 概要\n- [発言者名]: [発言の要点]\n- [発言者名]: [意見や提案内容]\n- [発言者名]: **[決定事項の場合は強調]**\n\n### 質疑応答\n**Q:** [質問者名]「質問内容」\n**A:** [回答者名]「回答内容」\n\n# アクションアイテム（TODO）\n| No | 担当者 | 内容（何を） | 期限（いつまでに） | 備考 |\n|---|---|---|---|---|\n| 1 | [氏名／チーム] | [具体的なタスク内容] | [YYYY/MM/DD or ASAP] | [補足があれば記載] |\n| 2 | [氏名／チーム] | [対応内容] | [期限] | [補足] |\n\n# 決定事項\n1. **[決定事項1]**\n2. **[決定事項2]**\n3. **[決定事項3]**\n\n{text}',
    category: 'general',
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'technical_meeting',
    name: '技術会議用（Q&A形式）',
    description: '技術的な内容の会議の議事録をQ&A形式で作成',
    prompt: 'あなたはIT分野に精通した議事録編集者です。技術的な内容を正確に保ちながら、質疑応答を重視した読みやすい議事録を作成してください。\n\n# ルール\n- 技術用語は正確に保持してください（API、フレームワーク名、プログラミング言語名等）\n- コード片やコマンドは `code` 形式で記載してください\n- **技術的な質疑応答を詳細に記録**してください\n- 設計決定や技術的決定事項は明確に記載してください\n- アクションアイテムは責任者と期限を明記してください\n- バージョン情報、URL、設定値は正確に記載してください\n\n# 技術文書の書式\n- APIエンドポイント、関数名、クラス名は正確に記載\n- エラーメッセージやログは `code` 形式で囲む\n- 技術的な課題と解決策を構造化して記載\n- パフォーマンス指標や数値データは正確に保持\n- 質疑応答はQ&A形式で詳細に記録\n\n# 出力例\n## 技術検討事項\n### 議題1: API設計について\n#### 概要説明\n- 山田エンジニア: `GET /api/users/{id}` エンドポイントのレスポンス形式を検討\n- 鈴木リーダー: **JSON Schema v4 形式で統一する**ことを提案\n\n#### 技術的質疑応答\n**Q:** 佐藤様より「レート制限はどのように実装しますか？」\n**A:** 山田エンジニアより「`Redis`を使用して、`sliding window`方式で実装予定です。1分間に100リクエストを上限とします」\n\n### TODO表（技術タスク）\n| No | 担当者 | タスク内容 | 期限 | 技術要件 |\n| -- | ------ | ---------- | ---- | -------- |\n| 1 | 山田エンジニア | API仕様書作成 | 来週金曜 | OpenAPI 3.0形式、Swagger UI含む |\n\n### 技術的決定事項\n1. **フレームワーク選定**: Next.js 14.0.0 を使用\n2. **データベース**: PostgreSQL 15.2 + Prisma ORM\n3. **認証方式**: JWT トークン認証（RS256）\n\n{text}',
    category: 'technical',
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'formal_minutes',
    name: '正式議事録（Q&A形式）',
    description: '質疑応答中心の正式な議事録形式で作成',
    prompt: '📑 議事録作成プロンプト（質疑応答中心・TODO表付き）\n\n以下のテキストは会議逐語録（VTTファイルから変換された発言記録）です。これを基に、**正式な議事録**を作成してください。\nフォーマットに沿って整理し、冗長な発言は削除し、要点・決定事項・TODOを明確にまとめてください。\n特に **質疑応答（Q&A形式）を重視**し、誰が何を聞き、誰がどう回答したのかを明示してください。\nビジネス文書として適切な敬語表現を使用してください。\n\n---\n\n## 出力フォーマット\n\n### 1. 会議情報\n\n* **会議名**: [会議タイトル]\n* **開催日時**: [YYYY年MM月DD日 HH:MM-HH:MM]\n* **開催場所**: [会議室名／オンライン等]\n* **出席者**: [役職・氏名を正式に記載]\n* **欠席者**: [該当する場合]\n* **議事録作成者**: [作成者名]\n\n---\n\n### 2. 会議概要\n\n* 会議の目的: [簡潔に記載]\n* 議題の全体概要: [各議題の要点を短く列挙]\n\n---\n\n### 3. 決定事項\n\n1. [重要な決定事項1]\n2. [重要な決定事項2]\n3. [重要な決定事項3]\n\n---\n\n### 4. TODO（宿題事項／アクションアイテム）\n\n| No | 担当者（誰が） | 内容（何を） | 期限（いつまでに） | 備考 |\n| -- | -------------- | ------------ | ------------------ | ---- |\n| 1  | [氏名／役職]   | [具体的な対応内容] | [YYYY/MM/DD or ASAP] | [補足あれば記載] |\n| 2  | [氏名／役職]   | [対応内容]   | [期限]             | [補足] |\n\n---\n\n### 5. 会議詳細（議題ごとに整理・Q&A形式中心）\n\n#### 議題1: [タイトル]\n\n##### 討議概要\n\n* [概要を簡潔に記載]\n\n##### 質疑応答（Q&A）\n\n* **質問**: [役職・氏名]より、「〜についてご質問がありました」\n  * **回答**: [役職・氏名]より、「〜についてご説明いたしました」\n\n##### 決定事項\n\n* [正式に決定された内容を記載]\n\n##### TODO（当該議題関連）\n\n* [担当者／期限／内容を要約 → 上記TODO表にも反映]\n\n---\n\n### 6. 次回会議予定\n\n* **日時**: [予定日時]\n* **場所**: [予定場所]\n* **主な議題**: [予定議題]\n\n---\n\n**以上**\n\n議事録作成日: [作成日]\n作成者: [作成者名]\n承認者: [承認者名]\n\n{text}',
    category: 'formal',
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'project_meeting',
    name: 'プロジェクト会議用',
    description: 'プロジェクトの進捗管理とタスク管理に特化した議事録',
    prompt: 'あなたはプロジェクトマネージャーの経験豊富な議事録編集者です。以下の会議録を、**プロジェクト管理に特化した議事録**として整理してください。\n\n# ルール\n- プロジェクトの進捗状況を明確に記載\n- マイルストーンやデッドラインに関する言及を強調\n- リスクや課題は必ず別セクションで記載\n- アクションアイテムは優先度付きで整理\n- ステークホルダーとの合意事項を明示\n\n# 出力フォーマット\n# プロジェクト会議情報\n- **プロジェクト名**: [プロジェクト名]\n- **会議日時**: [YYYY年MM月DD日 HH:MM-HH:MM]\n- **出席者**: [ロール・氏名]\n- **議事録作成者**: [氏名]\n\n# プロジェクト概要\n- **現在のフェーズ**: [フェーズ名]\n- **全体進捗**: [XX%完了]\n- **次のマイルストーン**: [日付・内容]\n\n# 進捗報告\n## 完了タスク\n- [担当者]: [完了したタスク] - [完了日]\n\n## 進行中タスク\n- [担当者]: [タスク名] - 進捗[XX%] - 予定完了[日付]\n\n## 課題・リスク\n| 分類 | 内容 | 影響度 | 対応策 | 担当者 | 期限 |\n|-----|-----|-------|--------|--------|------|\n| 課題 | [具体的な課題] | 高/中/低 | [対応策] | [担当者] | [期限] |\n\n# アクションアイテム（優先度付き）\n## 🔴 高優先度（緊急）\n| 担当者 | 内容 | 期限 | 備考 |\n|--------|------|------|------|\n| [氏名] | [タスク] | [日付] | [詳細] |\n\n## 🟡 中優先度\n| 担当者 | 内容 | 期限 | 備考 |\n|--------|------|------|------|\n| [氏名] | [タスク] | [日付] | [詳細] |\n\n# 決定事項・合意事項\n1. **[重要な決定事項]** - 合意者: [氏名一覧]\n2. **[承認事項]** - 承認者: [氏名]\n\n# 次回会議予定\n- **日時**: [予定]\n- **主な議題**: [内容]\n\n{text}',
    category: 'project',
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'weekly_standup',
    name: 'ウィークリーミーティング用',
    description: 'チーム定期ミーティングや進捗共有会議用のテンプレート',
    prompt: 'あなたはチームリーダー経験豊富な議事録編集者です。以下のウィークリーミーティングの内容を、**チーム運営に最適化された議事録**として整理してください。\n\n# ルール\n- 各メンバーの進捗を公平に記載\n- ブロッカーや支援要請を明確に識別\n- チーム全体の成果と課題をサマリー\n- 来週の重点項目を明示\n- ポジティブな成果は積極的に記載\n\n# 出力フォーマット\n# ウィークリーミーティング議事録\n- **日時**: [YYYY年MM月DD日 HH:MM-HH:MM]\n- **出席者**: [チームメンバー一覧]\n- **ファシリテーター**: [氏名]\n\n# 📈 今週のハイライト\n- **チーム成果**: [主要な成果・達成事項]\n- **個人MVP**: [今週特に貢献したメンバーと内容]\n- **完了マイルストーン**: [達成したマイルストーン]\n\n# 👥 メンバー進捗報告\n## [メンバー名1]\n- **今週の実績**: [完了したタスク]\n- **来週の予定**: [予定タスク]\n- **ブロッカー**: [課題や困りごと]\n- **支援要請**: [他メンバーへの依頼]\n\n## [メンバー名2]\n- **今週の実績**: [完了したタスク]\n- **来週の予定**: [予定タスク]\n- **ブロッカー**: [課題や困りごと]\n- **支援要請**: [他メンバーへの依頼]\n\n# 🚧 チーム課題・ブロッカー\n| 課題 | 影響するメンバー | 対応策 | 担当者 | 期限 |\n|------|------------------|--------|--------|----- -|\n| [具体的な課題] | [メンバー名] | [解決策] | [担当者] | [期限] |\n\n# ✅ アクションアイテム\n| 担当者 | 内容 | 期限 | 目的 |\n|--------|------|------|------|\n| [氏名] | [タスク内容] | [期限] | [なぜ必要か] |\n\n# 📅 来週の重点項目\n1. **[重点項目1]** - 担当: [氏名]\n2. **[重点項目2]** - 担当: [氏名]\n3. **[重点項目3]** - 担当: [氏名]\n\n# 📝 その他・情報共有\n- [その他の連絡事項やお知らせ]\n\n# 次回ミーティング\n- **日時**: [来週の予定]\n- **準備事項**: [各自の準備内容]\n\n{text}',
    category: 'weekly',
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'client_meeting',
    name: '顧客打ち合わせ用',
    description: '顧客や取引先との会議に特化した議事録テンプレート',
    prompt: 'あなたは顧客対応経験豊富な議事録編集者です。以下の顧客との打ち合わせ内容を、**顧客関係管理に最適化された議事録**として整理してください。\n\n# ルール\n- 顧客の要望・懸念事項を正確に記録\n- 提案内容と顧客の反応を明確に記載\n- 契約や費用に関する話は詳細に記録\n- 顧客からの質問と回答を漏れなく記載\n- 敬語を使用し、ビジネス文書として適切な表現を使用\n- フォローアップアクションを明確にする\n\n# 出力フォーマット\n# 顧客打ち合わせ議事録\n- **会議名**: [打ち合わせ件名]\n- **日時**: [YYYY年MM月DD日 HH:MM-HH:MM]\n- **場所**: [会議室・オンライン等]\n- **顧客情報**: [会社名・部署・役職・氏名]\n- **自社出席者**: [部署・役職・氏名]\n- **議事録作成者**: [氏名]\n\n# 🎯 打ち合わせ目的\n- **主目的**: [今回の打ち合わせの主な目的]\n- **背景**: [打ち合わせに至った経緯]\n\n# 💼 顧客要望・ニーズ\n## 明確化された要望\n1. **[要望1]**\n   - 詳細: [具体的な内容]\n   - 優先度: [高・中・低]\n   - 期限: [顧客希望時期]\n\n2. **[要望2]**\n   - 詳細: [具体的な内容]\n   - 優先度: [高・中・低]\n   - 期限: [顧客希望時期]\n\n## 課題・懸念事項\n- **顧客の懸念**: [顧客から提起された課題や不安要素]\n- **技術的制約**: [実現上の制約事項]\n- **予算制約**: [予算に関する制約]\n\n# 📋 提案内容と顧客反応\n## 自社提案事項\n### 提案1: [提案タイトル]\n- **提案内容**: [詳細な提案内容]\n- **顧客反応**: [ポジティブ・検討中・懸念あり]\n- **顧客コメント**: 「[顧客からの具体的な発言]」\n\n### 提案2: [提案タイトル]\n- **提案内容**: [詳細な提案内容]\n- **顧客反応**: [ポジティブ・検討中・懸念あり]\n- **顧客コメント**: 「[顧客からの具体的な発言]」\n\n# 💰 契約・費用関連\n- **見積もり範囲**: [提示した見積もりの内容]\n- **顧客予算感**: [顧客から聞いた予算情報]\n- **支払い条件**: [契約条件に関する討議内容]\n- **契約形態**: [提案した契約形態]\n\n# ❓ Q&Aセッション\n**Q:** [顧客質問] - [質問者名]様\n**A:** [自社回答] - [回答者名]\n\n**Q:** [顧客質問] - [質問者名]様\n**A:** [自社回答] - [回答者名]\n\n# ✅ 合意事項\n1. **[合意内容1]**\n2. **[合意内容2]**\n3. **[合意内容3]**\n\n# 📞 フォローアップアクション\n| 担当者 | アクション内容 | 期限 | 顧客への報告方法 |\n|--------|----------------|------|------------------|\n| [自社担当] | [具体的なアクション] | [YYYY/MM/DD] | [メール・電話・MTG] |\n| [顧客担当] | [顧客側のアクション] | [YYYY/MM/DD] | [確認方法] |\n\n# 📅 次回打ち合わせ\n- **予定日時**: [次回アポイント]\n- **主な議題**: [次回の討議内容]\n- **準備事項**: [各自の準備内容]\n\n# 📝 特記事項\n- [重要な補足事項やメモ]\n- [顧客の社内事情など参考情報]\n\n**以上**\n\n{text}',
    category: 'client',
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const mockApiResponses = {
  // Health Check
  health: (): MockHealthResponse => ({
    status: 'healthy',
    message: 'Mock API server is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0-mock',
    uptime: Math.floor(Math.random() * 86400) // ランダムなアップタイム
  }),

  // Version
  version: () => ({
    version: '2.0.0-mock',
    name: 'gijiroku-app-v2-mock',
    environment: 'development',
    build: `mock-${Date.now()}`
  }),

  // Prompts
  prompts: () => ({
    success: true,
    data: { prompts: mockPromptTemplates },
    count: mockPromptTemplates.length,
    message: 'Mock prompt templates retrieved successfully'
  }),

  // API Key Validation
  apiValidation: () => ({
    success: true,
    valid: true,
    provider: 'mock',
    message: 'Mock API key validation successful'
  }),

  // Models
  models: () => ({
    success: true,
    data: [
      { id: 'mock-gpt-5', name: 'Mock GPT-5', provider: 'openai' },
      { id: 'mock-gemini-2.5-pro', name: 'Mock Gemini 2.5 Pro', provider: 'google' },
      { id: 'mock-gemini-2.0-flash', name: 'Mock Gemini 2.0 Flash', provider: 'google' }
    ]
  })
};

/**
 * モックAPIサーバーの起動チェック
 */
export const isMockMode = (): boolean => {
  return (import.meta.env?.VITE_MOCK_MODE === 'true') || 
         (import.meta.env?.NODE_ENV === 'development') ||
         process.env.VITE_MOCK_MODE === 'true' ||
         process.env.NODE_ENV === 'development';
};

/**
 * API呼び出しのモック化
 */
export const createMockResponse = <T>(data: T, delay = 300): Promise<Response> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Response(JSON.stringify(data), {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
        },
      }));
    }, delay);
  });
};

/**
 * フェッチのインターセプト（モック用）
 */
export const mockFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  console.log('🎭 Mock API called:', url);

  // URLパターンマッチング
  if (url.includes('/health')) {
    return createMockResponse(mockApiResponses.health());
  }

  if (url.includes('/version')) {
    return createMockResponse(mockApiResponses.version());
  }

  if (url.includes('/api/prompts')) {
    return createMockResponse(mockApiResponses.prompts());
  }

  if (url.includes('/api-validation/test')) {
    return createMockResponse(mockApiResponses.apiValidation());
  }

  if (url.includes('/api-validation/models')) {
    return createMockResponse(mockApiResponses.models());
  }

  // 未定義のエンドポイントの場合
  return createMockResponse({
    success: false,
    message: 'Mock endpoint not implemented',
    url
  }, 100);
};