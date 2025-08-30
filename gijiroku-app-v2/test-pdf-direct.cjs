/**
 * PDF生成の直接テスト（IPC経由ではなく）
 */

const fs = require('fs');
const path = require('path');

async function testPdfGeneration() {
    console.log('🧪 PDF生成統合テスト開始...\n');

    // テスト用のMarkdownコンテンツ
    const testMarkdown = `# 議事録生成テスト

## 会議情報
- **日時**: 2025年8月30日 16:05
- **参加者**: テストユーザー
- **場所**: 第一会議室

## 議事内容

### 重要事項
1. ✅ PDF生成機能のテスト実行
2. ✅ Markdownの正常表示確認
3. ✅ 日本語フォント対応確認

### 検討事項
- **重要**: PDFが正常に生成されること
- *参考*: フォーマットが正しいこと
- \`code\` スタイルの確認

### テスト結果

| 項目 | 状態 | 備考 |
|------|------|------|
| PDF生成 | ✅ テスト中 | 統合テスト実行中 |
| 表示確認 | ✅ 実行中 | 日本語・マークダウン対応 |
| ファイル出力 | ⏳ 確認中 | 出力先: ./pdf-test-output.pdf |

### コード例
\`\`\`javascript
console.log('PDF生成テスト実行中...');
const result = await generatePdf(testInput);
\`\`\`

これは統合テスト用のサンプル議事録です。
PDF生成が成功すれば、この内容が正しくフォーマットされて出力されます。
`;

    try {
        console.log('📄 テスト用Markdownファイルを作成...');
        const testFile = path.join(__dirname, 'test-markdown-sample.md');
        fs.writeFileSync(testFile, testMarkdown, 'utf8');
        
        console.log('✅ テストファイル作成成功:', testFile);
        console.log('📏 コンテンツ長:', testMarkdown.length, '文字');
        
        // ファイル存在確認
        if (fs.existsSync(testFile)) {
            console.log('✅ テストファイルが存在することを確認');
            
            // ファイル内容のプレビュー
            const preview = testMarkdown.substring(0, 200) + '...';
            console.log('📋 コンテンツプレビュー:');
            console.log(preview);
            
            // 実際のPDF生成はElectron環境が必要
            console.log('\n🔧 実際のPDF生成にはElectron環境でのIPC通信が必要です');
            console.log('✅ テスト用Markdownファイルの準備は完了しました');
            
        } else {
            console.log('❌ テストファイルの作成に失敗');
        }

    } catch (error) {
        console.error('❌ テストエラー:', error.message);
    }
}

testPdfGeneration();