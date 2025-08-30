import API_ENDPOINTS from '../config/api';

export interface PdfGenerationOptions {
  title?: string;
  format?: 'A4' | 'Letter' | 'A3';
  content_type?: 'text' | 'markdown';
  
  // Advanced service only (simplified)
  
  // Advanced features options
  enable_mermaid?: boolean;
  enable_latex?: boolean;
  enable_images?: boolean;
  custom_css?: string;
  
  // Layout options
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

// HTML to PDF conversion using browser's print functionality
const _htmlToPdf = (htmlContent: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a hidden iframe for PDF generation
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('iframeDoc not available');
      }

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Wait for content to load, then trigger print
      iframe.onload = () => {
        setTimeout(() => {
          // For now, we'll create a simple text-based fallback
          // In a real implementation, you'd use a library like jsPDF or html2canvas
          const textContent = iframeDoc.body?.textContent || '';
          const blob = new Blob([textContent], { type: 'text/plain' });
          document.body.removeChild(iframe);
          resolve(blob);
        }, 100);
      };
    } catch (error) {
      reject(error);
    }
  });
};

export const generatePDF = async (
  content: string, 
  options: PdfGenerationOptions = {}
): Promise<Blob> => {
  const requestData = {
    content,
    title: options.title || '議事録',
    format: options.format || 'A4',
    content_type: options.content_type || 'markdown',
    
    // Advanced service only (simplified)
    
    // Advanced features enabled by default
    enable_mermaid: options.enable_mermaid !== false,
    enable_latex: options.enable_latex !== false,
    enable_images: options.enable_images !== false,
    custom_css: options.custom_css,
    
    // Layout options
    margin: options.margin || {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  };

  try {
    console.log('Generating PDF via Electron IPC...');
    console.log('Window object:', typeof window);
    console.log('ElectronAPI available:', typeof (window as any)?.electronAPI);
    
    // Check if running in Electron environment
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      console.log('Using Electron IPC for PDF generation');
      const electronAPI = (window as any).electronAPI;
      
      // Use Electron's markdown compilation service for PDF generation
      const result = await electronAPI.markdown.compileToPdf({
        mdContent: requestData.content,
        options: {
          title: requestData.title,
          toc: true,
          theme: 'default'
        },
        pdfOptions: {
          pageSize: requestData.format === 'A4' ? 'A4' : 'Letter',
          marginMm: 20,
          landscape: false,
          printBackground: true
        }
      });
      
      if (!result.success) {
        throw new Error(`PDF generation failed: ${result.error}`);
      }
      
      // Result contains the file path, read the file and convert to Blob
      if (!result.data || !result.data.pdfPath) {
        throw new Error('PDF file path not returned');
      }
      
      // Use file API to read the generated PDF
      const pdfBuffer = await electronAPI.file.readFile(result.data.pdfPath, { encoding: null });
      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
      
      if (pdfBlob.size === 0) {
        throw new Error('Empty PDF generated');
      }
      
      return pdfBlob;
    } else {
      // Fallback for web environment - use API endpoint
      console.log('ElectronAPI not available, falling back to web API');
      console.log('Calling PDF API:', API_ENDPOINTS.generatePdf);
      const response = await fetch(API_ENDPOINTS.generatePdf, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`PDF generation failed: ${response.status} ${response.statusText}`);
      }

      // バックエンドは直接PDFバイナリを返す
      const pdfBlob = await response.blob();
      
      if (pdfBlob.size === 0) {
        throw new Error('Empty PDF received from server');
      }
      
      return pdfBlob;
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

export const downloadPDF = (pdfBlob: Blob, filename: string = '議事録.pdf') => {
  // Blobからダウンロード用URLを作成
  const url = window.URL.createObjectURL(pdfBlob);
  
  // ダウンロード用のaタグを作成
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  
  // ダウンロードを実行
  document.body.appendChild(link);
  link.click();
  
  // クリーンアップ
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const previewPDF = async (
  content: string, 
  options: PdfGenerationOptions = {}
) => {
  try {
    console.log('Generating PDF preview via Electron IPC...');
    
    // Check if running in Electron environment
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      const electronAPI = (window as any).electronAPI;
      
      // Use Electron's markdown test PDF generation for preview
      const result = await electronAPI.markdown.testPdf();
      
      if (!result.success) {
        throw new Error(`PDF preview failed: ${result.error || result.message}`);
      }
      
      return {
        success: true,
        message: 'PDF preview generated successfully',
        data: result
      };
    } else {
      // Fallback for web environment
      const requestData = {
        content,
        title: options.title || '議事録',
        format: options.format || 'A4',
        content_type: options.content_type || 'markdown',
        
        // Advanced features enabled by default
        enable_mermaid: options.enable_mermaid !== false,
        enable_latex: options.enable_latex !== false,
        enable_images: options.enable_images !== false,
        custom_css: options.custom_css,
        
        // Layout options
        margin: options.margin || {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      };

      const response = await fetch(API_ENDPOINTS.generatePdfPreview, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`PDF preview failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('PDF preview error:', error);
    throw error;
  }
};