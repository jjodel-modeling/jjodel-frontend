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
> **Domain**: {Domain}

Contains X classes, Y attributes, Z references.

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
- `error` - messaggio di errore (null se nessun errore)

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
    confidence: number;   // 0-100 (solo per Jjodie)
    generatedWith: 'local' | 'jjodie';  // Traccia modalità generazione
}

interface Props {
    project: LProject;
}
```

---

## FUNZIONI HELPER

> **NOTA**: La maggior parte delle funzioni sono ora nel servizio centralizzato `DocumentationService.ts`

### DocumentationService (Centralizzato)

| Metodo | Scopo |
|--------|-------|
| `DocumentationService.load(projectId)` | Carica da localStorage |
| `DocumentationService.save(projectId, doc)` | Salva in localStorage |
| `DocumentationService.delete(projectId)` | Elimina da localStorage |
| `DocumentationService.calculateHash(project)` | Genera hash per detect changes |
| `DocumentationService.hasCriticalMass(project)` | Verifica almeno 1 classe + 1 attributo |
| `DocumentationService.isAIAvailable()` | Verifica se AI provider configurato |
| `DocumentationService.generate(project, useJjodie)` | Genera docs (Local o AI) |
| `DocumentationService.generateLocal(project)` | Generazione istantanea locale |
| `DocumentationService.generateWithJjodie(project)` | Generazione con AI |
| `DocumentationService.extractProtectedSections(content)` | Estrae sezioni @protected |
| `DocumentationService.mergeProtectedSections(new, old)` | Preserva sezioni utente |
| `DocumentationService.countProtectedSections(content)` | Conta sezioni protette |

### Helper Locali (nei componenti)

| Funzione | File | Scopo |
|----------|------|-------|
| `formatTimeAgo(timestamp)` | DocumentationSection.tsx | Formatta "Xm ago", "Xh ago" |
| `parseMarkdown(text)` | DocumentationTab.tsx | Converte Markdown in HTML |
| `getDocumentationStatus(doc, hash, editing)` | DocumentationTab.tsx | Calcola status (outdated, synced, etc.) |

---

## UI STATES

### Empty State (no documentation)
- Icona `bi-file-text`
- Titolo "No documentation yet"
- Bottone "+ Generate"

### With Documentation
- Card cliccabile con icona "D" blu pastello
- Nome "Project Documentation"
- Meta: "Generated Xm ago" (+ confidence % solo se generato con Jjodie)
- Toggle Local/Jjodie
- Badge "Outdated" se hash non corrisponde
- Bottoni: "Update" (se outdated, stile slate opacity), "View"

---

## FILE CHIAVE

| File | Scopo |
|------|-------|
| `frontend/src/components/project/DocumentationSection.tsx` | Componente sezione nel ProjectEditor |
| `frontend/src/components/project/DocumentationSection.scss` | Stili toggle e tooltip |
| `frontend/src/components/project/ProjectEditor.tsx` | Container che include DocumentationSection |
| `frontend/src/components/abstract/DockManager.ts` | Metodo `openDocumentation()` per aprire tab |
| `frontend/src/components/abstract/tabs/DocumentationTab.tsx` | Tab completa con editor markdown |
| `frontend/src/components/abstract/tabs/DocumentationTab.scss` | Stili tab documentazione |
| `frontend/src/components/abstract/tabs/tab-title.scss` | Stili badge tab (M, D) via `::before` pseudo-element |
| `frontend/src/services/DocumentationService.ts` | Servizio centralizzato per generazione docs |
| `frontend/src/services/AIProviderPreferences.ts` | **NUOVO** Servizio per preferenze AI provider |
| `frontend/src/hooks/useAIProviderPreference.ts` | **NUOVO** Hook per preferenze AI provider |
| `frontend/src/components/common/ProviderSelector.tsx` | **NUOVO** Componente dropdown provider |
| `frontend/src/components/settings/AISettingsContent.tsx` | **NUOVO** Componente puro configurazione AI |
| `frontend/src/components/settings/AISettingsModal.tsx` | **NUOVO** Modale AI settings |
| `frontend/src/contexts/AISettingsContext.tsx` | **NUOVO** Context per modale AI settings |

---

## TODO / PROSSIMI PASSI

1. ✅ Implementare generazione via Jjodie (quando `useJjodie=true`)
2. ✅ Monaco Editor per editing documentazione
3. ✅ Aggiungere preview inline del Markdown (Split View)
4. ✅ Supporto per sezioni @protected che non vengono sovrascritte
5. ✅ Export in altri formati (PDF, HTML)
6. ⬜ Integrazione con sistema di versioning del progetto

---

## REFACTORING: DocumentationService (Centralizzato)

### Problema Risolto
Prima c'erano **due flussi separati** per generare documentazione:
- `DocumentationSection.tsx` → `generateWithJjodie()` inline (funzionava con AI)
- `DocumentationTab.tsx` → `JjodieContextService.generateDocumentationWithSections()` (solo locale)

Quando l'utente cliccava "Regenerate" nel tab, usava il servizio sbagliato.

### Soluzione
Creato `frontend/src/services/DocumentationService.ts` con:

```typescript
export class DocumentationService {
    // PUBLIC API
    static isAIAvailable(): boolean;
    static async generate(project: LProject, useJjodie: boolean): Promise<GenerationResult>;
    static generateLocal(project: LProject): GenerationResult;
    static load(projectId: string): ProjectDocumentation | null;
    static save(projectId: string, doc: ProjectDocumentation): void;
    static delete(projectId: string): void;
    static calculateHash(project: LProject): string;
    static hasCriticalMass(project: LProject): boolean;

