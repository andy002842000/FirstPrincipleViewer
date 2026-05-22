import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { AppConfig, CaptureSource, Rect, UsageInfo } from '../../shared/ipc'
import { captureRegionToDataUrl, disposeCapture } from './capture'
import {
  type Locale,
  LOCALES,
  detectLocale,
  getLocalePreference,
  setLocalePreference,
  matchLocale,
  localeToLangName,
  createT,
  type TFunc
} from './i18n'

type Status = 'idle' | 'capturing' | 'ocr' | 'thinking' | 'streaming' | 'error'

function fmtTokens(n: number): string {
  return n.toLocaleString('en-US')
}

function fmtCost(usd: number): string {
  if (usd === 0) return '$0'
  if (usd < 0.01) return `$${usd.toFixed(5)}`
  if (usd < 1) return `$${usd.toFixed(4)}`
  return `$${usd.toFixed(2)}`
}

function costText(usd: number | null, t: TFunc): string {
  return usd === null ? t('cost.unknown') : fmtCost(usd)
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
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale())
  const [lastUsage, setLastUsage] = useState<UsageInfo | null>(null)
  const [sessionInput, setSessionInput] = useState(0)
  const [sessionOutput, setSessionOutput] = useState(0)
  const [sessionCost, setSessionCost] = useState(0)
  const [sessionCostKnown, setSessionCostKnown] = useState(true)

  const t = useMemo(() => createT(locale), [locale])

  const rectRef = useRef<Rect | null>(null)
  const sourceRef = useRef<CaptureSource | null>(null)
  const configRef = useRef<AppConfig | null>(null)
  const busyRef = useRef(false)
  const intervalRef = useRef<number | null>(null)
  const localeRef = useRef(locale)

  rectRef.current = rect
  sourceRef.current = source
  configRef.current = config
  localeRef.current = locale

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
      const res = await window.api.analyze({
        image,
        explainLang: localeToLangName(localeRef.current)
      })
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
    const offChunk = window.api.onExplainChunk((tok) => setExplanation((prev) => prev + tok))
    const offDone = window.api.onExplainDone((usage) => {
      setStatus('idle')
      if (!usage) return
      setLastUsage(usage)
      setSessionInput((p) => p + usage.inputTokens)
      setSessionOutput((p) => p + usage.outputTokens)
      const cost = usage.costUsd
      if (cost !== null) setSessionCost((p) => p + cost)
      else setSessionCostKnown(false)
    })
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
  const macDenied = config?.screenAccess === 'denied' || config?.screenAccess === 'restricted'

  const handleUiLangChange = (pref: Locale | 'auto'): void => {
    setLocalePreference(pref)
    setLocaleState(pref === 'auto' ? matchLocale(navigator.language) : pref)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="title">
          <span className="logo">◎</span>
          <div>
            <h1>FirstPrincipleViewer</h1>
            <p className="subtitle">{t('app.subtitle')}</p>
          </div>
        </div>
        <div className="header-right">
          <span className={`pill pill--${status}`}>{t(`status.${status}`)}</span>
          <button className="icon-btn" title={t('settings.title')} onClick={() => setShowSettings(true)}>
            ⚙
          </button>
        </div>
      </header>

      {config && !config.hasKey && (
        <div className="banner banner--warn">
          {t('banner.noKey')}{' '}
          <button className="link-btn" onClick={() => setShowSettings(true)}>
            {t('action.openSettings')}
          </button>
        </div>
      )}
      {macDenied && (
        <div className="banner banner--warn">
          {t('banner.mac')}{' '}
          <button className="link-btn" onClick={() => window.api.openScreenPrefs()}>
            {t('action.openScreenPrefs')}
          </button>
        </div>
      )}
      {error && <div className="banner banner--error">{error}</div>}

      <div className="controls">
        <button className="btn btn--primary" onClick={() => window.api.startRegionSelect()}>
          {t('btn.selectRegion')}
          <kbd>Ctrl/⌘ + Shift + E</kbd>
        </button>
        <label className={`toggle ${rect ? '' : 'toggle--disabled'}`}>
          <input
            type="checkbox"
            checked={monitoring}
            disabled={!rect}
            onChange={(e) => setMonitoring(e.target.checked)}
          />
          {t('toggle.monitor')}
          {config && <span className="muted"> · {t('toggle.interval', { ms: config.intervalMs })}</span>}
        </label>
      </div>

      {rect && (
        <div className="region-info">
          {t('region.info', {
            w: Math.round(rect.width),
            h: Math.round(rect.height),
            x: Math.round(rect.x),
            y: Math.round(rect.y)
          })}
        </div>
      )}

      <section className="explanation">
        {explanation ? (
          <ReactMarkdown>{explanation}</ReactMarkdown>
        ) : (
          <div className="placeholder">{t('explanation.placeholder')}</div>
        )}
      </section>

      {ocrText && (
        <details className="ocr">
          <summary>{t('ocr.summary')}</summary>
          <pre>{ocrText}</pre>
        </details>
      )}

      {lastUsage && (
        <div className="usage">
          <span>
            {t('usage.last', {
              total: fmtTokens(lastUsage.totalTokens),
              in: fmtTokens(lastUsage.inputTokens),
              out: fmtTokens(lastUsage.outputTokens),
              cost: costText(lastUsage.costUsd, t)
            })}
          </span>
          <span className="muted">
            {t('usage.session', {
              total: fmtTokens(sessionInput + sessionOutput),
              cost: fmtCost(sessionCost) + (sessionCostKnown ? '' : '+')
            })}
          </span>
        </div>
      )}

      <footer className="footer">
        {config
          ? t('footer.config', { model: config.model, langs: config.ocrLangs })
          : t('footer.loading')}
        {busy && <span className="spinner" aria-hidden />}
      </footer>

      {showSettings && config && (
        <SettingsModal
          config={config}
          t={t}
          uiPref={getLocalePreference()}
          onUiLangChange={handleUiLangChange}
          onClose={() => setShowSettings(false)}
          onSaved={(next) => setConfig(next)}
        />
      )}
    </div>
  )
}

