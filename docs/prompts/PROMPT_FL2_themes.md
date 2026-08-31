# PROMPT — FL2: temi delle form come preset in cascata

Implementa i temi delle form specificati da `docs/design/form-autolayout-spec.md` e `Form Auto Layout.dc.html` (autoritativo per la resa dei 4 preset).

## Cosa

Un tema è un preset nominato su ESATTAMENTE tre campi — nessun campo nuovo, nessun CSS libero:

```ts
type FormTheme = {
  labelPlacement: 'top' | 'left';
  density: 'comfortable' | 'compact' | 'dense';
  sectionStyle: 'flat' | 'divided' | 'card' | 'none';
};
```

Preset: `Comfortable` (top/comfortable/flat — default), `Compact` (left/compact/divided), `Sectioned` (top/comfortable/card), `Dense` (left/dense/none).

## Dove

- Definizione + risoluzione: `frontend/src/jjform/themes.ts` — puro, importabile sotto vitest (stesso vincolo di `shape.ts`).
- Cascata: metamodello → viewpoint → per-classe, la STESSA cascata degli altri style field della piattaforma (instance node preset: campi nominati in cascata) — non introdurre un secondo sistema di styling. Persistenza col meccanismo esistente degli style field del viewpoint; l'aggancio D-graph sta nell'adapter, non nel modulo puro.
- Risoluzione: `resolveTheme(defaults, viewpointTheme?, classTheme?) → FormTheme` — merge per campo (un override per-classe può cambiare solo `density`), non per preset intero.

## Resa (mappa i 3 campi, non stili ad hoc)

- `labelPlacement: left` → griglia label 72–78px + campo, label right-aligned; `top` → label sopra, 11px/500.
- `density` → scala di padding/font/gap: comfortable (7px 10px, 12.5px, gap 14), compact (5px 9px, 12px, gap 8/14), dense (4px 8px, 11.5px, gap 6/14). Costanti nominate, non numeri sparsi.
- `sectionStyle`: flat = eyebrow semplice; divided = eyebrow + border-bottom per sezione; card = una card per sezione con header band `#f8fafc`; none = nessun chrome, ordine come unico confine.

## Test attesi

- I 4 preset risolvono ai valori della tabella della spec.
- Merge per campo: viewpoint `Compact` + override per-classe `{density:'dense'}` → left/dense/divided.
- Default: nessun tema dichiarato → `Comfortable`.
- Nessun campo extra accettato (il tipo chiude il registro).

## Fuori scope

Packing e width map (FL1), widget (FL3), UI di scelta tema (può essere un select nel tab Style già esistente — se lo tocchi, dichiaralo nel log).

## Coordinamento

Parallelo a FL1/FL3, file disgiunti. Committa con pathspec, log con la sola tua entry.
