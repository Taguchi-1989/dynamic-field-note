// Utility for dynamic CSS loading to reduce initial bundle size
const loadedCss = new Set<string>();

export const loadCSS = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (loadedCss.has(url)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    
    link.onload = () => {
      loadedCss.add(url);
      resolve();
    };
    
    link.onerror = () => {
      reject(new Error(`Failed to load CSS: ${url}`));
    };

    document.head.appendChild(link);
  });
};

// Preload critical CSS for modals
export const preloadModalCSS = () => {
  const modalStyles = [
    '/src/components/SettingsModal.css',
    '/src/components/AboutModal.css',
    '/src/components/DictionaryModal.css',
    '/src/components/ContactModal.css'
  ];

  modalStyles.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = url;
    document.head.appendChild(link);
  });
};