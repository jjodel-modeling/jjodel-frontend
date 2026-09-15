# HANDOVER DOCUMENT
## Settings Page Redesign - Session 2
**Data:** 2026-01-27
**Branch:** alfonso-frontend-dev

---

## 1. STATO ATTUALE

### Completato in questa sessione

1. **Settings Page - Sidebar Navigation**
   - Rimossa visualizzazione a card verticali scroll
   - Implementata sidebar a sinistra (200px) con navigazione tab
   - Click su voce mostra solo quella sezione
   - Sezione Shortcuts RIMOSSA (già in Help menu)
   - Sezioni finali: AI Assistant, Appearance, Advanced

2. **AI Providers Estesi**
   - Aggiunti provider: Google (Gemini), DeepSeek, Mistral, Groq
   - Totale 8 provider: OpenAI, Anthropic, Google, DeepSeek, Mistral, Groq, Ollama, Custom
   - Modelli con format `{ id, label }` per label leggibili
   - Flag `needsApiKey` / `needsBaseUrl` per logica condizionale
   - Test connection implementato per tutti i provider

3. **Header Settings Uniformato**
   - Rimosso cerchio sfondo dall'icona header
   - Ora usa icona semplice (32px, #475569) come Account
   - Stili uniformati tra Settings e Account

4. **Link Gear Icon Jjodie → Settings**
   - Click su ingranaggio in chat Jjodie ora naviga a `/settings`
   - Chat viene minimizzata (non chiusa)
   - Import `useNavigate` aggiunto a Jodie.tsx

5. **ConfirmDialog per Clear Data**
   - Sostituito `window.confirm()` con ConfirmDialog custom
   - Usa componente esistente `ConfirmDialog` con variant="danger"

6. **ErrorDisplay Solo in Editor**
   - Aggiunto check `window.location.pathname.startsWith('/project')`
   - Error badge ora appare SOLO nella pagina editor/progetto
   - Evita errore "useNavigate outside Router" al login

### In Sospeso

- **Alert per Import Settings fallito**: `alert('Invalid settings file')` ancora usa alert nativo (non critico)
- **Test visivo completo**: verificare tutte le modifiche in dark mode e responsive

---

## 2. FILE MODIFICATI

### Settings Page Core
| File | Modifiche |
|------|-----------|
| `frontend/src/pages/Settings.tsx` | Sidebar navigation con state, rimosso ShortcutsSettings |
| `frontend/src/pages/settings.scss` | Layout sidebar, header senza cerchio, responsive, dark mode |

### AI Settings
| File | Modifiche |
|------|-----------|
| `frontend/src/pages/settings/AIAssistantSettings.tsx` | 8 provider, modelli con labels, testConnection per tutti |

### Advanced Settings
| File | Modifiche |
|------|-----------|
| `frontend/src/pages/settings/AdvancedSettings.tsx` | ConfirmDialog invece di window.confirm |

### Jjodie Chat
| File | Modifiche |
|------|-----------|
| `frontend/src/components/Jodie/Jodie.tsx` | useNavigate, handleOpenSettings naviga a /settings |

### Error System
| File | Modifiche |
|------|-----------|
| `frontend/src/common/ErrorPortal.tsx` | Check isInEditor, return null se non in /project |

---

## 3. DECISIONI DI DESIGN

### Layout Settings con Sidebar
```
┌─────────────────────────────────────────────────────────────────┐
│  ⚙ Settings                                                     │
│  Manage your preferences and configuration                      │
├────────────────┬────────────────────────────────────────────────┤
│ ● AI Assistant │  ┌──────────────────────────────────────────┐  │
│   Appearance   │  │ 🤖 AI Assistant (header)                 │  │
│   Advanced     │  ├──────────────────────────────────────────┤  │
│                │  │ Content...                               │  │
│                │  └──────────────────────────────────────────┘  │
└────────────────┴────────────────────────────────────────────────┘
```

### Header Page Pattern (senza cerchio)
```scss
.page-header-icon {
    font-size: 32px;
    color: #475569;
    line-height: 1;
    // NO background, NO border-radius, NO width/height
}
```

### Sidebar Active State
```scss
.sidebar-item.active {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
    color: white;
    i { color: white; }
}
```

### Provider Structure
```typescript
{
    id: 'mistral' as const,
    name: 'Mistral AI',
    models: [
        { id: 'mistral-large-latest', label: 'Mistral Large' },
        // ...
    ],
    keyUrl: 'https://console.mistral.ai/api-keys',
    needsApiKey: true,
    needsBaseUrl: false,
}
```

---

## 4. SNIPPET CHIAVE

### Settings.tsx Structure
```tsx
type SettingsSection = 'ai-assistant' | 'appearance' | 'advanced';

const sections = [
    { id: 'ai-assistant' as const, label: 'AI Assistant', icon: 'bi-robot' },
    { id: 'appearance' as const, label: 'Appearance', icon: 'bi-palette' },
    { id: 'advanced' as const, label: 'Advanced', icon: 'bi-sliders' },
];

function SettingsContent() {
    const [activeSection, setActiveSection] = useState<SettingsSection>('ai-assistant');
    // ... sidebar navigation + single section render
}
```

### ErrorDisplay Route Check
```tsx
// Only show error badge in the editor (project page)
const isInEditor = typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/project');

if (!isInEditor) {
    return null;
}
```

### AISettings Provider Type
```typescript
export interface AISettings {
    provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'mistral' | 'groq' | 'ollama' | 'custom';
    model: string;
    apiKey: string;
    enabled: boolean;
    autoSuggestOnErrors: boolean;
    baseUrl?: string;
}
```

### Jodie Settings Navigation
```tsx
const navigate = useNavigate();

const handleOpenSettings = useCallback(() => {
    setChatState(prev => ({ ...prev, isMinimized: true }));
    navigate('/settings');
}, [navigate]);
```

---

## 5. PROSSIMI STEP

### Immediati (Alta Priorità)
1. **Test visivo completo** - Verificare Settings in light/dark mode
2. **Test responsive** - Sidebar diventa horizontal tabs su mobile (< 768px)
3. **Verificare AI providers** - Testare selezione e modelli per ogni provider

### Media Priorità
1. **Toast per Import Settings** - Sostituire `alert('Invalid settings file')` con toast
2. **Regola icone bottoni** - Verificare contrasto icone su bottoni primary/secondary
3. **SettingsModal cleanup** - Rimuovere SettingsModal da Jodie.tsx se non più usato altrove

### Bassa Priorità
1. **Estrazione componenti** - PageHeader, SettingsSection come componenti riusabili
2. **SCSS condiviso** - Creare `_settings-common.scss` per pattern condivisi

---

## 6. CONTEXT PER LA NUOVA SESSIONE

### Prompt Iniziale Suggerito
```
Continuo lavoro su Settings page. Nella sessione precedente abbiamo:
- Implementato sidebar navigation (3 sezioni: AI Assistant, Appearance, Advanced)
- Aggiunto 8 provider AI (inclusi Mistral, Groq)
- Uniformato header Settings con Account (icona senza cerchio)
- Collegato gear icon Jjodie → navigazione a /settings
- Reso ErrorDisplay visibile solo in /project (editor)
- Sostituito window.confirm con ConfirmDialog custom

Leggi docs/handover/2026-01-27-settings-session-2.md per il contesto completo.

[Inserire qui il task specifico da fare]
```

### File da Aprire Subito
```
frontend/src/pages/Settings.tsx
frontend/src/pages/settings.scss
frontend/src/pages/settings/AIAssistantSettings.tsx
frontend/src/common/ErrorPortal.tsx
```

### Comandi Utili
```bash
# Avviare dev server
cd frontend && npm run dev

# Vedere modifiche
git status
git diff frontend/src/pages/Settings.tsx
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
- Sidebar active: gradient slate
- Font: Inter Variable
- Icons: Bootstrap Icons ONLY (bi-*)

### Componenti Esistenti Usati
- `ConfirmDialog` - `/frontend/src/components/ConfirmDialog/ConfirmDialog.tsx`
- `ErrorPortal` / `ErrorDisplay` - `/frontend/src/common/ErrorPortal.tsx`

---

*Documento generato - 2026-01-27*
