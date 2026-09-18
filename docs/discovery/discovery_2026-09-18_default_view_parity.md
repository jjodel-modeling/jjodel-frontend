# Discovery — parità della view di default con la sintassi astratta

Prompt-ID: P-2026-09-18-2219 · Fase 1 (discovery read-only) · 2026-09-18

Nota operativa: la sessione era aperta su `/Users/alfonso/jjodel` (branch `validation-skeleton`).
Il prompt dichiara repo/branch `alfonso-frontend-jjtl`, che risultava già checked out e pulito nel
worktree `/Users/alfonso/jjodel-release` (`git worktree list`). Tutta la discovery sotto è stata
condotta in quel worktree, non in quello della sessione. Questo file vive lì:
`/Users/alfonso/jjodel-release/docs/discovery/discovery_2026-09-18_default_view_parity.md`.

## Obiettivo

Stabilire, prima di scrivere qualunque diff, dove nasce oggi il seed di resa per object/edge/row
view, misurare (letture reali `getComputedStyle`, non solo SCSS) il delta fra la resa nativa
("sintassi astratta") e la resa di una view IR appena creata, verificare quali token esistono già,
e individuare gli equivalenti astratti di edge/row view.

## File letti (path completi, worktree `/Users/alfonso/jjodel-release`)

- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`
- `frontend/src/utils/lastViewpoint.ts`
- `frontend/src/components/editors/views/ViewData.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx`
- `frontend/src/view/viewElement/view.tsx`
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irCreationSeed.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/IRRow.tsx`
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`
- `frontend/src/components/editor-v2/nodes/instanceNode.scss`
- `frontend/src/components/editor-v2/EditorV2.scss`
- `frontend/src/components/editor-v2/EditorV2.tsx`
- `frontend/src/components/editor-v2/_color-schemes.scss`
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts`
- `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx`
- `frontend/src/redux/VersionFixer.tsx`
- `frontend/src/components/abstract/tabs/instanceTable.ts`
- `frontend/src/services/ThemeService.ts`
- `frontend/src/styles/_themes.scss`
- `frontend/src/styles/tokens/_colors-light.scss`, `_colors-dark.scss`
- `frontend/src/data/storage.ts`
- `frontend/scripts/smoke/states.ts`
- `docs/discovery/harness/probe_2026-09-03_rvp_slice1_manager_columns.mts` (precedente, letto come modello)
- `docs/decisions.md` — serie R-IRN (in particolare R-IRN-4, -5, -8, -9, -10, -22, -23), serie R-VP/R-DMV
- `CLAUDE.md` (copia di questo worktree) §3.3, §6.5

## Finding 1 — il seed non nasce in un punto unico, e il bottone "+" non semina nulla

Il "+" sulla sidebar (`TreeViewContent.tsx:1761`, `handleAddView` → `createBlankViewInViewpoint`,
`lastViewpoint.ts:191-217`) chiama `DViewElement.new2(candidate, '', dVp, undefined, true)`:
jsxString stringa vuota, nessun `ir`. **La view nasce inerte su entrambi i percorsi.**

La scelta del kind (Vertex/Row/Edge) avviene un passo dopo, aprendo il tab IR della view appena
creata: `ViewData.tsx:67,151` monta `<EnableIRPanel view={view} />` quando `!ir`.
`EnableIRPanel.tsx` (righe 80-108) costruisce `rowSeed`/`vertexSeed`/`edgeSeed` **inline**, non
chiamando `irDefaults.ts`/`irCreationSeed.ts` ma duplicandone a mano la stessa forma, e scrive
`view.ir = seed` → `LViewElement.set_ir` (`view.tsx:646-659`) → `TRANSACTION` con solo
`SetFieldAction` (nessun creator — sicuro per la regola 12/§3.3).

**Discrepanza da segnalare, non da assorbire silenziosamente**: `docs/decisions.md` registra
**R-IRN-5** (2026-08-13) come ritiro di `EnableIRPanel`. Su questo branch il file esiste, è
importato e montato attivamente. Vedi Domanda aperta 1.

Due percorsi ALTERNATIVI seminano IR direttamente alla creazione (`computeCreationSeed`), ma non
sono il "+": **A1** `DViewElement.newDefault` (menu contestuale classico, `ContextMenu.tsx:616-629`)
e **A2** `createViewInWorkbench` (voci "Create View" di albero/canvas, non un "+"), che semina solo
`kind:'vertex'`.

Object/edge/row **non condividono un percorso unico**: divergono dopo la creazione, dentro
`EnableIRPanel`, che è un'implementazione duplicata e indipendente delle stesse forme centralizzate
in `irDefaults.ts`.