    // PROTECTED SECTIONS
    static extractProtectedSections(content: string): Array<{ id: string; content: string }>;
    static mergeProtectedSections(newContent: string, oldContent: string): string;
    static countProtectedSections(content: string): number;
}
```

### Modifiche ai Componenti

**DocumentationSection.tsx** (da 768 a 216 righe):
- Rimosso tutto il codice di generazione inline
- Ora usa `DocumentationService.generate()`, `.load()`, `.save()`

**DocumentationTab.tsx**:
- Rimosso import `JjodieContextService` per generazione
- `handleGenerate` e `handleRegenerate` usano `DocumentationService.generate()`
- `handleSaveEdit` usa `DocumentationService.save()`
- Rimossi helper locali duplicati (`extractProtectedSections`, `countProtectedSections`, etc.)

---

## ENHANCED MONACO EDITOR (Floating Toolbar)

### Features Implementate

| Feature | Icona | Funzione |
|---------|-------|----------|
| Word Wrap | `bi-text-wrap` | Toggle wrap on/off |
| Copy | `bi-clipboard` | Copia contenuto editor |
| Split View | `bi-layout-split` | Mostra/nasconde preview live |
| Fullscreen | `bi-fullscreen` | Espande/riduce editor |
| Cancel | `bi-x-lg` | Annulla modifiche (in main toolbar) |
| Save | `bi-check-lg` | Salva modifiche (in main toolbar) |

### Nuovi State in DocumentationTab.tsx

```typescript
const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
const [splitView, setSplitView] = useState(false);
const [fullscreen, setFullscreen] = useState(false);
const [editorCopyStatus, setEditorCopyStatus] = useState<'idle' | 'copied'>('idle');
```

### Layout Editor (Edit Mode)

```
┌─────────────────────────────────────────────────────────────┐
│  [Status] Title                        │  Cancel  │  Save  │  ← Main toolbar
├─────────────────────────────────────────────────────────────┤
│                                  ┌──────────────────┐       │
│  # A Family Project              │ [⤶] [📋] [⊞] [↔] │       │  ← Floating toolbar
│                                  └──────────────────┘       │
│  ## Overview                                                │
│                                                             │
│  > **Domain**: ...                                          │
│                                                             │
│                    EDITOR                                   │
└─────────────────────────────────────────────────────────────┘

With Split View active:
┌─────────────────────────────┬───────────────────────────────┐
│                   ┌───────┐ │  Preview                      │
│  # A Family...    │[⤶][📋]│ │  ─────────                    │
│                   └───────┘ │                               │
│  ## Overview                │  A Family Project             │
│                             │  ════════════════             │
│  > **Domain**:              │                               │
│                             │  Overview                     │
│     EDITOR (50%)            │     PREVIEW (50%)             │
└─────────────────────────────┴───────────────────────────────┘
```

### Nuovi Stili SCSS

- `.documentation-editor-wrapper` - container con padding 16px, supporta `.fullscreen`
- `.editor-container` - container flex con max-width 1200px, modifier `.split`
- `.editor-pane` - position relative per floating toolbar
- `.editor-light-toolbar` - toolbar floating in alto a destra nell'editor
- `.light-toolbar-btn` - bottoni icona 32x32px con stato `.active`
- `.preview-pane` / `.preview-header` / `.preview-content` - split view preview
- Dark mode completo per tutti i nuovi elementi

---

## TIMESTAMP STATUS

Nella toolbar principale, accanto ai badge Synced/Outdated viene mostrato il timestamp dell'ultima generazione.

### Helper Function

```typescript
function formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
```

### Esempio UI

```
[✓ Synced] 14:32          // Se generato oggi
[⚠ Outdated] Last: Jan 28, 14:32   // Se generato in un altro giorno
```

---

## AI PROVIDER SELECTOR

Dropdown menu nella toolbar per selezionare il provider AI da usare per la generazione.

### State

```typescript
const [selectedProvider, setSelectedProvider] = useState<'local' | AIProvider>('local');
const [showProviderMenu, setShowProviderMenu] = useState(false);
```

### Available Providers

```typescript
const availableProviders = useMemo(() => {
    const providers = [{ id: 'local', name: 'Local (Instant)', available: true }];

    for (const providerId of ALL_PROVIDERS) {
        if (JodieConfigService.isProviderEnabled(providerId)) {
            providers.push({ id: providerId, name: displayName, available: true });
        }
    }

    return providers;
}, []);
```

### Layout Menu

```
┌─────────────────────┐
│ AI PROVIDER         │
├─────────────────────┤
│ ⚡ Local (Instant) ✓│
│ ✨ OpenAI           │
│ ✨ Anthropic        │
│ ✨ Mistral          │
├─────────────────────┤
│ ⚙ Configure...     │
└─────────────────────┘
```

---

## PROGRESS MODAL

Modale che mostra i passi di generazione in tempo reale durante Regenerate.

### Tipi

```typescript
interface GenerationStep {
    id: string;
    label: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    detail?: string;
}
```

### State

```typescript
const [showProgressModal, setShowProgressModal] = useState(false);
const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
```

### Steps (AI Mode)

1. Extracting metamodel structure
2. Fetching Wikidata definitions
3. Building AI prompt
4. Generating with [Provider]
5. Parsing response
6. Merging protected sections
7. Saving documentation

### Steps (Local Mode)

1. Extracting metamodel structure
2. Inferring domain
3. Generating documentation
4. Merging protected sections
5. Saving documentation

### Auto-close

Il modale si chiude automaticamente 1.5 secondi dopo il completamento. In caso di errore, rimane aperto e può essere chiuso manualmente.

### Layout Modal

```
┌─────────────────────────────────────┐
│ ✨ Generating Documentation...      │
├─────────────────────────────────────┤
│ ✓ Extracting metamodel structure   │
│ ✓ Fetching Wikidata definitions    │
│ ● Building AI prompt               │
│ ○ Generating with OpenAI           │
│ ○ Parsing response                 │
│ ○ Saving documentation             │
├─────────────────────────────────────┤
│         Closing automatically...    │
└─────────────────────────────────────┘
```

---

## JJODIE AI GENERATION

### Processo di Generazione

Quando l'utente seleziona **Jjodie** e clicca Generate/Update:

1. **Estrazione dati lessicali** (`extractLexicalData`)
   - Estrae nome progetto, metamodels, classi, attributi, references, enumerazioni
   - Struttura dati tipizzata con `ProjectLexicalData`

2. **Costruzione prompt** (`buildJjodiePrompt`)
   - Formatta i dati in un prompt strutturato per l'AI
   - Richiede identificazione dominio, descrizioni, confidence score
   - Output atteso in formato JSON

3. **Chiamata API** (`generateWithJjodie`)
   - Recupera provider attivo da `localStorage.getItem('jjodie_active_provider')`
   - Recupera config da `localStorage.getItem('jjodie_provider_{name}')`
   - POST a `/api/jjodie/generate`
   - Fallback a generazione locale se errore

4. **Conversione risposta** (`convertJjodieToMarkdown`)
   - Converte `JjodieResponse` in markdown
   - Include dominio, confidence, descrizioni AI
   - Preserva sezione `@protected` per note utente

### Interfacce Jjodie

```typescript
interface ProjectLexicalData {
    project: { name: string; description?: string; };
    metamodels: Array<{
        name: string;
        classes: Array<{
            name: string;
            isAbstract: boolean;
            attributes: Array<{ name: string; type: string; multiplicity?: string; }>;
            references: Array<{ name: string; targetClass: string; type: string; multiplicity?: string; }>;
            superClass?: string;
        }>;
        enumerations: Array<{ name: string; literals: string[]; }>;
    }>;
}

