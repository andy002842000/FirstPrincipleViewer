export type Locale = 'en' | 'zh-TW' | 'ja' | 'ko'

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' }
]

type Dict = Record<string, string>

const en: Dict = {
  'app.subtitle': 'Frame your screen → local OCR → first-principles explanation from Gemini',
  'status.idle': 'Idle',
  'status.capturing': 'Capturing…',
  'status.ocr': 'Recognizing text…',
  'status.thinking': 'Sending to Gemini…',
  'status.streaming': 'Explaining…',
  'status.error': 'Error',
  'banner.noKey': 'No Gemini API key set yet — add your own key to begin.',
  'banner.mac':
    "macOS hasn't granted Screen Recording, so capture won't work. Restart after granting.",
  'action.openSettings': 'Open Settings',
  'action.openScreenPrefs': 'Open System Settings',
  'btn.selectRegion': 'Select region',
  'toggle.monitor': 'Continuous monitor',
  'toggle.interval': 'every {ms} ms',
  'region.info': 'Region {w} × {h} @ ({x}, {y})',
  'explanation.placeholder':
    'Frame the part of your screen you want explained — the explanation streams here in real time.',
  'ocr.summary': 'Text captured by OCR',
  'footer.config': 'Model {model} · OCR {langs}',
  'footer.loading': 'Loading settings…',
  'usage.last': 'This call {total} tokens (in {in} · out {out}) · ≈ {cost}',
  'usage.session': 'Session total {total} tokens · ≈ {cost}',
  'cost.unknown': 'price unknown',
  'settings.title': 'Settings',
  'settings.key.label': 'Gemini API key',
  'settings.key.saved': ' · saved; leave blank to keep',
  'settings.key.placeholderSaved': '••••••••(saved)',
  'settings.key.placeholderEmpty': 'Paste your key',
  'settings.test': 'Test key',
  'settings.testing': 'Testing…',
  'settings.testOk': 'Key works ✓',
  'settings.getKey': 'Get a key ↗',
  'settings.encWarn':
    "⚠ This system can't use OS encryption; the key is stored in plaintext (common on Linux without a keyring).",
  'settings.model': 'Model',
  'settings.ocrLangs': 'OCR languages (e.g. eng, eng+chi_tra)',
  'settings.explainLang': 'Explanation language',
  'settings.interval': 'Continuous-monitor interval (ms)',
  'settings.uiLang': 'Interface language',
  'settings.uiLang.auto': 'Auto (system)',
  'settings.saved': 'Saved ✓',
  'settings.close': 'Close',
  'settings.save': 'Save',
  'settings.saving': 'Saving…',
  'overlay.hint': 'Drag to select the region to explain · Esc to cancel'
}

const zhTW: Dict = {
  'app.subtitle': '框選螢幕 → 本地 OCR → Gemini 第一性原理解說',
  'status.idle': '待命',
  'status.capturing': '擷取畫面中…',
  'status.ocr': '辨識文字中…',
  'status.thinking': '送往 Gemini…',
  'status.streaming': '解說中…',
  'status.error': '發生錯誤',
  'banner.noKey': '尚未設定 Gemini 金鑰 —— 填入你自己的金鑰即可開始。',
  'banner.mac': 'macOS 尚未授權螢幕錄製,無法擷取畫面。授權後請重新啟動 App。',
  'action.openSettings': '開啟設定',
  'action.openScreenPrefs': '開啟系統設定',
  'btn.selectRegion': '選取區域',
  'toggle.monitor': '持續監看',
  'toggle.interval': '每 {ms} ms',
  'region.info': '區域 {w} × {h} @ ({x}, {y})',
  'explanation.placeholder': '框出畫面上要解說的部分,解說會即時串流到這裡。',
  'ocr.summary': 'OCR 擷取到的文字',
  'footer.config': '模型 {model} · OCR {langs}',
  'footer.loading': '載入設定中…',
  'usage.last': '本次 {total} tokens(輸入 {in} · 輸出 {out})· ≈ {cost}',
  'usage.session': '本階段累計 {total} tokens · ≈ {cost}',
  'cost.unknown': '定價未知',
  'settings.title': '設定',
  'settings.key.label': 'Gemini API 金鑰',
  'settings.key.saved': ' · 已設定,留空表示不變更',
  'settings.key.placeholderSaved': '••••••••(已儲存)',
  'settings.key.placeholderEmpty': '貼上你的金鑰',
  'settings.test': '測試金鑰',
  'settings.testing': '測試中…',
  'settings.testOk': '金鑰可用 ✓',
  'settings.getKey': '取得金鑰 ↗',
  'settings.encWarn': '⚠ 此系統無法使用作業系統加密,金鑰將以明文存放(常見於沒有 keyring 的 Linux)。',
  'settings.model': '模型',
  'settings.ocrLangs': 'OCR 語言(如 eng、eng+chi_tra)',
  'settings.explainLang': '解說語言',
  'settings.interval': '持續監看間隔(毫秒)',
  'settings.uiLang': '介面語言',
  'settings.uiLang.auto': '自動(跟隨系統)',
  'settings.saved': '已儲存 ✓',
  'settings.close': '關閉',
  'settings.save': '儲存',
  'settings.saving': '儲存中…',
  'overlay.hint': '拖曳框選要解說的區域 · Esc 取消'
}

