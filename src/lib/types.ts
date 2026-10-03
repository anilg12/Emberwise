export type Lang = 'tr' | 'en';
export type ThemeMode = 'light' | 'dark' | 'system';
export type Accent = 'ember' | 'rose' | 'ocean' | 'forest' | 'plum' | 'honey';
export type MotionPref = 'system' | 'full' | 'reduced';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'epic';
export type Repeat = 'none' | 'daily' | 'weekdays' | 'custom';
export type HeroClass =
  | 'wizard'
  | 'knight'
  | 'ranger'
  | 'bard'
  | 'scientist'
  | 'chef'
  | 'gardener'
  | 'artist'
  | 'astronaut'
  | 'pirate'
  | 'ninja'
  | 'detective'
  | 'explorer'
  | 'coder'
  | 'guardian'
  | 'oracle'
  | 'frost'
  | 'timekeeper'
  | 'sovereign';
export type Body = 'f' | 'm';
export type AmbientKind =
  | 'rain'
  | 'storm'
  | 'waves'
  | 'wind'
  | 'forest'
  | 'stream'
  | 'night'
  | 'cafe'
  | 'library'
  | 'fire'
  | 'train'
  | 'brown'
  | 'pink';
/** Which ambience layers play together, each with its own level (0–1). Empty = silence. */
export type AmbientMix = Partial<Record<AmbientKind, number>>;
export type Route = 'today' | 'quests' | 'focus' | 'hero' | 'shop' | 'rewards' | 'awards' | 'stats' | 'settings';

export interface Look {
  body: Body;
  skin: number;
  hair: number;
  hairColor: number;
  heroClass: HeroClass;
  /** Outfit colour variant of the current character (0–3). */
  tone: number;
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
  | 'purchase'
  | 'login'
  | 'journal';

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
  ambient: AmbientMix;
  ambientVolume: number;
  /** Gentle lines of encouragement after actions. */
  motivation: boolean;
  /** Daily focus goal in minutes. */
  dailyGoal: number;
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
  acc: string | null;
}

export interface LoginState {
  /** Distinct days Emberwise was opened. */
  total: number;
  streak: number;
  best: number;
  lastDay: string | null;
  /** Recent login days (newest last), for the calendar and the weekly/monthly chests. */
  days: string[];
  /** Claimed rewards: gift:<day>, week:<monday>, month:<yyyy-mm>, path:<n>. */
  claimed: string[];
}

export interface JournalEntry {
  /** 1 (heavy) … 5 (glowing). */
  mood: number;
  note: string;
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
  counters: { tasksCreated: number; remindersSet: number; purchases: number; breaths: number };
  login: LoginState;
  journal: Record<string, JournalEntry>;
  /** Saved motivation lines (quote ids). */
  favorites: string[];
  timer: PersistedTimer | null;
}