interface JjodieResponse {
    domain: string;
    domainConfidence: number;
    projectDescription: string;
    metamodels: Array<{
        name: string;
        description: string;
        classes: Array<{
            name: string;
            description: string;
            attributeDescriptions: Record<string, string>;
            referenceDescriptions: Record<string, string>;
        }>;
    }>;
}
```

### Error Handling

- Se la chiamata API fallisce, si effettua fallback a generazione locale
- Errore mostrato in `.empty-state__error` con icona `bi-exclamation-circle`
- Stato `error` memorizza il messaggio di errore

---

## NOTE TECNICHE

### REGOLA CRITICA: NO EMOJI

**MAI usare emoji nell'UI di Jjodel.** Usare sempre Bootstrap Icons (`bi-*`).

Esempi di conversione:
- 🟢/🟡/🔴 → CSS color classes (`.confidence-high`, `.confidence-medium`, `.confidence-low`)
- 🔒/🔓 → `<i class="bi bi-lock-fill"></i>` / `<i class="bi bi-unlock-fill"></i>`
- ✅/❌ → `<i class="bi bi-check-circle"></i>` / `<i class="bi bi-x-circle"></i>`

### Protected Section Rendering

I marker `@protected` e `@end` nel markdown vengono renderizzati con Bootstrap Icons in DocumentationTab:

```typescript
// parseMarkdown() in DocumentationTab.tsx
html = html.replace(
    /@protected/g,
    '<span class="protected-marker protected-start"><i class="bi bi-lock-fill"></i> Protected</span>'
);
html = html.replace(
    /@end/g,
    '<span class="protected-marker protected-end"><i class="bi bi-lock-fill"></i></span>'
);
```

---

- Il confidence score (local) parte da 30 punti base
- Domain keywords sono hardcoded in `DOMAIN_KEYWORDS`
- localStorage key format: `jjodel_doc_{projectId}`
- Il toggle Jjodie attiva la generazione AI tramite `AIProviderService.chat()`
- Il tooltip avvisa sulla privacy dei dati quando si usa AI
- Provider config gestito da `JodieConfigService`

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
| - | Aggiunto `hasCriticalMass()` - richiede 1 classe + 1 attributo |
| - | Generate button disabilitato se no critical mass |
| - | Rinominate classi CSS: `doc-toggle`, `doc-spinning`, `doc-info-*` |
| - | handleView usa `DockManager.openDocumentation()` invece di download |
| - | Aggiunto import DockManager |
| - | DockManager: aggiunto metodo `openDocumentation(project, documentation)` |
| - | Fix tab styling: usa `data-type="documentation"` per CSS badge (allineato a Metamodel/Model tabs) |
| - | Tab icon "D" ora blu pastello (#bfdbfe bg, #1e40af text) come altri tab |
| - | `.btn--warning` ora usa slate con opacity invece di solid |
| - | Fix toggle dark mode: background più chiaro quando attivo (#64748b) |
| - | Toolbar buttons in DocumentationTab ora usano slate (#334155) |
| - | Modal button primary ora slate invece di cyan |
| - | Aggiunto campo `generatedWith: 'local' \| 'jjodie'` |
| - | Confidence badge mostrato solo per generazione Jjodie |
| - | `isAIProviderConfigured()` aggiornato per usare `jjodie_active_provider` |
| - | Implementato processo completo generazione Jjodie AI |
| - | Aggiunto `extractLexicalData()` per estrarre dati progetto |
| - | Aggiunto `buildJjodiePrompt()` per costruire prompt AI |
| - | Aggiunto `generateWithJjodie()` async con chiamata API |
| - | Aggiunto `convertJjodieToMarkdown()` per parsing risposta AI |
| - | `handleGenerate` ora async con try/catch e fallback locale |
| - | Aggiunto stato `error` e `.empty-state__error` per errori |
| 16:45 | **CRITICO**: Rimossi tutti emoji da generateDocumentation() |
| 16:45 | Rimosso confidence badge emoji (🟢/🟡/🔴) - ora usa CSS color classes |
| 16:45 | DocumentationTab: ConfidenceBadge usa CSS invece di emoji |
| 16:45 | DocumentationTab: @protected markers renderizzati con Bootstrap Icons (`bi-lock-fill`) |
| 16:45 | Overview section semplificata - no emoji, solo testo |
| 17:15 | Rimosso emoji anche da confidence badge in DocumentationSection.tsx |
| 17:15 | `DOMAIN_KEYWORDS` ora include descrizioni per ogni dominio |
| 17:15 | `inferDomain()` ritorna anche `description` oltre a `name` e `confidence` |
| 17:15 | Aggiunto `generateClassDescription()` per descrizioni template delle classi |
| 17:15 | `generateDocumentation()` migliorata con: |
| 17:15 | - Tabella statistiche (Classes, Attributes, References, Enumerations) |
| 17:15 | - Descrizioni classi generate automaticamente |
| 17:15 | - Supporto inheritance (Extends) |
| 17:15 | - Tabella References con tipo (composition/association) e multiplicity |
| 17:15 | - Icone ◇ (abstract) e ■ (concrete) per classi |
| 17:15 | - Separazione per Metamodel |
| 17:15 | Aggiunto `fetchWikidataDefinitions()` per integrare Wikidata |
| 17:15 | `buildJjodiePrompt()` ora accetta `wikidataDefinitions` opzionale |
| 17:15 | `generateWithJjodie()` estrae termini e li cerca su Wikidata prima di chiamare AI |
| 17:15 | Prompt AI migliorato con istruzioni più dettagliate |
| 18:00 | **Monaco Editor implementato** in DocumentationTab.tsx |
| 18:00 | Sostituito `<textarea>` con `<Editor>` da `@monaco-editor/react` |
| 18:00 | Aggiunto `markdownMonacoOptions` in `monacoConfig.ts` |
| 18:00 | Aggiornato SCSS con `.documentation-editor-container` |
| 18:00 | Dark mode supportato per Monaco Editor |
| 18:30 | **FIX CRITICO**: `generateWithJjodie()` ora usa `AIProviderService.chat()` |
| 18:30 | Rimosso endpoint inesistente `/api/jjodie/generate` |
| 18:30 | Import aggiunti: `AIProviderService`, `JodieConfigService` |
| 18:30 | `isAIProviderConfigured()` ora usa `JodieConfigService.hasValidConfiguration()` |
| 18:30 | Gestione JSON parsing per code blocks markdown nella risposta AI |
| 19:00 | **REFACTORING**: Creato `DocumentationService.ts` centralizzato |
| 19:00 | Tutta la logica di generazione spostata nel service |
| 19:00 | `DocumentationSection.tsx` semplificato (da 768 a 216 righe) |
| 19:00 | `DocumentationTab.tsx` ora usa `DocumentationService` invece di `JjodieContextService` |
| 19:00 | "Regenerate" nel tab ora usa Jjodie se AI disponibile |
| 19:00 | Aggiunto `mergeProtectedSections()` per preservare note utente |
| 19:30 | **ENHANCED EDITOR**: Monaco Editor con toolbar dedicata |
| 19:30 | Aggiunto toggle Word Wrap (`bi-text-wrap`) |
| 19:30 | Aggiunto toggle Split View (`bi-layout-split`) con preview live |
| 19:30 | Aggiunto Copy button in editor toolbar |
| 19:30 | Editor wrapper con max-width 1200px, centrato |
| 19:30 | Nuovi state: `wordWrap`, `splitView`, `editorCopyStatus` |
| 19:30 | Handler `handleEditorCopy()` per copia contenuto |
| 19:30 | Stili completi per light/dark mode |
| 19:30 | Toolbar principale mostra hint "Use editor toolbar" quando in edit mode |
| 19:45 | Rimosso badge "Editing" dalla editor toolbar (ridondante) |
| 19:45 | Editor toolbar mostra solo conteggio righe a sinistra |
| 20:00 | **FLOATING TOOLBAR**: Convertita toolbar da header a floating |
| 20:00 | Toolbar ora posizionata top-right dentro l'editor (`.editor-light-toolbar`) |
| 20:00 | Aggiunto state `fullscreen` e bottone fullscreen |
| 20:00 | Cancel/Save spostati nella main toolbar (non più in editor toolbar) |
| 20:00 | Nuove classi CSS: `.light-toolbar-btn`, `.editor-light-toolbar` |
| 20:00 | Supporto fullscreen con `.documentation-editor-wrapper.fullscreen` |
| 20:00 | Rimossi stili obsoleti: `.editor-toolbar`, `.toolbar-icon-btn`, `.toolbar-separator` |
| 20:30 | **TIMESTAMP**: Aggiunto `formatDateTime()` helper |
| 20:30 | Timestamp mostrato accanto ai badge Synced/Outdated nella toolbar |
| 20:30 | Nuova classe CSS: `.status-timestamp` |
| 20:45 | **AI PROVIDER SELECTOR**: Dropdown per selezione provider |
| 20:45 | Nuovi state: `selectedProvider`, `showProviderMenu` |
| 20:45 | useMemo `availableProviders` con provider configurati da JodieConfigService |
| 20:45 | Import aggiunti: `JodieConfigService`, `ALL_PROVIDERS`, `AIProvider` |
| 20:45 | Nuove classi CSS: `.provider-selector`, `.provider-btn`, `.provider-menu`, `.provider-option` |
| 21:00 | **PROGRESS MODAL**: Modale con step in tempo reale durante Regenerate |
| 21:00 | Nuovi state: `showProgressModal`, `generationSteps` |
| 21:00 | Tipo `GenerationStep` con status: pending/running/completed/error |
| 21:00 | Componente `GenerationProgressModal` con auto-close dopo completamento |
| 21:00 | `handleRegenerate` aggiornato con tracking degli step |
| 21:00 | useMemo `isGenerationComplete` per rilevare completamento |
| 21:00 | Nuove classi CSS: `.progress-modal`, `.progress-step`, `.step-indicator`, etc. |
| 21:00 | Dark mode completo per tutte le nuove features |
| 21:30 | **FIX ICONA**: `.doc-icon` ridimensionata per allinearsi a M e V |
| 21:30 | - width/height: 48px → 40px |
| 21:30 | - border-radius: 10px → 8px |
| 21:30 | - font-size: 20px → 16px |
| 21:35 | **FIX PROGRESS MODAL**: Step "Parsing response" ora viene aggiornato correttamente |
| 21:35 | Aggiunto blocco `if (useAI)` per `updateStep('parse', 'running/completed')` in `handleRegenerate` |
| 22:00 | **AI PROVIDER PREFERENCES**: Sistema centralizzato per gestione preferenze AI |
| 22:00 | Creato `AIProviderPreferences.ts` service in `/services/` |
| 22:00 | Creato `useAIProviderPreference.ts` hook in `/hooks/` |
| 22:00 | Creato `ProviderSelector.tsx` componente riutilizzabile in `/components/common/` |
| 22:00 | Creato `ProviderSelector.scss` stili con dark mode |
| 22:00 | `DocumentationTab.tsx` ora usa `useAIProviderPreference('documentation')` |
| 22:00 | Preferenze AI provider persistite in localStorage per ogni feature |
| 22:30 | **AI SETTINGS MODAL**: Sistema modale condiviso per configurazione AI providers |
| 22:30 | Creato `AISettingsContent.tsx` componente puro riutilizzabile |
| 22:30 | Creato `AISettingsContent.scss` stili con dark mode |
| 22:30 | Creato `AISettingsModal.tsx` wrapper modale |
| 22:30 | Creato `AISettingsModal.scss` stili modale con animazioni |
| 22:30 | Creato `AISettingsContext.tsx` context per aprire modale ovunque |
| 22:30 | Aggiunto `useAISettingsSafe()` hook per uso sicuro fuori dal provider |
| 22:30 | `ProviderSelector` ora usa automaticamente il context per "Configure in Settings" |
| 22:45 | **FIX**: "Configure in Settings" in DocumentationTab ora apre il modale AI |
| 22:45 | Convertito `<span>` in `<button>` con onClick per aprire AISettingsModal |
| 22:45 | Aggiunto hover state (cyan) al link "Configure in Settings" |
| 23:00 | **FIX CRITICO**: Aggiunto `AISettingsProvider` in App.tsx |
| 23:00 | Jodie.tsx ora usa `useAISettings()` per aprire il modale invece di navigare a /settings |
| 23:00 | Il pulsante gear in JodieHeader e il link "Configure providers" ora aprono il modale |
| 23:05 | **FIX z-index**: AISettingsModal z-index aumentato a 10002 (sopra Jjodie 10000) |
| 23:30 | **IMAGE PASTE SUPPORT**: Supporto per incollare immagini nella chat Jjodie |
| 23:30 | Aggiunta interfaccia `ChatImage` in `types/jodie.ts` |
| 23:30 | Aggiunto costante `VISION_PROVIDERS` e funzione `supportsVision()` |
| 23:30 | Aggiornata interfaccia `ChatMessage` con campo `images?: ChatImage[]` |
| 23:30 | `ChatInput.tsx` completamente riscritto con supporto paste/upload immagini |
| 23:30 | Creato `ChatInput.scss` con stili per image preview e attachment button |
| 23:30 | `AIProviderService.ts` aggiornato con supporto immagini per Claude, OpenAI, Gemini, Mistral |
| 23:30 | Aggiunti helper: `buildClaudeContent()`, `buildOpenAIContent()`, `buildGeminiParts()`, `buildMistralContent()` |
| 23:30 | `Jodie.tsx` aggiornato con `providerSupportsVision` computed |
| 23:30 | `JodieWindow.tsx` passa `supportsVision` prop a ChatInput |
| 23:30 | `ChatMessages.tsx` ora visualizza immagini nei messaggi |
| 23:30 | Stili per `.jodie-message-images` e `.jodie-message-image` aggiunti a JodieWindow.css |
| 23:45 | **FIX supportsVision**: Cambiato da whitelist a blacklist approach |
| 23:45 | Rimosso `VISION_MODELS`, aggiunto `NON_VISION_MODELS` |
| 23:45 | Claude/OpenAI/Gemini: tutti i modelli moderni supportano vision |
| 23:45 | Mistral: solo modelli "Pixtral" supportano vision |
| 23:45 | **FIX CSS**: Spostati stili image preview in JodieWindow.css (priorita` su SCSS) |
| 23:45 | `.jodie-input-container` ora usa `flex-direction: column` |
| 23:45 | Aggiunti stili per `.jodie-input-row`, `.jodie-attach-btn`, `.jodie-image-*` |
| 23:45 | Dark mode completo per tutti i nuovi elementi immagine |
| 00:15 | **PDF SUPPORT**: Aggiunto supporto per allegare documenti PDF |
| 00:15 | Aggiunta interfaccia `ChatDocument` in `types/jodie.ts` |
| 00:15 | Aggiunto costante `PDF_PROVIDERS` e funzione `supportsPDF()` |
| 00:15 | Aggiornata interfaccia `ChatMessage` con campo `documents?: ChatDocument[]` |
| 00:15 | `ChatInput.tsx` aggiornato per gestire file PDF |
| 00:15 | `AIProviderService.ts` aggiornato con supporto documenti per Claude e Gemini |
| 00:15 | `buildClaudeContent()` e `buildGeminiParts()` ora accettano `documents` |
| 00:15 | `Jodie.tsx` aggiornato con `providerSupportsPDF` e documenti in `handleSendMessage` |
| 00:15 | `JodieWindow.tsx` passa `supportsPDF` prop a ChatInput |
| 00:15 | `ChatMessages.tsx` ora visualizza documenti PDF nei messaggi |
| 00:15 | Aggiunti stili per `.jodie-attachment-previews`, `.jodie-document-preview`, `.jodie-message-documents` |

