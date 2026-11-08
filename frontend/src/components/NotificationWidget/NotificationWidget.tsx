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
import { TipsBrowserModal } from './TipsBrowserModal';
import './notification-widget.scss';

const CARD_GAP_PX = 16;

const NOTICE_ICONS: Record<string, string> = {
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
  success: 'bi-check-circle-fill',
  error: 'bi-x-circle-fill',
};

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

const BANNER_INSET_PX = 8;

// The docked Jjodie takes the right edge of the viewport; 0 when it is not docked.
function dockWidth(): number {
  return parseFloat(getComputedStyle(document.body).getPropertyValue('--jj-jodie-dock-width')) || 0;
}

/** The top of the work area: the canvas column in the editor, the content column on the dashboard. */
function measureBanner(): { left: number; top: number; width: number } {
  const viewportWidth = document.documentElement.clientWidth;
  const panes = Array.from(document.querySelectorAll<HTMLElement>('.editor-v2__main'))
    .filter(el => el.offsetWidth > 0)
    .map(el => el.getBoundingClientRect());
  let left: number;
  let right: number;
  let top: number;
  if (panes.length > 0) {
    const palette = visibleElement('aside.editor-v2-palette')?.getBoundingClientRect();
    const toolbar = visibleElement('.editor-v2-toolbar')?.getBoundingClientRect();
    const panel = visibleElement('.properties-tree-overlay')?.getBoundingClientRect();
    left = Math.max(Math.min(...panes.map(r => r.left)), palette?.right ?? 0);
    right = Math.min(Math.max(...panes.map(r => r.right)), panel?.left ?? viewportWidth, viewportWidth - dockWidth());
    top = toolbar?.bottom ?? Math.min(...panes.map(r => r.top));
  } else {
    const column = visibleElement('.dash-content')?.getBoundingClientRect();
    left = Math.max(column?.left ?? 0, 0);
    right = Math.min(column?.right ?? viewportWidth, viewportWidth - dockWidth());
    top = column?.top ?? visibleElement('nav.appbar')?.getBoundingClientRect().bottom ?? 0;
  }
  return { left: left + BANNER_INSET_PX, top: top + BANNER_INSET_PX, width: Math.max(right - left - 2 * BANNER_INSET_PX, 0) };
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

const NoticesAndTips: React.FC = () => {
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
  const bannerPosition = useMeasured(notice !== null && !onAuthPage, measureBanner);

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

  const bannerLevel = notice?.priority && NOTICE_ICONS[notice.priority] ? notice.priority : 'info';

  // SYSTEM NOTICE
  if (notice && bannerPosition) {
    return (
      <div className={`notice-banner notice-banner--${bannerLevel}`} role="status" style={bannerPosition}>
        <i className={`bi ${NOTICE_ICONS[bannerLevel]} notice-banner__icon`} aria-hidden="true" />
        <span className="notice-banner__text" title={notice.message}>
          {notice.title && <span className="notice-banner__title">{notice.title}</span>}
          {notice.message}
        </span>
        <button type="button" className="notice-banner__close" aria-label="Dismiss notice" onClick={() => dismissSystemNotice(notice.id)}>
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
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

export const NotificationWidget: React.FC = () => (
  <>
    <NoticesAndTips />
    <TipsBrowserModal />
  </>
);

export default NotificationWidget;
