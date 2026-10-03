export type Lang = 'tr' | 'en';
export type ThemeMode = 'light' | 'dark' | 'system';
export type Accent = 'ember' | 'rose' | 'ocean' | 'forest' | 'plum' | 'honey';
export type MotionPref = 'system' | 'full' | 'reduced';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'epic';
export type Repeat = 'none' | 'daily' | 'weekdays' | 'custom';
export type HeroClass = 'wizard' | 'knight' | 'ranger' | 'bard';
export type Body = 'f' | 'm';
export type AmbientKind = 'off' | 'rain' | 'fire' | 'waves' | 'wind' | 'brown';
export type Route = 'today' | 'quests' | 'focus' | 'hero' | 'shop' | 'awards' | 'stats' | 'settings';

export interface Look {
  body: Body;
  skin: number;
  hair: number;
  hairColor: number;
  heroClass: HeroClass;
}

export interface Profile {
  name: string;
  look: Look;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  purpose: string;
  difficulty: Difficulty;
  categoryId: string | null;
  /** Due day for one-off tasks; start day for repeating tasks. */
  date: string | null;
  /** Reminder time of day, HH:MM. */
  time: string | null;
  repeat: Repeat;
  /** Weekdays (0 = Sunday) for `custom` repeat. */
  repeatDays: number[];
  done: boolean;
  doneAt: string | null;
  /** Day keys a repeating task was completed on (trimmed to recent history). */
  doneDays: string[];
  /** The day key the reminder last fired for. */
  remindedKey: string | null;
  subtasks: Subtask[];
  /** Day the subtask checkmarks belong to (repeating tasks reset daily). */
  subtasksDay: string | null;
  createdAt: string;
  focusMinutes: number;
}

export interface Category {
  id: string;
  /** Built-in categories are translated through this key until renamed. */
  key?: string;
  name: string;
  color: string;
}

export type LogKind =
  | 'task'
  | 'subtask'
  | 'focus'
  | 'quest'
  | 'chest'
  | 'achievement'
  | 'streak'
  | 'purchase';

export interface LogEntry {
  id: string;
  t: string;
  kind: LogKind;
  xp: number;
  gold: number;
  ref: string;
  label?: string;
  /** Small facts used by daily quests and achievements. */
  meta?: {
    d?: Difficulty;
    p?: 1; // had a purpose
    r?: 1; // repeating task
    c?: string | null; // category id
    m?: number; // minutes (focus)
    full?: 1; // focus session completed in full
  };
}

export interface FocusSession {
  id: string;
  start: string;
  end: string;
  minutes: number;
  completed: boolean;
  taskId: string | null;
}

export interface Settings {
  lang: Lang;
  theme: ThemeMode;
  accent: Accent;
  motion: MotionPref;
  sounds: boolean;
  volume: number;
  notifications: boolean;
  focusMin: number;
  shortMin: number;
  longMin: number;
  longEvery: number;
  autoBreak: boolean;
  autoFocus: boolean;
  ambient: AmbientKind;
  ambientVolume: number;
  closeToTray: boolean;
  openAtLogin: boolean;
  pinWhileFocus: boolean;
}

export interface PersistedTimer {
  phase: 'focus' | 'short' | 'long';
  status: 'idle' | 'running' | 'paused';
  endsAt: number | null;
  remainingMs: number;
  totalMs: number;
  startedAt: number | null;
  cycle: number;
  taskId: string | null;
}

export interface Equipped {
  hat: string | null;
  pet: string | null;
  bg: string | null;
}

export interface Data {
  version: 1;
  createdAt: string;
  onboarded: boolean;
  profile: Profile;
  settings: Settings;
  tasks: Task[];
  categories: Category[];
  log: LogEntry[];
  sessions: FocusSession[];
  owned: string[];
  equipped: Equipped;
  shields: number;
  achievements: Record<string, string>;
  claimed: Record<string, string[]>;
  streak: { current: number; best: number; lastDay: string | null };
  counters: { tasksCreated: number; remindersSet: number; purchases: number };
  timer: PersistedTimer | null;
}