---

## AI PROVIDER PREFERENCES (Sistema Centralizzato)

Sistema per gestire le preferenze di AI provider per ogni feature di Jjodel.

### File Creati

| File | Scopo |
|------|-------|
| `frontend/src/services/AIProviderPreferences.ts` | Service centralizzato per gestione preferenze |
| `frontend/src/hooks/useAIProviderPreference.ts` | Hook React per usare le preferenze nei componenti |
| `frontend/src/components/common/ProviderSelector.tsx` | Componente dropdown riutilizzabile |
| `frontend/src/components/common/ProviderSelector.scss` | Stili con dark mode |

### API del Service

```typescript
class AIProviderPreferences {
    static getPreferred(feature: AIFeature): string;
    static setPreferred(feature: AIFeature, providerId: string): void;
    static resetPreference(feature: AIFeature): void;
    static getAllPreferences(): Record<AIFeature, string>;
    static isProviderAvailable(providerId: string): boolean;
    static resolveProvider(providerId: string): string;
}
```

### Hook

```typescript
const {
    selectedProvider,      // Provider corrente
    setSelectedProvider,   // Setter (salva anche in localStorage)
    resolvedProvider,      // 'auto' risolto al provider effettivo
    isProviderAvailable,   // Se il provider è configurato
    resetToDefault         // Reset al default
} = useAIProviderPreference('documentation');
```

