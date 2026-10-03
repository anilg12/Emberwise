// A thin wrapper around the Electron bridge with browser fallbacks,
// so the UI also runs in a plain browser during development.

const bridge = typeof window !== 'undefined' ? window.ember : undefined;
const LS_KEY = 'emberwise-data';

export const isElectron = !!bridge;
export const platform: 'win' | 'mac' | 'linux' | 'web' = !bridge
  ? 'web'
  : bridge.platform === 'darwin'
    ? 'mac'
    : bridge.platform === 'win32'
      ? 'win'
      : 'linux';

export const modKey = platform === 'mac' ? '⌘' : 'Ctrl';

export async function loadText(): Promise<string | null> {
  if (bridge) return bridge.load();
  try {
    return localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}

export async function saveText(text: string): Promise<boolean> {
  if (bridge) return bridge.save(text);
  try {
    localStorage.setItem(LS_KEY, text);
    return true;
  } catch {
    return false;
  }
}

export function saveTextSync(text: string): void {
  if (bridge) {
    bridge.saveSync(text);
    return;
  }
  try {
    localStorage.setItem(LS_KEY, text);
  } catch {
    /* ignore */
  }
}

export async function appInfo(): Promise<EmberAppInfo> {
  if (bridge) return bridge.info();
  return {
    version: __APP_VERSION__,
    platform: 'web',
    arch: '',
    electron: '',
    locale: navigator.language,
    packaged: false,
    dataPath: 'localStorage',
  };
}

/** Raw bytes of a bundled ambience loop (public/ambience/<name>.ogg). */
export async function readSound(name: string): Promise<ArrayBuffer | null> {
  if (bridge && location.protocol === 'file:') {
    const bytes = await bridge.readSound(name);
    return bytes ? (bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer) : null;
  }
  try {
    const r = await fetch(`ambience/${name}.ogg`);
    return r.ok ? await r.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export function notify(title: string, body: string, route?: string) {
  if (bridge) {
    bridge.notify({ title, body, route, silent: true });
    return;
  }
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') new Notification(title, { body });
    else if (Notification.permission !== 'denied')
      Notification.requestPermission().then((p) => {
        if (p === 'granted') new Notification(title, { body });
      });
  } catch {
    /* ignore */
  }
}

export function setNativeTheme(mode: string, dark: boolean, bg?: string, symbol?: string) {
  bridge?.setTheme({ mode, dark, bg, symbol });
}

let lastProgress = -2;
export function setProgress(v: number) {
  const rounded = v < 0 ? -1 : Math.round(v * 200) / 200;
  if (rounded === lastProgress) return;
  lastProgress = rounded;
  bridge?.setProgress(rounded);
}

let lastTray = '';
export function updateTray(payload: Parameters<EmberBridge['updateTray']>[0]) {
  const key = JSON.stringify(payload);
  if (key === lastTray) return;
  lastTray = key;
  bridge?.updateTray(payload);
}

let lastPin: boolean | null = null;
export function pinWindow(on: boolean) {
  if (on === lastPin) return;
  lastPin = on;
  bridge?.pin(on);
}
export const focusWindow = () => bridge?.focusWindow();
export const setCloseToTray = (on: boolean) => bridge?.setCloseToTray(on);
export const setOpenAtLogin = (on: boolean) => bridge?.setOpenAtLogin(on);
export const getOpenAtLogin = async () => (bridge ? bridge.getOpenAtLogin() : false);

export async function exportFile(text: string, fileName: string, title: string) {
  if (bridge) return bridge.exportData({ text, fileName, title });
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return { ok: true };
}

export async function importFile(title: string): Promise<{ ok: boolean; text?: string; canceled?: boolean }> {
  if (bridge) return bridge.importData({ title });
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return resolve({ ok: false, canceled: true });
      resolve({ ok: true, text: await f.text() });
    };
    input.click();
  });
}

export function openExternal(url: string) {
  if (bridge) bridge.openExternal(url);
  else window.open(url, '_blank', 'noopener');
}

export const onTrayAction = (cb: (a: string) => void) => bridge?.onTrayAction(cb) ?? (() => {});
export const onNavigate = (cb: (r: string) => void) => bridge?.onNavigate(cb) ?? (() => {});
export const onResume = (cb: () => void) => bridge?.onResume(cb) ?? (() => {});
