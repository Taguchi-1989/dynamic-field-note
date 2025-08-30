const fs = require('fs');
const path = require('path');

const pdfPath = 'C:\\Users\\tgch1\\AppData\\Roaming\\gijiroku-app-v2\\workspace\\exports\\20250830-2025-08-30_.pdf';

try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    console.log('📁 PDF File Check:');
    console.log(`📊 File size: ${pdfBuffer.length} bytes`);
    console.log(`🔍 Header (first 20 bytes): "${pdfBuffer.subarray(0, 20).toString('ascii')}"`);
    console.log(`🔍 Header (hex): ${pdfBuffer.subarray(0, 20).toString('hex')}`);
    
    // PDFヘッダーの検証
    const header = pdfBuffer.subarray(0, 5).toString('ascii');
    if (header.startsWith('%PDF-')) {
        console.log('✅ Valid PDF header detected');
    } else {
        console.log('❌ Invalid PDF header:', header);
    }
    
    // ファイル終端の確認
    const end = pdfBuffer.subarray(-10).toString('ascii');
    console.log(`🔚 File end (last 10 bytes): "${end}"`);
    
    if (end.includes('%%EOF')) {
        console.log('✅ Valid PDF file ending detected');
    } else {
        console.log('❌ Invalid PDF file ending');
    }
    
} catch (error) {
    console.error('❌ Error reading PDF file:', error.message);
}