const ja: Dict = {
  'app.subtitle': '画面を枠で囲む → ローカル OCR → Gemini の第一原理からの解説',
  'status.idle': '待機中',
  'status.capturing': 'キャプチャ中…',
  'status.ocr': 'テキスト認識中…',
  'status.thinking': 'Gemini へ送信中…',
  'status.streaming': '解説中…',
  'status.error': 'エラー',
  'banner.noKey': 'Gemini API キーが未設定です —— 自分のキーを入力すると使えます。',
  'banner.mac': 'macOS で画面収録が許可されていないため、キャプチャできません。許可後に再起動してください。',
  'action.openSettings': '設定を開く',
  'action.openScreenPrefs': 'システム設定を開く',
  'btn.selectRegion': '領域を選択',
  'toggle.monitor': '継続モニター',
  'toggle.interval': '{ms} ms ごと',
  'region.info': '領域 {w} × {h} @ ({x}, {y})',
  'explanation.placeholder':
    '解説してほしい画面の部分を枠で囲むと、ここにリアルタイムで解説が流れます。',
  'ocr.summary': 'OCR で取得したテキスト',
  'footer.config': 'モデル {model} · OCR {langs}',
  'footer.loading': '設定を読み込み中…',
  'usage.last': '今回 {total} トークン(入力 {in} · 出力 {out})· ≈ {cost}',
  'usage.session': 'セッション累計 {total} トークン · ≈ {cost}',
  'cost.unknown': '価格不明',
  'settings.title': '設定',
  'settings.key.label': 'Gemini API キー',
  'settings.key.saved': ' · 設定済み。空欄なら変更しません',
  'settings.key.placeholderSaved': '••••••••(保存済み)',
  'settings.key.placeholderEmpty': 'キーを貼り付け',
  'settings.test': 'キーをテスト',
  'settings.testing': 'テスト中…',
  'settings.testOk': 'キーは有効です ✓',
  'settings.getKey': 'キーを取得 ↗',
  'settings.encWarn':
    '⚠ このシステムは OS の暗号化を利用できないため、キーは平文で保存されます(keyring のない Linux で多い)。',
  'settings.model': 'モデル',
  'settings.ocrLangs': 'OCR 言語(例:eng、eng+chi_tra)',
  'settings.explainLang': '解説言語',
  'settings.interval': '継続モニターの間隔(ミリ秒)',
  'settings.uiLang': '表示言語',
  'settings.uiLang.auto': '自動(システムに従う)',
  'settings.saved': '保存しました ✓',
  'settings.close': '閉じる',
  'settings.save': '保存',
  'settings.saving': '保存中…',
  'overlay.hint': '解説したい領域をドラッグで選択 · Esc でキャンセル'
}

