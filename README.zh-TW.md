# FirstPrincipleViewer

[English](README.md) · **繁體中文** · [日本語](README.ja.md) · [한국어](README.ko.md)

**框選螢幕上任一區域 → 本機 OCR 抽出文字 → Gemini 即時串流「第一性原理」解說。**

一個輕量的跨平台桌面工具(Windows / macOS / Linux)。採 **BYOK(Bring Your Own Key,自帶金鑰)**:使用你自己的 Google Gemini API 金鑰,在 App 內輸入,並加密存放在你的電腦上。

> 🔒 **隱私與成本的設計初衷:** 截圖永遠不離開你的電腦。只有 OCR 出來的「文字」會送給 LLM,而且只用便宜的文字模型 —— 不用昂貴的視覺 API。

---

## 為什麼做這個工具

AI agent 的速度越來越快,工程資訊量也在爆炸 —— 快到人類光是「讀」都跟不上,更別說吸收。我們越來越難即時掌握眼前所有的資訊。

FirstPrincipleViewer 就是那條捷徑:不用停下來思考,直接框選你想搞懂的區域。它會讀出裡面的文字,並**即時**把它轉化成一份「**從第一性原理出發**」的摘要 —— 讓你抓到「為什麼」,而不只是滑過「是什麼」。

## 運作方式

```
框選區域  →  擷取畫面  →  本機 OCR(Tesseract)  →  文字  →  Gemini(文字模型)  →  串流解說
```

「**持續監看**」模式會依間隔重新擷取該區域,只有在辨識出的文字實際改變時才會再次呼叫 LLM。

## 開始使用

### 方式 A — 下載安裝檔
到 [Releases 頁面](https://github.com/andy002842000/FirstPrincipleViewer/releases) 下載你作業系統對應的最新安裝檔。

- **Windows:** `.exe`(NSIS 安裝程式)
- **macOS:** `.dmg` —— 目前**未經簽章**,首次開啟請**右鍵 → 開啟**,或執行 `xattr -dr com.apple.quarantine /Applications/FirstPrincipleViewer.app`。
- **Linux:** `.AppImage` —— `chmod +x` 後執行。

### 方式 B — 從原始碼執行

```bash
git clone https://github.com/andy002842000/FirstPrincipleViewer.git
cd FirstPrincipleViewer
npm install
npm run dev
```

## 自帶金鑰(BYOK)

1. 到 <https://aistudio.google.com/apikey> 免費申請 Gemini API 金鑰。
2. 啟動 App → 點 **⚙(設定)** → 貼上金鑰 → **測試** → **儲存**。
3. 金鑰會透過作業系統的金鑰庫(Windows DPAPI / macOS Keychain / Linux secret service)加密保存,之後不會再顯示,也不會送往 Google API 以外的任何地方。

> 開發時你也可以把 `GEMINI_API_KEY` 放進本機的 `.env`(參考 `.env.example`);App 內儲存的金鑰一律優先。

## 使用方式

1. 按 **Ctrl / ⌘ + Shift + E**(或點面板上的「選取區域」)。
2. 在任一螢幕上,拖框住你想被解說的文字。
3. 辨識到的文字與串流的第一性原理解說會出現在面板上。
4. 開啟「持續監看」,讓它隨著區域內容變化持續更新。

## 設定

| 設定項 | 說明 | 預設 |
| --- | --- | --- |
| API 金鑰 | 你的 Gemini 金鑰(加密保存) | — |
| 模型 | Gemini 文字模型 | `gemini-3.1-flash-lite` |
| OCR 語言 | Tesseract 語言(預設依系統語言) | 如 `eng+chi_tra` |
| 介面語言 | 介面**與回應**語言 | 自動(跟隨系統) |
| 監看間隔 | 重新擷取的間隔(毫秒) | `1500` |

## 成本(公開透明)

唯一會花錢的步驟是 **Gemini 文字 API 呼叫**。擷取畫面、OCR(Tesseract.js)與變化偵測全都在**本機執行、免費** —— 而且**截圖永遠不會上傳**,只有 OCR 出來的文字會。

每一次「框選 → 解說」的計費為 `輸入 tokens + 輸出 tokens`:

- **輸入** = 系統指令(~120 tokens)+ 提示包裝(~30)+ 你擷取到的文字
- **輸出** = 串流的解說內容(通常佔比較大)

預設模型 **`gemini-3.1-flash-lite`** —— 定價為 2026-05 的付費級距(請務必到 <https://ai.google.dev/pricing> 確認):

- 輸入:**$0.25 / 百萬 tokens**
- 輸出:**$1.50 / 百萬 tokens**
- 有**免費額度**(有流量限制) —— 個人輕量使用通常實際上是 $0。

### 每次框選的粗估成本

| 區域 | 輸入 tokens | 輸出 tokens | 每次成本 |
| --- | --- | --- | --- |
| 小(一句話 / 一個標籤) | ~230 | ~400 | ~$0.0007 |
| 中(一段文字 / 程式碼) | ~600 | ~800 | ~$0.0014 |
| 大(一整段) | ~1,650 | ~1,200 | ~$0.0022 |

大約是**每次 $0.0007–$0.002** —— 約等於 **每 1 美金可框 500–1,500 次**。(token 數為估計值;CJK 文字的 tokenization 不同。)

「**持續監看**」模式只有在 OCR 文字實際**改變**時才呼叫 API —— 監看靜態畫面時只會持續做本機 OCR,不會產生新的付費呼叫。

### 如何降低成本

- 在設定裡改用更便宜的模型,例如 `gemini-2.5-flash-lite`(每百萬 $0.10 輸入 / $0.40 輸出)。
- 讓解說保持簡短 —— 輸出 tokens 是成本大頭。
- 輕量使用就待在免費額度內。

## 打包安裝檔

```bash
npm run package:win     # 或 package:mac / package:linux
```

打上版本 tag 時,CI 會自動建置三平台(見 `.github/workflows`)。

## 技術堆疊

Electron · TypeScript · React · Vite(electron-vite)· Tesseract.js(本機 OCR)· @google/genai

## 平台須知

- **macOS:** App 需要**螢幕錄製**權限(系統設定 → 隱私權與安全性 → 螢幕錄製)。App 會提示/引導你;授權後請重新啟動。
- **Linux:** 若沒有可用的 keyring / secret service,金鑰會退回明文存放 —— 設定視窗會在發生時警告你。螢幕擷取在 X11 下最穩;Wayland 需要 PipeWire。
- **多螢幕:** 支援 —— 每個螢幕都有自己的框選層。單一次框選需落在同一個螢幕內。

## 參與貢獻

歡迎開 issue 與 PR。送出 PR 前請先:

```bash
npm run typecheck
npm run build
```

## 授權

[MIT](LICENSE) © andy002842000
