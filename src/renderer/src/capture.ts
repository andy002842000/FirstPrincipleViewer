import type { CaptureSource, Rect } from '../../shared/ipc'

let mediaStream: MediaStream | null = null
let video: HTMLVideoElement | null = null
let currentSourceId = ''

async function ensureStream(source: CaptureSource): Promise<HTMLVideoElement> {
  if (video && mediaStream && currentSourceId === source.sourceId) return video

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
    video = null
  }
  currentSourceId = source.sourceId

  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.sourceId,
        minWidth: source.width,
        maxWidth: source.width,
        minHeight: source.height,
        maxHeight: source.height
      }
    } as unknown as MediaTrackConstraints
  })

  const el = document.createElement('video')
  el.srcObject = mediaStream
  el.muted = true
  await el.play()
  if (el.videoWidth === 0) {
    await new Promise<void>((resolve) => {
      el.addEventListener('loadeddata', () => resolve(), { once: true })
    })
  }
  video = el
  return el
}

/**
 * Grab the current frame, crop the selected region, and return it as a PNG data
 * URL. OCR + LLM happen in the main process; the image only travels over local IPC.
 */
export async function captureRegionToDataUrl(rect: Rect, source: CaptureSource): Promise<string> {
  const el = await ensureStream(source)
  const sf = source.scaleFactor
  const sx = Math.max(0, Math.round(rect.x * sf))
  const sy = Math.max(0, Math.round(rect.y * sf))
  const sw = Math.max(1, Math.round(rect.width * sf))
  const sh = Math.max(1, Math.round(rect.height * sf))

  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not acquire 2D canvas context')
  ctx.drawImage(el, sx, sy, sw, sh, 0, 0, sw, sh)
  return canvas.toDataURL('image/png')
}

export function disposeCapture(): void {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
  video = null
  currentSourceId = ''
}