### localStorage Keys

```
jjodel_provider_documentation: {"providerId":"openai","updatedAt":1234567890}
jjodel_provider_chat: {"providerId":"mistral","updatedAt":1234567890}
```

### Feature Supportate

| Feature | Chiave | Default |
|---------|--------|---------|
| Documentation | `jjodel_provider_documentation` | `local` |
| Chat (Jjodie) | `jjodel_provider_chat` | `auto` |

---

## AI SETTINGS MODAL (Componente Condiviso)

Sistema per configurare AI providers da qualsiasi punto dell'app tramite modale.

### Architettura

```
AISettingsContent.tsx  (componente puro, riutilizzabile)
        │
        ├──► SettingsPage.tsx (/settings/ai)
        │
        └──► AISettingsModal.tsx (overlay, apribile ovunque)
                    │
                    └──► AISettingsContext (provider React)
```

### File Creati

| File | Scopo |
|------|-------|
| `frontend/src/components/settings/AISettingsContent.tsx` | Componente puro per configurazione providers |
| `frontend/src/components/settings/AISettingsContent.scss` | Stili con dark mode |
| `frontend/src/components/settings/AISettingsModal.tsx` | Wrapper modale |
| `frontend/src/components/settings/AISettingsModal.scss` | Stili modale |
| `frontend/src/contexts/AISettingsContext.tsx` | Context per aprire modale ovunque |

