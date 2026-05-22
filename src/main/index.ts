import {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  desktopCapturer,
  screen,
  shell,
  systemPreferences
} from 'electron'
import { join } from 'path'
import { config as loadEnv } from 'dotenv'
import { GoogleGenAI } from '@google/genai'
import { createWorker, type Worker as OcrWorker } from 'tesseract.js'
import {
  Channels,
  type Rect,
  type CaptureSource,
  type RegionSelection,
  type AnalyzePayload,
  type AnalyzeResult,
  type AppConfig,
  type SettingsPayload,
  type TestKeyResult,
  type UsageInfo
} from '../shared/ipc'
import {
  getApiKey,
  setApiKey,
  hasApiKey,
  getSettings,
  updateSettings,
  isEncryptionAvailable
} from './settings'

loadEnv()

const HOTKEY = 'CommandOrControl+Shift+E'

let panel: BrowserWindow | null = null
let overlayEntries: { win: BrowserWindow; display: Electron.Display }[] = []
let genai: GoogleGenAI | null = null
let genaiKey = ''
let ocrWorker: OcrWorker | null = null
let ocrWorkerLangs = ''
let lastText = ''

const isDev = !app.isPackaged
const rendererUrl = process.env['ELECTRON_RENDERER_URL']

function loadRenderer(win: BrowserWindow, htmlFile: string): void {
  if (isDev && rendererUrl) {
    void win.loadURL(`${rendererUrl}/${htmlFile}`)
  } else {
    void win.loadFile(join(__dirname, `../renderer/${htmlFile}`))
  }
}

function getScreenAccess(): string {
  if (process.platform !== 'darwin') return 'not-applicable'
  try {
    return systemPreferences.getMediaAccessStatus('screen')
  } catch {
    return 'unknown'
  }
}

function currentConfig(): AppConfig {
  const s = getSettings()
  return {
    hasKey: hasApiKey(),
    model: s.model,
    ocrLangs: s.ocrLangs,
    intervalMs: s.intervalMs,
    explainLang: s.explainLang,
    encryptionAvailable: isEncryptionAvailable(),
    screenAccess: getScreenAccess()
  }
}

function createPanel(): void {
  panel = new BrowserWindow({
    width: 480,
    height: 760,
    minWidth: 360,
    minHeight: 480,
    title: 'FirstPrincipleViewer',
    backgroundColor: '#0f1115',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })
  loadRenderer(panel, 'index.html')
  panel.on('closed', () => {
    panel = null
  })
}

function createOverlays(): void {
  if (overlayEntries.length > 0) {
    overlayEntries.forEach((e) => e.win.focus())
    return
  }
  for (const display of screen.getAllDisplays()) {
    const { x, y, width, height } = display.bounds
    const win = new BrowserWindow({
      x,
      y,
      width,
      height,
      transparent: true,
      frame: false,
      resizable: false,
      movable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      hasShadow: false,
      fullscreenable: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true
      }
    })
    win.setAlwaysOnTop(true, 'screen-saver')
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    loadRenderer(win, 'overlay.html')
    win.on('closed', () => {
      overlayEntries = overlayEntries.filter((e) => e.win !== win)
    })
    overlayEntries.push({ win, display })
  }
}

function closeOverlays(): void {
  const entries = overlayEntries
  overlayEntries = []
  for (const { win } of entries) {
    if (!win.isDestroyed()) win.close()
  }
}

async function getSourceForDisplay(display: Electron.Display): Promise<CaptureSource> {
  const scaleFactor = display.scaleFactor
  const width = Math.round(display.size.width * scaleFactor)
  const height = Math.round(display.size.height * scaleFactor)
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 0, height: 0 }
  })
  const index = screen.getAllDisplays().findIndex((d) => d.id === display.id)
  const match =
    sources.find((s) => s.display_id === String(display.id)) ?? sources[index] ?? sources[0]
  return { sourceId: match?.id ?? '', width, height, scaleFactor }
}

function buildPrompt(text: string): string {
  return `Here is the text captured from the user's screen:\n\n"""\n${text}\n"""\n\nExplain it from first principles.`
}

function systemInstruction(explainLang: string): string {
  return [
    'You are a tutor who explains things from first principles.',
    'The user has captured some text from their screen (it may be code, an error, a UI label, a chart caption, prose, anything).',
    `Write your entire explanation in ${explainLang}, regardless of the language of the captured text.`,
    'Explain what it means and how it works, building up from fundamental concepts, clearly and concisely.',
    'Define jargon when you must use it. Prefer short paragraphs and bullet points.',
    'If the text is incomplete or ambiguous (OCR is imperfect), reason about the most likely intent and say so briefly.'
  ].join(' ')
}

async function runOcr(dataUrl: string): Promise<string> {
  const langs = getSettings().ocrLangs
  if (!ocrWorker || ocrWorkerLangs !== langs) {
    if (ocrWorker) await ocrWorker.terminate()
    ocrWorker = await createWorker(langs, undefined, {
      cachePath: join(app.getPath('userData'), 'tessdata')
    })
    ocrWorkerLangs = langs
  }
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64, 'base64')
  const { data } = await ocrWorker.recognize(buffer)
  return data.text ?? ''
}

// USD per 1M tokens, { in, out }. Estimates — verify at https://ai.google.dev/pricing
const PRICING: Record<string, { in: number; out: number }> = {
  'gemini-3.1-flash-lite': { in: 0.25, out: 1.5 },
  'gemini-2.5-flash-lite': { in: 0.1, out: 0.4 },
  'gemini-2.5-flash': { in: 0.3, out: 2.5 },
  'gemini-2.0-flash-lite': { in: 0.075, out: 0.3 },
  'gemini-2.0-flash': { in: 0.1, out: 0.4 }
}

