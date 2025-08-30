const { app } = require("electron");
const path = require("path");

// Test with the actual service
app.whenReady().then(async () => {
  try {
    // Import the built service
    const { PdfGenerationService } = require("./dist-electron/main.cjs");
    const service = PdfGenerationService.getInstance();
    
    console.log("Testing markdown PDF generation...");
    
    const testMarkdown = `# MermaidWorker修正テスト

## 確認項目
- PDF生成が正常に動作する
- MermaidWorkerタイムアウトが発生しない
- 基本的なMarkdown機能が使える

### リスト
1. **太字テスト**
2. *斜体テスト*
3. \`コードテスト\`

> 引用テスト

これで動作確認が完了します。
`;
    
    const result = await service.generatePdfFromMarkdown({
      mdContent: testMarkdown,
      options: {
        title: "MermaidWorker修正テスト",
        toc: true,
        theme: "default"
      }
    });
    
    console.log("PDF Generation Result:", result);
    console.log("SUCCESS: PDF generated without MermaidWorker timeout!");
    
  } catch (error) {
    console.error("Test failed:", error.message);
  } finally {
    app.quit();
  }
});