### Uso

```typescript
// Nel componente
import { useAISettings } from '../../contexts/AISettingsContext';

function MyComponent() {
    const { openAISettings } = useAISettings();

    return (
        <button onClick={openAISettings}>
            Configure AI
        </button>
    );
}
```

### Safe Hook per componenti esterni

```typescript
// Se il componente potrebbe essere fuori dal Provider
import { useAISettingsSafe } from '../../contexts/AISettingsContext';

const aiSettings = useAISettingsSafe();  // Returns null if not in provider
if (aiSettings) {
    aiSettings.openAISettings();
}
```

### Features

- Configurazione per OpenAI, Anthropic, Mistral, Gemini, Ollama
- Test Connection per ogni provider
- Salvataggio in localStorage
- Dark mode completo
- Chiudi con ESC o click fuori
- Animazioni slideUp e fadeIn

---

## JJODIE IMAGE PASTE SUPPORT

Supporto per incollare e allegare immagini nella chat di Jjodie per provider con vision capability.

### Provider con Vision Support

| Provider | Vision Support |
|----------|----------------|
| OpenAI | Tutti i modelli GPT-4 (gpt-4o, gpt-4o-mini, gpt-4-turbo). **NO** gpt-3.5-turbo |
| Claude | Tutti i modelli Claude 3+ (sonnet, opus, haiku) |
| Gemini | Tutti i modelli Gemini 1.5+ e 2.0 |
| Mistral | **SOLO** modelli Pixtral (pixtral-large-latest, pixtral-12b). I modelli standard (mistral-large, mistral-small) NON supportano vision |
| DeepSeek | NO vision support |
| Groq | NO vision support |

