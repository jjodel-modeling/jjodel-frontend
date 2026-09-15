# Prompt Claude Code: U-2 — breadcrumb read-only nel blocco parenting di "Applies to"

**Nome del documento prompt**: 2026-08-09 23:28
**Tipo**: feat (un commit, più fase di verifica ancore con report)
**Branch**: `alfonso-frontend-jjtl` (atteso a `8704221de` o successivo solo-docs)
**Vincolo generale**: CLAUDE.md è la fonte di verità; se questo prompt lo contraddice, segnala il conflitto e fermati. Leggi `docs/claude-code-log.md` a inizio sessione.

## Contesto e ratifiche

U-2 è il residuo R-F4 della voce 4: una breadcrumb **read-only** `viewpoint › parent › view` in testa al blocco parenting di "Applies to". Ratifiche di oggi (chat Cowork, 2026-08-09 sera):

- La sospensiva di R-H («breadcrumb rinviata finché parent e viewpoint non sono distinguibili») è **sciolta** dalla voce 4 (D-4-1/D-4-2): U-2 parte, e lo scioglimento va annotato sotto R-H in `docs/decisions.md`.
- La breadcrumb entra nel blocco condiviso `ViewParentingFields`, quindi su **entrambe** le superfici che lo montano: body IR "Applies to" (`editor-v2/viewpoint/authoring/irTabs.tsx:108`) e tab Apply-to legacy (`editors/views/data/InfoData.tsx:284`). Nessuna prop nuova.
- Il **ritiro del portale** di `ViewData.tsx` è rinviato a U-1/Slice C: in questo giro non si tocca.

Vincolo architetturale non negoziabile (dalla discovery §D2): la breadcrumb legge **solo** `readViewParenting` (campo persistito `d.viewpoint`), mai `get_viewpoint` o `get_fatherChain` del proxy. La riga read-only Viewpoint e la breadcrumb devono mostrare lo stesso valore perché leggono lo stesso campo, come già riga e lista (D-4-2).

## Verifica d'ingresso (hard stop se fallisce)

1. `git log --oneline origin/alfonso-frontend-jjtl..HEAD` → attesi 0 commit.
2. `git status --porcelain` → attesi solo il residuo noto: 2 file CSS della serie U modificati più 2 path docs non tracciati. **Riporta in chat i path esatti dei 2 CSS modificati.** Se uno dei due è `src/components/viewParenting/viewParenting.scss`: **HARD STOP**, la modifica di questo task toccherebbe un file con modifiche non committate di Alfonso e serve una decisione in chat.

## Fase 0 — verifica ancore (read-only, con report)

La discovery di riferimento è `docs/discovery/discovery_2026-08-08_uniformazione_card_properties.md` (§D2): è precedente ai commit di voce 5/6, quindi le ancore vanno riverificate su HEAD prima di scrivere. Verifica:

