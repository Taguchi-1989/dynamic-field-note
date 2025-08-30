/**
 * PDF生成の直接テスト（IPC経由ではなく）
 */

const { PdfGenerationService } = require('./dist-electron/main.cjs');

async function testPdfGeneration() {
    console.log('🧪 PDF生成直接テスト開始...\n');

    try {
        const pdfService = new (eval('PdfGenerationService'))();
        await pdfService.initialize();

        const testInput = {
            mdContent: `# 議事録テスト

## 会議情報
- 日時: 2025年8月30日
- 参加者: テストユーザー

## 議事内容

### 重要事項
1. PDF生成機能のテスト
2. マークダウンの正常表示確認

### 検討事項
- **重要**: PDFが正常に生成されること
- *参考*: フォーマットが正しいこと

| 項目 | 状態 |
|------|------|
| PDF生成 | テスト中 |
| 表示確認 | 実行中 |

これは統合テストです。`,
            fileName: 'test-pdf-output',
            outputPath: './pdf-test-output.pdf'
        };

        console.log('📄 PDF生成を実行中...');
        const result = await pdfService.generatePdfFromMarkdown(testInput);
        
        console.log('✅ PDF生成成功:', result);
        console.log('📁 出力ファイル:', result.filePath);
        console.log('📏 ファイルサイズ:', result.fileSize, 'bytes');

    } catch (error) {
        console.error('❌ PDF生成エラー:', error.message);
        console.error('詳細:', error);
    }
}

testPdfGeneration();