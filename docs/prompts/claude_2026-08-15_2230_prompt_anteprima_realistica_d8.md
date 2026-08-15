# Prompt — Anteprima realistica nella modale Symbol (cablaggio della misura D8)

Data: 2026-08-15 22:30 · Serie: fronte forme, slice «anteprima realistica» (roadmap del
checkpoint (5), confermata nel (6); memo D15: «l'anteprima con label realistica, che mostra il box
prodotto dalla taglia da contenuto (D8)»)
Esecutore: sessione Cowork su `/Users/alfonso/jjodel`, branch `alfonso-frontend-jjtl`
Protocollo: docs/PROTOCOL.md — clausole P1..P10 applicabili. Deroga: P8 non applicabile (smoke
automatico non ancora implementato; resta lo smoke visivo di Alfonso).
Prerequisito: GO visivo su D18 RICEVUTO (2026-08-15; commit `65cc3b03c`, entry di log
`ac2d52b26`). Nessuno smoke pendente a inizio sessione.

## COSA

La striscia di anteprima della modale Symbol (`SymbolEditorModal`) smette di essere simbolica
(glifo `SymbolPreview` a 168px con la label sovrapposta) e mostra il box che la taglia da
contenuto (D8) produce per la view corrente: la forma alle proporzioni reali del box derivato, la
label dentro il contorno, e la caption `W × H px · derivata dall'inchiostro (D8)` come nel mockup.
Quando il resize manuale vince (`isResized`), l'anteprima mostra la taglia manuale e la caption lo
dichiara (es. `W × H px · taglia manuale`). Le forme condizionali restano senza anteprima statica
(il messaggio attuale e' onesto e non si tocca).

Il motore della taglia si CONSUMA, non si modifica: `useContentSize.ts`, `shapeRegistry.ts`
(`contentRect` / `boxForContent` / `boxForContentNumeric`) e la policy di riconoscimento
geometrico restano intatti. Se la discovery scopre che il consumo pulito richiede un ritocco al
motore, quello e' un hard stop, non un diff.

Fuori scope dichiarato: stencil e sezione Progetto (D17); «Nuova forma» (D19 chiusa); edge
authoring; card del rail e `VertexAuthoringPanel`; catalogo e tile del picker (l'anteprima dei
tile resta `SymbolPreview` com'e'); ogni scrittura D-layer nuova.

## FASE 1 — Discovery read-only (OBBLIGATORIA, hard stop dopo)

Domande a cui il report deve rispondere, con path:riga:

1. **Dove vive il box derivato a runtime.** `useContentSize.ts` scrive la taglia top-level sul
   nodo RF (`width`/`height` con `measured` azzerato, checkpoint 15/8). La modale e' montata alla
   radice dell'app, FUORI dal provider ReactFlow: puo' leggere il nodo RF della view corrente
   (come? store RF, Redux, DOM) o deve ricomputare il box? Mappare ENTRAMBE le strade con costi e
   rischi, proporne UNA.
2. **Il caso «nessun nodo sul canvas»**: una view aperta nella modale puo' non avere alcun nodo
   renderizzato (metaclasse senza istanze visibili, tab diverso)? Cosa mostra l'anteprima in quel
   caso (fallback dichiarato, non un numero inventato)?
3. **Il caso `isResized`**: da dove si legge (`manualSizeOf` in `jjomTransformers.ts`, D-layer
   `w`/`h`) e con quale precedenza rispetto al derivato; testo esatto della caption nei due stati.
4. **La resa**: `SymbolPreview` ha viewBox fisso 72×48. Serve una variante a proporzioni libere
   (prop additiva) o un componente nuovo in `viewpoint/authoring/`? Verificare che la strada
   scelta NON cambi i tile del catalogo ne' la card del rail. Grep di collisione sui nomi nuovi
   previsti, con controllo positivo.
5. **Se serve ricomputare senza canvas**: `boxFromIntrinsic` parte da una misura DOM
   (`max-content`). Un'anteprima che misura se stessa puo' riusare il primitivo di
   `useContentSize` senza duplicarlo? Costo (reflow sincrono nel contesto modale) e rischi di
   divergenza dalla misura del canvas (font, zoom: il checkpoint 15/8 documenta offsetWidth vs
   client rect).
6. **Aggiornamento live**: l'anteprima deve seguire gli edit del pannello ospitato (la modale gia'
   si aggiorna via `useSelector` sull'ir). Con quale ritmo si ricalcola il box senza reflow a ogni
   keystroke (il debounce del pannello e' 300 ms)?

Report: `docs/discovery/discovery_<data>_anteprima_realistica_d8.md` (verificare collisioni di
nome nel giorno). Contenuto minimo come da P4. L'hard stop non e' completo finche' il report non
e' scritto e committato. `viewpoint/authoring/` e' in critical zone (§3.1): Layer Impact Report in
chat prima del diff di Fase 2, anche se nessun file di §3.2 e' toccato.

## FASE 2 — Implementazione (solo dopo analisi del report e go-ahead)

Perimetro atteso (da confermare in discovery, non vincolante sui nomi interni):

- `SymbolEditorModal.tsx`: striscia di anteprima cablata al box (derivato o manuale), caption.
- `SymbolEditorModal.scss`: stile della striscia; l'altezza della striscia e della modale restano
  FISSE (`min(760px, 90vh)` × 1040): un box grande si scala per stare nella striscia, non la
  allarga.
- Eventuale componente di anteprima nuovo (o prop additiva a `SymbolPreview`) in
  `viewpoint/authoring/`.
- Eventuali test puri sui helper di scala/caption.

Vincoli: design system (slate #334155, cyan solo focus/attivi, label 11px, griglia 8px); UI in
inglese; niente em dash nei testi; commenti in inglese; nessuna dipendenza nuova; nessun rename di
identificatori esistenti; diff minima.

## COME (gate e disciplina di superficie)

- Gate nel container da `git archive HEAD frontend` + overlay dei soli file modificati (un tar del
  working tree falsa i gate: casing `settings/`). Baseline typecheck Linux: **14**, elenco
  invariato riga per riga (misurarla sull'albero pulito nello stesso ambiente prima
  dell'overlay). Vitest: base **1221 passed / 0 failed** (piu' gli eventuali test nuovi; le 9
  suite `window is not defined` che non collezionano sono note). Build exit 0; una build lanciata
  subito dopo vitest puo' morire OOM (exit 137): rilanciarla da sola (eventualmente
  `NODE_OPTIONS=--max-old-space-size=4096`).
- sha256 device/container prima del commit. `git add <file espliciti>` e commit nella STESSA
  invocazione; sweep di TUTTI i `.git/*.lock` (mv in `_to_delete/` con nome nuovo) immediatamente
  prima di ogni comando git; `rm` non permesso sul mount. La VM del bridge non ha identita' git:
  committare con `-c user.name=Claude -c user.email=noreply@anthropic.com`.
- Commit separati: discovery report prima o insieme alla Fase 2, mai untracked (P4).
- Hard stop dopo la Fase 2 per il GO visivo. Criteri minimi: (a) su una view geometrica
  l'anteprima mostra la forma alle proporzioni del box derivato, con caption `W × H px` coerente
  col nodo sul canvas; (b) editando label o form dalla modale l'anteprima segue senza jank;
  (c) su una view con resize manuale la caption dichiara la taglia manuale e i numeri sono quelli
  del D-layer; (d) forma condizionale: messaggio attuale invariato; (e) catalogo, tile, recenti e
  card del rail invariati al pixel; (f) modale e striscia ad altezza fissa, nessun layout shift al
  cambiare del box.
- Entry in `docs/claude-code-log.md` DOPO il GO (formato §21.2; `check:docs` coi quattro file alla
  radice del gate; noti: 8 errori preesistenti su entry del 14/8, non correggerli; rotazione log
  ancora dovuta, 42 entry attive).

## RIFERIMENTI

- Memo: `docs/ratifiche/claude_2026-08-15_memo_ratifica_symbol_due_superfici_stencil.md` (§D15,
  anteprima realistica)
- Mockup: `docs/redesign/claude_2026-08-15_mockup_catalogo_stencil_nuova_forma.html` (striscia
  con caption `190 × 58 px · derivata dall'inchiostro (D8)`); contesto layout:
  `claude_2026-08-15_mockup_rail_e_modale_symbol.html`
- Codice: `viewpoint/authoring/SymbolEditorModal.tsx/.scss`, `SymbolPreview.tsx`;
  `viewpoint/ir/useContentSize.ts`, `shapeRegistry.ts` (contratto `contentRect` /
  `boxForContent` / `boxForContentNumeric`), `IRNodeContent.tsx`;
  `jjomTransformers.ts` (`manualSizeOf`)
- Discovery: `discovery_2026-08-15_cablaggio_taglia_da_contenuto.md` (primitivo di misura, zoom,
  border box), `discovery_2026-08-15_d18_catalogo_sezioni.md` (stato della modale post-D18)
- Norme: CLAUDE.md (regole non negoziabili, §3.1/§3.2, §5, §7, §17, §21), docs/PROTOCOL.md
  P1..P10
- Checkpoint: `docs/sessioni/claude_sessione_2026-08-15_6.md` (stato, decisioni recenti, vincoli
  di superficie)

## DEBITI IN CODA (non di questa slice, non farli senza richiesta)

Push dell'arco (~35 commit locali), rotazione log (42 entry attive, soglia 20, a repo fermo),
pulizia `_to_delete/` (inclusi `transfer/gate_2026-08-15_d15_163426.tar` 87 MB e
`transfer/gate_2026-08-15_d18.tar` 85 MB), registro `docs/decisions.md` (serie D mai iscritta).
