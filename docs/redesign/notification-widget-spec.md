# JJODEL NOTIFICATION WIDGET - SPECIFICATION

**Version:** 1.0  
**Date:** January 2026  
**Status:** Ready for Implementation

---

## 1. OVERVIEW

Widget fisso in basso a destra per mostrare:
- **System notices** (avvisi dal sistema/manutenzione)
- **Tips** (suggerimenti per l'utente)

La categoria del post WordPress determina lo stile.

---

## 2. LOGICA

```
WordPress API
    ↓
category: "system-notice" → Stile A (minimal)
category: "tip"           → Stile D (con counter + Next)
```

**Priorità:**
1. Se esistono `system-notice` non dismissate → mostra la più recente
2. Altrimenti → mostra `tip` con rotazione

---

## 3. WORDPRESS API

### Sito WordPress
```
https://jjodel.com
```

### Categorie (slug)
- `system-notice` — Avvisi di sistema
- `tip` — Suggerimenti

### Step 1: Fetch Category IDs
```
GET https://jjodel.com/wp-json/wp/v2/categories?slug=system-notice,tip
```

**Response:**
```json
[
  { "id": 5, "slug": "system-notice" },
  { "id": 6, "slug": "tip" }
]
```

### Step 2: Fetch Posts by Categories
```
GET https://jjodel.com/wp-json/wp/v2/posts?categories=5,6&_fields=id,title,content,excerpt,categories,date&per_page=20
```

### Response WP → Mapping Widget

```typescript
// WordPress response
interface WPPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  categories: number[];
  date: string;
}

// Mapping function
const mapWPToNotification = (post: WPPost, systemNoticeCatId: number): NotificationPost => ({
  id: post.id,
  category: post.categories.includes(systemNoticeCatId) ? 'system-notice' : 'tip',
  title: post.title.rendered,
  message: stripHtml(post.excerpt.rendered || post.content.rendered),
  priority: 'info', // default, usa custom field per override
  date: post.date,
});

// Strip HTML tags
const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();
```

### Custom Field per Priority (opzionale)

Per usare priority diversi (warning, success, error), aggiungi un custom field in WordPress:

1. Installa **ACF** (Advanced Custom Fields) o usa campi nativi
2. Crea campo `notification_priority` con valori: `info`, `warning`, `success`, `error`
3. Esponi nel REST API aggiungendo in `functions.php`:

```php
add_action('rest_api_init', function() {
  register_rest_field('post', 'notification_priority', [
    'get_callback' => function($post) {
      return get_post_meta($post['id'], 'notification_priority', true) ?: 'info';
    }
  ]);
});
```

---

## 3.1 CREARE NOTIFICHE IN WORDPRESS

### System Notice (Avviso di sistema)

1. **Nuovo Post** in WordPress
2. **Titolo:** "Scheduled Maintenance" (sarà il title)
3. **Contenuto/Excerpt:** "Jjodel will be undergoing maintenance..." (sarà il message)
4. **Categoria:** `system-notice`
5. **Custom field** `notification_priority`: `warning` / `info` / `success` / `error`
6. **Pubblica**

### Tip (Suggerimento)

1. **Nuovo Post** in WordPress
2. **Titolo:** (opzionale, non mostrato)
3. **Contenuto/Excerpt:** "Press Ctrl+S to save your project quickly."
4. **Categoria:** `tip`
5. **Pubblica**

### Esempi Post WordPress

| Titolo | Excerpt | Categoria | Priority |
|--------|---------|-----------|----------|
| Scheduled Maintenance | Jjodel will be offline Jan 20, 2-4 AM UTC | system-notice | warning |
| New Version 2.1 | Explore the new redesigned interface! | system-notice | info |
| (vuoto) | Press Ctrl+S to save your project quickly | tip | — |
| (vuoto) | Use Templates to start faster | tip | — |

---

## 4. STILE A: SYSTEM NOTICE

Per avvisi di sistema importanti.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  ⚠ SYSTEM NOTICE                              [✕]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Scheduled Maintenance                              │
│                                                     │
│  Jjodel will be undergoing maintenance on           │
│  Jan 20, 2026 from 2:00 AM to 4:00 AM UTC.          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Dimensioni

| Proprietà | Valore |
|-----------|--------|
| Width | `320px` |
| Border radius | `12px` |
| Position | `fixed`, `bottom: 24px`, `right: 24px` |
| z-index | `1000` |

### Colori Priority

| Priority | Icona | Colore |
|----------|-------|--------|
| `warning` | `bi-exclamation-triangle-fill` | `#F59E0B` |
| `info` | `bi-info-circle-fill` | `#6B7280` |
| `success` | `bi-check-circle-fill` | `#10B981` |
| `error` | `bi-x-circle-fill` | `#EF4444` |

### SCSS

```scss
.notification-widget {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 320px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e2e4e8;
  overflow: hidden;
  font-family: 'Inter Variable', -apple-system, sans-serif;
  z-index: 1000;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.notification-header-label {
  display: flex;
  align-items: center;
  gap: 8px;
  
  i {
    font-size: 14px;
  }
  
  span {
    font-size: 11px;
    font-weight: 600;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.notification-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #9CA3AF;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 150ms ease;
  
  &:hover {
    color: #374151;
  }
  
  i {
    font-size: 14px;
  }
}

.notification-content {
  padding: 16px;
}

.notification-title {
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 600;
  color: #111418;
}

.notification-message {
  margin: 0;
  font-size: 13px;
  color: #6B7280;
  line-height: 1.5;
}

// Priority colors
.notification-widget.priority-warning .notification-header i { color: #F59E0B; }
.notification-widget.priority-info .notification-header i { color: #6B7280; }
.notification-widget.priority-success .notification-header i { color: #10B981; }
.notification-widget.priority-error .notification-header i { color: #EF4444; }
```

---

## 5. STILE D: TIPS

Per suggerimenti con navigazione.

### Layout

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [💡]  QUICK TIP                              [✕]  │
│                                                     │
│  Press Ctrl+S to save your project quickly.         │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Tip 1 of 5                              [Next →]  │
└─────────────────────────────────────────────────────┘
```

### SCSS Aggiuntivo

```scss
.notification-widget.is-tip {
  .notification-header {
    border-bottom: none;
    background: transparent;
    padding: 16px 16px 12px;
  }
}

.tip-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #FEF3C7;
  display: flex;
  align-items: center;
  justify-content: center;
  
  i {
    color: #F59E0B;
    font-size: 16px;
  }
}

