import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import {
  Channels,
  type Rect,
  type RegionSelection,
  type AnalyzePayload,
  type AnalyzeResult,
  type AppConfig,
  type SettingsPayload,
  type TestKeyResult
} from '../shared/ipc'

function sub(
  channel: string,
  listener: (event: IpcRendererEvent, ...args: any[]) => void
): () => void {
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api = {
  // Panel -> main: ask main to show the region-selection overlay.
  startRegionSelect: (): void => ipcRenderer.send(Channels.regionStart),

  // Overlay -> main: a region was drawn / selection cancelled.
  submitRegion: (rect: Rect): void => ipcRenderer.send(Channels.regionSelected, rect),
  cancelRegion: (): void => ipcRenderer.send(Channels.regionCancel),

  // Panel <-> main.
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke(Channels.configGet),
  saveSettings: (payload: SettingsPayload): Promise<AppConfig> =>
    ipcRenderer.invoke(Channels.settingsSave, payload),
  testKey: (payload: SettingsPayload): Promise<TestKeyResult> =>
    ipcRenderer.invoke(Channels.settingsTest, payload),
  openScreenPrefs: (): void => ipcRenderer.send(Channels.openScreenPrefs),
  openExternal: (url: string): void => ipcRenderer.send(Channels.openExternal, url),
  analyze: (payload: AnalyzePayload): Promise<AnalyzeResult> =>
    ipcRenderer.invoke(Channels.analyze, payload),
  resetText: (): void => ipcRenderer.send(Channels.resetText),

  // Main -> panel events.
  onRegionSet: (cb: (selection: RegionSelection) => void): (() => void) =>
    sub(Channels.regionSet, (_e, selection: RegionSelection) => cb(selection)),
  onExplainStart: (cb: () => void): (() => void) => sub(Channels.explainStart, () => cb()),
  onExplainChunk: (cb: (text: string) => void): (() => void) =>
    sub(Channels.explainChunk, (_e, text: string) => cb(text)),
  onExplainDone: (cb: () => void): (() => void) => sub(Channels.explainDone, () => cb()),
  onExplainError: (cb: (message: string) => void): (() => void) =>
    sub(Channels.explainError, (_e, message: string) => cb(message))
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
