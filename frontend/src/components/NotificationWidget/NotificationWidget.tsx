import React, { useState, useEffect, useMemo } from 'react';
import './notification-widget.scss';

interface NotificationPost {
  id: string;
  category: 'system-notice' | 'tip';
  title?: string;
  message: string;
  priority?: 'warning' | 'info' | 'success' | 'error';
}

interface APIResponse {
  posts: NotificationPost[];
}

interface QuickTipsState {
  seen: Record<string, number>;
  pauseUntil: number | null;
}

const API_URL = 'https://jjodel-notifications.alfonso-pierantonio.workers.dev';

const TIP_HIDE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function loadTipsState(): QuickTipsState {
  try {
    const raw = localStorage.getItem('jjodel-quick-tips-state');
    if (!raw) return { seen: {}, pauseUntil: null };
    const parsed = JSON.parse(raw);
    return {
      seen: parsed?.seen && typeof parsed.seen === 'object' ? parsed.seen : {},
      pauseUntil: typeof parsed?.pauseUntil === 'number' ? parsed.pauseUntil : null,
    };
  } catch {
    return { seen: {}, pauseUntil: null };
  }
}

function saveTipsState(state: QuickTipsState): void {
  try {
    localStorage.setItem('jjodel-quick-tips-state', JSON.stringify(state));
  } catch {
    // localStorage full or disabled: silent noop
  }
}

function getUnseenTips(allTips: NotificationPost[], state: QuickTipsState, now: number): NotificationPost[] {
  return allTips.filter(t => {
    const seenAt = state.seen[t.id];
    return seenAt === undefined || (now - seenAt) >= TIP_HIDE_WINDOW_MS;
  });
}

// Pause is honored only if every tip in the current payload has a recent seen entry.
// A new tip (no seen entry) implicitly breaks the pause so it appears immediately.
function isPauseActive(allTips: NotificationPost[], state: QuickTipsState, now: number): boolean {
  if (state.pauseUntil === null || now >= state.pauseUntil) return false;
  const allSeenRecently = allTips.every(t => {
    const seenAt = state.seen[t.id];
    return seenAt !== undefined && (now - seenAt) < TIP_HIDE_WINDOW_MS;
  });
  return allSeenRecently;
}

export const NotificationWidget: React.FC = () => {
  const [posts, setPosts] = useState<NotificationPost[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [tipsQueue, setTipsQueue] = useState<NotificationPost[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('jjodel-dismissed-notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(API_URL);
        const data: APIResponse = await res.json();
        setPosts(data.posts || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Save dismissed to localStorage
  useEffect(() => {
    localStorage.setItem('jjodel-dismissed-notifications', JSON.stringify(dismissedIds));
  }, [dismissedIds]);

  const tips = useMemo(() => posts.filter(p => p.category === 'tip'), [posts]);

  // Build the queue of unseen-or-stale tips after fetch.
  // Re-runs whenever the payload changes (e.g. new tip appears in Notion).
  useEffect(() => {
    if (tips.length === 0) return;
    const now = Date.now();
    const state = loadTipsState();

    if (isPauseActive(tips, state, now)) {
      setTipsQueue([]);
      return;
    }

    setTipsQueue(getUnseenTips(tips, state, now));
    setQueueIndex(0);
  }, [tips]);

  // Signal to other components (like Jjodie FAB) when the widget is actually visible
  useEffect(() => {
    const shouldShow = isVisible && posts.length > 0 && !isLoading;
    const hasSystemNotice = posts.filter(p => p.category === 'system-notice' && !dismissedIds.includes(p.id)).length > 0;
    const hasTipToShow = tipsQueue.length > 0 && queueIndex < tipsQueue.length;
    const isActuallyVisible = shouldShow && (hasSystemNotice || hasTipToShow);

    if (isActuallyVisible) {
      document.body.setAttribute('data-notification-visible', 'true');
    } else {
      document.body.removeAttribute('data-notification-visible');
    }

    return () => {
      document.body.removeAttribute('data-notification-visible');
    };
  }, [isVisible, posts, isLoading, dismissedIds, tipsQueue, queueIndex]);

  // Hide widget on auth page
  if (window.location.hash.includes('auth')) return null;

  // Separate by category
  const systemNotices = posts
    .filter(p => p.category === 'system-notice')
    .filter(p => !dismissedIds.includes(p.id));

  // Determine what to show
  const hasSystemNotice = systemNotices.length > 0;
  const currentNotice = systemNotices[0];
  const currentTip = tipsQueue.length > 0 && queueIndex < tipsQueue.length ? tipsQueue[queueIndex] : null;

  const dismissSystemNotice = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

  const handleNext = () => {
    const current = tipsQueue[queueIndex];
    if (!current) return;
    const now = Date.now();
    const state = loadTipsState();
    state.seen[current.id] = now;

    const wasLast = queueIndex >= tipsQueue.length - 1;
    if (wasLast) {
      state.pauseUntil = now + TIP_HIDE_WINDOW_MS;
      saveTipsState(state);
      setTipsQueue([]);
    } else {
      saveTipsState(state);
      setQueueIndex(queueIndex + 1);
    }
  };

  // Closing on the last tip starts the pause; closing mid-queue just hides for now,
  // so the remaining tips reappear next mount.
  const handleClose = () => {
    const current = tipsQueue[queueIndex];
    if (!current) {
      setTipsQueue([]);
      return;
    }
    const now = Date.now();
    const state = loadTipsState();
    state.seen[current.id] = now;

    const wasLast = queueIndex >= tipsQueue.length - 1;
    if (wasLast) {
      state.pauseUntil = now + TIP_HIDE_WINDOW_MS;
    }
    saveTipsState(state);
    setTipsQueue([]);
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'info': return 'bi-info-circle-fill';
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-x-circle-fill';
      default: return 'bi-bell-fill';
    }
  };

  // Don't render if loading, not visible, or no posts
  if (isLoading || !isVisible || posts.length === 0) return null;

  // SYSTEM NOTICE
  if (hasSystemNotice && currentNotice) {
    return (
      <div className={`notification-widget priority-${currentNotice.priority || 'info'}`}>
        <div className="notification-header">
          <div className="notification-header-label">
            <i className={`bi ${getPriorityIcon(currentNotice.priority)}`} />
            <span>System Notice</span>
          </div>
          <button className="notification-close" onClick={() => dismissSystemNotice(currentNotice.id)}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="notification-content">
          {currentNotice.title && (
            <h4 className="notification-title">{currentNotice.title}</h4>
          )}
          <p className="notification-message">{currentNotice.message}</p>
        </div>
      </div>
    );
  }

  // TIPS
  if (tipsQueue.length > 0 && currentTip) {
    return (
      <div className="notification-widget is-tip">
        <div className="notification-header">
          <div className="notification-header-label">
            <div className="tip-icon-wrapper">
              <i className="bi bi-lightbulb-fill" />
            </div>
            <span>Quick Tip</span>
          </div>
          <button className="notification-close" onClick={handleClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="notification-content">
          <p className="notification-message">{currentTip.message}</p>
        </div>
        <div className="notification-footer">
          <span className="tip-counter">Tip {queueIndex + 1} of {tipsQueue.length}</span>
          <button className="tip-next-btn" onClick={handleNext}>
            Next <i className="bi bi-arrow-right" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default NotificationWidget;
