# Discovery — D18: catalogo a sezioni nella colonna della modale Symbol

**Data**: 2026-08-15. **Fase**: 1 (read-only) del prompt
`docs/prompts/claude_2026-08-15_2120_prompt_D18_catalogo_sezioni.md`.
**HEAD al momento della discovery**: `d81d6116c`, branch `alfonso-frontend-jjtl`, working tree
pulito (untracked deliberati: `.claude/settings.local.json`, `_to_delete/`).
**Strumenti**: lettura via bridge (file staged, byte-identici al working tree pulito su HEAD);
grep sul mount della VM locale, dove `grep` e' GNU grep 3.7 (`type grep` → `/usr/bin/grep`):
il caveat ugrep di CLAUDE.md §5 riguarda la shell interattiva di Claude Code e qui non si applica,
ma ogni asserzione di assenza porta comunque il suo controllo positivo.

## Obiettivo e ipotesi da falsificare

D18 ristruttura la colonna catalogo della modale Symbol: ricerca primaria in testa, recenti dopo
un'applicazione, sezioni per notazione con contatore e collasso, chip di notazione al posto della
Select. Ipotesi di partenza da verificare:

- H1: il picker post-D15b puo' ospitare sezioni collassabili nella sola variante `column` senza
  toccare il percorso `disclosure`.
- H2: esiste un posto naturale e non persistente per i recenti.
- H3: raggruppamento e contatori si derivano da `filterCatalog`/`CATALOG_NOTATIONS` senza toccare
  la tabella dati.
- H4: esiste nel codebase un primitivo di collasso riusabile.
- H5: i nomi nuovi previsti sono liberi.

Esito sintetico: H1 vera; H2 vera (stato di app-session nella modale, proposta sotto); H3 vera,
con i numeri del mockup che coincidono esattamente col catalogo reale; H4 **falsa** (nessun
primitivo riusabile: si implementa un collasso locale seguendo le convenzioni visive esistenti);
H5 vera (zero collisioni, controllo positivo eseguito).

## File letti (path completi)

- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolCatalogPicker.tsx` (intero, 112 righe)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx` (intero, 232 righe)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.scss` (intero, 278 righe)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolPreview.tsx` (intero, 93 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/notationCatalog.ts` (intero, 137 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/symbolRecognition.ts` (intero)
- `frontend/src/components/ui/FormSection/FormSection.tsx` (intero, 39 righe)
- `frontend/src/components/editor-v2/viewpoint/authoring/TextStyleField.tsx` (righe 120-175)
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (righe 36-191, via grep mirato)
- `frontend/src/App.tsx` (righe 58, 179 via grep)
- `docs/ratifiche/claude_2026-08-15_memo_ratifica_symbol_due_superfici_stencil.md` (intero)
- `docs/redesign/claude_2026-08-15_mockup_catalogo_stencil_nuova_forma.html` (intero; usato SOLO
  per la parte D18: ricerca, recenti, sezioni con contatori)
- `docs/PROTOCOL.md` (intero), `docs/claude-code-log.md` (entry recenti), `docs/decisions.md` (coda)

## Q1 — Stato del picker post-D15b

`SymbolCatalogPicker.tsx` e' un componente unico con branch sulla variante:

- Contratto (righe 20-29): `onApply: (preset: SymbolPreset) => void` piu'
  `variant?: 'disclosure' | 'column'`, default `disclosure`. Il commento della prop dichiara:
  «'column': always open, no gate and no Hide button — the persistent catalog column of the
  symbol editor modal (D15b); the host provides the container and its styling».
- Stato locale (righe 49-51): `open` (solo disclosure), `notation`, `query`.
- Render (righe 65-108): Select del filtro (righe 68-73, opzioni da `NOTATION_OPTIONS`, riga 31),
  Input di ricerca (76-81), griglia piatta `repeat(auto-fill, minmax(72px, 1fr))` (82-106), tutto
  con stili inline; l'unica classe e' il wrapper `jj-field` (riga 66).

Consumatori (grep globale `SymbolCatalogPicker` su `frontend/src`, controllo positivo:
`SymbolPreview` trova 4 file): **l'unico mount e' `SymbolEditorModal.tsx:176`**, con
`variant="column"`. La variante `disclosure` ha oggi **zero mount** ed e' contratto, non uso: il
suo percorso resta com'e' (Select + Input + griglia piatta) e D18 si esprime nel solo ramo
`column`. Nessun rischio di rompere mount esterni perche' non ce ne sono; la prop nuova per i
recenti e' additiva e opzionale (P3: aggiungere proprieta' opzionali e' ammesso).

Cosa serve per le sezioni: stato locale `useState` nel picker (chiavi per notazione), markup a
sezioni nel ramo column, classi SCSS nuove al posto degli stili inline della griglia. Poiche' il
picker smonta quando la modale chiude (`SymbolEditorModal.tsx:102` ritorna `null` senza figli), il
collasso «persiste finche' la modale e' aperta» per costruzione, senza alcuna scelta di storage:
e' esattamente il criterio (b) del prompt.

## Q2 — Dove vivono i recenti: proposta unica

Fatti sul ciclo di vita:

- `SymbolEditorModal` e' montata UNA volta alla radice dell'app (`App.tsx:179`,
  `<Try><SymbolEditorModal/></Try>`); alla chiusura setta `viewId = null` e ritorna `null`
  (righe 102, 129) ma **il componente non smonta mai**.
- `lastApplied` e' azzerato deliberatamente a ogni apertura (righe 73-74) perche' cosi' prescrive
  il memo D14 per lo stato «modified». I recenti sono uno stato diverso: il mockup li mostra
  popolati all'apertura, quindi devono sopravvivere alla chiusura.

**Proposta: recenti come stato di app-session nella modale.** `useState<string[]>` in
`SymbolEditorModal`, NON azzerato nell'handler di apertura, alimentato da `applyPreset`
(riga 123-127: unica via di applicazione; dedup + unshift + cap), passato al picker come prop
additiva. Si conserva l'**id** del preset, non l'oggetto: il render risolve contro
`NOTATION_CATALOG` e scarta gli id ignoti, il che e' gia' compatibile con gli id stencil che
arriveranno con D17.

Trade-off contro l'alternativa (persistenza):

- App-session (proposta): sopravvive a chiusura/riapertura nella stessa esecuzione dell'app;
  muore al reload. Zero superficie di persistenza, zero chiavi nuove, zero decisioni di scoping
  per progetto, nessuna migrazione. E' lo scope minimo che soddisfa il criterio (c).
- localStorage: sopravvive al reload, ma e' vietato senza discussione (norma di progetto),
  richiederebbe una decisione di chiave e di scoping (globale? per progetto?), e il debito delle
  «quattro chiavi inerti in localStorage» gia' censite sconsiglia di aggiungerne una quinta per
  una feature di comodo. Il D-layer e' fuori discussione: i recenti non sono contenuto del
  progetto.

Decide Alfonso all'hard stop; l'implementazione differisce di poche righe.

## Q3 — Raggruppamento derivato e interazione ricerca ↔ sezioni

Fatti da `notationCatalog.ts`:

- `filterCatalog(notation, query)` (righe 128-136) filtra per notazione esatta piu' substring su
  label, notation e keywords.
- `CATALOG_NOTATIONS` (righe 93-95) e' derivata «nell'ordine di prima apparizione nel catalogo»:
  e' gia' l'ordine di sezione del mockup.
- Conteggi reali per notazione: BPMN 17, UML 7, Flowchart 2, Petri net 3, ER 7 (36 preset,
  5 notazioni). **Coincidono uno a uno con i contatori del mockup** (17/7/7/2/3): il mockup e'
  disegnato sul catalogo vero, non su numeri di fantasia. (Ordine: nel catalogo Flowchart precede
  Petri net che precede ER; il mockup mostra UML, ER, Flowchart, Petri net. L'ordine normativo e'
  quello derivato dal catalogo, il mockup non lo prescrive.)

**Indicizzazione derivata**: un helper puro
`catalogSections(query: string): CatalogSection[]` con
`CatalogSection = { notation, presets, total }`, dove `presets` sono i match della query nella
notazione e `total` e' la cardinalita' piena della sezione. Nessuna modifica alle righe della
tabella (D1 intatta). Posto naturale: **appeso in coda a `notationCatalog.ts`**, che e' gia'
modulo puro con test propri (`__tests__/notationCatalog.test.ts`); i test nuovi entrano li'.
Nota di perimetro: il prompt elenca il file solo come «non toccare nei contenuti»; aggiungervi
helper derivati e' un'estensione di perimetro di un file, dichiarata qui e da confermare al
go-ahead. Alternativa a costo zero: helper dentro `SymbolCatalogPicker.tsx`, ma i test
diventerebbero test di un modulo React, contro l'indicazione del prompt («puri, senza React»).

**Interazione ricerca ↔ sezioni (proposta motivata)**: con query non vuota, una sezione senza
risultati **si nasconde** (non «0»): nella colonna da 264px una fila di intestazioni a zero e'
rumore, e la reversibilita' e' immediata svuotando il campo. Le sezioni con risultati mostrano il
conteggio dei match e si presentano **espanse a prescindere dal collasso**, perche' una ricerca
che nasconde i propri risultati dietro un header chiuso appare rotta; lo stato di collasso scelto
dall'utente si sospende durante la ricerca e si ripristina allo svuotamento della query. A query
vuota: tutte le sezioni visibili, contatore = totale, collasso onorato.

**Chip ↔ sezioni**: i chip sostituiscono la Select con la stessa semantica (selezione singola,
`''` = All; criterio d): chip attivo = si rende la sola sezione di quella notazione, header e
contatore inclusi. Click sul chip attivo lo disattiva (torna All), equivalente alla Select di oggi.

## Q4 — Pattern di collasso esistenti: censimento

- `FormSection` (`components/ui/FormSection/FormSection.tsx:25-37`): titolo uppercase + divider +
  contenuto, **nessun collasso**; CSS modules hashati (lezione D15b: non stilizzabile dall'esterno).
- Tree view (`TreeViewSidebar/TreeViewContent.tsx:164-191`): expand/collapse **persistito su
  `DProject.expandedTreeNodes`** con convenzione a marker `COLLAPSED_PREFIX`. Scope sbagliato per
  D18: il criterio (b) chiede persistenza per la sola durata della modale; agganciare il D-layer
  sarebbe un errore di livello.
- `TextStyleField.tsx:141-166`: trigger a disclosure con `aria-expanded` e caret
  `bi bi-chevron-down`; e' il precedente locale (stessa cartella) per l'accessibilita' del
  toggle, ma apre un popover, non una sezione inline.
- Il gate Browse/Hide del picker stesso (righe 55-63) e' l'altro disclosure locale, senza
  aria-expanded.

Conclusione: **nessun primitivo riusabile**; il collasso di sezione si implementa nel picker con
`useState` locale e il linguaggio visivo gia' in uso: header uppercase 10-10.5px con
`bi-chevron-down`/`bi-chevron-right` e contatore a destra (mockup, righe 63-66 e 147-187), bottone
con `aria-expanded` (precedente TextStyleField). Token gia' usati nel file SCSS della modale:
`--color-border-secondary`, `--color-bg-primary`, `--color-text-secondary`, `--space-*`.
Chip di notazione secondo CLAUDE.md §7.1 (slate-100 `#f1f5f9`, bordo slate-200, selezione
`rgba(14,165,233,0.08)`; riferimenti `forEndUser/inputselect.scss` e
`editors/views/data/viewapplyto.scss:717+`). Nel barrel `components/ui` **non esiste un
primitivo Chip** (grep `chip` su `ui/index.ts`: exit 1; controllo positivo: 54 righe `export`
nello stesso file): i chip sono bottoni con classi SCSS, come gia' altrove.

Nota di layout: oggi scrolla l'intera colonna (`SymbolEditorModal.scss:132-143`,
`overflow-y: auto` su `__catalog`). Il mockup fissa ricerca e recenti e fa scorrere la sola lista
(`.catlist`, riga 61 del mockup). Lo scroller va spostato sulla lista delle sezioni: la modale
resta a scatola fissa (SCSS righe 23-26, invariate) e il collasso non puo' produrre layout shift
del frame (criterio f).

## Q5 — Collisioni dei nomi nuovi previsti

Comando (GNU grep 3.7 sul mount):
`grep -rn "symbol-catalog\b|symbol-catalog__|catalogSections|CatalogSection|groupCatalog|recentIds|notation-chip|__recents" frontend/src`
→ **zero hit** (exit 1). Controllo positivo sullo stesso strumento e percorso:
`grep -rc "symbol-editor-modal" .../SymbolEditorModal.scss` → 2.

Nomi previsti, tutti liberi:

- TS: tipo `CatalogSection`, funzione `catalogSections`, prop `recentIds`.
- SCSS (namespace nuovo del picker, emesso solo nel ramo column):
  `symbol-catalog__section`, `__section-head`, `__section-count`, `__tiles`, `__tile`,
  `__chips`, `__chip`, piu' `symbol-editor-modal__recents` nel file della modale.

Nessun evento nuovo (il lancio resta `jjodel:symbol-editor-open` dal registry), nessuna
dipendenza nuova.

## Perimetro atteso di Fase 2 (da confermare al go-ahead)

1. `frontend/src/components/editor-v2/viewpoint/authoring/SymbolCatalogPicker.tsx` — ramo column:
   ricerca in testa, chip al posto della Select, strip recenti (prop additiva), sezioni con
   contatore e collasso; ramo disclosure invariato.
2. `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx` — stato recenti
   alimentato da `applyPreset`, prop verso il picker.
3. `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.scss` — classi di
   sezioni/chip/recenti, scroller spostato sulla lista.
4. `frontend/src/components/editor-v2/viewpoint/ir/notationCatalog.ts` — SOLO append di
   `CatalogSection` + `catalogSections` (tabella intatta); estensione dichiarata sopra.
5. `frontend/src/components/editor-v2/viewpoint/ir/__tests__/notationCatalog.test.ts` — test dei
   helper derivati.

Fuori: stencil e sezione Progetto (D17), «Nuova forma» (D19), misura D8 nell'anteprima, edge
authoring, card del rail, `VertexAuthoringPanel`.

## Dipendenze e rischi

- `viewpoint/authoring/` e' critical zone §3.1: Layer Impact Report in chat prima del diff di
  Fase 2 (dovuto anche senza file §3.2). Nessuna scrittura D-layer nuova: l'unica via di
  applicazione resta `applyPreset` → `set_ir` canonico, invariato (criterio e per costruzione).
- Il riconoscimento (`recognizeSymbol`) e il chip di stato dell'header non sono toccati.
- Gate nel container da `git archive HEAD frontend` + overlay; baseline typecheck Linux 14,
  vitest 1216 passed, build exit 0 (retry isolato se OOM 137).
- Sessioni concorrenti: staging per file esplicito, add+commit nella stessa invocazione.

## Domande aperte per Alfonso (hard stop)

1. **Recenti**: app-session nella modale (proposta) o persistenza (dove)?
2. **Helper derivati**: append a `notationCatalog.ts` con test puri (proposta) o dentro il picker
   (test non piu' puri)?
3. **Stato iniziale del collasso** a query vuota: prima sezione aperta e le altre chiuse (fedele
   al mockup) o tutte aperte?
4. **Cap dei recenti**: proposti 6 (una riga della colonna); il click su un recente lo riporta in
   testa (proposta: si').
5. **Tile evidenziata** (`.tile.sel` nel mockup, sul simbolo riconosciuto): nel mockup appartiene
   alla scena stencil (D17) e non e' nei criteri D18. Proposta: NON includerla ora.
