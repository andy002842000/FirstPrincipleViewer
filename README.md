# FirstPrincipleViewer

**English** · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

**Frame any region of your screen → local OCR → a real-time, first-principles explanation streamed from Gemini.**
框選螢幕上任一區域 → 本地 OCR 抽出文字 → Gemini 即時串流「第一性原理」解說。

A small cross-platform desktop tool (Windows / macOS / Linux). It is **BYOK** — Bring Your Own Key: you use your own Google Gemini API key, entered in‑app and stored encrypted on your machine.

> 🔒 **Privacy & cost by design:** screenshots never leave your machine. Only the OCR'd *text* is sent to the LLM, and only a cheap text model is used — no expensive vision API.

---

## How it works

```
Select a region  →  capture frame  →  local OCR (Tesseract)  →  text  →  Gemini (text model)  →  streamed explanation
```

A **continuous-monitor** mode re-captures the region on an interval and only calls the LLM again when the recognized text actually changes.

## Get it running

### Option A — download a build
Grab the latest installer for your OS from the [Releases page](https://github.com/andy002842000/FirstPrincipleViewer/releases).

- **Windows:** `.exe` (NSIS installer)
- **macOS:** `.dmg` — the app is currently **unsigned**, so on first launch right‑click → *Open*, or run `xattr -dr com.apple.quarantine /Applications/FirstPrincipleViewer.app`.
- **Linux:** `.AppImage` — `chmod +x` then run.

### Option B — run from source

```bash
git clone https://github.com/andy002842000/FirstPrincipleViewer.git
cd FirstPrincipleViewer
npm install
npm run dev
```

## Bring Your Own Key (BYOK)

1. Get a **free** Gemini API key at <https://aistudio.google.com/apikey>.
2. Launch the app → click the **⚙ (Settings)** button → paste your key → **Test** → **Save**.
3. The key is stored encrypted via your OS keystore (Windows DPAPI / macOS Keychain / Linux secret service) and never shown again or sent anywhere except Google's API.

> For development you may instead put `GEMINI_API_KEY` in a local `.env` (see `.env.example`); a saved in‑app key always takes priority.

## Usage

1. Press **Ctrl / ⌘ + Shift + E** (or click **選取區域 / Select region**).
2. Drag a box over the text you want explained — on any monitor.
3. The recognized text and a streamed first‑principles explanation appear in the panel.
4. Toggle **持續監看 / Continuous monitor** to keep it updating as the region changes.

## Settings

| Setting | Meaning | Default |
| --- | --- | --- |
| API key | Your Gemini key (stored encrypted) | — |
| Model | Gemini text model | `gemini-3.1-flash-lite` |
| OCR languages | Tesseract langs, e.g. `eng`, `eng+chi_tra` | `eng+chi_tra` |
| Explanation language | Language the explanation is written in | `Traditional Chinese` |
| Monitor interval | Re-capture interval in ms | `1500` |

## Cost (transparent)

The only step that ever costs money is the **Gemini text API call**. Capturing the screen, OCR (Tesseract.js) and change-detection all run **locally and free** — and **screenshots are never uploaded**, only the OCR'd text is.

Each *frame → explain* call is billed as `input tokens + output tokens`:

- **input** = system instruction (~120 tokens) + prompt wrapper (~30) + your captured text
- **output** = the streamed explanation (usually the larger share)

Default model **`gemini-3.1-flash-lite`** — pricing as of 2026-05, paid tier (always verify at <https://ai.google.dev/pricing>):

- Input: **$0.25 / 1M tokens**
- Output: **$1.50 / 1M tokens**
- A **free tier** is available (rate-limited) — light personal use is often effectively $0.

### Rough cost per capture

| Region | Input tokens | Output tokens | Cost / capture |
| --- | --- | --- | --- |
| Small (a sentence / a label) | ~230 | ~400 | ~$0.0007 |
| Medium (a paragraph / code) | ~600 | ~800 | ~$0.0014 |
| Large (a full section) | ~1,650 | ~1,200 | ~$0.0022 |

So roughly **$0.0007–$0.002 per capture** — about **500–1,500 captures per US$1**. (Token counts are estimates; CJK text tokenizes differently.)

**Continuous monitor** mode only calls the API when the OCR'd text actually *changes* — watching a static region keeps doing local OCR but makes no new paid calls.

### Lowering the cost

- Pick a cheaper model in Settings, e.g. `gemini-2.5-flash-lite` ($0.10 in / $0.40 out per 1M).
- Keep explanations short — output tokens dominate the bill.
- Stay within the free tier for casual use.

## Build installers

```bash
npm run package:win     # or package:mac / package:linux
```

CI builds all three platforms automatically on tagged releases (see `.github/workflows`).

## Tech stack

Electron · TypeScript · React · Vite (electron-vite) · Tesseract.js (local OCR) · @google/genai

## Platform notes

- **macOS:** the app needs **Screen Recording** permission (System Settings → Privacy & Security → Screen Recording). The app will prompt/guide you; restart after granting.
- **Linux:** if no keyring/secret service is available, the key falls back to plaintext storage — the Settings dialog warns you when this happens. Screen capture works best under X11; Wayland needs PipeWire.
- **Multi-monitor:** supported — each display gets its own selection overlay. A single selection must stay within one display.

## Contributing

Issues and PRs welcome. Before opening a PR:

```bash
npm run typecheck
npm run build
```

## License

[MIT](LICENSE) © andy002842000
