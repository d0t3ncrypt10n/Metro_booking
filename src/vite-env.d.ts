/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_ENABLE_DARK_MODE: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_MAP_CENTER_X: string
  readonly VITE_MAP_CENTER_Y: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
