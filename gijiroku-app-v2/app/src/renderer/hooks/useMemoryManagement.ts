import { useEffect, useCallback } from 'react';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface MemoryManagementOptions {
  threshold: number;
  interval: number;
  onMemoryWarning?: (memoryInfo: MemoryInfo) => void;
}

export const useMemoryManagement = (options: MemoryManagementOptions = {
  threshold: 0.8,
  interval: 30000
}) => {
  const { threshold, interval, onMemoryWarning } = options;

  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance && (performance as any).memory) {
      const memoryInfo = (performance as any).memory as MemoryInfo;
      const usageRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
      
      if (usageRatio > threshold) {
        onMemoryWarning?.(memoryInfo);
        // Force garbage collection if available
        if ('gc' in window && typeof (window as any).gc === 'function') {
          (window as any).gc();
        }
      }
      
      return memoryInfo;
    }
    return null;
  }, [threshold, onMemoryWarning]);

  const forceGarbageCollection = useCallback(() => {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(checkMemoryUsage, interval);
    return () => clearInterval(intervalId);
  }, [checkMemoryUsage, interval]);

  return {
    checkMemoryUsage,
    forceGarbageCollection
  };
};