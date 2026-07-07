/**
 * Provider-agnostic logger. Swap the `sinks` array to plug in Sentry/PostHog later
 * without touching call sites.
 *
 * In production we also keep a bounded ring buffer in localStorage so admins can
 * paste recent logs when reporting an issue over WhatsApp on a low-bandwidth line.
 */

type Level = 'info' | 'warn' | 'error';

interface Entry {
  t: string;
  level: Level;
  msg: string;
  ctx?: Record<string, unknown>;
}

const BUFFER_KEY = 'salem-logs';
const BUFFER_MAX = 50;
const isProd = import.meta.env.PROD;

function pushBuffer(entry: Entry) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(BUFFER_KEY);
    const list: Entry[] = raw ? JSON.parse(raw) : [];
    list.push(entry);
    while (list.length > BUFFER_MAX) list.shift();
    window.localStorage.setItem(BUFFER_KEY, JSON.stringify(list));
  } catch {
    /* localStorage full / disabled — safe to ignore */
  }
}

function emit(level: Level, msg: string, ctx?: Record<string, unknown>) {
  const entry: Entry = { t: new Date().toISOString(), level, msg, ctx };
  // Always mirror to console — cheap and useful in every environment.
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  fn(`[${level}] ${msg}`, ctx ?? '');
  if (isProd) pushBuffer(entry);
}

export const logger = {
  info: (msg: string, ctx?: Record<string, unknown>) => emit('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit('error', msg, ctx),
  /** Retrieve the in-browser log buffer (for the "Copy logs" admin action). */
  dump: (): Entry[] => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(window.localStorage.getItem(BUFFER_KEY) || '[]');
    } catch {
      return [];
    }
  },
  clear: () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(BUFFER_KEY);
  },
};
