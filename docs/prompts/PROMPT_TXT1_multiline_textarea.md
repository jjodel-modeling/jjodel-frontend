# PROMPT — TXT1: l'annotation `multiline` sul metamodello (DISCOVERY-FIRST)

Corsia **completa** (RC-3): il perimetro dichiarato sta sopra i 3 file. Referto in
`docs/discovery/discovery_2026-09-01_txt1_annotation_multiline.md`, **nessun codice
prima del referto** (P4). Il referto si committa nel task che lo produce (P4, regola 16).

## Il difetto

La spec dice che è il metamodello a decidere la form: «Corrections promote to the
metamodel as annotations — the same ladder as the value renderers»
(`docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md`, «Principle»).
Per la textarea questo oggi non è vero. Un `EString` che vuole essere una nota
multiriga ha due sole vie, e nessuna delle due è il metamodello:

- un override d'autore per-view, `FormSpec.widgets[name] = 'textarea'`, che
  `useFormWidgets.ts:165-169` ammette già come compatibile con `text` — ma vive nella
  view, non nel metamodello, e va rifatto in ogni viewpoint;
- **rinominare il tipo** dell'attributo in uno dei nomi del rung 3 (`text`, `etext`,
  `longtext`, `multiline`, `memo`, `clob` — `jjform/layout.ts:227-229`), cioè cambiare
  il modello dell'utente per una scelta di presentazione.

TXT1 aggiunge il gradino che manca: una dichiarazione sul metamodello, letta dal rung 2.

## Cosa ho già misurato (confermare, non ri-derivare)

- Il carrier esiste e funziona: `DAnnotation.source`, stringa, encoding
  `jjodel/<chiave>=<valore>`, parentata su qualunque `DModelElement`,
  `DAttribute.annotations` compreso. Lettura pura in
  `components/editor-v2/nodes/rowViewAnnotations.ts` (`readRowViewAnnotations`,
  `parseRowViewAnnotations`), scrittura in `rowViewAnnotationsWrite.ts`
  (`declareRowViewAnnotation` / `clearRowViewAnnotation`, **fuori** da ogni
  `TRANSACTION` esterna per CLAUDE.md §3.3).
- Le chiavi sono un'unione chiusa di quattro: `'renderer' | 'unit' | 'min' | 'max'`
  (`rowViewAnnotations.ts:58`). `DAnnotationDetail` è una classe vuota il cui corpo è
  `// todo` e `EcoreParser.parseDAnnotation` ritorna `[]` alla prima riga: **i details
  keyed di Ecore non sono un carrier**, riempirli è un core change e non è questo task.
- Il rung 2 è vivo e consumato: `IRForm.tsx:262-266` proietta `LayoutAnnotations`
  dai descriptor e la passa a `autoLayoutRows` (`IRForm.tsx:502`), che chiama
  `widthOf` (`jjform/layout.ts:284`). Non è una scrittura morta.
- `WIDTH_MAP.text = { span: 12, widget: 'textarea' }` esiste già
  (`jjform/layout.ts:166`), e `extendedWidgetFor` (`formAutoLayout.ts:395-408`) manda
  quel nome a `GrowTextWidget`.

## Clausola d'arresto

La prima domanda del referto è: **il grafo D porta metadati per-attributo scrivibili e
persistiti, oggi, senza toccare il core?** Se la verifica smentisce quanto sopra — la
chiave non è estendibile senza toccare `DAnnotation`, oppure la scrittura non
sopravvive a un salva/riapri — **STOP**: si consegna il referto con la misura e nient'altro.
Non si ripiega su un campo nuovo di `DAttribute` (sarebbe un core change, regola 5) né su
`DAnnotationDetail`.

## La forma minima (ipotesi da verificare, non ordine di esecuzione)

1. `rowViewAnnotations.ts`: quinta chiave `multiline`. Valore booleano dichiarato
   (`jjodel/multiline=true`), con la stessa disciplina dei bound: un valore che non è
   `true` né `false` viene **scartato**, non coerciuto — un `NaN` che passa il controllo
   è esattamente l'errore che quel commento già evita.
