# HANDOVER DOCUMENT
## Settings Page Redesign + Error Portal Improvements
**Data:** 2026-01-27
**Branch:** alfonso-frontend-dev

---

## 1. STATO ATTUALE

### Completato
- **Settings Page Redesign**: Layout completamente ristrutturato per matchare Account Settings
  - Rimossa sidebar interna con navigazione a tab
  - Ora mostra tutte le sezioni come card verticali separate
  - Header a sinistra (non centrato) con icona piccola + titolo + descrizione
  - Larghezza aumentata a 1100px (come Account)

- **Error Portal/Badge**: Implementato sistema di notifica errori migliorato
  - Badge clickabile con design slick (bordo rosso a sinistra)
  - Modal via React Portal (zoom-independent)
  - Mostra info sull'istanza che ha causato l'errore
  - Chiusura con X, Escape, click su backdrop

- **Checkbox Fix**: Rimossi checkbox duplicati nelle Settings
  - Ora usa solo checkbox nativo con `accent-color: #475569`
  - Rimosso `.checkbox-mark` custom da tutti i componenti

- **Account Page Width**: Uniformata larghezza con Settings (1100px)

### In Sospeso / Da Verificare
- Testare visivamente il nuovo layout Settings su schermi diversi
- Verificare dark mode per tutte le nuove componenti
- Verificare responsive su mobile

---

## 2. FILE MODIFICATI

### Settings Page
| File | Modifiche |
|------|-----------|
| `frontend/src/pages/Settings.tsx` | Rimossa sidebar, layout a card verticali, header a sinistra |
| `frontend/src/pages/settings.scss` | Nuovo layout tipo Account, `.page-header`, `.settings-section`, `.section-header`, `.form-row` |
| `frontend/src/pages/settings/AIAssistantSettings.tsx` | Form a 2 colonne (Provider/Model), rimosso `.checkbox-mark` |
| `frontend/src/pages/settings/AppearanceSettings.tsx` | Rimosso section-header interno |
| `frontend/src/pages/settings/ShortcutsSettings.tsx` | Rimosso section-header interno |
| `frontend/src/pages/settings/AdvancedSettings.tsx` | Rimosso section-header interno, rimosso `.checkbox-mark` |
| `frontend/src/pages/settings/index.ts` | Nessuna modifica (barrel export) |

### Error System
| File | Modifiche |
|------|-----------|
| `frontend/src/common/ErrorPortal.tsx` | Nuovo componente ErrorDisplay con badge clickabile + modal |
| `frontend/src/common/error.scss` | Stili `.error-badge-slick`, `.error-notification-portal`, animazioni |
| `frontend/src/common/DV.tsx` | Usa ErrorDisplay invece di ErrorPortal diretto |

### Account Page
| File | Modifiche |
|------|-----------|
| `frontend/src/pages/account.scss` | `max-width: 1100px`, `align-self: flex-start` |

---

## 3. DECISIONI DI DESIGN

### Pattern Layout Pagine Settings-like
```
┌─────────────────────────────────────────────────────┐
│  [icon] Title                                       │
│  Subtitle/description                               │
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ [icon] Section Title          (gray header)    ││
│  ├─────────────────────────────────────────────────┤│
│  │ Content area (padding 24px)                    ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ [icon] Another Section                         ││
│  ├─────────────────────────────────────────────────┤│
│  │ Content...                                     ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Convenzioni CSS Stabilite
- **Larghezza pagine**: `max-width: 1100px` per Settings e Account
- **Allineamento**: `align-self: flex-start` per evitare centratura verticale
- **Card sections**: `border-radius: 12px`, `border: 1px solid #e2e8f0`
- **Section header**: `background: #f8fafc`, `padding: 16px 24px`
- **Form 2 colonne**: usa `.form-row` con `grid-template-columns: 1fr 1fr`
- **Checkbox**: usa nativo con `accent-color: #475569`, NO custom `.checkbox-mark`