1. `src/components/viewParenting/viewParentingOptions.ts`: interfaccia `ViewParentingFacts` e funzione `readViewParenting` (attesi: `viewpointId`, `viewpointName`, `fatherId`, `detached`, `parentOptions`, `descendantCount`; il nome del padre NON c'è ancora).
2. `src/components/viewParenting/ViewParentingFields.tsx`: struttura attesa: campo Viewpoint (riga read-only + Move to viewpoint), poi campo Parent view. Import `InfoTooltip` da `../ui` presente (voce 5).
3. `grep -rn "jj-context-bar" src/` → attesi SOLO `editors/Info.tsx` (markup inline) e `styles/components/_form-system.scss:1197-1239` (CSS, importato globalmente via `styles/style.scss`). Se compaiono altri usi: fermati e riporta.
4. `grep -rn "jj-parenting-breadcrumb" src/` → atteso **zero** occorrenze (verifica anti-collisione del nome nuovo, obbligatoria per convenzione).
5. Test esistente `src/components/viewParenting/__tests__/viewParentingOptions.test.ts`: leggi come costruisce lo state fixture, per estendere lo stesso pattern.
6. `docs/decisions.md`: individua la voce R-H e il formato delle entry. Se R-H non c'è: **HARD STOP**.

**Report obbligatorio** (l'hard stop di fase non è completo senza): `docs/discovery/discovery_<data>_u2_breadcrumb_anchors.md` con data di esecuzione in formato `YYYY-MM-DD`. Contenuto minimo: obiettivo, file letti con path completi, esito delle 6 verifiche, scostamenti dalla discovery del 2026-08-08, rischi, eventuali domande per Alfonso. Report sintetico: è una verifica di ancore, non una nuova discovery. Il report NON va committato in questo commit di feature: resta nel working tree (è uno dei path docs non tracciati ammessi) e si consolida a parte se richiesto.

Se una qualsiasi ancora non corrisponde, fermati e riporta in chat prima di ogni modifica.

## COSA — un commit

**File toccati (tutti e soli questi):**

1. `src/components/viewParenting/viewParentingOptions.ts`
2. `src/components/viewParenting/__tests__/viewParentingOptions.test.ts`
3. `src/components/viewParenting/ViewParentingFields.tsx`
4. `src/components/viewParenting/viewParenting.scss`
5. `docs/decisions.md`
6. `docs/claude-code-log.md` (entry di fine task)

### 1. `viewParentingOptions.ts` — nome del padre

Aggiungi a `ViewParentingFacts` la proprietà **opzionale** (regola 11: solo aggiunte opzionali alle interfacce esportate):

```ts
/** Name of the father, when there is one. */
fatherName?: string;
```

In `readViewParenting`, dopo il calcolo di `viewpointName`:

```ts
const fatherName: string | undefined = fatherId ? state.idlookup?.[fatherId]?.name : undefined;
```

e includilo nel return. Nessun'altra modifica alla funzione.

### 2. Test — estensione, non riscrittura

Nel test esistente aggiungi asserzioni con lo stesso pattern di fixture: `fatherName` valorizzato per una view figlia (nome del padre dall'idlookup), `undefined` per una view detached. Non modificare le asserzioni esistenti.

### 3. `ViewParentingFields.tsx` — la breadcrumb

In testa al fragment ritornato (prima del campo Viewpoint), costruisci i segmenti da `facts` e `view`:

```tsx
// U-2: read-only breadcrumb over the same persisted facts as the row below (D-4-2).
// Segments that exist only; parent omitted when the father IS the viewpoint root.
const crumbs: string[] = [];
if (facts.viewpointId && facts.viewpointId !== (view.id as any)) crumbs.push(facts.viewpointName || 'unnamed');
if (facts.fatherId && facts.fatherId !== facts.viewpointId && facts.fatherId !== (view.id as any)) crumbs.push(facts.fatherName || 'unnamed');
crumbs.push(view.name || 'unnamed');
```

Resa, riusando le classi globali esistenti più un wrapper scoped nuovo:

```tsx
{crumbs.length >= 2 && (
    <div className="jj-parenting-breadcrumb jj-context-bar" role="navigation" aria-label="View parenting">
        {crumbs.map((c, i) => (
            <React.Fragment key={i}>
                {i > 0 && <span className="jj-context-bar__sep">›</span>}
                <span className={'jj-context-bar__segment' + (i === crumbs.length - 1 ? ' jj-context-bar__segment--current' : '')}>{c}</span>
            </React.Fragment>
        ))}
    </div>
)}
```

Niente `onClick`, niente icone, niente navigazione: è una lettura. Nessuna modifica al resto del componente.

### 4. `viewParenting.scss` — neutralizzazione scoped

In coda al file, senza toccare le regole esistenti e senza toccare `_form-system.scss`:

```scss
// U-2: the read-only parenting breadcrumb reuses the global .jj-context-bar skin.
// Scoped overrides only: no full-width bar chrome inside the field block, and no
// click affordance — every segment is plain text here.
.jj-parenting-breadcrumb.jj-context-bar {
    padding: 0 0 10px;
    background: transparent;
    border-bottom: none;
}
.jj-parenting-breadcrumb .jj-context-bar__segment {
    cursor: default;
}
.jj-parenting-breadcrumb .jj-context-bar__segment:hover {
    background: transparent;
}
```

### 5. `docs/decisions.md` — annotazione sotto R-H

Sotto la voce R-H, nel formato del registro, una riga di scioglimento con questo contenuto (adatta la forma, non il significato):

> Sospensiva sciolta (2026-08-09): parent e viewpoint sono distinguibili dalla voce 4 (D-4-1/D-4-2), U-2 parte. Ratifica in chat Cowork del 2026-08-09; la breadcrumb legge `readViewParenting`, non i getter del proxy.

Niente em dash nel testo aggiunto. Nessun'altra voce toccata.

### 6. Gate, commit, entry di log

- `npm run build` → 0 errori; `tsc` → 33 errori = baseline, Δ0; `vitest` → verde, nessun fallimento nuovo oltre le 9 collection failures note (il totale dei passed può crescere per le asserzioni aggiunte: riporta il delta); `npm run check:docs` → 2/2 coi due warning noti.
- `git add` dei soli 6 file elencati (per nome; il discovery report resta fuori). Commit: `feat(properties): read-only parenting breadcrumb in the Applies to block (U-2)`
- Entry in `docs/claude-code-log.md` nel formato standard (nome documento prompt: "2026-08-09 23:28"), inclusa nel commit.

## HARD STOP — smoke visivo di Alfonso

Dopo il commit, fermati e riporta in chat l'esito dei gate. Il push NON si esegue finché Alfonso non dà il GO dopo lo smoke su localhost:3000 (hard refresh):

1. View IR **figlia** di un'altra view: in testa ad "Applies to" compare `viewpoint › parent › view` coi tre nomi giusti.
2. View di **primo livello** (father = radice del viewpoint): due soli segmenti, `viewpoint › view`, nessun nome duplicato.
3. Stessa resa nel tab Apply-to **legacy** (view senza `ir`, host InfoData).
4. Nessun segmento cliccabile: cursore default, nessun hover, l'ultimo segmento in peso `--current`.
5. Dopo **Move to viewpoint**: breadcrumb aggiornata al nuovo viewpoint senza reload, coerente con la riga Viewpoint sottostante.
6. Il resto del blocco (riga Viewpoint, Move to viewpoint, Parent view, tooltip ⓘ) invariato.

## Push (solo dopo il GO)

1. `git log --oneline origin/alfonso-frontend-jjtl..HEAD` → atteso esattamente 1 commit, col messaggio esatto di cui sopra. Altrimenti **HARD STOP**.
2. `git status --porcelain` → solo il residuo noto più l'eventuale discovery report non tracciato. Altrimenti **HARD STOP**.
3. `git push` semplice; riporta il range pushato.

## Cosa NON fare

- Non toccare `ViewData.tsx` né il meccanismo del portale (rinviato a U-1/Slice C per ratifica).
- Non usare `get_viewpoint`, `get_fatherChain` o altri getter del proxy per i dati della breadcrumb.
- Non toccare `_form-system.scss`, `Info.tsx`, né la breadcrumb legacy `jj-context-bar` esistente.
- Non toccare i 2 CSS della serie U modificati nel working tree né i 2 path docs non tracciati.
- Nessuna prop nuova su `ViewParentingFields`, nessun rename di identificatori esistenti, niente `git add .`.

## RIFERIMENTI

- Discovery: `docs/discovery/discovery_2026-08-08_uniformazione_card_properties.md`, §D2 (breadcrumb) e §4/Q2 (sospensiva R-H).
- `docs/decisions.md`: R-H (sospensiva), D-4-1/D-4-2 (viewpoint derivato e read-only, father unico writer), R-F4 → U-2 (D-4-9).
- Codice a HEAD `8704221de`: `viewParentingOptions.ts` (readViewParenting, 83 righe), `ViewParentingFields.tsx` (141 righe, due host: `irTabs.tsx:108`, `InfoData.tsx:284`), `_form-system.scss:1197-1239` (skin `jj-context-bar`), `styles/style.scss:2` (import globale del form-system).
- Precedente di metodo: prompt InfoTooltip "2026-08-09 15:59" (riuso/estrazione con verifica d'ingresso e smoke gate).
