import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

export const usePerformance = (componentName: string, enabled = import.meta.env.DEV) => {
  const renderStartTime = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  // レンダリング開始時刻を記録
  useEffect(() => {
    if (!enabled) return;
    renderStartTime.current = performance.now();
  });

  // レンダリング完了時にメトリクスを計算
  useEffect(() => {
    if (!enabled) return;
    
    const renderTime = performance.now() - renderStartTime.current;
    const metric: PerformanceMetrics = {
      renderTime,
      componentName,
      timestamp: Date.now()
    };
    
    metricsRef.current.push(metric);
    
    // 開発環境でのログ出力
    if (renderTime > 16) { // 16ms以上の場合は警告
      console.warn(`🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    } else {
      console.log(`⚡ ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    }
    
    // メトリクス履歴を最新50件に制限
    if (metricsRef.current.length > 50) {
      metricsRef.current = metricsRef.current.slice(-50);
    }
  });

  // パフォーマンス計測の開始
  const startMeasure = useCallback((label: string) => {
    if (!enabled) return () => {};
    
    const startTime = performance.now();
    performance.mark(`${componentName}-${label}-start`);
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      performance.mark(`${componentName}-${label}-end`);
      performance.measure(`${componentName}-${label}`, `${componentName}-${label}-start`, `${componentName}-${label}-end`);
      
      console.log(`⏱️  ${componentName}.${label}: ${duration.toFixed(2)}ms`);
      return duration;
    };
  }, [componentName, enabled]);

  // メトリクス統計情報を取得
  const getMetrics = useCallback(() => {
    if (!enabled) return null;
    
    const metrics = metricsRef.current;
    if (metrics.length === 0) return null;

    const renderTimes = metrics.map(m => m.renderTime);
    const avgRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);
    const minRenderTime = Math.min(...renderTimes);

    return {
      componentName,
      totalRenders: metrics.length,
      avgRenderTime: Number(avgRenderTime.toFixed(2)),
      maxRenderTime: Number(maxRenderTime.toFixed(2)),
      minRenderTime: Number(minRenderTime.toFixed(2)),
      lastRenderTime: Number(metrics[metrics.length - 1]?.renderTime.toFixed(2) || 0)
    };
  }, [componentName, enabled]);

  // パフォーマンス統計をコンソールに出力
  const logMetrics = useCallback(() => {
    const metrics = getMetrics();
    if (!metrics) return;
    
    console.group(`📊 Performance Metrics: ${metrics.componentName}`);
    console.log(`Total Renders: ${metrics.totalRenders}`);
    console.log(`Average: ${metrics.avgRenderTime}ms`);
    console.log(`Min: ${metrics.minRenderTime}ms`);
    console.log(`Max: ${metrics.maxRenderTime}ms`);
    console.log(`Last: ${metrics.lastRenderTime}ms`);
    console.groupEnd();
  }, [getMetrics]);

  // メトリクスをクリア
  const clearMetrics = useCallback(() => {
    metricsRef.current = [];
  }, []);

  return {
    startMeasure,
    getMetrics,
    logMetrics,
    clearMetrics,
    enabled
  };
};

// Web Vitals監視フック
export const useWebVitals = (enabled = import.meta.env.DEV) => {
  useEffect(() => {
    if (!enabled) return;

    // Core Web Vitals の監視
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          console.log(`📏 ${entry.name}: ${entry.duration.toFixed(2)}ms`);
        } else if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          console.group('🚀 Navigation Timing');
          console.log(`DNS: ${(navEntry.domainLookupEnd - navEntry.domainLookupStart).toFixed(2)}ms`);
          console.log(`TCP: ${(navEntry.connectEnd - navEntry.connectStart).toFixed(2)}ms`);
          console.log(`Request: ${(navEntry.responseStart - navEntry.requestStart).toFixed(2)}ms`);
          console.log(`Response: ${(navEntry.responseEnd - navEntry.responseStart).toFixed(2)}ms`);
          console.log(`DOM Processing: ${(navEntry.domComplete - navEntry.responseEnd).toFixed(2)}ms`);
          console.log(`Load Complete: ${(navEntry.loadEventEnd - navEntry.fetchStart).toFixed(2)}ms`);
          console.groupEnd();
        }
      });
    });

    // 監視対象のエントリタイプを設定
    try {
      observer.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }

    return () => {
      observer.disconnect();
    };
  }, [enabled]);
};