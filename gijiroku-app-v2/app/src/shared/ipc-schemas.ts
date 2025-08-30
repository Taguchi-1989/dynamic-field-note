/**
 * IPC通信用zodスキーマ定義
 * 
 * masterfile.md 仕様に基づく型安全なIPC通信
 * - 入力バリデーション
 * - 出力型チェック
 * - エラーハンドリング標準化
 * - セキュリティ強化
 */

import { z } from 'zod';

// === 共通型定義 ===

const FilePathSchema = z.string().min(1).refine(
  (path) => !path.includes('..') && !path.includes('~'),
  { message: 'Invalid file path: path traversal not allowed' }
);

const TimestampSchema = z.string().datetime();

const UuidSchema = z.string().uuid();

const PositiveIntSchema = z.number().int().positive();

const NonEmptyStringSchema = z.string().min(1);

// === File API Schemas ===

export const FileSelectOptionsSchema = z.object({
  title: z.string().optional(),
  defaultPath: FilePathSchema.optional(),
  buttonLabel: z.string().optional(),
  filters: z.array(z.object({
    name: z.string(),
    extensions: z.array(z.string())
  })).optional(),
  properties: z.array(z.enum([
    'openFile', 'openDirectory', 'multiSelections', 
    'showHiddenFiles', 'createDirectory', 'promptToCreate',
    'noResolveAliases', 'treatPackageAsDirectory', 'dontAddToRecent'
  ])).optional()
});

export const FileSelectResultSchema = z.object({
  canceled: z.boolean(),
  filePaths: z.array(FilePathSchema)
});

export const SaveDialogOptionsSchema = z.object({
  title: z.string().optional(),
  defaultPath: FilePathSchema.optional(),
  buttonLabel: z.string().optional(),
  filters: z.array(z.object({
    name: z.string(),
    extensions: z.array(z.string())
  })).optional(),
  nameFieldLabel: z.string().optional(),
  showsTagField: z.boolean().optional()
});

export const SaveDialogResultSchema = z.object({
  canceled: z.boolean(),
  filePath: FilePathSchema.optional()
});

// === Storage API Schemas ===

export const StorageKeySchema = z.string().min(1).max(256).refine(
  (key) => /^[a-zA-Z0-9_\-\.]+$/.test(key),
  { message: 'Storage key contains invalid characters' }
);

export const StorageValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.any()),
  z.record(z.any()),
  z.null()
]);

// === Backend API Schemas ===

export const BackendRequestOptionsSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  timeout: z.number().positive().max(300000).optional() // 最大5分
});

// === Workspace API Schemas ===

export const WorkspaceInfoSchema = z.object({
  root: FilePathSchema,
  paths: z.record(FilePathSchema),
  currentPath: z.string(),
  isPortable: z.boolean(),
  canWrite: z.boolean(),
  diskUsage: z.object({
    used: z.number(),
    available: z.number()
  }),
  version: z.string(),
  lastModified: z.string()
});

export const WorkspaceConfigSchema = z.object({
  name: NonEmptyStringSchema,
  version: PositiveIntSchema,
  createdAt: TimestampSchema,
  paths: z.object({
    attachments: z.string(),
    exports: z.string(),
    cache: z.string(),
    db: z.string()
  })
});

export const AppLocalConfigSchema = z.object({
  pdf: z.object({
    pageSize: z.enum(['A4', 'Letter']),
    marginMm: z.number().positive().max(50) // 最大50mm
  }),
  markdown: z.object({
    theme: z.enum(['default', 'corporate']),
    toc: z.boolean(),
    latex: z.enum(['katex', 'tectonic'])
  }),
  mermaid: z.object({
    themePath: z.string()
  })
});

export const AppLocalConfigUpdateSchema = AppLocalConfigSchema.deepPartial();

// === Markdown API Schemas ===

export const MarkdownCompileOptionsSchema = z.object({
  latex: z.enum(['katex', 'tectonic']).optional(),
  theme: z.enum(['default', 'corporate']).optional(),
  toc: z.boolean().optional(),
  pageSize: z.enum(['A4', 'Letter']).optional(),
  marginMm: z.number().positive().max(50).optional()
});

export const MarkdownCompileInputSchema = z.object({
  mdPath: FilePathSchema.optional(),
  mdContent: z.string().max(10_000_000).optional(), // 最大10MB
  pdfPath: FilePathSchema.optional(),
  options: MarkdownCompileOptionsSchema.optional()
}).refine(
  (input) => input.mdPath || input.mdContent,
  { message: 'Either mdPath or mdContent must be provided' }
);

