import React, { useState, useEffect } from 'react';
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

const API_URL = 'https://jjodel-notifications.alfonso-pierantonio.workers.dev';

export const NotificationWidget: React.FC = () => {
  const [posts, setPosts] = useState<NotificationPost[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
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

  // Signal to other components (like Jjodie FAB) when notification is visible
  useEffect(() => {
    const shouldShow = isVisible && posts.length > 0 && !isLoading;
    const hasTipsDismissed = sessionStorage.getItem('jjodel-tips-dismissed') === 'true';
    const hasSystemNotice = posts.filter(p => p.category === 'system-notice' && !dismissedIds.includes(p.id)).length > 0;
    const isActuallyVisible = shouldShow && (hasSystemNotice || !hasTipsDismissed);

    if (isActuallyVisible) {
      document.body.setAttribute('data-notification-visible', 'true');
    } else {
      document.body.removeAttribute('data-notification-visible');
    }

    return () => {
      document.body.removeAttribute('data-notification-visible');
    };
  }, [isVisible, posts, isLoading, dismissedIds]);

  // Hide widget on auth page
  if (window.location.hash.includes('auth')) return null;

  // Separate by category
  const systemNotices = posts
    .filter(p => p.category === 'system-notice')
    .filter(p => !dismissedIds.includes(p.id));

  const tips = posts.filter(p => p.category === 'tip');

  // Determine what to show
  const hasSystemNotice = systemNotices.length > 0;
  const currentNotice = systemNotices[0];
  const currentTip = tips.length > 0 ? tips[tipIndex % tips.length] : null;

  // Hide tips if dismissed this session (system notices still show)
  if (sessionStorage.getItem('jjodel-tips-dismissed') === 'true' && !hasSystemNotice) return null;

  const dismiss = (id?: string) => {
    if (id) {
      setDismissedIds(prev => [...prev, id]);
    } else {
      // Save tip dismissal in sessionStorage (reappears next session)
      sessionStorage.setItem('jjodel-tips-dismissed', 'true');
      setIsVisible(false);
    }
  };

  const nextTip = () => {
    setTipIndex(prev => (prev + 1) % tips.length);
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
          <button className="notification-close" onClick={() => dismiss(currentNotice.id)}>
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
  if (tips.length > 0 && currentTip) {
    return (
      <div className="notification-widget is-tip">
        <div className="notification-header">
          <div className="notification-header-label">
            <div className="tip-icon-wrapper">
              <i className="bi bi-lightbulb-fill" />
            </div>
            <span>Quick Tip</span>
          </div>
          <button className="notification-close" onClick={() => dismiss()}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="notification-content">
          <p className="notification-message">{currentTip.message}</p>
        </div>
        <div className="notification-footer">
          <span className="tip-counter">Tip {(tipIndex % tips.length) + 1} of {tips.length}</span>
          <button className="tip-next-btn" onClick={nextTip}>
            Next <i className="bi bi-arrow-right" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default NotificationWidget;
