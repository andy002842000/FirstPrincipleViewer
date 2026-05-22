import type { Rect } from '../../shared/ipc'

const selection = document.getElementById('selection') as HTMLDivElement
const sizeLabel = document.getElementById('size') as HTMLSpanElement

let startX = 0
let startY = 0
let dragging = false

function setBox(x: number, y: number, w: number, h: number): void {
  selection.style.left = `${x}px`
  selection.style.top = `${y}px`
  selection.style.width = `${w}px`
  selection.style.height = `${h}px`
  sizeLabel.textContent = `${Math.round(w)} × ${Math.round(h)}`
}

window.addEventListener('mousedown', (e) => {
  dragging = true
  startX = e.clientX
  startY = e.clientY
  selection.style.display = 'block'
  setBox(startX, startY, 0, 0)
})

window.addEventListener('mousemove', (e) => {
  if (!dragging) return
  const x = Math.min(startX, e.clientX)
  const y = Math.min(startY, e.clientY)
  setBox(x, y, Math.abs(e.clientX - startX), Math.abs(e.clientY - startY))
})

window.addEventListener('mouseup', (e) => {
  if (!dragging) return
  dragging = false
  selection.style.display = 'none'

  const x = Math.min(startX, e.clientX)
  const y = Math.min(startY, e.clientY)
  const width = Math.abs(e.clientX - startX)
  const height = Math.abs(e.clientY - startY)

  if (width < 8 || height < 8) {
    window.api.cancelRegion()
    return
  }
  const rect: Rect = { x, y, width, height }
  window.api.submitRegion(rect)
})

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.api.cancelRegion()
  }
})