.notification-footer {
  padding: 12px 16px;
  background: #fafbfc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tip-counter {
  font-size: 11px;
  color: #9CA3AF;
}

.tip-next-btn {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  background: #ffffff;
  border: 1px solid #e2e4e8;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 150ms ease;
  
  &:hover {
    background: #f1f5f9;
    border-color: #d0d3d8;
  }
  
  i {
    font-size: 12px;
  }
}
```

---

## 6. REACT COMPONENT

```tsx
// components/NotificationWidget/NotificationWidget.tsx

import React, { useState, useEffect } from 'react';
import './notification-widget.scss';

interface NotificationPost {
  id: number;
  category: 'system-notice' | 'tip';
  title?: string;
  message: string;
  priority?: 'warning' | 'info' | 'success' | 'error';
  date?: string;
}

interface WPPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  categories: number[];
  date: string;
  notification_priority?: string;
}

interface WPCategory {
  id: number;
  slug: string;
}

const WP_BASE_URL = 'https://jjodel.com/wp-json/wp/v2';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

export const NotificationWidget: React.FC = () => {
  const [posts, setPosts] = useState<NotificationPost[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('jjodel-dismissed-notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch notifications from WordPress
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Step 1: Get category IDs
        const catRes = await fetch(`${WP_BASE_URL}/categories?slug=system-notice,tip`);
        const categories: WPCategory[] = await catRes.json();
        
        if (categories.length === 0) {
          setIsLoading(false);
          return;
        }

        const systemNoticeCat = categories.find(c => c.slug === 'system-notice');
        const tipCat = categories.find(c => c.slug === 'tip');
        const catIds = categories.map(c => c.id).join(',');

        // Step 2: Get posts
        const postsRes = await fetch(
          `${WP_BASE_URL}/posts?categories=${catIds}&_fields=id,title,content,excerpt,categories,date,notification_priority&per_page=20`
        );
        const wpPosts: WPPost[] = await postsRes.json();

        // Step 3: Map to notification format
        const notifications: NotificationPost[] = wpPosts.map(post => ({
          id: post.id,
          category: systemNoticeCat && post.categories.includes(systemNoticeCat.id) 
            ? 'system-notice' 
            : 'tip',
          title: post.title.rendered,
          message: stripHtml(post.excerpt.rendered || post.content.rendered),
          priority: (post.notification_priority as any) || 'info',
          date: post.date,
        }));

        setPosts(notifications);
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

  // Separate by category
  const systemNotices = posts
    .filter(p => p.category === 'system-notice')
    .filter(p => !dismissedIds.includes(p.id));
  
  const tips = posts.filter(p => p.category === 'tip');

  // Determine what to show
  const hasSystemNotice = systemNotices.length > 0;
  const currentNotice = systemNotices[0];
  const currentTip = tips[tipIndex % tips.length];

  const dismiss = (id?: number) => {
    if (id) {
      setDismissedIds(prev => [...prev, id]);
    } else {
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
            <i className={getPriorityIcon(currentNotice.priority)} />
            <span>System Notice</span>
          </div>
          <button className="notification-close" onClick={() => dismiss(currentNotice.id)}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="notification-content">
          <h4 className="notification-title">{currentNotice.title}</h4>
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
```

---

## 7. ICONE BOOTSTRAP

| Elemento | Icona |
|----------|-------|
| Warning | `bi-exclamation-triangle-fill` |
| Info | `bi-info-circle-fill` |
| Success | `bi-check-circle-fill` |
| Error | `bi-x-circle-fill` |
| Tip | `bi-lightbulb-fill` |
| Close | `bi-x-lg` |
| Next | `bi-arrow-right` |

---

## 8. PERSISTENZA

### localStorage Keys

| Key | Valore | Scopo |
|-----|--------|-------|
| `jjodel-dismissed-notifications` | `[101, 102]` | Array di ID dismissati |

### Comportamento
- System notices dismissate non riappaiono (fino a clear localStorage)
- Tips dismissati nascondono il widget per la sessione
- Widget riappare al refresh se ci sono nuove notifiche

---

## 9. IMPLEMENTAZIONE CHECKLIST

- [ ] Creare `NotificationWidget.tsx`
- [ ] Creare `notification-widget.scss`
- [ ] Aggiungere al layout principale (App.tsx o Layout.tsx)
- [ ] Configurare URL endpoint WordPress (env variable)
- [ ] Testare dismissione e localStorage
- [ ] Testare rotazione tips

---

## 10. INTEGRAZIONE

### In App.tsx o Layout.tsx

```tsx
import { NotificationWidget } from './components/NotificationWidget';

function App() {
  return (
    <div className="app">
      {/* ... resto dell'app ... */}
      
      <NotificationWidget />
    </div>
  );
}
```

### CORS (se necessario)

Se il frontend è su un dominio diverso da jjodel.com, aggiungi in WordPress `functions.php`:

```php
add_action('rest_api_init', function() {
  remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
  add_filter('rest_pre_serve_request', function($value) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET');
    header('Access-Control-Allow-Headers: Content-Type');
    return $value;
  });
});
```

---

## 11. PRIMO POST DI TEST

Crea subito un post in WordPress per testare:

1. **Vai su** WordPress Admin → Posts → Add New
2. **Titolo:** `Welcome to Jjodel 2.0`
3. **Excerpt:** `We've redesigned the interface. Explore the new features!`
4. **Categoria:** `system-notice`
5. **Pubblica**

Il widget dovrebbe apparire nella dashboard!

---

**END OF SPECIFICATION**