export const MarkdownCompileResultSchema = z.object({
  pdfPath: FilePathSchema,
  pages: PositiveIntSchema,
  sizeBytes: PositiveIntSchema,
  warnings: z.array(z.string()).optional()
});

export const MarkdownTestResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  testPdfPath: FilePathSchema.optional()
});

// === Jobs API Schemas ===

export const JobTypeSchema = z.enum([
  'pdf_generation',
  'markdown_compile',
  'mermaid_render',
  'data_export',
  'data_import',
  'cleanup',
  'backup'
]);

export const JobStatusSchema = z.enum([
  'queued',
  'running', 
  'succeeded',
  'failed',
  'canceled'
]);

export const JobCreateInputSchema = z.object({
  type: JobTypeSchema,
  payload: z.record(z.any()),
  priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
  timeout: z.number().positive().max(1_800_000).optional() // 最大30分
});

export const JobCreateResultSchema = z.object({
  id: UuidSchema
});

export const JobStatusResultSchema = z.object({
  status: JobStatusSchema,
  progress: z.number().min(0).max(100),
  result: z.any().optional(),
  error: z.string().optional(),
  createdAt: TimestampSchema.optional(),
  startedAt: TimestampSchema.optional(),
  completedAt: TimestampSchema.optional()
});

// === Database API Schemas ===

export const DatabaseHealthCheckSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  version: z.string().optional(),
  tables: z.array(z.string()).optional(),
  lastBackup: TimestampSchema.optional()
});

export const DatabaseStatsSchema = z.object({
  users: z.number().int().nonnegative(),
  meetings: z.number().int().nonnegative(),
  documents: z.number().int().nonnegative(),
  tasks: z.number().int().nonnegative(),
  attachments: z.number().int().nonnegative(),
  jobs: z.record(z.number().int().nonnegative()),
  diskUsageMB: z.number().positive().optional(),
  lastVacuum: TimestampSchema.optional()
});

// === Mermaid API Schemas ===

export const MermaidCacheStatsSchema = z.object({
  fileCount: z.number().int().nonnegative(),
  totalSizeMB: z.number().nonnegative(),
  oldestFile: z.date().nullable(),
  newestFile: z.date().nullable(),
  hitRate: z.number().min(0).max(100).optional()
});

export const MermaidClearResultSchema = z.object({
  success: z.boolean(),
  filesDeleted: z.number().int().nonnegative().optional(),
  spaceSavedMB: z.number().nonnegative().optional()
});

// === Secure Storage API Schemas ===

export const CredentialTypeSchema = z.enum([
  'supabase_key',
  'api_token', 
  'oauth_token',
  'user_credential'
]);

export const SecureCredentialInputSchema = z.object({
  id: NonEmptyStringSchema.max(128),
  type: CredentialTypeSchema,
  service: NonEmptyStringSchema.max(64),
  account: NonEmptyStringSchema.max(128),
  value: z.string().min(1).max(4096), // 最大4KB
  metadata: z.record(z.any()).optional()
});

export const SecureCredentialListSchema = z.array(z.object({
  id: z.string(),
  type: z.string(),
  service: z.string(),
  account: z.string(),
  hasValue: z.boolean(),
  metadata: z.record(z.any()).optional()
}));

export const ApiKeyConfigSchema = z.object({
  supabase: z.object({
    url: z.string().url().optional(),
    anonKey: z.string().optional(),
    serviceRoleKey: z.string().optional()
  }).optional(),
  openai: z.object({
    apiKey: z.string().optional(),
    organization: z.string().optional()
  }).optional(),
  external: z.record(z.object({
    key: z.string(),
    endpoint: z.string().url().optional()
  })).optional()
});

export const SecureStorageHealthSchema = z.object({
  ok: z.boolean(),
  keytar: z.boolean(),
  fallback: z.boolean(),
  message: z.string()
});

// === App Control API Schemas ===

export const AppVersionSchema = z.string().regex(
  /^\d+\.\d+\.\d+(-[a-zA-Z0-9\-\.]+)?$/,
  { message: 'Invalid version format' }
);

export const AppPathNameSchema = z.enum([
  'home', 'appData', 'userData', 'cache', 'temp', 
  'exe', 'module', 'desktop', 'documents', 'downloads',
  'music', 'pictures', 'videos', 'recent', 'logs'
]);

export const WorkspaceSelectDirectoryResultSchema = z.object({
  success: z.boolean(),
  path: z.string().optional(),
  error: z.string().optional()
});

export const WorkspaceSwitchResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional()
});

export const WorkspaceInitializeResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional()
});

export const WorkspaceBackupResultSchema = z.object({
  success: z.boolean(),
  backupPath: z.string().optional(),
  error: z.string().optional()
});

// === Error Response Schema ===

