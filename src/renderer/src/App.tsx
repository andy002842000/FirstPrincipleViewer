import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { AppConfig, CaptureSource, Rect } from '../../shared/ipc'
import { captureRegionToDataUrl, disposeCapture } from './capture'

type Status = 'idle' | 'capturing' | 'ocr' | 'thinking' | 'streaming' | 'error'

const STATUS_LABEL: Record<Status, string> = {
  idle: '待命',
  capturing: '擷取畫面中…',
  ocr: '辨識文字中…',
  thinking: '送往 Gemini…',
  streaming: '解說中…',
  error: '發生錯誤'
}

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [source, setSource] = useState<CaptureSource | null>(null)
  const [rect, setRect] = useState<Rect | null>(null)
  const [ocrText, setOcrText] = useState('')
  const [explanation, setExplanation] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [monitoring, setMonitoring] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const rectRef = useRef<Rect | null>(null)
  const sourceRef = useRef<CaptureSource | null>(null)
  const configRef = useRef<AppConfig | null>(null)
  const busyRef = useRef(false)
  const intervalRef = useRef<number | null>(null)

  rectRef.current = rect
  sourceRef.current = source
  configRef.current = config

  const runCycle = useCallback(async () => {
    const r = rectRef.current
    const src = sourceRef.current
    const cfg = configRef.current
    if (!r || !src || !cfg || busyRef.current) return

    busyRef.current = true
    try {
      setError('')
      setStatus('capturing')
      const image = await captureRegionToDataUrl(r, src)
      setStatus('ocr')
      const res = await window.api.analyze({ image })
      setOcrText(res.text)
      if (res.error) {
        // onExplainError listener already surfaced it
      } else if (!res.changed) {
        setStatus('idle')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus('error')
    } finally {
      busyRef.current = false
    }
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const cfg = await window.api.getConfig()
        setConfig(cfg)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    })()

    const offStart = window.api.onExplainStart(() => {
      setExplanation('')
      setStatus('streaming')
    })
    const offChunk = window.api.onExplainChunk((t) => setExplanation((prev) => prev + t))
    const offDone = window.api.onExplainDone(() => setStatus('idle'))
    const offError = window.api.onExplainError((m) => {
      setError(m)
      setStatus('error')
    })
    const offRegion = window.api.onRegionSet((sel) => {
      setSource(sel.source)
      setRect(sel.rect)
      setExplanation('')
      setOcrText('')
    })

    return () => {
      offStart()
      offChunk()
      offDone()
      offError()
      offRegion()
      disposeCapture()
    }
  }, [])

  useEffect(() => {
    if (rect) void runCycle()
  }, [rect, runCycle])

  useEffect(() => {
    if (!monitoring) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    const ms = configRef.current?.intervalMs ?? 1500
    void runCycle()
    intervalRef.current = window.setInterval(() => void runCycle(), ms)
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [monitoring, runCycle])

  const busy = status !== 'idle' && status !== 'error'
  const macDenied =
    config?.screenAccess === 'denied' || config?.screenAccess === 'restricted'

  return (
    <div className="app">
      <header className="header">
        <div className="title">
          <span className="logo">◎</span>
          <div>
            <h1>FirstPrincipleViewer</h1>
            <p className="subtitle">框選螢幕 → 本地 OCR → Gemini 第一性原理解說</p>
          </div>
        </div>
        <div className="header-right">
          <span className={`pill pill--${status}`}>{STATUS_LABEL[status]}</span>
          <button className="icon-btn" title="設定" onClick={() => setShowSettings(true)}>
            ⚙
          </button>
        </div>
      </header>

      {config && !config.hasKey && (
        <div className="banner banner--warn">
          尚未設定 Gemini 金鑰。{' '}
          <button className="link-btn" onClick={() => setShowSettings(true)}>
            開啟設定
          </button>{' '}
          填入你自己的金鑰即可開始。
        </div>
      )}
      {macDenied && (
        <div className="banner banner--warn">
          macOS 尚未授權螢幕錄製,無法擷取畫面。{' '}
          <button className="link-btn" onClick={() => window.api.openScreenPrefs()}>
            開啟系統設定
          </button>{' '}
          授權後請重新啟動 App。
        </div>
      )}
      {error && <div className="banner banner--error">{error}</div>}

      <div className="controls">
        <button className="btn btn--primary" onClick={() => window.api.startRegionSelect()}>
          選取區域
          <kbd>Ctrl/⌘ + Shift + E</kbd>
        </button>
        <label className={`toggle ${rect ? '' : 'toggle--disabled'}`}>
          <input
            type="checkbox"
            checked={monitoring}
            disabled={!rect}
            onChange={(e) => setMonitoring(e.target.checked)}
          />
          持續監看
          {config && <span className="muted"> · 每 {config.intervalMs} ms</span>}
        </label>
      </div>

      {rect && (
        <div className="region-info">
          區域 {Math.round(rect.width)} × {Math.round(rect.height)} @ ({Math.round(rect.x)},{' '}
          {Math.round(rect.y)})
        </div>
      )}

      <section className="explanation">
        {explanation ? (
          <ReactMarkdown>{explanation}</ReactMarkdown>
        ) : (
          <div className="placeholder">
            按「選取區域」或熱鍵框出畫面上要解說的部分,解說會即時串流到這裡。
          </div>
        )}
      </section>

      {ocrText && (
        <details className="ocr">
          <summary>OCR 擷取到的文字</summary>
          <pre>{ocrText}</pre>
        </details>
      )}

      <footer className="footer">
        {config ? (
          <>
            模型 <code>{config.model}</code> · OCR <code>{config.ocrLangs}</code>
          </>
        ) : (
          '載入設定中…'
        )}
        {busy && <span className="spinner" aria-hidden />}
      </footer>

      {showSettings && config && (
        <SettingsModal
          config={config}
          onClose={() => setShowSettings(false)}
          onSaved={(next) => setConfig(next)}
        />
      )}
    </div>
  )
}

