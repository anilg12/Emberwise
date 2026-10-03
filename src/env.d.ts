/// <reference types="svelte" />
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface EmberAppInfo {
  version: string;
  platform: string;
  arch: string;
  electron: string;
  locale: string;
  packaged: boolean;
  dataPath: string;
}

interface EmberBridge {
  platform: string;
  load(): Promise<string | null>;
  save(text: string): Promise<boolean>;
  saveSync(text: string): boolean;
  info(): Promise<EmberAppInfo>;
  readSound(name: string): Promise<Uint8Array | null>;
  notify(payload: { title: string; body: string; silent?: boolean; route?: string }): void;
  setTheme(payload: { mode: string; dark: boolean; bg?: string; symbol?: string }): void;
  setProgress(value: number): void;
  updateTray(payload: {
    title?: string;
    running?: boolean;
    labels?: { show?: string; toggle?: string; quit?: string; hidden?: string };
  }): void;
  pin(on: boolean): void;
  focusWindow(): void;
  setCloseToTray(on: boolean): void;
  setOpenAtLogin(on: boolean): void;
  getOpenAtLogin(): Promise<boolean>;
  exportData(payload: { text: string; fileName: string; title: string }): Promise<{ ok: boolean; canceled?: boolean; path?: string; error?: string }>;
  importData(payload: { title: string }): Promise<{ ok: boolean; canceled?: boolean; text?: string; error?: string }>;
  openExternal(url: string): void;
  onTrayAction(cb: (action: string) => void): () => void;
  onNavigate(cb: (route: string) => void): () => void;
  onResume(cb: () => void): () => void;
}

interface Window {
  ember?: EmberBridge;
  webkitAudioContext?: typeof AudioContext;
}