**Nota**: La funzione `supportsVision()` usa un approccio blacklist invece di whitelist per essere piu` permissiva con i nuovi modelli.

### Tipi

```typescript
interface ChatImage {
    id: string;         // Unique ID (img_timestamp_random)
    data: string;       // Base64 encoded data (without data URL prefix)
    mimeType: string;   // e.g., 'image/png', 'image/jpeg'
    preview: string;    // Full data URL for display
    name?: string;      // Optional filename
}

// ChatMessage ora include:
interface ChatMessage {
    // ... existing fields
    images?: ChatImage[];
}
```

### Funzionalità

1. **Paste da clipboard**: Cmd+V / Ctrl+V incolla automaticamente immagini
2. **File picker**: Bottone per selezionare immagini dal filesystem
3. **Preview**: Anteprima immagini prima dell'invio con X per rimuovere
4. **Multi-image**: Supporto per più immagini per messaggio
5. **Vision detection**: Bottone attach e placeholder appaiono solo se provider supporta vision

### Formato API per Provider

**Claude (Anthropic)**:
```json
{
  "type": "image",
  "source": {
    "type": "base64",
    "media_type": "image/png",
    "data": "base64data..."
  }
}
```

**OpenAI**:
```json
{
  "type": "image_url",
  "image_url": {
    "url": "data:image/png;base64,..."
  }
}
```

**Gemini**:
```json
{
  "inline_data": {
    "mime_type": "image/png",
    "data": "base64data..."
  }
}
```

**Mistral (Pixtral)**:
```json
{
  "type": "image_url",
  "image_url": "data:image/png;base64,..."
}
```

### File Modificati

| File | Modifiche |
|------|-----------|
| `types/jodie.ts` | +ChatImage, +VISION_PROVIDERS, +NON_VISION_MODELS, +supportsVision() |
| `components/Jodie/ChatInput.tsx` | Riscritto con paste handler, file picker, image preview |
| `components/Jodie/ChatInput.scss` | Nuovo file con stili per preview e attach button |
| `services/AIProviderService.ts` | +buildClaudeContent, +buildOpenAIContent, +buildGeminiParts, +buildMistralContent |
| `components/Jodie/Jodie.tsx` | +providerSupportsVision, updated handleSendMessage |
| `components/Jodie/JodieWindow.tsx` | +supportsVision prop |
| `components/Jodie/ChatMessages.tsx` | Visualizza immagini nei messaggi |
| `components/Jodie/JodieWindow.css` | +.jodie-message-images, +.jodie-message-image |

---

## JJODIE PDF DOCUMENT SUPPORT

Supporto per allegare documenti PDF nella chat di Jjodie per provider con supporto nativo PDF.

### Provider con PDF Support

| Provider | PDF Support |
|----------|-------------|
| Claude | ✓ Supporto nativo via document block |
| Gemini | ✓ Supporto nativo via inline_data |
| OpenAI | ✗ NO |
| Mistral | ✗ NO |
| DeepSeek | ✗ NO |
| Groq | ✗ NO |

### Tipi

```typescript
interface ChatDocument {
    id: string;         // Unique ID (doc_timestamp_random)
    data: string;       // Base64 encoded data (without data URL prefix)
    mimeType: string;   // 'application/pdf'
    name: string;       // Filename (required)
    size: number;       // File size in bytes
}

