# 2026-08-29 00:20 — Stringhe in inglese, e la superficie di authoring per le annotazioni `jjodel/*`

Due seguiti dallo smoke visivo della libreria Row view. Undici file di sorgente, nessuno nella
critical zone. Perimetro concordato al hard stop di regola 19 e approvato con due emendamenti,
riportati qui sotto ai punti A e B.

## Richiesta (verbatim)

> **1.** All UI strings in English. The inspector and related surfaces shipped in Italian: non
> valutata, dichiarato, Cambia renderer, the ladder rung descriptions, and any other string added in
> the level-3 slices. The product's language is English (sentence case, documentation-grade). Sweep
> every string introduced by these slices: not evaluated, declared, Change renderer, rung evidence
> texts (no annotation on color, "Green" is not a colour literal, all 3 literals of Palette are CSS
> colour names), badge labels, and the smoke fixture's visible labels. Update the probe assertions
> that pin those strings.
>
> **2.** The jjodel/* annotations have no authoring surface. The renderer inspector writes
> jjodel/renderer, but there is nowhere to see or set jjodel/unit, jjodel/min, jjodel/max,
> jjodel/code — so a modeler cannot give widthPx its px unit at all. Where does attribute editing
> live today in the metamodel editor (the attribute row, a side panel, a popover)? Add a Display
> group there with four fields, reading and writing the annotations through
> rowViewAnnotationsWrite.ts (bare creators, per the LIR): Unit — short text input (e.g. px, s, ms);
> Min / Max — numeric inputs; both set → progress, either empty → plain number; Code — a toggle:
> render values in monospace. Plus a read-only line showing the effective renderer for this
> attribute (the ladder's verdict), so the modeler sees the consequence of what they set — and, when
> jjodel/renderer is declared, an inline declared badge with a Clear action, same semantics as the
> inspector's.
>
> Constraints: additive only; fields appear only for attribute kinds where they make sense
> (Unit/Min/Max on numeric types, Code on strings); empty field = annotation removed, not written as
> empty string. If the attribute editing surface is owned by another slice's panel (the Form tab
> work), put the group in the metamodel-side surface, not the FormSpec one — these annotations are
> metamodel facts, not view facts.

## A — `jjodel/code` non esiste

`rowViewAnnotations.ts:59` possiede quattro chiavi: `renderer | unit | min | max`. `jjodel/code` non
compare da nessuna parte in `src/` (controllo positivo: `jjodel/unit` compare due volte nello stesso
file). Il monospazio **è già un renderer**, `code`, ed è in `DECLARABLE_RENDERERS`: il toggle scrive
quindi `jjodel/renderer=code` e lo pulisce. Una quinta chiave avrebbe cambiato la semantica della
scala, non l'avrebbe estesa.

Conseguenza: il toggle e il menu "Change renderer" dell'ispettore sono due controlli su una chiave
sola. Emendamento approvato: quando la chiave dichiara **altro** il toggle **non si rende affatto**,
invece di rendersi disabilitato — «a disabled control invites the user to wonder how to enable it»,
mentre il badge `declared` accanto dice già qual è la situazione e Clear è l'unica mossa che la
cambia. Il toggle ricompare quando la dichiarazione è pulita o legge `code`.

## B — La riga del verdetto non ha un valore d'istanza

Nell'ispettore M2 non c'è nessuna DValue. `detectValueRenderer` corto-circuita su `isEmptySlot` e
risponderebbe `dash` per ogni attributo del modello; i pioli 2, 3 e 4 della scala leggono il valore,
i literal contro il valore, e il nome solo come spareggio su un valore che già nomina un colore.
Nessuno dei tre può accendersi qui.

Emendamento approvato: la riga si chiama **"Renderer from metamodel"** e non "effective renderer", e
porta sotto di sé una riga breve — *«Instances may resolve differently by value — inspect a row on
the canvas for the full ladder»*. I pioli non accendibili **non si disegnano**: disegnarli sarebbe
il pannello M2 che mente esattamente nel modo che l'ispettore è stato costruito per impedire.

Serve quindi una funzione nuova, `metamodelRenderer` in `valueRenderer.ts`: l'ordine di
`detectValueRenderer` meno i pioli che hanno bisogno di un valore. Duplica l'ordine invece di
condividerlo perché le due rispondono a domande diverse — «cosa rende questo slot» contro «cosa ha
stabilito il modellatore». Un tipo `Color` dichiarato **viene** riportato come `swatch`, perché è un
fatto del metamodello; se una data istanza sia dipingibile non lo è.

## Dove è atterrato il gruppo

L'editing degli attributi M2 vive in `components/editors/Info.tsx`, nel rail destro:
`static attribute()` → `static feature()`, che rende `GENERAL`, `TYPE & BOUNDS` e la striscia dei
flag. `DISPLAY` è la quarta `CollapsibleSection`, chiusa di default, e sta **solo** nel ramo
`attribute()`: unità, bounds e monospazio sono affermazioni su un valore, e una reference non ne ha.

Percorso per lo screenshot:

```
rail destro → albero → un attributo (es. widthPx su AllNine) → sezione DISPLAY
```

## Due file oltre il perimetro concordato, dichiarati

1. `editor-v2/nodes/displayAnnotationFields.ts` — il gating doveva essere puro e testabile, e non
   poteva stare nel componente: il componente importa `rowViewAnnotationsWrite.ts`, che importa il
   barrel del joiner, che tira dentro Monaco, che dereferenzia `window` all'import. È esattamente la
   ragione per cui `rowViewAnnotationsWrite.ts` era stato staccato a suo tempo, e la stessa linea
   passa qui.
2. `editor-v2/nodes/rendererInspector.scss` — una riga di commento che nominava la stringa
   `dichiarato`. Cambiata la stringa, quel commento avrebbe detto il falso.

## Una trappola di metodo, per il prossimo

La prima verifica delle stringhe dell'ispettore leggeva `popover.innerText` e trovava tre righe:
`name`, `· Config`, `auto`. Sembrava che il corpo del pannello non ci fosse. C'era: il corpo sta in
uno scroller clippato e `innerText` non restituisce il testo che non è reso. `sections=1 rungs=4
action="Change renderer"` dal DOM lo dimostra. La sonda ora legge `textContent` e stampa i conteggi:
una spazzata che legge tre righe di nove non prova niente sulle altre sei.