const ko: Dict = {
  'app.subtitle': '화면 영역 선택 → 로컬 OCR → Gemini의 제1원리 설명',
  'status.idle': '대기',
  'status.capturing': '캡처 중…',
  'status.ocr': '텍스트 인식 중…',
  'status.thinking': 'Gemini로 전송 중…',
  'status.streaming': '설명 중…',
  'status.error': '오류',
  'banner.noKey': 'Gemini API 키가 아직 없습니다 —— 본인 키를 입력하면 시작할 수 있습니다.',
  'banner.mac': 'macOS에서 화면 기록이 허용되지 않아 캡처할 수 없습니다. 허용 후 앱을 재시작하세요.',
  'action.openSettings': '설정 열기',
  'action.openScreenPrefs': '시스템 설정 열기',
  'btn.selectRegion': '영역 선택',
  'toggle.monitor': '연속 모니터',
  'toggle.interval': '{ms} ms 마다',
  'region.info': '영역 {w} × {h} @ ({x}, {y})',
  'explanation.placeholder':
    '설명을 원하는 화면 영역을 박스로 감싸면 여기에 실시간으로 설명이 표시됩니다.',
  'ocr.summary': 'OCR로 추출한 텍스트',
  'footer.config': '모델 {model} · OCR {langs}',
  'footer.loading': '설정 불러오는 중…',
  'usage.last': '이번 {total} 토큰(입력 {in} · 출력 {out})· ≈ {cost}',
  'usage.session': '세션 누적 {total} 토큰 · ≈ {cost}',
  'cost.unknown': '가격 미상',
  'settings.title': '설정',
  'settings.key.label': 'Gemini API 키',
  'settings.key.saved': ' · 설정됨. 비워두면 변경하지 않음',
  'settings.key.placeholderSaved': '••••••••(저장됨)',
  'settings.key.placeholderEmpty': '키 붙여넣기',
  'settings.test': '키 테스트',
  'settings.testing': '테스트 중…',
  'settings.testOk': '키 사용 가능 ✓',
  'settings.getKey': '키 받기 ↗',
  'settings.encWarn':
    '⚠ 이 시스템은 OS 암호화를 사용할 수 없어 키가 평문으로 저장됩니다(keyring 없는 Linux에서 흔함).',
  'settings.model': '모델',
  'settings.ocrLangs': 'OCR 언어(예: eng, eng+chi_tra)',
  'settings.explainLang': '설명 언어',
  'settings.interval': '연속 모니터 간격(밀리초)',
  'settings.uiLang': '인터페이스 언어',
  'settings.uiLang.auto': '자동(시스템 따름)',
  'settings.saved': '저장됨 ✓',
  'settings.close': '닫기',
  'settings.save': '저장',
  'settings.saving': '저장 중…',
  'overlay.hint': '설명할 영역을 드래그하여 선택 · Esc로 취소'
}

const DICTS: Record<Locale, Dict> = { en, 'zh-TW': zhTW, ja, ko }

const STORAGE_KEY = 'uiLocale'

// Human-language name to ask the LLM to respond in, per UI locale.
const LANG_NAME: Record<Locale, string> = {
  en: 'English',
  'zh-TW': 'Traditional Chinese',
  ja: 'Japanese',
  ko: 'Korean'
}

export function localeToLangName(locale: Locale): string {
  return LANG_NAME[locale] ?? 'English'
}

/** Map any BCP-47 language tag to one of our supported locales. */
export function matchLocale(lang: string): Locale {
  const l = (lang || '').toLowerCase()
  if (l.startsWith('zh')) return 'zh-TW'
  if (l.startsWith('ja')) return 'ja'
  if (l.startsWith('ko')) return 'ko'
  return 'en'
}

/** Saved manual preference, or 'auto' when following the system. */
export function getLocalePreference(): Locale | 'auto' {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved in DICTS) return saved as Locale
  } catch {
    // ignore
  }
  return 'auto'
}

export function setLocalePreference(pref: Locale | 'auto'): void {
  try {
    if (pref === 'auto') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, pref)
  } catch {
    // ignore
  }
}

/** The locale actually in effect (manual preference, else system). */
export function detectLocale(): Locale {
  const pref = getLocalePreference()
  if (pref !== 'auto') return pref
  return matchLocale(navigator.language)
}

export type TFunc = (key: string, params?: Record<string, string | number>) => string

export function createT(locale: Locale): TFunc {
  const dict = DICTS[locale] ?? en
  return (key, params) => {
    let s = dict[key] ?? en[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        s = s.replace(`{${k}}`, String(v))
      }
    }
    return s
  }
}