`updateDefaultView` (`view.tsx:1978`) è un mecanismo di migrazione slegato da qualunque flusso di
creazione: chiamato solo da `VersionFixer.tsx:149` (bump di versione) e da `NestedView.tsx:399`
(bottone "nuove default disponibili").

**Critical zone**: `useJjomSync.ts`, `portDistribution.ts`, `handlePosition.ts` non compaiono in
nessuno dei file di questa traccia — nessun import, nessuna chiamata. Nessuna violazione del
perimetro dichiarato off-limits dal prompt.

## Finding 2 — perché la resa di oggi è povera (causa nel seed IR + nel compilatore)

Seed vivo per una view vertex (`defaultObjectViewIR()`, `irDefaults.ts:30-53`):
```
{irVersion:'ir-1.2', kind:'vertex', metaclasses:'*', priority:0, exclusive:true,
 shape:{form:'rect', labels:[{position:'top', source:{from:'intrinsic',prop:'qualifiedName'}}]},
 fieldCompartments:[{id:'attributes', source:{from:'attributes'}, separator:true, ...}]}
```

- **Bordo/radius grigio uniforme**: `shape` non ha la chiave `border`. `irCompile.ts:307` risolve
  `border = ir.shape.border ?? null`; con `null`, `IRNodeContent.tsx:333-336` lascia il fallback
  CSS puro, `irStyle.ts:72`: `border: 1px solid var(--border-default); border-radius: 4px`.
  `--border-default` (`_color-schemes.scss:318,339,367,394`) è una famiglia di token **diversa**
  da quella del renderer nativo (`--color-inode-border`), gated dalla classe `theme-${theme}` di
  `_themes.scss`, non dall'attributo `[data-theme]`.
- **Nome non sottolineato**: il seed non ha `style` sull'etichetta, e **`TextStyle` non ha alcun
  campo underline/text-decoration nello schema** (`irTypes.ts:89-95`). Non è un default omesso: è
  un asse assente dal tipo.
