import { useState, useEffect } from 'react';
// Replaced axios with native fetch for smaller bundle size
import API_ENDPOINTS from '../config/api';

// Simple cache for health check to avoid rapid requests
let healthCache: { status: ServerStatus; timestamp: number } | null = null;
const HEALTH_CACHE_DURATION = 5000; // 5 seconds

interface ServerStatus {
  isHealthy: boolean;
  version?: string;
  timestamp?: string;
  responseTime?: number;
  error?: string;
}

export const useServerHealth = () => {
  const [nodeApiStatus, setNodeApiStatus] = useState<ServerStatus>({ isHealthy: false });
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkServerHealth = async () => {
    // Check cache first
    if (healthCache && Date.now() - healthCache.timestamp < HEALTH_CACHE_DURATION) {
      setNodeApiStatus(healthCache.status);
      return;
    }
    
    setIsChecking(true);
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(API_ENDPOINTS.health, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      const responseTime = Date.now() - startTime;
      
      const status = {
        isHealthy: response.status === 200,
        version: data.version,
        timestamp: data.timestamp,
        responseTime,
        error: undefined
      };
      
      // Cache the result
      healthCache = {
        status,
        timestamp: Date.now()
      };
      
      setNodeApiStatus(status);
      setLastCheck(new Date());
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      setNodeApiStatus({
        isHealthy: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      setLastCheck(new Date());
    } finally {
      setIsChecking(false);
    }
  };

  // 自動ヘルスチェック（10秒間隔）
  useEffect(() => {
    checkServerHealth(); // 初回実行

    const interval = setInterval(checkServerHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return {
    nodeApiStatus,
    isChecking,
    lastCheck,
    checkServerHealth
  };
};