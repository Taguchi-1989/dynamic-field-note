const { app, BrowserWindow } = require("electron");

// 通常ユーザーシナリオ: 基本的な議事録をPDFに
app.whenReady().then(async () => {
  console.log("📝 シナリオ1: 通常ユーザーテスト開始");
  
  const startTime = Date.now();
  const win = new BrowserWindow({ show: false });
  
  // 通常ユーザーが作る一般的な議事録内容
  const basicContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h1>会議議事録</h1>
      <p><strong>日時:</strong> 2024年8月30日</p>
      <p><strong>参加者:</strong> 田中、佐藤、山田</p>
      
      <h2>議題</h2>
      <ul>
        <li>プロジェクトの進捗確認</li>
        <li>次週の予定</li>
        <li>課題の共有</li>
      </ul>
      
      <h2>決定事項</h2>
      <ol>
        <li>来週までにドラフトを完成させる</li>
        <li>次回会議は来週金曜日</li>
        <li>各自タスクを整理する</li>
      </ol>
      
      <p>以上で会議を終了します。</p>
    </div>
  `;
  
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(basicContent)}`);
  
  // デフォルト設定でPDF生成（通常ユーザーはこの設定を使う）
  const pdfBuffer = await win.webContents.printToPDF({
    format: "A4",           // デフォルトサイズ
    landscape: false,       // 縦向き
    printBackground: true,  // 背景も印刷
    margins: {             // 標準マージン
      top: 0.5,
      bottom: 0.5,
      left: 0.5,
      right: 0.5
    }
  });
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // 結果出力
  console.log("✅ PDF生成完了");
  console.log(`📄 PDFサイズ: ${pdfBuffer.length} bytes`);
  console.log(`⏱️ 生成時間: ${duration}ms`);
  
  // PDFファイル保存
  const fs = require("fs");
  fs.writeFileSync("test-normal-user.pdf", pdfBuffer);
  console.log("💾 ファイル保存: test-normal-user.pdf");
  
  // 成功評価
  if (pdfBuffer.length > 1000 && duration < 10000) {
    console.log("🎉 通常ユーザーシナリオ: SUCCESS");
  } else {
    console.log("❌ 通常ユーザーシナリオ: FAILED");
  }
  
  win.destroy();
  app.quit();
});
