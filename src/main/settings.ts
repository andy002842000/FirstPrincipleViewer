import { app, safeStorage } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'

export interface StoredSettings {
  model: string
  ocrLangs: string
  explainLang: string
  intervalMs: number
}

interface SettingsFile extends StoredSettings {
  /** safeStorage-encrypted API key, base64. Present when OS encryption is available. */
  encryptedKey?: string
  /** Plaintext fallback used only when OS encryption is unavailable (e.g. Linux without a keyring). */
  plainKey?: string
}

const DEFAULTS: StoredSettings = {
  model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  ocrLangs: process.env.OCR_LANGS || 'eng+chi_tra',
  explainLang: process.env.EXPLAIN_LANG || 'Traditional Chinese',
  intervalMs: Number(process.env.MONITOR_INTERVAL_MS) || 1500
}

let cache: SettingsFile | null = null

function filePath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function load(): SettingsFile {
  if (cache) return cache
  try {
    if (existsSync(filePath())) {
      const parsed = JSON.parse(readFileSync(filePath(), 'utf-8')) as Partial<SettingsFile>
      cache = { ...DEFAULTS, ...parsed }
      return cache
    }
  } catch {
    // fall through to defaults
  }
  cache = { ...DEFAULTS }
  return cache
}

function persist(): void {
  try {
    writeFileSync(filePath(), JSON.stringify(cache, null, 2), 'utf-8')
  } catch {
    // best effort; nothing actionable if the disk write fails
  }
}

export function isEncryptionAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable()
  } catch {
    return false
  }
}

export function getSettings(): StoredSettings {
  const s = load()
  return {
    model: s.model,
    ocrLangs: s.ocrLangs,
    explainLang: s.explainLang,
    intervalMs: s.intervalMs
  }
}

export function updateSettings(patch: Partial<StoredSettings>): void {
  const s = load()
  if (patch.model !== undefined) s.model = patch.model.trim() || DEFAULTS.model
  if (patch.ocrLangs !== undefined) s.ocrLangs = patch.ocrLangs.trim() || DEFAULTS.ocrLangs
  if (patch.explainLang !== undefined) s.explainLang = patch.explainLang.trim() || DEFAULTS.explainLang
  if (patch.intervalMs !== undefined && Number.isFinite(patch.intervalMs)) {
    s.intervalMs = Math.max(300, Math.round(patch.intervalMs))
  }
  persist()
}

/** Resolve the effective key: a user-saved BYOK key takes priority, env var is a dev fallback. */
export function getApiKey(): string {
  const s = load()
  if (s.encryptedKey && isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(Buffer.from(s.encryptedKey, 'base64'))
    } catch {
      return ''
    }
  }
  if (s.plainKey) return s.plainKey
  return process.env.GEMINI_API_KEY ?? ''
}

export function setApiKey(plain: string): void {
  const s = load()
  const key = plain.trim()
  if (!key) {
    delete s.encryptedKey
    delete s.plainKey
  } else if (isEncryptionAvailable()) {
    s.encryptedKey = safeStorage.encryptString(key).toString('base64')
    delete s.plainKey
  } else {
    s.plainKey = key
    delete s.encryptedKey
  }
  persist()
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0
}
