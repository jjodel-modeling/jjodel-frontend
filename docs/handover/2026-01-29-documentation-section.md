# HANDOVER: DocumentationSection Component

## DATA
2026-01-29

## CONTESTO
Implementazione del componente DocumentationSection per il Project Dashboard di Jjodel. Permette di generare documentazione automatica dal metamodel con supporto per generazione locale o tramite Jjodie (AI).

---

## LAVORO COMPLETATO

### 1. DocumentationSection Component

**File creati:**

#### `frontend/src/components/project/DocumentationSection.tsx`
Componente React per la sezione documentazione nel Project Editor.

**Features implementate:**
- Generazione documentazione Markdown dal metamodel
- Persistenza in localStorage con chiave `jjodel_doc_{projectId}`
- Hash del progetto per rilevare modifiche (outdated detection)
- Confidence score basato su:
  - Numero di classi (15-25 punti)
  - Presenza di attributes (10 punti)
  - Presenza di references (10 punti)
  - Domain inference (fino a 20 punti extra)
- Domain inference automatico (E-commerce, Healthcare, Finance, Education)
- Toggle Local/Jjodie per modalità generazione
- Tooltip informativo sulla privacy dei dati AI
- Download del file .md generato

**Struttura del Markdown generato:**
```markdown
# {ProjectName} Documentation

## Overview
> **Confidence**: 🟢/🟡/🔴 XX%
Domain: **{Domain}**. Contains X classes, Y attributes, Z references.

## Classes
### ClassName *(abstract)*
| Attribute | Type |
|-----------|------|
| name | string |

## Enumerations
**EnumName**: `literal1`, `literal2`

## Notes
@protected
*Add notes here*
@end
```

**Stati del componente:**
- `isGenerating` - loading state durante generazione
- `documentation` - dati documentazione salvati
- `useJjodie` - toggle per modalità AI
- `showTooltip` - visibilità tooltip info

---

#### `frontend/src/components/project/DocumentationSection.scss`
Stili per il componente con supporto dark mode.

**Classi principali:**
- `.list-card__icon--doc` - Icona blu con lettera "D"
- `.list-card__toggle` - Container toggle Local/Jjodie (overflow: visible)
- `.toggle-switch` - Switch animato con slider (active: #334155 slate)
- `.toggle-label` - Label attiva/inattiva
- `.info-icon` / `.info-tooltip` - Tooltip privacy (z-index: 9999, pointer-events: none)
- `.confidence-badge--{high|medium|low}` - Badge colorati
- `.btn--warning` - Bottone arancione per "Update"
- `@keyframes spin` - Animazione loading

**Fix overflow per tooltip:**
- `.list-card__toggle`, `.list-card__item`, `.list-card`, `.project-section` hanno `overflow: visible`

---

### 2. Integrazione in ProjectEditor

#### `frontend/src/components/project/ProjectEditor.tsx`
- Aggiunto import: `import DocumentationSection from './DocumentationSection';`
- Inserito componente dopo sezione VIEWPOINTS (linea ~920):
```tsx
{/* Documentation Section */}
<DocumentationSection project={project} />
```

---

## INTERFACCE E TIPI

```typescript
interface ProjectDocumentation {
    content: string;      // Markdown generato
    generatedAt: number;  // Timestamp
    projectHash: string;  // Hash per detect changes
    confidence: number;   // 0-100
}

interface Props {
    project: LProject;
}
```

---

## FUNZIONI HELPER

| Funzione | Scopo |
|----------|-------|
| `loadDocumentation(projectId)` | Carica da localStorage |
| `saveDocumentation(projectId, doc)` | Salva in localStorage |
| `calculateProjectHash(project)` | Genera hash per detect changes |
| `formatTimeAgo(timestamp)` | Formatta "Xm ago", "Xh ago" |
| `inferDomain(classNames)` | Inferisce dominio da nomi classi |
| `calculateConfidence(project)` | Calcola score 0-100 |
| `generateDocumentation(project)` | Genera Markdown |
| `isAIProviderConfigured()` | Verifica se AI provider è configurato in localStorage |

---

## UI STATES

### Empty State (no documentation)
- Icona `bi-file-text`
- Titolo "No documentation yet"
- Bottone "+ Generate"

### With Documentation
- Card cliccabile con icona "D" blu
- Nome "Project Documentation"
- Meta: "Generated Xm ago · 🟢 XX%"
- Toggle Local/Jjodie
- Badge "Outdated" se hash non corrisponde
- Bottoni: "Update" (se outdated), "View"

---

## FILE CHIAVE

| File | Scopo |
|------|-------|
| `frontend/src/components/project/DocumentationSection.tsx` | Componente principale |
| `frontend/src/components/project/DocumentationSection.scss` | Stili e dark mode |
| `frontend/src/components/project/ProjectEditor.tsx` | Container che include DocumentationSection |

---

## TODO / PROSSIMI PASSI

1. ⬜ Implementare generazione via Jjodie (quando `useJjodie=true`)
2. ⬜ Aggiungere preview inline del Markdown
3. ⬜ Supporto per sezioni @protected che non vengono sovrascritte
4. ⬜ Export in altri formati (PDF, HTML)
5. ⬜ Integrazione con sistema di versioning del progetto

---

## NOTE TECNICHE

- Il confidence score parte da 30 punti base
- Domain keywords sono hardcoded in `DOMAIN_KEYWORDS`
- localStorage key format: `jjodel_doc_{projectId}`
- Il toggle Jjodie per ora cambia solo lo state, non la logica di generazione
- Il tooltip avvisa sulla privacy dei dati quando si usa AI

---

## CHANGELOG

| Ora | Modifica |
|-----|----------|
| - | Creazione componente e stili base |
| - | Fix overflow per tooltip (z-index 9999, parent overflow visible) |
| - | Toggle switch color: #334155 (slate) invece di cyan |
| - | Aggiunto `isAIProviderConfigured()` per verificare settings AI |
| - | Toggle e label "Jjodie" disabilitati se no AI provider |
| - | Tooltip mostra messaggio diverso se AI non configurato |
| - | Tooltip posizionato sotto (top: 100%) invece che sopra |
| - | Stili `.disabled` per toggle-switch e toggle-label |

---

*Ultimo aggiornamento: 2026-01-29*
