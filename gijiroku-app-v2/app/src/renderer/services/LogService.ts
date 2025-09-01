export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: string;
}

class LogServiceClass {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private sessionId = Date.now().toString();

  private createLogEntry(level: LogEntry['level'], message: string, context?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  info(message: string, context?: string) {
    const entry = this.createLogEntry('info', message, context);
    this.addLog(entry);
    console.log(`[${entry.timestamp}] INFO: ${message}`, context || '');
  }

  warn(message: string, context?: string) {
    const entry = this.createLogEntry('warn', message, context);
    this.addLog(entry);
    console.warn(`[${entry.timestamp}] WARN: ${message}`, context || '');
  }

  error(message: string, context?: string) {
    const entry = this.createLogEntry('error', message, context);
    this.addLog(entry);
    console.error(`[${entry.timestamp}] ERROR: ${message}`, context || '');
  }

  debug(message: string, context?: string) {
    const entry = this.createLogEntry('debug', message, context);
    this.addLog(entry);
    console.log(`[${entry.timestamp}] DEBUG: ${message}`, context || '');
  }

  getLogs(level?: LogEntry['level']): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  getSessionLogs(): LogEntry[] {
    return this.getLogs();
  }

  getCurrentSessionId(): string {
    return this.sessionId;
  }

  // レガシーメソッド - 互換性のため
  logFileInput(filename: string, fileSize: number, fileType: string, characters: number) {
    this.info(`File input: ${filename} (${fileType}, ${fileSize} bytes, ${characters} characters)`);
  }

  logVttProcessing(originalChars: number, processedChars: number, removedChars: number) {
    this.info(`VTT processing: ${originalChars} → ${processedChars} chars (removed: ${removedChars})`);
  }

  logPromptSelection(template: string, customUsed: boolean) {
    this.info(`Prompt selected: ${template}${customUsed ? ' (custom)' : ''}`);
  }

  logChunking(totalChars: number, chunks: number, avgChunkSize: number, overhead: number) {
    this.info(`Chunking: ${totalChars} chars → ${chunks} chunks (avg: ${avgChunkSize}, overhead: ${overhead})`);
  }

  logApiCall(provider: string, model: string, inputChars: number, chunkNum: number, totalChunks: number) {
    this.info(`API call: ${provider}/${model} (chunk ${chunkNum}/${totalChunks}, ${inputChars} chars)`);
  }

  logApiResponse(success: boolean, outputChars: number, duration: number, provider: string, retries: number, chunkNum: number) {
    const status = success ? 'success' : 'failed';
    this.info(`API response: ${status} (chunk ${chunkNum}, ${outputChars} chars, ${duration}s, retries: ${retries})`);
  }

  logResultMerge(totalChars: number, duration: number) {
    this.info(`Result merge: ${totalChars} chars in ${duration}s`);
  }

  logUserAction(action: string, target: string) {
    this.info(`User action: ${action} (${target})`);
  }

  logPdfGeneration(title: string, fileSize: number, duration: number) {
    this.info(`PDF generated: ${title} (${fileSize} bytes, ${duration}ms)`);
  }

  logError(category: string, type: string, message: string, details?: any) {
    this.error(`${category}/${type}: ${message}`, details ? JSON.stringify(details) : undefined);
  }

  getInstance() {
    return this;
  }

  log(level: string, category: string, type: string, message: string, details?: any) {
    const logLevel = level.toLowerCase() as LogEntry['level'];
    const fullMessage = `[${category}/${type}] ${message}`;
    
    switch (logLevel) {
      case 'info':
        this.info(fullMessage, details ? JSON.stringify(details) : undefined);
        break;
      case 'warn':
        this.warn(fullMessage, details ? JSON.stringify(details) : undefined);
        break;
      case 'error':
        this.error(fullMessage, details ? JSON.stringify(details) : undefined);
        break;
      case 'debug':
        this.debug(fullMessage, details ? JSON.stringify(details) : undefined);
        break;
    }
  }

  clearLogs() {
    this.logs = [];
  }
}

export const LogService = new LogServiceClass();
export default LogService;