/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCK_MODE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly NODE_ENV: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}