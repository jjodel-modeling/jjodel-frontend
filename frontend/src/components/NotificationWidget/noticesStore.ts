/**
 * Data and state of notices and tips (R-NT-1..3): no React, so every reader shares one fetch per
 * page load and the rules can run under vitest.
 */
import { JjodelEvents } from '../../events/registry';

export interface NotificationPost {
  id: string;
  category: 'system-notice' | 'tip';
  title?: string;
  message: string;
  priority?: 'warning' | 'info' | 'success' | 'error';
}

export interface TipsPrefs {
  showTips: boolean;
}

// The host depends on the Cloudflare account's workers.dev subdomain and must change with it (the AI proxy in types/jodie.ts lives on the same subdomain).
const API_URL = 'https://jjodel-notifications.alfonso99.workers.dev';

const TIPS_STATE_KEY = 'jjodel-quick-tips-state';
const DISMISSED_KEY = 'jjodel-dismissed-notifications';
const TIPS_PREFS_KEY = 'jjodel-tips-prefs';
const TIP_SESSION_KEY = 'jjodel-tips-session';

let postsPromise: Promise<NotificationPost[]> | null = null;
// Holds the session limit within this page load when sessionStorage refuses the write.
let automaticTipTaken = false;

async function requestPosts(): Promise<NotificationPost[]> {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data?.posts) ? data.posts : [];
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
    return [];
  }
}

/** The payload of this page load. Every reader gets the same promise; a failure is an empty list. */
export function fetchPosts(): Promise<NotificationPost[]> {
  if (!postsPromise) postsPromise = requestPosts();
  return postsPromise;
}

function readJson(storage: Storage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeRaw(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage full or disabled: silent noop
  }
}

// The stored object also holds pauseUntil, written by earlier versions: ignored here, kept as found.
function loadTipsState(): Record<string, unknown> & { seen: Record<string, number> } {
  const parsed = readJson(localStorage, TIPS_STATE_KEY) as { seen?: unknown } | null;
  const seen = parsed?.seen && typeof parsed.seen === 'object' ? parsed.seen as Record<string, number> : {};
  return { ...parsed, seen };
}

/** A tip stays seen forever (R-NT-1): an entry of any age counts. */
export function markTipSeen(id: string): void {
  const state = loadTipsState();
  state.seen[id] = Date.now();
  writeRaw(localStorage, TIPS_STATE_KEY, JSON.stringify(state));
}

export function unseenTips(posts: NotificationPost[]): NotificationPost[] {
  const { seen } = loadTipsState();
  return posts.filter(p => p.category === 'tip' && seen[p.id] === undefined);
}

export function loadTipsPrefs(): TipsPrefs {
  const parsed = readJson(localStorage, TIPS_PREFS_KEY) as Partial<TipsPrefs> | null;
  return { showTips: typeof parsed?.showTips === 'boolean' ? parsed.showTips : true };
}

export function saveTipsPrefs(prefs: TipsPrefs): void {
  writeRaw(localStorage, TIPS_PREFS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent(JjodelEvents.TIPS_PREFS_CHANGED));
}

/** The tip to show on demand, marked seen because the caller displays it; null when none is left. */
export function nextTip(posts: NotificationPost[]): NotificationPost | null {
  const tip = unseenTips(posts)[0] ?? null;
  if (tip) markTipSeen(tip.id);
  return tip;
}

function isAutomaticTipTaken(): boolean {
  if (automaticTipTaken) return true;
  try {
    return sessionStorage.getItem(TIP_SESSION_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * The tip to show unasked, at most one per browser session (R-NT-2). Call it only when the card is
 * about to be displayed: a null spends neither the session slot nor a tip.
 */
export function claimAutomaticTip(posts: NotificationPost[]): NotificationPost | null {
  if (!loadTipsPrefs().showTips || isAutomaticTipTaken()) return null;
  const tip = nextTip(posts);
  if (!tip) return null;
  automaticTipTaken = true;
  writeRaw(sessionStorage, TIP_SESSION_KEY, '1');
  return tip;
}

function loadDismissed(): string[] {
  const parsed = readJson(localStorage, DISMISSED_KEY);
  return Array.isArray(parsed) ? parsed : [];
}

export function dismissNotice(id: string): void {
  writeRaw(localStorage, DISMISSED_KEY, JSON.stringify([...loadDismissed(), id]));
}

/** The first undismissed system notice: one banner at a time (R-NT-4). */
export function currentNotice(posts: NotificationPost[]): NotificationPost | null {
  const dismissed = loadDismissed();
  return posts.find(p => p.category === 'system-notice' && !dismissed.includes(p.id)) ?? null;
}