function SettingsModal({
  config,
  onClose,
  onSaved
}: {
  config: AppConfig
  onClose: () => void
  onSaved: (next: AppConfig) => void
}) {
  const [keyInput, setKeyInput] = useState('')
  const [model, setModel] = useState(config.model)
  const [langs, setLangs] = useState(config.ocrLangs)
  const [explainLang, setExplainLang] = useState(config.explainLang)
  const [intervalMs, setIntervalMs] = useState(String(config.intervalMs))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [test, setTest] = useState<{ state: 'idle' | 'testing' | 'ok' | 'fail'; msg: string }>({
    state: 'idle',
    msg: ''
  })

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    setSaved(false)
    try {
      const next = await window.api.saveSettings({
        apiKey: keyInput.trim() !== '' ? keyInput.trim() : undefined,
        model,
        ocrLangs: langs,
        explainLang,
        intervalMs: Number(intervalMs)
      })
      onSaved(next)
      setKeyInput('')
      setSaved(true)
    } catch (e) {
      setTest({ state: 'fail', msg: e instanceof Error ? e.message : String(e) })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (): Promise<void> => {
    setTest({ state: 'testing', msg: '' })
    try {
      const res = await window.api.testKey({
        apiKey: keyInput.trim() !== '' ? keyInput.trim() : undefined,
        model
      })
      setTest(
        res.ok
          ? { state: 'ok', msg: '金鑰可用 ✓' }
          : { state: 'fail', msg: res.error ?? '測試失敗' }
      )
    } catch (e) {
      setTest({ state: 'fail', msg: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>設定</h2>
          <button className="icon-btn" onClick={onClose} title="關閉">
            ✕
          </button>
        </div>

        <label className="field">
          <span>
            Gemini API 金鑰
            {config.hasKey && <em className="muted"> · 已設定,留空表示不變更</em>}
          </span>
          <input
            type="password"
            value={keyInput}
            autoComplete="off"
            spellCheck={false}
            placeholder={config.hasKey ? '••••••••(已儲存)' : '貼上你的金鑰'}
            onChange={(e) => setKeyInput(e.target.value)}
          />
        </label>
        <div className="field-row">
          <button className="btn" onClick={handleTest} disabled={test.state === 'testing'}>
            {test.state === 'testing' ? '測試中…' : '測試金鑰'}
          </button>
          {test.state === 'ok' && <span className="ok-text">{test.msg}</span>}
          {test.state === 'fail' && <span className="err-text">{test.msg}</span>}
          <a
            className="link"
            onClick={() => window.api.openExternal('https://aistudio.google.com/apikey')}
            style={{ marginLeft: 'auto', cursor: 'pointer' }}
          >
            取得金鑰 ↗
          </a>
        </div>
        {!config.encryptionAvailable && (
          <div className="note">
            ⚠ 此系統無法使用作業系統加密,金鑰將以明文存放(常見於沒有 keyring 的 Linux)。
          </div>
        )}

        <label className="field">
          <span>模型</span>
          <input value={model} onChange={(e) => setModel(e.target.value)} spellCheck={false} />
        </label>
        <label className="field">
          <span>OCR 語言(如 eng、eng+chi_tra)</span>
          <input value={langs} onChange={(e) => setLangs(e.target.value)} spellCheck={false} />
        </label>
        <label className="field">
          <span>解說語言</span>
          <input value={explainLang} onChange={(e) => setExplainLang(e.target.value)} />
        </label>
        <label className="field">
          <span>持續監看間隔(毫秒)</span>
          <input
            type="number"
            min={300}
            step={100}
            value={intervalMs}
            onChange={(e) => setIntervalMs(e.target.value)}
          />
        </label>

        <div className="modal-foot">
          {saved && <span className="ok-text">已儲存 ✓</span>}
          <button className="btn" onClick={onClose}>
            關閉
          </button>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? '儲存中…' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  )
}
