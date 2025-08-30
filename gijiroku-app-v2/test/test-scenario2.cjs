const { app, BrowserWindow } = require("electron");

// 設定調整ユーザーシナリオ: カスタム設定での高度なPDF
app.whenReady().then(async () => {
  console.log("⚙️ シナリオ2: 設定調整ユーザーテスト開始");
  
  const startTime = Date.now();
  const win = new BrowserWindow({ 
    show: false,
    width: 1200,  // より大きなウィンドウサイズ
    height: 1600
  });
  
  // パワーユーザーが作るより複雑な議事録内容
  const advancedContent = `
    <div style="font-family: \"Noto Sans JP\", sans-serif; padding: 30px; background: white;">
      <style>
        .highlight { background: linear-gradient(90deg, #ffeb3b, #ffc107); padding: 8px 12px; border-radius: 4px; font-weight: bold; }
        .note { border-left: 4px solid #2196f3; padding: 16px; background: linear-gradient(135deg, #e3f2fd, #bbdefb); margin: 12px 0; border-radius: 0 8px 8px 0; }
        .warning { border-left: 4px solid #f44336; padding: 16px; background: linear-gradient(135deg, #ffebee, #ffcdd2); margin: 12px 0; border-radius: 0 8px 8px 0; }
        .custom-table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        .custom-table th, .custom-table td { border: 2px solid #333; padding: 12px; text-align: left; }
        .custom-table th { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
        .two-column { display: flex; gap: 20px; margin: 20px 0; }
        .column { flex: 1; padding: 16px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; }
      </style>
      
      <h1 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">📊 戦略会議議事録</h1>
      
      <div class="two-column">
        <div class="column">
          <strong>📅 日時:</strong> 2024年8月30日 14:00-16:00<br>
          <strong>📍 場所:</strong> オンライン会議<br>
          <strong>🎯 議題:</strong> Q4戦略立案
        </div>
        <div class="column">
          <strong>👥 参加者:</strong><br>
          • 田中 (PM)<br>
          • 佐藤 (Tech Lead)<br>
          • 山田 (Designer)<br>
          • 鈴木 (Sales)
        </div>
      </div>
      
      <h2 style="color: #e74c3c;">🔥 重要事項</h2>
      
      <div class="highlight">🚨 緊急: 来週までにプロトタイプ完成必須</div>
      
      <div class="note">
        <strong>📝 メモ:</strong> パフォーマンス改善について議論。現在の処理時間355msは良好だが、さらなる最適化が必要。
      </div>
      
      <h2 style="color: #27ae60;">📈 進捗状況</h2>
      
      <table class="custom-table">
        <tr>
          <th>タスク</th>
          <th>担当者</th>
          <th>進捗</th>
          <th>期限</th>
          <th>ステータス</th>
        </tr>
        <tr>
          <td>PDF生成機能</td>
          <td>田中</td>
          <td>95%</td>
          <td>8/30</td>
          <td>✅ 完了</td>
        </tr>
        <tr>
          <td>UI改善</td>
          <td>山田</td>
          <td>70%</td>
          <td>9/5</td>
          <td>🔄 進行中</td>
        </tr>
        <tr>
          <td>テスト実装</td>
          <td>佐藤</td>
          <td>80%</td>
          <td>9/1</td>
          <td>🔄 進行中</td>
        </tr>
      </table>
      
      <div class="warning">
        <strong>⚠️ 注意:</strong> MermaidWorkerのタイムアウト問題は解決済み。今後は別の課題に集中。
      </div>
      
      <h2>🎯 アクションアイテム</h2>
      <ol style="line-height: 1.8;">
        <li><strong>田中:</strong> PDF生成機能の最終テスト完了 (期限: 今日中)</li>
        <li><strong>山田:</strong> UIプロトタイプの完成 (期限: 9/3)</li>
        <li><strong>佐藤:</strong> 統合テストの実装 (期限: 9/5)</li>
        <li><strong>鈴木:</strong> クライアント向けデモの準備 (期限: 9/10)</li>
      </ol>
      
      <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 8px; text-align: center;">
        <strong>次回会議: 9月6日(金) 14:00〜</strong><br>
        テーマ: 最終リリースに向けた準備
      </div>
    </div>
  `;
  
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(advancedContent)}`);
  
  // パワーユーザー向けカスタム設定
  const customPdfOptions = {
    format: "A4",           
    landscape: false,       
    printBackground: true,  // 重要: カスタムCSS背景を印刷
    scale: 0.8,            // 少し縮小して多くの内容を収める
    margins: {             // より狭いマージンで効率的に
      top: 0.3,
      bottom: 0.3,
      left: 0.3,
      right: 0.3
    },
    displayHeaderFooter: true,
    headerTemplate: "<div style=\"font-size: 10px; width: 100%; text-align: center; color: #666;\">戦略会議議事録 - 機密文書</div>",
    footerTemplate: "<div style=\"font-size: 10px; width: 100%; text-align: center; color: #666;\">ページ <span class=\"pageNumber\"></span> / <span class=\"totalPages\"></span></div>"
  };
  
  const pdfBuffer = await win.webContents.printToPDF(customPdfOptions);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // 結果出力
  console.log("✅ 高度PDF生成完了");
  console.log(`📄 PDFサイズ: ${pdfBuffer.length} bytes`);
  console.log(`⏱️ 生成時間: ${duration}ms`);
  
  // PDFファイル保存
  const fs = require("fs");
  fs.writeFileSync("test-power-user.pdf", pdfBuffer);
  console.log("💾 ファイル保存: test-power-user.pdf");
  
  // より厳しい評価基準（カスタム設定の分、処理時間は長めでもOK）
  if (pdfBuffer.length > 10000 && duration < 15000) {
    console.log("🎉 設定調整ユーザーシナリオ: SUCCESS");
    console.log(`📊 通常比較: ${(pdfBuffer.length/1024).toFixed(1)}KB vs 151KB`);
  } else {
    console.log("❌ 設定調整ユーザーシナリオ: FAILED");
  }
  
  win.destroy();
  app.quit();
});
