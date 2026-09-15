# Jjodel UI Redesign - Status & Specifications
**Last Updated:** January 18, 2026
**Session:** Notification Widget + Project Cards

---

## 1. PROJECT OVERVIEW

Jjodel è un tool SaaS open-source di metamodellazione per ricerca e educazione. Il redesign UI si concentra su miglioramenti visivi mantenendo funzionalità e stabilità.

**Design Philosophy:**
- Look professionale, enterprise, maturo
- Palette monocromatica (grigi + slate)
- "Friendly but authoritative" brand personality
- Font: Inter Variable

---

## 2. ACCENT COLOR

### ✅ DECISION: Cyan → Slate

| Before | After |
|--------|-------|
| #06B6D4 (Cyan) | #475569 (Slate) |

**Palette Slate:**
- Primary: `#475569`
- Hover: `#334155`
- Light bg: `#f1f5f9`

**File aggiornati (17 totali):**
- `_colors-light.scss`, `_colors-dark.scss`
- `dashboard.scss`, `catalog.scss`, `style.scss`
- `project-card.scss`, `navbar.scss`, `dock-tabs.scss`
- `index.scss`, `auth.scss`, `info.scss`

**Docs:** `/docs/redesign/color-usage-guidelines.md`

---

## 3. NOTIFICATION WIDGET

### ✅ IMPLEMENTED

**Architecture:**
```
Notion Database → Cloudflare Worker (proxy) → React Widget
```

**Notion Database ID:** `2eb4b66bdb50802fa2cfdcdd7aae3fbf`

**Notion Columns:**
| Column | Type | Values |
|--------|------|--------|
| Title | Title | Notification title |
| Category | Select | `system-notice`, `tip` |
| Priority | Select | `info`, `warning`, `success`, `error` |
| Active | Checkbox | ✅ to show |
| Message | Text | Extended message |

**Cloudflare Worker:**
- URL: `https://jjodel-notifications.alfonso-pierantonio.workers.dev`
- Token variable: `NOTION_TOKEN` (encrypted)

**Widget Behavior:**
- System notices: priorità alta, dismissibili permanentemente (localStorage)
- Tips: rotazione con "Next", dismissibili per sessione (sessionStorage)
- Non appare in `/auth` page

**Files:**
- `components/NotificationWidget/NotificationWidget.tsx`
- `components/NotificationWidget/notification-widget.scss`

**Docs:** `/docs/redesign/notification-widget-spec.md`

---

## 4. PROJECT CARDS

### ✅ IMPLEMENTED (with pending fixes)

**Card Layout:**
```
┌─────────────────────────────────┐
│ [Private]           ☆    ⋮     │  ← Cover con gradiente
│         (gradient cover)        │
├─────────────────────────────────┤
│ Project Name                    │
│ Description (if custom)...      │
│                                 │
│ 🔀 0 metamodels  📄 0 models · 5m│
└─────────────────────────────────┘
```

**Gradienti (25 vivaci):**
```javascript
const gradients = [
  // Blu/Cyan
  'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)',
  'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)',
  // Verde/Teal
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #2af598 0%, #009efd 100%)',
  'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
  'linear-gradient(135deg, #96e6a1 0%, #d4fc79 100%)',
  // Viola/Rosa
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
  'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
  'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
  // Arancio/Rosso/Giallo
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
  'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
  'linear-gradient(135deg, #f83600 0%, #f9d423 100%)',
  // Rosa/Pesca
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  // Pastello vivace
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
];
```

**Grid Layout:**
```scss
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
```

**View Modes (2):**
1. **Grid** - Card colorate con cover
2. **Compact** - Mini-card senza cover (lista)

**Search Bar:** Filtro progetti per nome con debounce

**Files:**
- `pages/components/Project.tsx`
- `styles/project-card.scss`
- `pages/Catalog.tsx`
- `styles/catalog.scss`

### ⏳ PENDING FIXES

1. **Menu overflow** - dropdown esce dalla card
2. **Allineamento vista compatta** - colonne non allineate
3. **Stella/menu trasparenti** - rimuovere sfondo bianco

---

## 5. SIDEBAR

### ✅ IMPLEMENTED

**Features:**
- Favorites section: mostra progetti con `isFavorite: true`
- Footer compatto: `Jjodel v2.0` + License badge

**License Badge:**
```jsx
<a href="https://opensource.org/licenses/MIT" target="_blank" className="license-badge">
  <span className="license-label">License</span>
  <span className="license-type">MIT</span>
</a>
```

---

## 6. FOOTER (Bottom Bar)

### ✅ DECISION

- Footer visibile solo nell'Editor (con progetto aperto)
- Non visibile nella Dashboard
- License MIT spostata nella sidebar

---

## 7. FUTURE IMPLEMENTATIONS