// ChatMessage ora include:
interface ChatMessage {
    // ... existing fields
    images?: ChatImage[];
    documents?: ChatDocument[];
}
```

### Funzionalità

1. **File picker**: Bottone paperclip per selezionare PDF dal filesystem
2. **Preview**: Anteprima con icona PDF, nome file e dimensione
3. **Multi-attachment**: Supporto per più PDF e immagini per messaggio
4. **PDF detection**: Bottone attach mostra icona paperclip se supporta PDF (invece di icona immagine)

### Formato API per Provider

**Claude (Anthropic)**:
```json
{
  "type": "document",
  "source": {
    "type": "base64",
    "media_type": "application/pdf",
    "data": "base64data..."
  }
}
```

**Gemini**:
```json
{
  "inline_data": {
    "mime_type": "application/pdf",
    "data": "base64data..."
  }
}
```

### File Modificati

| File | Modifiche |
|------|-----------|
| `types/jodie.ts` | +ChatDocument, +PDF_PROVIDERS, +supportsPDF() |
| `components/Jodie/ChatInput.tsx` | +document state, +handleFileChange per PDF, +document preview UI |
| `services/AIProviderService.ts` | +documents param, buildClaudeContent/buildGeminiParts aggiornati |
| `components/Jodie/Jodie.tsx` | +providerSupportsPDF, +documents in handleSendMessage |
| `components/Jodie/JodieWindow.tsx` | +supportsPDF prop |
| `components/Jodie/ChatMessages.tsx` | +jodie-message-documents display |
| `components/Jodie/JodieWindow.css` | +.jodie-attachment-previews, +.jodie-document-preview, +.jodie-message-document |

---

## TAB BADGE STYLING

Il badge "D" nella tab è gestito via CSS in `tab-title.scss` usando pseudo-elementi `::before`:

```scss
.tab-title {
    &[data-type="documentation"]::before {
        content: "D";
        background-color: #bfdbfe;  // Blue-200 pastel
        color: #1e40af;             // Blue-800 for contrast
    }
}
```

Questo approccio è identico a Metamodel (M viola) e Model (M ambra). Il tab title deve usare l'attributo `data-type`:

```tsx
// In DockManager.openDocumentation()
title: React.createElement('div', {
    className: 'tab-title active-on-mouseenter',
    'data-type': 'documentation'
}, 'Documentation')
```

---

## BRAND COLORS (Slate)

| Elemento | Colore |
|----------|--------|
| Brand primary | `#334155` (slate-700) |
| Brand hover | `#1e293b` (slate-800) |
| Outline border | `#cbd5e1` (slate-300) |
| Outline hover bg | `#f1f5f9` (slate-100) |
| Tab icon Doc | `#bfdbfe` bg, `#1e40af` text |
| Warning/Update btn | slate con opacity, non solid |
| Toggle active (dark) | `#64748b` (slate-500) |

---

*Ultimo aggiornamento: 2026-01-30 ore 00:45*

---

## VERSION HISTORY / ROLLBACK

Per fare rollback a una versione precedente:
```bash
git checkout <commit-hash> -- .
# oppure per vedere i cambiamenti prima
git diff <commit-hash>
```

### Commit History

| Data | Commit Hash | Descrizione | File Principali |
|------|-------------|-------------|-----------------|
| 2026-01-30 00:45 | `98ea3b353` | Simplify metamodel selection menu (minimal design) | `ProjectEditor.tsx`, `project-editor.scss` |
| 2026-01-30 00:20 | `c90cad4a0` | PDF support, Model capability badges, Metamodel selection dropdown | `types/jodie.ts`, `ChatInput.tsx`, `AIProviderService.ts`, `AISettingsContent.tsx`, `ProjectEditor.tsx`, `Navbar.tsx` |

### Dettaglio Commit `c90cad4a0`

**Features aggiunte:**

1. **PDF Support per Jjodie Chat**
   - Interfaccia `ChatDocument` in `types/jodie.ts`
   - Funzione `supportsPDF()` per rilevare supporto provider
   - `ChatInput.tsx` gestisce upload e preview PDF
   - `AIProviderService.ts` formatta PDF per Claude e Gemini API
   - `ChatMessages.tsx` visualizza documenti nei messaggi

2. **Model Capability Badges in AI Settings**
   - `PROVIDER_MODELS` con capabilities `vision` e `pdf` per ogni modello
   - Componente `ModelCapabilitiesBadges` in `AISettingsContent.tsx`
   - Badge "Images", "PDF", "Text only" sotto il select del modello
   - Stili in `AISettingsContent.scss` con dark mode

3. **Metamodel Selection Dropdown**
   - Dropdown in `ProjectEditor.tsx` per selezionare metamodel quando si crea un nuovo model
   - `createM1` esportato da `Navbar.tsx`
   - Comportamento condizionale: 0 metamodels = disabled, 1 = direct create, 2+ = dropdown menu
   - Stili in `project-editor.scss` con animazione slideDown

**File modificati (19 files, +1919 -129):**
- `frontend/src/types/jodie.ts`
- `frontend/src/components/Jodie/ChatInput.tsx`
- `frontend/src/components/Jodie/ChatInput.scss`
- `frontend/src/components/Jodie/Jodie.tsx`
- `frontend/src/components/Jodie/JodieWindow.tsx`
- `frontend/src/components/Jodie/ChatMessages.tsx`
- `frontend/src/components/Jodie/JodieWindow.css`
- `frontend/src/services/AIProviderService.ts`
- `frontend/src/components/settings/AISettingsContent.tsx`
- `frontend/src/components/settings/AISettingsContent.scss`
- `frontend/src/components/project/ProjectEditor.tsx`
- `frontend/src/components/project/project-editor.scss`
- `frontend/src/pages/components/Navbar.tsx`

---
