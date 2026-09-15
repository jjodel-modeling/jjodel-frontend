# Prompt Claude Code: forme, Passo 0 (verifica handle) + ratifica discovery

**Nome del documento prompt**: 2026-08-14 02:30
**Tipo**: discovery mirata
**Effort**: xhigh
**Critical zone**: sì in lettura (`portDistribution.ts`, `handlePosition.ts`,
`DynamicHandles.tsx`). Nessuna scrittura su sorgenti.

**Supersede**: il prompt `2026-08-14 01:58` (Fase 0, dieci domande) è archiviato.
Nove domande su dieci hanno già risposta nel discovery report allegato. Resta aperta
solo quella del §6, che è però quella che decide tutto il resto.

---

## COSA

Due cose, in quest'ordine.

**A. Ratificare il discovery report allegato.** È stato prodotto in chat leggendo il
working tree, non da te. Va verificato prima di diventare la base di un diff.

**B. Rispondere alla domanda aperta del §6**: come vengono posizionati gli handle di
React Flow sui nodi IR, e se possono essere collocati su offset arbitrari calcolati dal
contorno della forma anziché sui lati del box rettangolare.

Nessuna modifica ai file sorgente. Nessun modulo nuovo. Nessuna forma nuova.

---

## DOVE

**Da verificare (parte A)**, i riferimenti puntuali del report:

- `viewpoint/ir/irTypes.ts:38` — la union `ShapeForm` è quella dichiarata
- `viewpoint/ir/irTypes.ts:116,187,351,407` — `form`, `collapsed.form`, `collapsedForm`
- `viewpoint/ir/IRNodeContent.tsx:62,156,179,183` — risoluzione per istanza e ramo diamante
- `viewpoint/ir/irStyle.ts` — regole `.ir-shape--*` e neutralizzatori `:has()`
- `nodes/nodeSizing.ts:34` e `nodes/ObjectNode.tsx:388-402` — gate di resize
- `viewpoint/authoring/VertexAuthoringPanel.tsx:324-335` — `ConditionalEditor<ShapeForm>`
- `redux/VersionFixer.tsx:1009` — migrazione `2.225 -> 2.226`, campo `e.ir`
- il conteggio dei riferimenti a `ShapeForm`: il report ne dichiara 7 in 6 file

**Da leggere (parte B)**, path candidati da confermare con `grep` prima di aprirli:

- `components/editor-v2/**/DynamicHandles.tsx`
- `components/editor-v2/utils/handlePosition.ts`
- `components/editor-v2/utils/portDistribution.ts`
- `components/editor-v2/nodes/ObjectNode.tsx` (dove monta gli `<Handle>`)
- `components/editor-v2/EditorV2.scss` (regole di posizionamento degli handle)

---

## COME

### Parte A: ratifica

Per ogni riferimento dell'elenco sopra, una riga: **confermato** con il contenuto
effettivo, oppure **divergente** con il contenuto reale e il path:linea corretto.
Non riscrivere il report: produci un elenco di scostamenti. Se non ce ne sono, dillo
esplicitamente.

Aggiungi una verifica che il report non ha fatto: leggi **`irCompile.ts` integralmente**
e riporta come `Conditional<T>` viene compilato in `CompiledConditional<T>`, con
particolare attenzione a se il valore risolto è memoizzato o ricalcolato a ogni chiamata.
Serve a dimensionare il rischio §8 riga 2.

### Parte B: la domanda che decide tutto

Rispondi a queste, con `path:linea` e con almeno una traccia end-to-end su uno scenario
reale, non sulla lettura del codice (CLAUDE.md §5).

**B1.** Dove sono montati gli `<Handle>` di React Flow per i nodi IR, e quanti ne
esistono per nodo.

**B2.** La loro posizione è determinata da: (a) il default di React Flow sui quattro lati
del box, (b) uno stile inline calcolato, (c) una classe CSS, (d) altro. Cita il codice.

**B3.** Se esiste un calcolo di posizione, qual è il suo input? Riceve larghezza e
altezza del nodo, oppure una geometria più ricca? La forma (`ShapeForm`) entra in quel
calcolo in qualche punto, anche indirettamente?

**B4.** `portDistribution.ts` produce `nodeHandles` e `edgeHandles`. CLAUDE.md §3.10
afferma che `nodeHandles` è scartato da `EditorV2.tsx`. **Verificalo ora** e riporta
l'esito con il path:linea del consumatore (o l'assenza di consumatori, con controllo
positivo della ricerca). Riporta lo stesso per `edgeHandles`.

**B5.** Domanda operativa: se un descriptor di forma fornisse, per un dato nodo, una
lista di offset `(dx, dy)` relativi al centro del box, **esiste un punto in cui quegli
offset possono essere applicati agli handle senza toccare la politica di ordinamento
delle ancore**? Indica il punto esatto, oppure spiega perché non esiste. Non
implementarlo.

**B6.** Il diamante oggi: gli archi si agganciano al rombo o al rettangolo circoscritto?
Rispondi guardando lo stato reale, non il codice. Se non riesci a produrre lo scenario,
dillo invece di dedurlo.

### Vincoli metodologici

- `grep` in questa shell è un wrapper su `ugrep --ignore-files`: `--include` non filtra e
  `--exclude-dir` è inerte. Usa `command grep` quando quei flag portano il significato
  della ricerca (CLAUDE.md §5).
- Ogni asserzione di assenza richiede il comando, il suo exit status e un controllo
  positivo sullo stesso comando.
- Conte su output completo, mai su `| tail -N`, dichiarate come tali.
- **Non toccare** `docs/discovery/2026-05-27_anchor_ordering_inversion.md` né il bug che
  descrive. Se la traccia B3/B5 lo attraversa, annotalo e prosegui senza proporre fix.

---

## DISCOVERY REPORT

- **Path**: `docs/discovery/discovery_2026-08-14_ir_shape_handles.md`
- Contenuto: esito della ratifica (parte A, elenco scostamenti), risposte B1..B6,
  rischi aggiornati, domande aperte.
- Committa **anche** il report allegato a questo prompt, corretto degli scostamenti
  trovati, come `docs/discovery/discovery_2026-08-14_ir_shape_form.md`.
  Se un'affermazione risulta falsa, correggila sul posto e marca la correzione.

---

## HARD STOP

Al termine, fermati. In chat riporta soltanto:

1. Gli scostamenti della parte A, o "nessuno".
2. La risposta a **B5** in tre righe: punto di innesto esistente, oppure perché no.
3. La risposta a **B6**.

Non proporre diff, non creare `shapes/`, non toccare `ShapeForm`.

---

## COMMIT

```
git add docs/discovery/discovery_2026-08-14_ir_shape_handles.md
git add docs/discovery/discovery_2026-08-14_ir_shape_form.md
git add docs/claude-code-log.md
```

Mai `git add .` o `git add -A`. Messaggio:
`docs(discovery): verify IR handle placement against shape contour`

Entry di log nel formato §21.2 con **Layer Impact Report**: `not-required` (lettura),
**Out-of-scope changes**: `no`, **Regressions**: `no`, **Corregge**: `—`, **Causa**: `—`.

---

## RIFERIMENTI

- Report allegato: `discovery_2026-08-14_ir_shape_form.md` (prodotto in chat, da ratificare)
- `CLAUDE.md` §3.1, §3.10, §5, §17, §21.2
- `docs/PROTOCOL.md` P1..P9
- `docs/discovery/2026-05-27_anchor_ordering_inversion.md` (da non intrecciare)