- **Nessun compartimento visibile — NON è un bug, corretto in Fase 2**: il seed dichiara un
  `fieldCompartments` con `attributes`, e `IRNodeContent.tsx:515` lo scarta
  (`if (source.length === 0) return null`) ogni volta che la classe non ha ancora attributi.
  Verificato in Fase 2 (2026-09-18) che il nativo fa esattamente lo stesso:
  `ObjectNode.tsx:729,1291`, `hasFeatures = slotRows.length > 0` sopprime l'intero div
  `.mm-object__compartment` quando la classe non ha slot. I due renderer erano già d'accordo;
  la riga sopra descriveva uno stato, non un delta. Rimosso dallo scope della Fase 2 (era
  l'item "compartimento sempre visibile" di S2).

**Edge — riferimento astratto esiste**: `UnifiedEdge.tsx` + `jjomTransformers.ts:115-125,584-652`
costruiscono l'edge RF direttamente dalla reference D-layer, indipendentemente da qualunque view
autorata; `irEdgeViews.ts` solo decora `data` quando una IR view è presente. Stessa struttura a due
livelli di `ObjectNode.tsx`/IR — parità concettualmente analoga a quella richiesta per l'oggetto.

**Row — nessun riferimento astratto sensato**: `RowViewIR` (`irTypes.ts:572-590`) non ha ALCUN
campo di shape/border/badge — "non renderizza mai sul canvas" per design (commento a `irTypes.ts:567`).
Il suo unico fallback, `defaultRowViewIR()`, passa comunque per la stessa pipeline IR, non per un
renderer nativo indipendente (confermato leggendo `IRRow.tsx` per intero). Vedi Domanda aperta 2.

## Misure — punto 2/3 della Fase 1 (getComputedStyle reale, non da SCSS)

Eseguita con un probe Playwright reale (offline bootstrap + costruzione modello via `page.evaluate`
sugli stessi global esposti che il repo usa già in `docs/discovery/harness/`). Fixture: metaclasse
`Widget` con un attributo `label:EString`, istanza `w1`. Caso A = `.mm-object` nativo
(`ObjectNode.tsx`, nessuna view custom attiva). Caso B = view IR-nativa vertex, seminata
letteralmente come `defaultObjectViewIR()` (il seed vivo di Finding 1/2), installata via
`SetFieldAction` sul campo `ir`. Tema commutato replicando `ThemeService.apply()` per intero
(attributo + evento `jjodel:theme-changed`, altrimenti la classe `theme-${theme}` non si aggiorna
e la Caso B resta bloccata al tema di mount — vedi Rischio 3).

| property | Caso A light | Caso B light | Caso A dark | Caso B dark |
|---|---|---|---|---|
| container border-width | 1px | 1px | 1px | 1px |
| container border-color | `rgb(203,213,225)` (`--color-inode-border`) | `rgba(0,0,0,0.12)` (`--border-default`) | `rgba(255,255,255,0.16)` | `rgba(255,255,255,0.15)` |
| container border-radius | **8px** | **4px** | 8px | 4px |
| container background-color | `rgb(255,255,255)` (`--color-inode-surface`) | `rgb(255,255,255)` | `rgb(51,65,85)` | `rgb(51,65,85)` |
| name font-size | **14px** | **13px** | 14px | 13px |
| name font-weight | 600 | 600 | 600 | 600 |
| name text-decoration-line | **underline** | **none** | underline | none |
| name text-underline-offset | 3px | auto (n/a) | 3px | auto (n/a) |
| separator | `.mm-object__header` border-bottom 1px, `--color-inode-border` | `.ir-compartment` border-**top** 1px, `rgba(51,65,85,0.15)` **letterale** | border-bottom 1px, tema-aware | border-top 1px, **stesso letterale** (identico al light) |
| compartment height | 36px | 27.19px | 36px | 27.19px |
| compartment padding | 10px 14px | 4px 8px | 10px 14px | 4px 8px |

Ogni riga sopra è un fallimento del criterio di accettazione ("una sola differenza misurata è un
fallimento") — sono sette, non una. JSON grezzi e script probe:
`docs/discovery/harness/probe_2026-09-18_ir_vs_native_object_style.mts` (lasciato non tracciato in
questo worktree, non aggiunto a git — decisione lasciata ad Alfonso/alla Fase 2).

## Token esistenti (punto 4)

| valore | token nativo già esistente | usato oggi dal fallback IR? |
|---|---|---|
| border-color | `--color-inode-border` (`_colors-light.scss:447`, `_colors-dark.scss:342`) | no — usa `--border-default` (`_themes.scss`, famiglia diversa) |
| background | `--color-inode-surface` (`_colors-light.scss:446`, `_colors-dark.scss:341`) | no — usa `--node-bg` |
| border-radius 8px | **NON TOKENIZZATO** — letterale bare in `instanceNode.scss:28`, con commento esplicito contro 12px | n/a (fallback usa 4px, anch'esso letterale) |
| text-decoration | nessun token — CSS nativo `text-decoration: underline` su `.mm-object__name` (`EditorV2.scss:2231-2232`) | schema IR (`TextStyle`) non ha l'asse |
| separatore compartimento IR | nessun token — `rgba(51,65,85,0.15)` letterale (`irStyle.ts:52`), identico nei due temi | — |

Nessun valore richiesto dal criterio di accettazione risulta già tokenizzato per il lato IR; la
Fase 2 deve riusare `--color-inode-border`/`--color-inode-surface` (confermando che siano
leggibili nella cascata di `irStyle.ts`, non solo in quella di `instanceNode.scss` — vedi Domanda
aperta 4) e introdurre un token nuovo per il border-radius se si vuole evitare un secondo letterale.

## Ricerca nomi nuovi (punto 5)

Non eseguibile in modo significativo in Fase 1: nessun nome di classe SCSS o id di elemento IR è
stato ancora proposto (dipende dal design della Fase 2). Da fare al momento in cui la Fase 2
propone nomi concreti.

## Rischi e dipendenze

1. **EnableIRPanel è vivo ma dichiarato ritirato** (R-IRN-5). Se la Fase 2 tocca solo
   `irDefaults.ts`/`irCreationSeed.ts`, il bottone "+" (che passa da `EnableIRPanel.enable()`)
   potrebbe non cambiare comportamento, perché quella funzione duplica il seed a mano.
2. **RowViewIR non ha un concetto di box** — “parità” per row view potrebbe non significare le
   stesse sette proprietà misurate per l'oggetto. Serve una decisione di Alfonso prima di
   disegnare la Fase 2 per quel kind (vedi Domanda aperta 2).
3. **Due famiglie di tema coesistono in editor-v2**: token attribute-gated (`_colors-*.scss`,
   usati dal renderer nativo) e token class-gated (`_themes.scss`, usati dal fallback IR,
   aggiornati solo alla ricezione dell'evento `jjodel:theme-changed`). Non è lo scope di questo
   task risolverlo, ma la Fase 2 deve scegliere consapevolmente la famiglia attribute-gated per
   restare coerente col renderer nativo, non introdurre una terza via.
4. **Perimetro file previsto per la Fase 2** supera probabilmente la soglia della regola 19 (5
   file): almeno `irDefaults.ts`, `irStyle.ts`, `IRNodeContent.tsx`, `irTypes.ts` (se si aggiunge
   l'asse underline), più uno o due file di token. Segnalato qui in anticipo perché non colga di
   sorpresa la conferma della Fase 2.

## Domande aperte per Alfonso

1. **R-IRN-5 vs realtà**: `EnableIRPanel` è ancora montato e attivo su questo branch, ma
   `docs/decisions.md` lo dichiara ritirato dal 2026-08-13. Il ritiro è stato fatto su un altro
   branch non ancora arrivato qui, oppure non è mai stato eseguito? Determina se la Fase 2 deve
   intervenire su quel file oltre a `irDefaults.ts`.
2. **"Row view" — quale dei due?** `RowViewIR` (uno dei tre kind IR, mai renderizzato come box) non
   ha equivalente astratto di bordo/radius/sottolineatura/separatore/compartimento. La serie
   R-VP/R-DMV di `docs/decisions.md` usa "row" per un concetto diverso (righe della tabella nel
   Data Manager), che ha già un default sensato e non è `RowViewIR`. A quale dei due si riferisce
   il prompt? Le due letture portano a lavori di Fase 2 completamente diversi.
3. **Estensione di `TextStyle`**: per rendere la sottolineatura autorabile (decisione 4 del
   prompt) serve aggiungere un campo opzionale a un'interfaccia esportata. Permesso dalla regola
   11 (solo aggiunte opzionali), ma è comunque una modifica di interfaccia — confermare prima di
   procedere.
4. **`--color-inode-border`/`--color-inode-surface` sono leggibili da `irStyle.ts`?** Non
   verificato in Fase 1 se la cascata CSS in cui vive il fallback IR vede questi custom property
   (dichiarati per il contesto di `instanceNode.scss`) o se serve un livello di indirection.
5. **Origine del font-size 13px** sull'etichetta IR (contro 14px nativo): misurato ma non
   ancora tracciato a livello di regola CSS specifica in questa fase.
6. **Il separatore letterale `rgba(51,65,85,0.15)`, identico in light e dark**: rientra nel
   perimetro "separatore" del criterio di accettazione? Probabilmente sì (è uno dei valori
   elencati al punto 2 della Fase 1), ma la sua natura "stesso valore nei due temi by design" va
   confermata come bug da correggere, non come scelta intenzionale.

**Fine Fase 1 — hard stop. In attesa dell'analisi/go-ahead di Alfonso in chat prima di qualunque scrittura di codice.**

---

## Appendice — S1 + S2 batch 1-3: misura di verifica (2026-09-19)

Prompt-ID: P-2026-09-18-2219. Codice misurato: `alfonso-frontend-jjtl` @ `400095370` (S1, cornerRadius,
seed dell'oggetto: border, label 14px + underline, separatore col colore del bordo). Batch 4 di S2 non
ancora applicato.

Probe: `docs/discovery/harness/probe_2026-09-19_ir_vs_native_object_style_parity.mts`, lanciato con
`node` 26 (type stripping nativo, nessun `tsx` installato) contro il dev server di `jjodel-release`
su `:3001`. Exit 0, 14 righe MISURA, nessun BLOCCO, `page errors: []`. Due metaclassi
(`Widget` con un attributo, `Empty` senza attributi), un'istanza ciascuna, due temi. Caso A = nodo
nativo (`.mm-node.mm-object`), Caso B = view IR seminata come `defaultObjectViewIR()` corrente
(`.ir-node-content`). Tema commutato replicando `ThemeService.apply()` (attributo + evento
`jjodel:theme-changed`).

### Widget (un attributo)

| proprieta' | A light | B light | A dark | B dark | esito |
|---|---|---|---|---|---|
| container border-width (4 lati) | 1px | 1px | 1px | 1px | = |
| container border-color | `rgb(203, 213, 225)` | `rgb(203, 213, 225)` | `rgba(255, 255, 255, 0.16)` | `rgba(255, 255, 255, 0.16)` | = |
| container border-radius | 8px | 8px | 8px | 8px | = |
| container background-color | `rgb(255, 255, 255)` | `rgb(255, 255, 255)` | `rgb(51, 65, 85)` | `rgb(51, 65, 85)` | = |
| container padding | 0 | 0 | 0 | 0 | = |
| name font-size / font-weight | 14px / 600 | 14px / 600 | 14px / 600 | 14px / 600 | = |
| name text-decoration-line / style / thickness | underline / solid / auto | underline / solid / auto | underline / solid / auto | underline / solid / auto | = |
| name text-decoration-color | `rgb(15, 23, 42)` | `rgb(30, 41, 59)` | `rgba(255, 255, 255, 0.92)` | `rgba(255, 255, 255, 0.9)` | **differisce** (colore del testo dell'etichetta) |
| name text-underline-offset | 3px | auto | 3px | auto | **differisce** |
| separatore (spessore, colore) | header border-bottom 1px `rgb(203, 213, 225)` | compartment border-top 1px `rgb(203, 213, 225)` | 1px `rgba(255, 255, 255, 0.16)` | 1px `rgba(255, 255, 255, 0.16)` | = (lato e elemento diversi, vedi Empty) |
| compartment min-height | auto | auto | auto | auto | = |
| compartment altezza effettiva | 36px | 27.1875px | 36px | 27.1875px | **differisce** |
| compartment padding | 10px 14px | 4px 8px | 10px 14px | 4px 8px | **differisce** |
| compartment background | trasparente | trasparente | trasparente | trasparente | = |

Delta rispetto alla Fase 1: da sette differenze a quattro. Restano il colore del testo
dell'etichetta, l'offset della sottolineatura, l'altezza e il padding del compartimento: sono
esattamente i quattro item del batch 4.

### Empty (zero attributi)

| proprieta' | A light | B light | A dark | B dark | esito |
|---|---|---|---|---|---|
| compartimento presente | no | no | no | no | = |
| container: border, radius, background, name font e underline | come Widget | come Widget | come Widget | come Widget | = |
| header/separatore sotto il nome | border-bottom 1px `rgb(203, 213, 225)` presente | assente | 1px `rgba(255, 255, 255, 0.16)` presente | assente | **differisce (nuovo)** |

### Domanda aperta 4 — chiusa

`var(--color-inode-border)` risolve nella cascata del nodo IR in entrambi i temi: il bordo del
container B misura `rgb(203, 213, 225)` in light e `rgba(255, 255, 255, 0.16)` in dark, identico ad A.

### Finding nuovo — separatore su istanza senza attributi

Il nativo disegna la riga di separazione anche quando il compartimento e' soppresso: la regola
`.mm-object__header { border-bottom: 1px solid var(--color-inode-border) }`
(`frontend/src/components/editor-v2/nodes/instanceNode.scss:76`) e' incondizionata, e sull'istanza di
`Empty` la misura da' `borderBottomWidth: 1px` sull'header. Il nodo IR ha il separatore come
`border-top` del compartimento, che sull'istanza di `Empty` non esiste, quindi non disegna nulla.
Il Finding 2 corretto ("i due renderer erano gia' d'accordo") vale per il div del compartimento, non
per la riga di separazione. Non e' nei quattro item del batch 4: da decidere.

### Non misurato da questo probe

Il padding dell'header nativo (`padding: 11px 14px`, `instanceNode.scss:74`) contro il padding
dell'etichetta IR, e l'altezza totale del nodo. Il padding del container e' 0 in entrambi, ma
questo non copre il box dell'etichetta.

### Dopo il batch 4 (2026-09-19, working tree, non ancora committato)

Seed: `style.color: 'var(--color-inode-name)'` sull'etichetta (`irDefaults.ts`). Renderer: `underline`
imposta anche `textUnderlineOffset: '3px'` (`IRNodeContent.tsx`, `resolveTextStyle`). Il probe e' stato
rilanciato (exit 0, 14 MISURA, 0 BLOCCO; il letterale `ir` del probe aggiornato al seed). Confronto A/B
su Widget e Empty, light e dark:

- name text-decoration-color: uguale (`rgb(15, 23, 42)` light, `rgba(255, 255, 255, 0.92)` dark).
- name text-underline-offset: uguale (3px).
- Restano: compartment altezza (A 36px, B 27.1875px) e padding (A `10px 14px`, B `4px 8px`) su
  Widget; separatore assente su Empty (A 1px, B nessuno). Nessun'altra differenza sulle proprieta'
  misurate.

Altezza e padding del compartimento non si chiudono con il seme. Il padding del compartimento IR viene da
`--ir-pad-x/-y` (`irStyle.ts:23-25,52`), impostato dal token `shape.padding` (small 4/2, normal 8/4, large
16/8 per x/y) e condiviso con l'etichetta: nessun valore e' 14/10. `rowFormat.style` (`TextStyle`) non ha
assi di padding ne' di line-height, e `.ir-row { line-height: 1.4 }` e' globale (`irStyle.ts:54`).
Le uniche vie sono una regola globale in `irStyle.ts` (ridipinge le view salvate) o un campo nuovo
opzionale sullo schema: nessuna delle due e' stata eseguita.