function priceFor(model: string): { in: number; out: number } | null {
  if (PRICING[model]) return PRICING[model]
  const key = Object.keys(PRICING).find((k) => model.startsWith(k))
  return key ? PRICING[key] : null
}

interface RawUsage {
  promptTokenCount?: number
  candidatesTokenCount?: number
  totalTokenCount?: number
  thoughtsTokenCount?: number
}

function computeUsage(u: RawUsage | undefined, model: string): UsageInfo {
  const inputTokens = u?.promptTokenCount ?? 0
  const total =
    u?.totalTokenCount ??
    inputTokens + (u?.candidatesTokenCount ?? 0) + (u?.thoughtsTokenCount ?? 0)
  const outputTokens = Math.max(0, total - inputTokens)
  const p = priceFor(model)
  const costUsd = p ? (inputTokens * p.in + outputTokens * p.out) / 1_000_000 : null
  return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, costUsd, model }
}

async function streamExplanation(
  sender: Electron.WebContents,
  text: string,
  explainLang: string
): Promise<void> {
  const key = getApiKey()
  if (!key) {
    sender.send(
      Channels.explainError,
      'No Gemini API key set. Open Settings and add your key (free at https://aistudio.google.com/apikey).'
    )
    return
  }
  if (!genai || genaiKey !== key) {
    genai = new GoogleGenAI({ apiKey: key })
    genaiKey = key
  }
  const settings = getSettings()
  const lang = explainLang || settings.explainLang
  sender.send(Channels.explainStart)
  const stream = await genai.models.generateContentStream({
    model: settings.model,
    contents: buildPrompt(text),
    config: {
      systemInstruction: systemInstruction(lang),
      temperature: 0.4
    }
  })
  let usage: RawUsage | undefined
  for await (const chunk of stream) {
    const piece = chunk.text
    if (piece) {
      sender.send(Channels.explainChunk, piece)
    }
    if (chunk.usageMetadata) {
      usage = chunk.usageMetadata
    }
  }
  sender.send(Channels.explainDone, computeUsage(usage, settings.model))
}

function registerIpc(): void {
  ipcMain.on(Channels.regionStart, () => createOverlays())
  ipcMain.on(Channels.regionCancel, () => closeOverlays())
  ipcMain.on(Channels.resetText, () => {
    lastText = ''
  })
  ipcMain.on(Channels.openScreenPrefs, () => {
    if (process.platform === 'darwin') {
      void shell.openExternal(
        'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'
      )
    }
  })
  ipcMain.on(Channels.openExternal, (_event, url: string) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      void shell.openExternal(url)
    }
  })

  ipcMain.on(Channels.regionSelected, async (event, rect: Rect) => {
    const entry = overlayEntries.find((e) => e.win.webContents.id === event.sender.id)
    const display = entry?.display ?? screen.getPrimaryDisplay()
    closeOverlays()
    lastText = ''
    let source: CaptureSource
    try {
      source = await getSourceForDisplay(display)
    } catch {
      source = await getSourceForDisplay(screen.getPrimaryDisplay())
    }
    const selection: RegionSelection = { rect, source }
    if (panel) {
      panel.show()
      panel.focus()
      panel.webContents.send(Channels.regionSet, selection)
    }
  })

  ipcMain.handle(Channels.configGet, async (): Promise<AppConfig> => currentConfig())

  ipcMain.handle(Channels.settingsSave, async (_event, payload: SettingsPayload): Promise<AppConfig> => {
    if (payload.apiKey !== undefined) {
      setApiKey(payload.apiKey)
      genai = null
      genaiKey = ''
    }
    updateSettings({
      model: payload.model,
      ocrLangs: payload.ocrLangs,
      explainLang: payload.explainLang,
      intervalMs: payload.intervalMs
    })
    return currentConfig()
  })

  ipcMain.handle(
    Channels.settingsTest,
    async (_event, payload: SettingsPayload): Promise<TestKeyResult> => {
      const key = (payload.apiKey ?? '').trim() || getApiKey()
      if (!key) return { ok: false, error: '尚未提供金鑰。' }
      const model = (payload.model ?? '').trim() || getSettings().model
      try {
        const client = new GoogleGenAI({ apiKey: key })
        await client.models.generateContent({
          model,
          contents: 'ping',
          config: { maxOutputTokens: 8, temperature: 0 }
        })
        return { ok: true }
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) }
      }
    }
  )

  ipcMain.handle(
    Channels.analyze,
    async (event, payload: AnalyzePayload): Promise<AnalyzeResult> => {
      let text = ''
      try {
        text = await runOcr(payload.image)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        event.sender.send(Channels.explainError, `OCR failed: ${message}`)
        return { ok: false, changed: false, text: '', error: message }
      }

      const normalized = text.replace(/\s+/g, ' ').trim()
      if (normalized.length === 0) {
        return { ok: true, changed: false, text: '' }
      }
      if (normalized === lastText) {
        return { ok: true, changed: false, text }
      }
      lastText = normalized

      try {
        await streamExplanation(event.sender, text, payload.explainLang ?? '')
        return { ok: true, changed: true, text }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        event.sender.send(Channels.explainError, message)
        return { ok: false, changed: true, text, error: message }
      }
    }
  )
}

app.whenReady().then(() => {
  registerIpc()
  createPanel()

  const registered = globalShortcut.register(HOTKEY, () => createOverlays())
  if (!registered) {
    console.warn(`Failed to register global shortcut ${HOTKEY}`)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createPanel()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  void ocrWorker?.terminate()
})