2. `jjform/layout.ts`: `LayoutAnnotations` guadagna `multiline?: boolean`; nel rung 2 di
   `widthOf`, su un attributo scalare della famiglia string/unknown, la dichiarazione
   produce `verdict('text', 'annotation', …)` — span 12, widget `textarea`.
   **Precedenza**: `renderer` resta prima (è la regola 1 della scala, e un
   `renderer=code` che oggi decide una larghezza deve continuare a deciderla, regola 3);
   `multiline` decide solo dove il renderer non ha deciso.
3. `IRForm.tsx:262-266`: una chiave in più nella proiezione. `AttrShape` **non** si
   allarga — è il confine che FL1 ha già dichiarato in due posti («the shape is the
   METAMODEL's structure and an annotation is a decoration over it»).
4. Superficie di dichiarazione: il gruppo Display del pannello proprietà
   (`nodes/DisplayAnnotations.tsx`, montato da `editors/Info.tsx:586`), con il gating di
   `displayAnnotationFields.ts` — `multiline` è testuale, stessa porta di `code`.

## Il trabocchetto: due `textarea`, una parola

`widgets/index.ts:18-25` lo dichiara e chiede di tenerli separati:

- `WidgetKind.textarea` (`useFormWidgets` → `IRFormField.tsx:420`, `TextWidget multiline`)
  è **l'editor di espressioni JjEL**: mono, 44–56px, `resize: none`, e `IRFormField.tsx:463`
  gli attacca l'hint `JjEL`;
- `FormWidget.textarea` (FL1 → `extendedWidgetFor` → `GrowTextWidget`) è la prosa che cresce.

TXT1 deve arrivare al **secondo**. Criterio meccanico: `extendedWidgetFor` ritorna `null`
se `descriptor.widget !== descriptor.derivedWidget` (`formAutoLayout.ts:400`), quindi la via
che non tocca la derivazione di `useFormWidgets` è anche l'unica che imbocca la strada
giusta — e l'hint `JjEL` resta spento senza toccare la sua condizione. Se il referto
conclude diversamente, lo argomenta con la misura.

## Canvas e tabella: intatti, ed è verificabile

Nessun tocco a `valueRenderer.ts`, `RowValue`, `RendererInspector.tsx`,
`jjomTransformers.ts`, `instanceTable.ts`. Aggiungere una chiave all'unione non cambia
il canvas perché il Row view legge `renderer`/`unit`/`min`/`max` per nome: **questo va
mostrato**, non affermato. Un attributo con `jjodel/multiline=true` rende in cella e in
compartment esattamente come senza (misura o test, a scelta; §5, un'asserzione di assenza
vuole la prova che la ricerca sia girata).

Nota: `jjodel/multiline` **non** entra in `DECLARABLE_RENDERERS`. Un valore di `renderer`
nuovo propagherebbe a `RendererKind`, `RENDERER_LABELS` e allo switch di `RowValue` — cioè
al canvas. È il motivo per cui la chiave è nuova e non è un renderer.

## L'eccezione al cap `STRETCH_MAX`, dichiarata nella spec

`STRETCH_MAX = 6` (`jjform/layout.ts:73`) esiste solo nel codice e nel referto
`discovery_2026-09-01_10k_ritocchi_giro2.md`: **nella spec non compare** (grep su
`design_handoff_jjodel_form_views/`: zero occorrenze). Il commento del codice lo chiama
«amendment A2 (10k, 01-09-2026)», ma nella spec **A2 è un altro emendamento** (le literal
di `FormTheme`). Collisione di id, ereditata.

TXT1 chiude il buco con **un emendamento nuovo, il prossimo libero (`A3`)**, che scrive
due cose:

- il cap: lo stretch della regola 2 si ferma a metà riga;
- **l'eccezione**: il cap vale su quello che il packer *aggiunge*, non sulla larghezza di
  base. Un campo `text`/`richtext` — e quindi un attributo con `multiline` dichiarato —
  parte da 12 e li tiene. Non è uno strappo alla regola: è la regola letta bene, ed è la
  frase che oggi vive solo nell'header di `layout.ts:70-71`.

L'id `A2` nel commento di `layout.ts` **non si rinomina** (regola 2): l'emendamento dichiara
la corrispondenza in una riga e il codice resta com'è.

## Allineamento con AUTO1

AUTO1 (`docs/discovery/discovery_2026-09-01_auto1_id_autoincrement.md`) è in volo e legge
anch'esso metadati per-attributo. Le due corsie sono **disgiunte per carrier e per accessor**,
e devono restare tali:

- AUTO1 legge **flag D** (`isID`, `changeable`) con `featureFlags(idlookup, a.id)` in
  `jjform/shape.ts`, e li mette in `AttrShape` — è struttura del metamodello;
- TXT1 legge **annotation** con `readRowViewAnnotations` / `parseRowViewAnnotations`, e le
  tiene **fuori** da `AttrShape` — è decorazione.

Vincoli operativi: TXT1 non tocca `shape.ts` né `create.ts`; non introduce un secondo lettore
di annotation. `useFormWidgets.ts` è l'unico file su cui i due perimetri possono incrociarsi
(AUTO1 emenda la riga 314, il read-only): la forma minima di TXT1 non lo tocca affatto —
se il referto conclude che deve, dichiaralo come punto di serializzazione con AUTO1 e
allinea prima di scrivere.

## Test attesi

In `jjform/__tests__/layout.test.ts` e `nodes/__tests__/rowViewAnnotations.test.ts`
(più `displayAnnotationFields` se il gating cambia). Ogni caso è un criterio meccanico:

- `EString` scalare, `multiline` dichiarato → `{ kind: 'text', span: 12, widget: 'textarea',
  rung: 'annotation' }`; lo stesso attributo senza dichiarazione → `{ kind: 'string',
  span: 6, widget: 'text' }`, invariato.
- Dichiarazione di nulla: `multiline` su un boolean, su un numero, su un enum, su una
  reference e su un multivalore **non cambia niente** (il rung 1 ha già deciso).
- `renderer=code` + `multiline` sullo stesso attributo → vince `code`, span 6.
- Valore non booleano (`jjodel/multiline=si`) → scartato, come un bound non finito.
- `clearRowViewAnnotation` → il campo torna a 6.
- Il campo non prende il box JjEL: `extendedWidgetFor` ritorna `'textarea'` e l'hint di
  `IRFormField.tsx:463` resta spento.
- Il round-trip `.ecore` perde la dichiarazione (parser stubbato, pre-esistente): va
  **dichiarato** nel referto, non riparato qui.

Le unità nuove si provano contro almeno una mutazione ciascuna sui punti portanti (chiave
tolta dall'unione, rung 2 spostato prima del rung 1, precedenza del renderer invertita):
un test che non diventa rosso non pinna niente.

## Fuori scope

`parseDAnnotation` / il round-trip Ecore delle annotation; `DAnnotationDetail`; qualunque
campo nuovo su `DAttribute`; `richtext` (la seconda riga a span 12 della tabella, che
nessun rung raggiunge oggi); la tabella del Manager; il canvas; l'altezza massima o il
`resize` di `GrowTextWidget`; l'override d'autore `FormSpec.widgets`, che resta com'è e
continua a vincere (`formAutoLayout.ts:400`).

## Perimetro dichiarato (regola 19)

`nodes/rowViewAnnotations.ts`, `jjform/layout.ts`, `viewpoint/ir/IRForm.tsx`,
`nodes/displayAnnotationFields.ts`, `nodes/DisplayAnnotations.tsx`,
`design_handoff_jjodel_form_views/form-autolayout-spec.md`, i due file di test, il referto e
la entry di log. Sono nove: la lista è qui perché la regola 19 vuole la conferma **prima**,
e questa la dà. Qualunque file oltre questi si ferma e si chiede.

## Gate

`npx tsc --noEmit` letto su output **completo** con exit status (baseline 33, §17 e §5:
una conta su una finestra non è una conta); `npm run build` exit 0; vitest sui file toccati
e sulle suite `jjform/__tests__/` e `viewpoint/ir/__tests__/`. Smoke visivo: un attributo
`EString` annotato, la form mostra il box che cresce a 12 colonne e la riga accanto non si
sposta; lo stesso attributo senza annotation resta a 6. Layer Impact Report: `not-required`
se il diff non tocca §3.1 — dichiararlo.
