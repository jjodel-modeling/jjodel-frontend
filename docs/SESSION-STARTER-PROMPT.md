# Jjodel Project - Session Starter Prompt

> Copia e incolla questo prompt all'inizio di una nuova chat per dare contesto completo all'agente AI.

---

## PROMPT

```
# Jjodel UI/UX Redesign - Session Context

## Progetto
**Jjodel** è un metamodeling tool SaaS per ricerca e didattica. Stiamo completando un redesign UI/UX completo usando **Agentic Conversational Development (ACD)** - una metodologia dove umani e agenti AI collaborano attraverso dialogo iterativo.

Repository: `/Users/alfonso/Jjodel Redux`
Branch: `alfonso-frontend-dev`

## Tech Stack
- React 18 + TypeScript (strict mode)
- Vite (build tool)
- SCSS + CSS Modules
- Redux (state management)
- Bootstrap Icons ONLY (mai Font Awesome, Material, Heroicons)
- Font: Inter Variable

## File Chiave da Leggere

**PRIMA di fare qualsiasi cosa, leggi questi file:**

1. `/CLAUDE.md` - Design system completo (colori, typography, spacing, component patterns)
2. `/docs/AGENTIC-CONVERSATIONAL-DEVELOPMENT.md` - Metodologia di sviluppo
3. `/docs/handover/HANDOVER-UI-REDESIGN-2026-01-24.md` - Ultimo handover (stato del lavoro)
4. `/docs/CHANGELOG.md` - Storia delle modifiche

## Design System (Sintesi)

### Colori
- **Slate base**: #475569 (primary), #334155 (hover)
- **Cyan accent**: #06b6d4 (focus, links)
- **Danger**: #ef4444 (errors, delete)
- **Backgrounds**: #ffffff (primary), #f8fafc (secondary), #f1f5f9 (tertiary)
- **Borders**: #e2e4e8

### Regole CRITICHE (NON NEGOZIABILI)

1. **Buttons**: TUTTI outline-style (background transparent + border), MAI filled
2. **Icons**: SOLO Bootstrap Icons (`<i className="bi bi-*" />`)
3. **Booleans**: SEMPRE Toggle switch custom, MAI checkbox nativi
4. **Spacing**: Multipli di 8px (8, 16, 24, 32)
5. **Focus**: Cyan ring (`box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.1)`)

## UI Component Library

Abbiamo creato una libreria di componenti in `/frontend/src/components/ui/`:

- **Button** - 4 variants (primary, secondary, danger, ghost), 3 sizes
- **Input** - Con supporto icone left/right, error states
- **Select** - Con chevron Bootstrap Icons custom
- **Textarea** - Con character counter
- **Toggle** - Switch custom (44x24px), NON checkbox
- **Field** - Wrapper per Label + Input + HelpText/ErrorText
- **FormSection** - Sezione con titolo uppercase e divider
- **Label, HelpText, ErrorText** - Componenti di supporto

Import: `import { Button, Input, Toggle, Field } from '../ui';`

## Stato Attuale (Gennaio 24, 2026)

### Completato
- ✅ UI Component Library (10 componenti + design tokens)
- ✅ Button standardization in Properties Panel (Info.tsx)
- ✅ NodeEditor export fix
- ✅ Input field optimization (compatti, font uniformato)
- ✅ Console empty state con quick-start examples
- ✅ Documentazione ACD completa

### Da Fare
- [ ] CSS per Console empty state (`.console-empty__*` classes)
- [ ] Wire `onExecuteCode` prop in Console.tsx
- [ ] Componenti rimanenti: Card, Badge, Modal, Tabs, Tooltip, IconButton, Spinner, Divider, MetricCard, InfoBanner
- [ ] Refactoring componenti esistenti per usare UI library
- [ ] Properties Panel patterns per tutti gli element types
- [ ] Viewpoints Interface improvements
- [ ] Bulk Operations con selection bar

## Come Lavorare

1. **Leggi sempre** il design system prima di implementare
2. **Chiedi** se qualcosa non è chiaro
3. **Itera** in piccoli step reviewabili
4. **Documenta** le decisioni non ovvie
5. **Crea handover** alla fine della sessione

## Comunicazione

- Fornirò screenshot per feedback visuale
- Sarò specifico nelle richieste ("cambia X in Y")
- Tu proponi, implementi, spieghi - io approvo o correggo
- Se hai dubbi, chiedi prima di implementare

---

Inizia leggendo `/CLAUDE.md` e `/docs/handover/HANDOVER-UI-REDESIGN-2026-01-24.md` per avere il contesto completo.
```

---

## Note per l'uso

### Quando usare questo prompt
- All'inizio di ogni nuova sessione/chat
- Quando cambi agente AI (es. da Claude a un altro)
- Dopo un lungo periodo senza lavorare sul progetto

### Come aggiornarlo
Dopo ogni sessione significativa:
1. Aggiorna la sezione "Stato Attuale" con cosa è stato completato
2. Aggiorna "Da Fare" con i nuovi task
3. Aggiorna la data dell'ultimo handover

### Personalizzazioni
- Aggiungi/rimuovi sezioni in base alle esigenze
- Includi screenshot di riferimento se necessario
- Aggiungi link a file specifici se stai lavorando su una feature particolare

---

**Ultimo aggiornamento**: January 24, 2026