### Tags/Folders per Progetti

**Approccio:** Usare `project.state` per metadati custom

```javascript
data.project.state = {
  tags: ['client', 'research', 'urgent'],
  folder: 'Client Projects'
}
```

Nessuna modifica backend necessaria!

### Slider View (Carousel)

Toggle vista aggiuntivo per scorrimento orizzontale tipo Netflix.

### AI Assistant (RAG)

Widget chat per rispondere a domande su Jjodel e MDE.
- Knowledge base: docs Jjodel + concetti MDE
- Context-aware: analisi modello/metamodello corrente
- API: Claude/OpenAI

---

## 8. DESIGN SYSTEM FILES

**Location:** `/docs/redesign/`

| File | Description |
|------|-------------|
| `color-usage-guidelines.md` | Palette colori e regole uso |
| `notification-widget-spec.md` | Spec widget notifiche |
| `project-card-spec.md` | Spec card progetti |
| `dialogs-modals-spec.md` | Spec dialogs e modali |
| `menu-redesign-spec.md` | Spec menu principale |
| `right-panel-tabs-spec.md` | Spec tabs pannello destro |

---

## 9. TECHNICAL NOTES

**Cloudflare Worker Code:**
```javascript
const NOTION_API_VERSION = '2022-06-28';
const DATABASE_ID = '2eb4b66bdb50802fa2cfdcdd7aae3fbf';

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const notionResponse = await fetch(
        `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.NOTION_TOKEN}`,
            'Notion-Version': NOTION_API_VERSION,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filter: {
              property: 'Active',
              checkbox: { equals: true },
            },
          }),
        }
      );

      if (!notionResponse.ok) {
        const error = await notionResponse.json();
        return new Response(JSON.stringify({ error }), { status: 500, headers: corsHeaders });
      }

      const notionData = await notionResponse.json();

      const posts = notionData.results.map((page) => {
        const props = page.properties;
        return {
          id: page.id,
          category: props.Category?.select?.name || 'tip',
          title: props.Title?.title?.[0]?.plain_text || '',
          message: props.Message?.rich_text?.[0]?.plain_text || props.Title?.title?.[0]?.plain_text || '',
          priority: props.Priority?.select?.name || 'info',
        };
      });

      return new Response(JSON.stringify({ posts }), {
        status: 200,
        headers: corsHeaders,
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};
```

---

## 10. LATEST SESSION UPDATES (January 19, 2026)

### Completed
- ✅ Slider 3x3 con navigazione (frecce + dots in basso)
- ✅ Transizione fluida tra pagine slider
- ✅ Vista compatta allineata
- ✅ Barra filtri uniformata
- ✅ Drag & drop globale per file .jjodel (in corso)

### In Progress
- ⏳ Project Card redesign → Stile "Accent Left" (barra slate a sinistra, no cover)
- ⏳ Aggiunta info: versione engine + proprietario

### Card Accent Left Layout
```
┌─────────────────────────────────┐
█ Project 1              ☆  ⋮    │
█ [Private] · alfonso · v2.2     │
█ 0 metamodels · 0 models   5m   │
└─────────────────────────────────┘
```

### Tags System (da implementare)
- Approccio libero con autocomplete
- Salvataggio in `project.state.tags`
- Suggerimenti da tag esistenti durante digitazione
- Filtro dashboard per tag

## 11. NEXT SESSION - PRIORITY TASKS

### High Priority
1. Finire Card Accent Left (fix author: `data.author?.name || data.author?.surname`)
2. Tags per progetti (UI + autocomplete + filtri)
3. Fix menu overflow nelle card

### Medium Priority
4. Pagina singolo progetto / Editor
5. About dialog redesign

### Low Priority
6. Form controls spec
7. AI Assistant spec

---

## 11. VS CODE PROMPTS UTILI

### Fix Card Menu Overflow
```
"Fix menu overflow - il dropdown delle card non deve uscire dalla card:
- project-card overflow: visible
- dropdown z-index: 1000
- Rimuovi icone flottanti fuori dalla card"
```

### Fix Vista Compatta
```
"Fix allineamento vista compatta con grid colonne fisse:
- Nome: 280px con text-overflow ellipsis
- Stats: 1fr
- Badge, stella, menu: auto"
```

### Icone Trasparenti
```
"Stella e menu icone sulla card devono essere trasparenti:
- background: none
- color: rgba(255,255,255,0.7)
- hover: bianco
- favorite attivo: #facc15 (giallo)"
```

---

## 12. CONTACTS & RESOURCES

- **Notion Integration Token:** In Cloudflare Worker env variables
- **Cloudflare Dashboard:** workers.cloudflare.com
- **Gradients Reference:** coolors.co/gradients

---

*Document generated by Claude - Session January 18, 2026*
