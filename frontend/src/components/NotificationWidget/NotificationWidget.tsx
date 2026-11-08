import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isConsumerMode } from '../environment/consumerMode';
import { JjodelEvents } from '../../events/registry';
import {
  claimAutomaticTip,
  currentNotice,
  dismissNotice,
  fetchPosts,
  loadTipsPrefs,
  nextTip,
  saveTipsPrefs,
  type NotificationPost,
} from './noticesStore';
import './notification-widget.scss';

const CARD_GAP_PX = 16;

function visibleElement(selector: string): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).find(el => el.offsetWidth > 0) ?? null;
}

// Offsets, not the rect: the button scales on hover, and the card must not move with it.
function measureTipsCard(): { left: number; bottom: number } {
  const viewportHeight = document.documentElement.clientHeight;
  const jodie = visibleElement('button.jodie-minimized');
  if (jodie) {
    return {
      left: jodie.offsetLeft + jodie.offsetWidth + CARD_GAP_PX,
      bottom: viewportHeight - (jodie.offsetTop + jodie.offsetHeight),
    };
  }
  const rail = visibleElement('aside.editor-v2-palette') ?? visibleElement('.leftbar');
  const statusBar = visibleElement('.app-statusbar');
  return {
    left: Math.max(rail?.getBoundingClientRect().right ?? 0, 0) + CARD_GAP_PX,
    bottom: (statusBar ? viewportHeight - statusBar.getBoundingClientRect().top : 0) + CARD_GAP_PX,
  };
}

/** Runs measure while active, again on resize, on the rail and dock variables and on layout changes. */
function useMeasured<T>(active: boolean, measure: () => T): T | null {
  const [value, setValue] = useState<T | null>(null);

  useLayoutEffect(() => {
    if (!active) {
      setValue(null);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const next = measure();
      setValue(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    // The Jjodie button and the rails mount late and move with `body:has(...)` rules, so a
    // route change alone says nothing; the variables are published as inline styles.
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
    window.addEventListener('resize', schedule);
    document.addEventListener('transitionend', schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      document.removeEventListener('transitionend', schedule, true);
    };
  }, [active, measure]);

  return value;
}

export const NotificationWidget: React.FC = () => {
  // Templates page: no Quick tip (handoff §2.4, P-2026-10-19-1616); system notices stay.
  const onTemplatesPage = /^\/templates(\/|$)/.test(useLocation().pathname);
  const [posts, setPosts] = useState<NotificationPost[]>([]);
  const [dismissCount, setDismissCount] = useState(0);
  const [showTips, setShowTips] = useState(() => loadTipsPrefs().showTips);
  const [currentTip, setCurrentTip] = useState<NotificationPost | null>(null);

  useEffect(() => {
    let live = true;
    fetchPosts().then(next => {
      if (live) setPosts(next);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const onPrefsChanged = () => {
      const on = loadTipsPrefs().showTips;
      setShowTips(on);
      if (!on) setCurrentTip(null);
    };
    window.addEventListener(JjodelEvents.TIPS_PREFS_CHANGED, onPrefsChanged);
    return () => window.removeEventListener(JjodelEvents.TIPS_PREFS_CHANGED, onPrefsChanged);
  }, []);

  const onAuthPage = window.location.hash.includes('auth');
  // dismissCount re-reads the dismissals in localStorage.
  const notice = useMemo(() => currentNotice(posts), [posts, dismissCount]);

  // #168 J7 (D4): no Quick tip in the stand-alone consumer; system notices stay. A tip skipped
  // here is not claimed, so it is not marked as seen and the developer still gets it.
  // The same holds on the Templates page and behind a notice, which has precedence (R-NT-4).
  const tipAllowed = !isConsumerMode() && !onTemplatesPage && !onAuthPage && showTips && !notice;

  useEffect(() => {
    if (!tipAllowed || currentTip) return;
    const tip = claimAutomaticTip(posts);
    if (tip) setCurrentTip(tip);
  }, [tipAllowed, posts, currentTip]);

  const tipVisible = tipAllowed && currentTip !== null;
  const tipPosition = useMeasured(tipVisible, measureTipsCard);

  // Signal to other components (like Jjodie FAB) when the widget is actually visible
  const isActuallyVisible = !onAuthPage && (notice !== null || tipVisible);
  useEffect(() => {
    if (isActuallyVisible) {
      document.body.setAttribute('data-notification-visible', 'true');
    } else {
      document.body.removeAttribute('data-notification-visible');
    }

    return () => {
      document.body.removeAttribute('data-notification-visible');
    };
  }, [isActuallyVisible]);

  // Hide widget on auth page
  if (onAuthPage) return null;

  const dismissSystemNotice = (id: string) => {
    dismissNotice(id);
    setDismissCount(count => count + 1);
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

  // SYSTEM NOTICE
  if (notice) {
    return (
      <div className={`notification-widget priority-${notice.priority || 'info'}`}>
        <div className="notification-header">
          <div className="notification-header-label">
            <i className={`bi ${getPriorityIcon(notice.priority)}`} />
            <span>System Notice</span>
          </div>
          <button className="notification-close" onClick={() => dismissSystemNotice(notice.id)}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="notification-content">
          {notice.title && (
            <h4 className="notification-title">{notice.title}</h4>
          )}
          <p className="notification-message">{notice.message}</p>
        </div>
      </div>
    );
  }

  // TIPS
  if (tipVisible && tipPosition && currentTip) {
    return (
      <div className="tips-card" role="status" style={tipPosition}>
        <div className="tips-card__header">
          <i className="bi bi-lightbulb tips-card__icon" aria-hidden="true" />
          <span className="tips-card__label">Tip</span>
          <button type="button" className="tips-card__close" aria-label="Close tip" onClick={() => setCurrentTip(null)}>
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>
        <p className="tips-card__message">{currentTip.message}</p>
        <div className="tips-card__footer">
          <button type="button" className="tips-card__off" onClick={() => saveTipsPrefs({ showTips: false })}>
            Turn off tips
          </button>
          <button type="button" className="tips-card__next" onClick={() => setCurrentTip(nextTip(posts))}>
            Next tip
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default NotificationWidget;