### Colori Chiave (da CLAUDE.md)
```scss
// Accent slate gradient (bottoni primary, toggle)
background: linear-gradient(135deg, #64748b 0%, #475569 100%);

// Checkbox accent
accent-color: #475569;

// Section header background
background: #f8fafc;

// Borders
border-color: #e2e8f0;
```

---

## 4. SNIPPET CHIAVE

### Struttura Settings.tsx (semplificata)
```tsx
function SettingsContent() {
    return (
        <div className="settings-page">
            {/* Page Header - left aligned */}
            <div className="page-header">
                <div className="page-header-icon">
                    <i className="bi bi-gear" />
                </div>
                <div className="page-header-text">
                    <h1>Settings</h1>
                    <p>Manage your preferences and configuration</p>
                </div>
            </div>

            {/* Sections as cards */}
            <div className="settings-section">
                <div className="section-header">
                    <i className="bi bi-robot" />
                    <span>AI Assistant</span>
                </div>
                <div className="section-content">
                    <AIAssistantSettings />
                </div>
            </div>

            {/* More sections... */}
        </div>
    );
}
```

### Struttura Sezione Card (SCSS)
```scss
.settings-section {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 24px;
    overflow: hidden;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;

    i { font-size: 18px; color: #64748b; }
    span { font-size: 15px; font-weight: 600; color: #1e293b; }
}

.section-content {
    padding: 24px;
}
```

### Form Row 2 Colonne
```scss
.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}
```

### ErrorDisplay Component Interface
```tsx
interface ErrorDisplayProps {
    errorType: string;
    message: string;
    dname?: string;      // Instance name
    nodename?: string;   // Class name
    viewName?: string;   // View that caused error
}
```

---

## 5. PROSSIMI STEP

### Immediati (Alta Priorità)
1. **Testing visivo** - Aprire Settings e Account per verificare che il layout sia corretto
2. **Dark mode check** - Verificare che tutti i nuovi stili supportino dark mode
3. **Responsive test** - Controllare su viewport < 768px

### Possibili Miglioramenti (Media Priorità)
1. **Shortcuts editabili** - La sezione Shortcuts ha un "coming soon" per customizzazione
2. **Test Connection migliorato** - Aggiungere più feedback durante il test API
3. **Appearance options** - "Coming soon" elenca: accent colors, font size, canvas grid, compact mode

### Refactoring Futuro (Bassa Priorità)
1. Estrarre `.page-header` e `.settings-section` in componenti riusabili
2. Creare file SCSS condiviso per stili pagine settings-like
3. Unificare pattern tra Account e Settings in componenti comuni

---

## 6. CONTEXT PER LA NUOVA SESSIONE

### Prompt Iniziale Suggerito
```
Continuo lavoro su Settings page. Nella sessione precedente abbiamo:
- Ristrutturato Settings con layout a card verticali (come Account)
- Implementato Error Portal con badge clickabile
- Uniformato larghezza pagine a 1100px

Leggi docs/handover/2026-01-27-settings-page-redesign.md per il contesto completo.

[Inserire qui il task specifico da fare]
```

### File da Aprire Subito
```
frontend/src/pages/Settings.tsx
frontend/src/pages/settings.scss
frontend/src/pages/settings/AIAssistantSettings.tsx
```

### Comandi Utili
```bash
# Avviare dev server (se non già attivo)
cd frontend && npm run dev

# Vedere modifiche recenti
git status
git diff frontend/src/pages/settings.scss
```

### Branch Attuale
```
alfonso-frontend-dev (basato su dotnet-backend-integration)
```

---

## 7. RIFERIMENTI

### Design System
- Vedi `/CLAUDE.md` per design tokens completi
- Colori accent: slate (#475569, #64748b)
- Font: Inter Variable
- Icons: Bootstrap Icons ONLY (bi-*)

### File Correlati Non Modificati (ma rilevanti)
- `frontend/src/pages/Account.tsx` - Riferimento per layout
- `frontend/src/pages/account.scss` - Riferimento stili card
- `frontend/src/pages/components/Navbar.tsx` - Contiene link a Settings

---

*Documento generato automaticamente - 2026-01-27*
