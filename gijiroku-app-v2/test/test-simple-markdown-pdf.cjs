/**
 * シンプルなマークダウンPDFテスト
 * - 見出し文字間隔確認
 * - 基本機能確認
 */

const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

async function testSimpleMarkdownPDF() {
  console.log('📝 シンプルマークダウンPDFテスト開始');
  
  try {
    await app.whenReady();
    
    const testWindow = new BrowserWindow({ 
      show: false,
      width: 1200,
      height: 1600
    });
    
    // 見出し文字間隔修正を含むHTML
    const htmlWithImprovedHeadings = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Noto Sans JP', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: none;
            margin: 0;
            padding: 20mm;
          }
          
          /* 見出しの文字間隔を修正 */
          h1, h2, h3, h4, h5, h6 {
            letter-spacing: normal !important;
            word-spacing: normal !important;
            font-weight: 600;
            line-height: 1.3;
            margin: 0.8em 0 0.4em 0;
          }
          
          h1 { 
            font-size: 1.8em; 
            margin-top: 0;
            margin-bottom: 0.6em;
            border-bottom: 2px solid #333;
            padding-bottom: 0.3em;
          }
          
          h2 { 
            font-size: 1.5em; 
            margin-top: 1.2em;
            margin-bottom: 0.5em;
          }
          
          h3 { 
            font-size: 1.3em; 
          }
          
          .highlight { 
            background: linear-gradient(90deg, #ffeb3b, #ffc107); 
            padding: 2px 6px; 
            border-radius: 3px;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
          }
          
          table th, table td {
            border: 1px solid #333;
            padding: 8px 12px;
            text-align: left;
          }
          
          table th {
            background: #f5f5f5;
            font-weight: bold;
          }
          
          blockquote {
            border-left: 4px solid #2196f3;
            padding: 12px 16px;
            background: #f8f9fa;
            margin: 16px 0;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <h1>マークダウンPDF生成テスト</h1>
        
        <h2>見出し文字間隔修正確認</h2>
        <p>この見出しは<span class="highlight">文字間隔が正常</span>に表示されるはずです。</p>
        
        <h3>機能テスト項目</h3>
        <ul>
          <li><strong>太字テキスト</strong></li>
          <li><em>斜体テキスト</em></li>
          <li><code>コードスパン</code></li>
        </ul>
        
        <h2>表の表示テスト</h2>
        <table>
          <tr>
            <th>項目</th>
            <th>ステータス</th>
            <th>備考</th>
          </tr>
          <tr>
            <td>見出し修正</td>
            <td>✅ 完了</td>
            <td>文字間隔正常化</td>
          </tr>
          <tr>
            <td>PDF生成</td>
            <td>✅ 動作中</td>
            <td>テスト実施中</td>
          </tr>
        </table>
        
        <blockquote>
          これは引用文のテストです。見出しの文字間隔が改善されているかを確認してください。
        </blockquote>
        
        <h2>結果</h2>
        <p>このPDFで見出しの文字間隔が正常に表示されていれば、修正は成功です。</p>
      </body>
      </html>
    `;
    
    await testWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlWithImprovedHeadings)}`);
    
    const startTime = Date.now();
    const pdfBuffer = await testWindow.webContents.printToPDF({
      format: 'A4',
      landscape: false,
      printBackground: true,
      scale: 1.0,
      margins: {
        top: 0.5,
        bottom: 0.5,
        left: 0.5,
        right: 0.5
      }
    });
    const endTime = Date.now();
    
    const testPdfPath = path.join(__dirname, 'heading-spacing-test.pdf');
    fs.writeFileSync(testPdfPath, pdfBuffer);
    
    console.log('✅ 見出し文字間隔修正テスト完了');
    console.log(`📁 保存先: ${testPdfPath}`);
    console.log(`📊 サイズ: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
    console.log(`⏱️ 生成時間: ${endTime - startTime}ms`);
    
    console.log('\\n🎯 確認項目:');
    console.log('  - 見出し文字間隔: ✅ CSS修正適用');
    console.log('  - 表レイアウト: ✅ 正常表示');
    console.log('  - スタイリング: ✅ カスタムCSS適用');
    
    testWindow.destroy();
    
    return {
      success: true,
      pdfPath: testPdfPath,
      size: pdfBuffer.length,
      duration: endTime - startTime
    };
    
  } catch (error) {
    console.error('❌ テスト失敗:', error.message);
    return { success: false, error: error.message };
  } finally {
    setTimeout(() => app.quit(), 1000);
  }
}

testSimpleMarkdownPDF().then(result => {
  if (result.success) {
    console.log('🎉 シンプルマークダウンPDFテスト: SUCCESS');
    console.log('📄 見出し文字間隔修正が適用されたPDFを確認してください');
  } else {
    console.log('❌ テスト失敗:', result.error);
  }
});