# Prompt Claude Code: C9.1, completare le coppie `--color-entity-*` da `entityMeta.ts`

**Nome canonico del documento prompt**: `2026-08-10 19:30`
**Tipo**: commit unico, solo file di token. Nessun componente toccato.
**Ratifica a monte**: C9.1 del memo `claude/2026-08-10_memo_ratifica_2_rail_fase0.md`
(Alfonso, 2026-08-10). Il commit precede l'arco del rail e chiude un debito che esisteva
prima di esso.

---

## COSA

`entityMeta.ts` definisce le coppie `badgeBg` / `badgeText` per undici tipi di entity. Il
lato CSS ne replica **cinque** come custom property `--color-entity-<tipo>-{bg,fg}`.
Mancano le quattro che il rail userà più spesso: **attribute, reference, operation, enum**.

I commenti di entrambi i file dichiarano già l'obbligo di sincronia:
`entityMeta.ts:10-12` («i valori bg/text di questo file sono replicati come CSS variables
in `_colors-light.scss` e `_colors-dark.scss`. Mantenere in sync») e
`_colors-light.scss:329-330` («Allineata a `entityMeta.ts`. NON modificare senza aggiornare
anche `entityMeta.ts`»). Le quattro coppie mancanti sono quindi un debito dichiarato, non
una richiesta nuova.

**Aggiungi le quattro coppie, in light e in dark. Non toccare nient'altro.**

## DOVE

Due file, nessun altro:

- `frontend/src/styles/tokens/_colors-light.scss`, blocco «ENTITY CATEGORICAL PALETTE»
  (righe ~327-341 su HEAD)
- `frontend/src/styles/tokens/_colors-dark.scss`, blocco «ENTITY CATEGORICAL PALETTE —
  dark variant» (righe ~231-244 su HEAD)

`entityMeta.ts` **non si tocca**: è la fonte, ed è già completa.

## COME

### Light: copia verbatim da `entityMeta.ts`

Aggiungi in coda alle cinque coppie esistenti, prima del blocco «Saturated variants»,
mantenendo l'ordine e la formattazione delle righe già presenti (due punti, spazio,
maiuscolo esadecimale, punto e virgola):

```scss
  --color-entity-attribute-bg: #D1FAE5;
  --color-entity-attribute-fg: #059669;
  --color-entity-reference-bg: #CFFAFE;
  --color-entity-reference-fg: #0891B2;
  --color-entity-operation-bg: #E0E7FF;
  --color-entity-operation-fg: #4F46E5;
  --color-entity-enum-bg: #FEF3C7;
  --color-entity-enum-fg: #D97706;
```

Riscontro sulla fonte: `entityMeta.ts:151-152` (attribute), `:160-161` (reference),
`:169-170` (operation), `:133-134` (enum). Verifica i valori sul file prima di scriverli:
se non coincidono con quelli qui sopra, **fermati e segnala**, non adattare.

### Dark: copia verbatim `badgeBgDark` / `badgeTextDark`

```scss
  --color-entity-attribute-bg: rgba(16, 185, 129, 0.15);
  --color-entity-attribute-fg: #34D399;
  --color-entity-reference-bg: rgba(6, 182, 212, 0.15);
  --color-entity-reference-fg: #22D3EE;
  --color-entity-operation-bg: rgba(99, 102, 241, 0.15);
  --color-entity-operation-fg: #818CF8;
  --color-entity-enum-bg: rgba(245, 158, 11, 0.15);
  --color-entity-enum-fg: #FBBF24;
```

**Attenzione, qui c'è una divergenza deliberata da spiegare nel commento.** Le cinque
coppie dark già presenti **non** copiano i valori dark di `entityMeta.ts`: seguono la regola
dichiarata nel loro header, cioè «bg rgba 0.18 del fg light, fg shade-300». Le quattro
nuove seguono invece `entityMeta.ts` verbatim (alpha 0.15, fg shade-400).

La scelta è ratificata e ha due ragioni: (1) l'obbligo di sincronia dei due file riguarda
`entityMeta.ts` come fonte, e un componente che legge il colore da TypeScript deve ottenere
lo stesso colore di uno che lo legge da CSS; (2) applicando la regola shade-300 al tipo
`enum` si otterrebbe `#FCD34D`, che è **identico** al fg dark già assegnato a `model`, cioè
due tipi indistinguibili in dark mode.

**Le cinque coppie esistenti non si toccano.** Aggiorna solo il commento di header del
blocco dark perché descriva la realtà invece di una regola che ora vale per metà del blocco.
Testo proposto, adattalo alla larghezza delle righe circostanti:

```
     ENTITY CATEGORICAL PALETTE — dark variant
     Le prime cinque coppie seguono: bg rgba 0.18 del fg light, fg shade-300.
     Le quattro aggiunte il 2026-08-10 (attribute, reference, operation, enum)
     copiano badgeBgDark/badgeTextDark di entityMeta.ts verbatim: alpha 0.15,
     fg shade-400. Divergenza deliberata (C9.1): allineare enum alla regola
     shade-300 lo renderebbe identico a model.
```

## Vincoli

- **Due file, nient'altro.** Nessun componente, nessuno `.scss` di componente, nessun
  `entityMeta.ts`.
- **Prima di scrivere, `grep -rn "color-entity-attribute\|color-entity-reference\|color-entity-operation\|color-entity-enum" frontend/src`**
  per confermare che i quattro nomi non esistano già da nessuna parte. Se un nome esiste,
  fermati e segnala: significa che qualcuno li ha introdotti altrove e va deciso quale
  vince.
- `git add` dei soli due file più `docs/claude-code-log.md`. Mai `git add .`.
- Messaggio di commit: `refactor(tokens): complete the --color-entity-* pairs from entityMeta`
- Gate: `npm run build` e `npm run check:docs`. Non serve typecheck (nessun `.ts` toccato),
  ma eseguilo comunque se è nel tuo gate standard e riporta il delta.
- Entry in `docs/claude-code-log.md` col formato validato dal gate, trattini lunghi delle
  intestazioni inclusi (sono formato, non stile).
  `**Prompt document name**: 2026-08-10 19:30`. `**Smoke visivo**: non applicabile` (i
  quattro token non hanno ancora consumatori: li introdurrà l'arco del rail).
  `**Layer Impact Report**: not-required`.

## Definition of done

1. Otto righe nuove in `_colors-light.scss`, otto in `_colors-dark.scss`, commento di
   header dark aggiornato.
2. `git diff --stat` mostra esattamente tre file (i due token più il log).
3. Build verde.
4. Nessuna riga rimossa o modificata fra quelle preesistenti: il diff è puramente additivo
   tranne il commento di header.