function SettingsModal({
  config,
  t,
  uiPref,
  onUiLangChange,
  onClose,
  onSaved
}: {
  config: AppConfig
  t: TFunc
  uiPref: Locale | 'auto'
  onUiLangChange: (pref: Locale | 'auto') => void
  onClose: () => void
  onSaved: (next: AppConfig) => void
}) {
  const [keyInput, setKeyInput] = useState('')
  const [model, setModel] = useState(config.model)
  const [langs, setLangs] = useState(config.ocrLangs)
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
          ? { state: 'ok', msg: t('settings.testOk') }
          : { state: 'fail', msg: res.error ?? 'failed' }
      )
    } catch (e) {
      setTest({ state: 'fail', msg: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{t('settings.title')}</h2>
          <button className="icon-btn" onClick={onClose} title={t('settings.close')}>
            ✕
          </button>
        </div>

        <label className="field">
          <span>
            {t('settings.key.label')}
            {config.hasKey && <em className="muted">{t('settings.key.saved')}</em>}
          </span>
          <input
            type="password"
            value={keyInput}
            autoComplete="off"
            spellCheck={false}
            placeholder={
              config.hasKey ? t('settings.key.placeholderSaved') : t('settings.key.placeholderEmpty')
            }
            onChange={(e) => setKeyInput(e.target.value)}
          />
        </label>
        <div className="field-row">
          <button className="btn" onClick={handleTest} disabled={test.state === 'testing'}>
            {test.state === 'testing' ? t('settings.testing') : t('settings.test')}
          </button>
          {test.state === 'ok' && <span className="ok-text">{test.msg}</span>}
          {test.state === 'fail' && <span className="err-text">{test.msg}</span>}
          <a
            className="link"
            onClick={() => window.api.openExternal('https://aistudio.google.com/apikey')}
            style={{ marginLeft: 'auto', cursor: 'pointer' }}
          >
            {t('settings.getKey')}
          </a>
        </div>
        {!config.encryptionAvailable && <div className="note">{t('settings.encWarn')}</div>}

        <label className="field">
          <span>{t('settings.uiLang')}</span>
          <select value={uiPref} onChange={(e) => onUiLangChange(e.target.value as Locale | 'auto')}>
            <option value="auto">{t('settings.uiLang.auto')}</option>
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('settings.model')}</span>
          <input value={model} onChange={(e) => setModel(e.target.value)} spellCheck={false} />
        </label>
        <label className="field">
          <span>{t('settings.ocrLangs')}</span>
          <input value={langs} onChange={(e) => setLangs(e.target.value)} spellCheck={false} />
        </label>
        <label className="field">
          <span>{t('settings.interval')}</span>
          <input
            type="number"
            min={300}
            step={100}
            value={intervalMs}
            onChange={(e) => setIntervalMs(e.target.value)}
          />
        </label>

        <div className="modal-foot">
          {saved && <span className="ok-text">{t('settings.saved')}</span>}
          <button className="btn" onClick={onClose}>
            {t('settings.close')}
          </button>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? t('settings.saving') : t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
