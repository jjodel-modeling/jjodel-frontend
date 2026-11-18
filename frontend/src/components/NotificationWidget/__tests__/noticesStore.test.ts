/**
 * The module-level promise and the per-load flag are the behaviour under test, so every test
 * imports a fresh copy of the store: a second import inside a test is a page reload (same
 * storage, new module state).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Store = typeof import('../noticesStore');
type Post = import('../noticesStore').NotificationPost;

const QUICK_TIPS_KEY = 'jjodel-quick-tips-state';
const DAY_MS = 24 * 60 * 60 * 1000;

function memoryStorage(): Storage {
    const data = new Map<string, string>();
    return {
        get length() { return data.size; },
        clear: () => data.clear(),
        getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
        key: (i: number) => [...data.keys()][i] ?? null,
        removeItem: (k: string) => { data.delete(k); },
        setItem: (k: string, v: string) => { data.set(k, String(v)); },
    };
}

const tip = (id: string): Post => ({ id, category: 'tip', message: `message ${id}` });
const notice = (id: string): Post => ({ id, category: 'system-notice', message: `notice ${id}` });
const SIX = ['a', 'b', 'c', 'd', 'e', 'f'].map(tip);

async function load(): Promise<Store> {
    vi.resetModules();
    return import('../noticesStore');
}

/** A new browser session: new module state, sessionStorage emptied, localStorage kept. */
async function newSession(): Promise<Store> {
    vi.stubGlobal('sessionStorage', memoryStorage());
    return load();
}

function respondWith(body: string, status = 200): ReturnType<typeof vi.fn> {
    const fetchMock = vi.fn(async () => new Response(body, { status }));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
    vi.stubGlobal('sessionStorage', memoryStorage());
    vi.stubGlobal('window', new EventTarget());
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('seen state (R-NT-1)', () => {
    it('marks a tip seen when it is displayed, not later', async () => {
        const store = await load();
        const shown = store.claimAutomaticTip(SIX);
        expect(shown?.id).toBe('a');
        expect(Object.keys(JSON.parse(localStorage.getItem(QUICK_TIPS_KEY)!).seen)).toEqual(['a']);
    });

    it('never expires: an entry 400 days old is still seen', async () => {
        const old = Date.now() - 400 * DAY_MS;
        localStorage.setItem(QUICK_TIPS_KEY, JSON.stringify({ seen: { a: old }, pauseUntil: null }));
        const store = await load();
        expect(store.unseenTips([tip('a')])).toEqual([]);
    });

    it('ignores pauseUntil, in the past or in the future, and keeps the field it does not own', async () => {
        const until = Date.now() + 10 * DAY_MS;
        localStorage.setItem(QUICK_TIPS_KEY, JSON.stringify({ seen: {}, pauseUntil: until }));
        const store = await load();
        expect(store.claimAutomaticTip([tip('a')])?.id).toBe('a');
        expect(JSON.parse(localStorage.getItem(QUICK_TIPS_KEY)!).pauseUntil).toBe(until);
    });

    it('reads corrupt state as nothing seen, without throwing', async () => {
        localStorage.setItem(QUICK_TIPS_KEY, '{not json');
        const store = await load();
        expect(store.unseenTips([tip('a')]).map(t => t.id)).toEqual(['a']);
    });
});

describe('session limit (R-NT-2)', () => {
    it('shows at most one tip automatically per session, across a reload', async () => {
        let store = await load();
        expect(store.claimAutomaticTip(SIX)?.id).toBe('a');
        expect(store.claimAutomaticTip(SIX)).toBeNull();
        store = await load();
        expect(store.claimAutomaticTip(SIX)).toBeNull();
    });

    it('shows the next unseen tip in a new session', async () => {
        let store = await load();
        store.claimAutomaticTip(SIX);
        store = await newSession();
        expect(store.claimAutomaticTip(SIX)?.id).toBe('b');
    });

    it('still holds the limit in the page load when sessionStorage throws', async () => {
        const broken = memoryStorage();
        broken.setItem = () => { throw new Error('denied'); };
        vi.stubGlobal('sessionStorage', broken);
        const store = await load();
        expect(store.claimAutomaticTip(SIX)?.id).toBe('a');
        expect(store.claimAutomaticTip(SIX)).toBeNull();
    });

    it('shows another unseen tip on demand, past the limit, and marks it seen', async () => {
        const store = await load();
        store.claimAutomaticTip(SIX);
        expect(store.nextTip(SIX)?.id).toBe('b');
        expect(store.unseenTips(SIX).map(t => t.id)).toEqual(['c', 'd', 'e', 'f']);
    });

    it('is silent when every tip is seen, and does not spend the session slot', async () => {
        const store = await load();
        SIX.forEach(t => store.markTipSeen(t.id));
        expect(store.claimAutomaticTip(SIX)).toBeNull();
        expect(store.nextTip(SIX)).toBeNull();
        expect(store.claimAutomaticTip([...SIX, tip('new')])?.id).toBe('new');
    });

    it('shows a tip added later once, across sessions', async () => {
        let store = await load();
        SIX.forEach(t => store.markTipSeen(t.id));
        const withNew = [tip('new'), ...SIX];
        store = await newSession();
        expect(store.claimAutomaticTip(withNew)?.id).toBe('new');
        store = await newSession();
        expect(store.claimAutomaticTip(withNew)).toBeNull();
    });

    it('stays silent on days 0, 15 and 30 after all tips are seen', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-11-08T12:00:00Z'));
        const start = Date.now();
        let store = await load();
        SIX.forEach(t => store.markTipSeen(t.id));
        for (const day of [0, 15, 30]) {
            vi.setSystemTime(start + day * DAY_MS);
            store = await newSession();
            expect(store.claimAutomaticTip(SIX)).toBeNull();
        }
    });
});