export const IPCErrorSchema = z.object({
  name: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
  stack: z.string().optional()
});

// === IPC Response Wrapper ===

export const IPCResponseSchema = <T extends z.ZodType>(dataSchema: T) => 
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: IPCErrorSchema.optional()
  }).refine(
    (response) => response.success ? !!response.data : !!response.error,
    { message: 'Response must have either data (success) or error (failure)' }
  );

// === 型エクスポート ===

export type FileSelectOptions = z.infer<typeof FileSelectOptionsSchema>;
export type FileSelectResult = z.infer<typeof FileSelectResultSchema>;
export type SaveDialogOptions = z.infer<typeof SaveDialogOptionsSchema>;
export type SaveDialogResult = z.infer<typeof SaveDialogResultSchema>;

export type StorageKey = z.infer<typeof StorageKeySchema>;
export type StorageValue = z.infer<typeof StorageValueSchema>;

export type BackendRequestOptions = z.infer<typeof BackendRequestOptionsSchema>;

export type WorkspaceInfo = z.infer<typeof WorkspaceInfoSchema>;
export type WorkspaceConfig = z.infer<typeof WorkspaceConfigSchema>;
export type AppLocalConfig = z.infer<typeof AppLocalConfigSchema>;
export type AppLocalConfigUpdate = z.infer<typeof AppLocalConfigUpdateSchema>;

export type MarkdownCompileOptions = z.infer<typeof MarkdownCompileOptionsSchema>;
export type MarkdownCompileInput = z.infer<typeof MarkdownCompileInputSchema>;
export type MarkdownCompileResult = z.infer<typeof MarkdownCompileResultSchema>;
export type MarkdownTestResult = z.infer<typeof MarkdownTestResultSchema>;

export type JobType = z.infer<typeof JobTypeSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type JobCreateInput = z.infer<typeof JobCreateInputSchema>;
export type JobCreateResult = z.infer<typeof JobCreateResultSchema>;
export type JobStatusResult = z.infer<typeof JobStatusResultSchema>;

export type DatabaseHealthCheck = z.infer<typeof DatabaseHealthCheckSchema>;
export type DatabaseStats = z.infer<typeof DatabaseStatsSchema>;

export type MermaidCacheStats = z.infer<typeof MermaidCacheStatsSchema>;
export type MermaidClearResult = z.infer<typeof MermaidClearResultSchema>;

export type CredentialType = z.infer<typeof CredentialTypeSchema>;
export type SecureCredentialInput = z.infer<typeof SecureCredentialInputSchema>;
export type SecureCredentialList = z.infer<typeof SecureCredentialListSchema>;
export type ApiKeyConfig = z.infer<typeof ApiKeyConfigSchema>;
export type SecureStorageHealth = z.infer<typeof SecureStorageHealthSchema>;

export type AppVersion = z.infer<typeof AppVersionSchema>;
export type AppPathName = z.infer<typeof AppPathNameSchema>;

export type IPCError = z.infer<typeof IPCErrorSchema>;
export type IPCResponse<T> = {
  success: boolean;
  data?: T;
  error?: IPCError;
};

// === バリデーション用ヘルパー関数 ===

export function validateInput<T>(schema: z.ZodType<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`Input validation failed: ${formattedErrors}`);
    }
    throw new Error(`Input validation failed: ${error}`);
  }
}

export function createSuccessResponse<T>(data: T): IPCResponse<T> {
  return {
    success: true,
    data
  };
}

export function createErrorResponse(error: Error | string): IPCResponse<never> {
  const errorObj = error instanceof Error ? error : new Error(error);
  return {
    success: false,
    error: {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack
    }
  };
}

// === セキュリティバリデーター ===

export function validateSecurePath(path: string): boolean {
  // パストラバーサル攻撃を防ぐ
  if (path.includes('..') || path.includes('~')) {
    return false;
  }
  
  // 危険なパスを防ぐ
  const dangerousPaths = [
    '/etc/', '/usr/', '/bin/', '/sbin/', '/root/',
    'C:\\Windows\\', 'C:\\Program Files\\', 'C:\\System32\\'
  ];
  
  return !dangerousPaths.some(dangerous => 
    path.toLowerCase().startsWith(dangerous.toLowerCase())
  );
}

export function sanitizeFilename(filename: string): string {
  // ファイル名から危険な文字を除去
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '-')
    .replace(/\.+/g, '.')
    .substring(0, 255); // ファイル名の最大長制限
}

export function validateApiKey(key: string): boolean {
  // API キーの基本的な形式チェック
  return /^[A-Za-z0-9_\-\.]+$/.test(key) && key.length >= 8 && key.length <= 256;
}