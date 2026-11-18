import React, { useEffect, useState } from 'react';
import { JjodelEvents } from '../../events/registry';
import { fetchPosts, type NotificationPost } from './noticesStore';

/** Every tip of the payload, from the Help menu. Reading them here does not mark them as seen. */
export const TipsBrowserModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tips, setTips] = useState<NotificationPost[]>([]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(JjodelEvents.TIPS_BROWSER_OPEN, onOpen);
    return () => window.removeEventListener(JjodelEvents.TIPS_BROWSER_OPEN, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    let live = true;
    fetchPosts().then(posts => {
      if (live) setTips(posts.filter(p => p.category === 'tip'));
    });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      live = false;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="tips-browser-backdrop" onClick={() => setOpen(false)}>
      <div className="tips-browser" role="dialog" aria-modal="true" aria-label="Tips" onClick={e => e.stopPropagation()}>
        <div className="tips-browser__header">
          <i className="bi bi-lightbulb" aria-hidden="true" />
          <h3>Tips</h3>
          <button type="button" className="tips-browser__close" aria-label="Close" onClick={() => setOpen(false)}>
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>
        {tips.length > 0 ? (
          <ul className="tips-browser__list">
            {tips.map(tip => <li key={tip.id}>{tip.message}</li>)}
          </ul>
        ) : (
          <p className="tips-browser__empty">No tips available.</p>
        )}
      </div>
    </div>
  );
};

export default TipsBrowserModal;