describe('preference (R-NT-3)', () => {
    it('defaults to showing tips', async () => {
        const store = await load();
        expect(store.loadTipsPrefs()).toEqual({ showTips: true });
    });

    it('off hides the card and does not spend the tip or the session slot', async () => {
        const store = await load();
        store.saveTipsPrefs({ showTips: false });
        expect(store.claimAutomaticTip(SIX)).toBeNull();
        expect(store.unseenTips(SIX)).toHaveLength(6);
        store.saveTipsPrefs({ showTips: true });
        expect(store.claimAutomaticTip(SIX)?.id).toBe('a');
    });

    it('persists and announces a change', async () => {
        const store = await load();
        const { JjodelEvents } = await import('../../../events/registry');
        const heard = vi.fn();
        window.addEventListener(JjodelEvents.TIPS_PREFS_CHANGED, heard);
        store.saveTipsPrefs({ showTips: false });
        expect(heard).toHaveBeenCalledTimes(1);
        expect((await load()).loadTipsPrefs()).toEqual({ showTips: false });
    });
});

describe('shared fetch', () => {
    it('sends one request for two readers', async () => {
        const fetchMock = respondWith(JSON.stringify({ posts: SIX }));
        const store = await load();
        const [first, second] = await Promise.all([store.fetchPosts(), store.fetchPosts()]);
        const third = await store.fetchPosts();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(first).toHaveLength(6);
        expect(second).toBe(first);
        expect(third).toBe(first);
    });

    it('turns HTTP 500 into an empty list, logs once and does not retry', async () => {
        const fetchMock = respondWith(JSON.stringify({ posts: SIX }), 500);
        const store = await load();
        await expect(store.fetchPosts()).resolves.toEqual([]);
        await expect(store.fetchPosts()).resolves.toEqual([]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('turns a non-JSON body into an empty list', async () => {
        respondWith('<html>not json</html>');
        const store = await load();
        await expect(store.fetchPosts()).resolves.toEqual([]);
        expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('turns a network failure and a body without posts into an empty list', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
        let store = await load();
        await expect(store.fetchPosts()).resolves.toEqual([]);
        respondWith(JSON.stringify({ error: 'nope' }));
        store = await load();
        await expect(store.fetchPosts()).resolves.toEqual([]);
    });
});

describe('notices', () => {
    it('picks the first undismissed notice and persists a dismissal', async () => {
        const store = await load();
        const posts = [tip('t'), notice('n1'), notice('n2')];
        expect(store.currentNotice(posts)?.id).toBe('n1');
        store.dismissNotice('n1');
        expect(store.currentNotice(posts)?.id).toBe('n2');
        expect(JSON.parse(localStorage.getItem('jjodel-dismissed-notifications')!)).toEqual(['n1']);
    });

    it('reads a corrupt dismissal list as empty', async () => {
        localStorage.setItem('jjodel-dismissed-notifications', 'oops');
        const store = await load();
        expect(store.currentNotice([notice('n1')])?.id).toBe('n1');
    });
});
