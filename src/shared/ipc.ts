export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface CaptureSource {
  sourceId: string
  /** Captured frame width in physical pixels. */
  width: number
  /** Captured frame height in physical pixels. */
  height: number
  /** Display scale factor (DIP -> physical pixel multiplier). */
  scaleFactor: number
}

export interface RegionSelection {
  /** Region in the chosen display's local DIP coordinates. */
  rect: Rect
  /** Capture source for the display the region was drawn on. */
  source: CaptureSource
}

export interface AnalyzePayload {
  /** PNG data URL of the cropped region. OCR + LLM run in the main process. */
  image: string
  /** Human language the explanation should be written in (follows the UI locale). */
  explainLang?: string
}

export interface AnalyzeResult {
  ok: boolean
  /** False when the OCR'd text is empty or unchanged since last call (no LLM call made). */
  changed: boolean
  /** The OCR'd text, returned so the panel can display it. */
  text: string
  error?: string
}

export interface AppConfig {
  hasKey: boolean
  model: string
  ocrLangs: string
  intervalMs: number
  explainLang: string
  /** Whether the OS provides encrypted secret storage (false e.g. on Linux without a keyring). */
  encryptionAvailable: boolean
  /** Screen-capture permission: 'granted' | 'denied' | 'not-determined' | 'restricted' | 'unknown' | 'not-applicable'. */
  screenAccess: string
}

export interface SettingsPayload {
  /** When provided (even empty string to clear), the API key is updated. Omit to leave unchanged. */
  apiKey?: string
  model?: string
  ocrLangs?: string
  explainLang?: string
  intervalMs?: number
}

export interface TestKeyResult {
  ok: boolean
  error?: string
}

export interface UsageInfo {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  /** Estimated USD cost; null when the model's pricing is unknown. */
  costUsd: number | null
  model: string
}

export const Channels = {
  regionStart: 'region:start',
  regionSelected: 'region:selected',
  regionCancel: 'region:cancel',
  regionSet: 'region:set',
  analyze: 'analyze',
  resetText: 'explain:reset',
  configGet: 'config:get',
  settingsSave: 'settings:save',
  settingsTest: 'settings:test',
  openScreenPrefs: 'open:screen-prefs',
  openExternal: 'open:external',
  explainStart: 'explain:start',
  explainChunk: 'explain:chunk',
  explainDone: 'explain:done',
  explainError: 'explain:error'
} as const
