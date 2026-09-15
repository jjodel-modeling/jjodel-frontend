# Discovery — FL2: i temi della form come preset in cascata

Data: 2026-08-31. Prompt: `docs/prompts/PROMPT_FL2_themes.md`.
Fase 1 read-only. Nessun file di `frontend/src/` scritto durante questa fase.

## 1. Ipotesi che la discovery sta falsificando

1. «I tre path citati dal prompt esistono» — **falsificata due volte su tre**, §2.
2. «`FormTheme` e' un identificatore libero» — **falsificata**, §3: esiste gia', con
   un altro significato, e i suoi letterali sono congelati da R-B9.
3. «La cascata da imitare e' una sola e si trova» — **confermata**, §4.
4. «Le costanti di resa del prompt sono complete» — **quasi**: due valori non sono
   determinati dal testo, §5.

## 2. I path del prompt

| Citato | Esiste | Reale |
|---|---|---|
| `docs/design/form-autolayout-spec.md` | no | `docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md` (untracked a inizio sessione) |
| `Form Auto Layout.dc.html` | **no, in nessun punto del repo** | — |
| `frontend/src/jjform/` | si' | 10 moduli + `__tests__/` |

Il primo e' un prefisso mancante e si risolve senza ambiguita': un solo file con quel
nome nel repo.

Il secondo **non esiste**. Controllo positivo eseguito, non un silenzio (CLAUDE.md §5,
«un'asserzione di assenza richiede la prova che la ricerca sia girata»):
`command grep -rl "Form Auto Layout" docs/` restituisce **4 file** — la spec e i quattro
prompt FL1..FL4 — e **zero** file `.dc.html`. La board che il repo tiene nella stessa
cartella e' `Jjodel Form Views.dc.html`, e **non e' quella**: cercando i nomi dei quattro
preset dentro di essa si trovano `compact` x7 e `Compact` x1 (che sono il tema IR gia'
esistente, §3), e **zero occorrenze** di `comfortable`, `sectioned`, `dense`.

**Perche' non e' un hard stop di Regola 15.** La board e' citata come autoritativa
«per la resa dei 4 preset», cioe' come arbitro in caso di disaccordo fra testo e disegno.
Il disaccordo qui non c'e': la tabella dei preset sta identica nel prompt e nella spec
ratificata, e i numeri di resa stanno per esteso nel prompt. La board deciderebbe solo i
due valori di §5. Assenza dichiarata, non aggirata.

## 3. `FormTheme` esiste gia' — collisione di nome, non di compilazione

`frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts:211`:

```ts
/** Panel skin of a form rendering. Absent = the host decides ('plain' in the rail,
 *  'card' in the form document): the default belongs to the host, not to the view,
 *  so the compile does NOT materialize one here. */
export type FormTheme = 'plain' | 'card' | 'compact' | 'inspector';
```

e su `FormSpec` (`irTypes.ts:247-250`):

```ts
    /** Absent = host default (see FormTheme). */
    theme?: FormTheme;
    /** Absent = 'above'. 'left' is honoured by the 'compact' theme only. */
    labelPlacement?: 'above' | 'left';
```

Consumatori vivi: `IRForm.tsx:34,45,234` (`const theme: FormTheme = spec?.theme ?? defaultTheme`),
`FormAuthoringBody.tsx:77` (`THEME_OPTIONS`, la select gia' esistente),
`irFormStyle.scss:842-975` (`.ir-form--card`, `--compact`, `--inspector`; la riga 842 dichiara
«Control heights: plain 28, card 28, compact 24, inspector 26»).

Tre conseguenze, tutte per FL4 e nessuna per FL2:

1. **Nome duplicato fra moduli.** `jjform/themes.ts` e `ir/irTypes.ts` esporteranno due
   `FormTheme` con significati diversi. TypeScript non se ne accorge finche' qualcuno non
   li importa insieme — e quel qualcuno e' `IRForm.tsx`, cioe' FL4. Precedente in repo per
   la stessa forma: `AccentPlacement` e' dichiarato **due volte**, in
   `nodes/instanceNodeStyle.ts:21` e in `irTypes.ts:286`, con union diverse, e
   `irTypes.ts:276-280` spiega perche' non si importano a vicenda («`irTypes` is a pure
   schema, and importing a canvas module into it would invert the layering»).
2. **I letterali vecchi sono definitivi.** `irTypes.ts:239` — «Since the saved IR has no
   VersionFixer at all (R-B9), every literal below is DEFINITIVE once written». Quindi
   `'plain' | 'card' | 'compact' | 'inspector'` **non si rinomina e non si restringe**:
   un IR salvato che porta `theme: 'inspector'` deve continuare a leggersi. FL4 potra'
   aggiungere il tema nuovo accanto, mai al posto.
3. **`labelPlacement` esiste gia' con un altro vocabolario**: `'above' | 'left'` la',
   `'top' | 'left'` qui. `'above'` e `'top'` sono lo stesso concetto con due nomi. FL4
   dovra' mappare, non unificare: il letterale `'above'` e' persistito.

Regola 2 e P2 sono rispettate: **nessun identificatore esistente viene rinominato**, e il
nuovo vive in un modulo che oggi nessuno importa insieme al vecchio.

## 4. La cascata da imitare

`frontend/src/components/editor-v2/nodes/instanceNodeStyle.ts` — e' il «instance node preset»
citato dal prompt, ed e' l'unico sistema di questa forma in repo (`resolveInstanceNodeStyle`
ha un solo chiamante di produzione, `ObjectNode.tsx:607`).

Struttura da replicare, tre parti:

- `INSTANCE_NODE_STYLE_DEFAULT` — il default di fabbrica, valore pieno (`:52`).
- `INSTANCE_NODE_PRESETS: Record<string, Partial<InstanceNodeStyle>>` — quattro preset
  nominati sugli stessi campi (`:71`).
- `resolveInstanceNodeStyle(...layers)` (`:88-102`), che e' il pezzo con la sostanza:

```ts
    for (const layer of layers) {
        if (!layer) continue;
        // The explicit `undefined` filter is the whole point: a spread would let
        // a layer that names a field without an opinion erase the layer below.
        const stated = Object.entries(layer).filter(([, v]) => v !== undefined);
        out = { ...out, ...Object.fromEntries(stated) } as InstanceNodeStyle;
    }
```

Il commento e' la ragione per cui il merge del prompt e' «per campo, non per preset intero»:
uno spread nudo farebbe cancellare al layer superiore i campi che nomina senza opinione.
Stesso ordine, meno- a piu'-specifico: metamodello, viewpoint, per-classe.

Il file dichiara di se': «This slice renders from the default (no authoring surface writes
the layers yet), so the resolver is called with none; the shape is here so the next slice
adds a source, not a mechanism». FL2 sta nella stessa posizione: modulo puro adesso,
sorgente D-graph nell'adapter di FL4.

## 5. I due valori che il testo non determina

1. **Larghezza della colonna label in `labelPlacement: left`.** Il prompt dice «72-78px»,
   che e' un intervallo, e una costante nominata deve sceglierne uno. **72** e' l'unico
   multiplo di 8 dentro l'intervallo, e la griglia di base del progetto e' 8px
   (CLAUDE.md §7.1). Scelto 72 per quel motivo, non per gusto. Da notare che il tema IR
   esistente usa oggi **88px** (`irFormStyle.scss:904`, `grid-template-columns: 88px 1fr`):
   il nuovo preset stringe, e la differenza e' voluta dalla spec.
2. **Tipografia della label in `left`.** Il prompt dichiara «11px/500» solo per `top`.
   Assunzione presa: **una sola tipografia di label**, non una per placement — quindi
   11/500 in entrambi, e nel modulo la coppia sta in due costanti scalari
   (`LABEL_FONT_SIZE`, `LABEL_FONT_WEIGHT`) invece che dentro il record per-placement,
   cosi' il codice dice «questo non varia» invece di ripetere lo stesso numero due volte.
   E' l'unica cosa che la board mancante potrebbe smentire.

Terzo punto, risolto e non assunto: **la banda header della card**. La spec dice `#f8fafc`.
Un esadecimale nudo in TS morirebbe in dark mode. Il token esiste ed e' esattamente questo
ruolo — `_colors-light.scss:399` `--color-form-panel: #{$slate-50};` con `$slate-50: #f8fafc`
(`:19`) e il commento «card-theme panel, sub-form header», e `_colors-dark.scss:298`
`--color-form-panel: #0f1012;`. Il modulo emette `var(--color-form-panel)`, che in light
**e'** il valore della spec. Precedente per una `var()` dentro un modulo TS:
`instanceNodeStyle.ts:44`, `NEUTRAL_ACCENT = 'var(--color-inode-accent-neutral)'`.

Attenzione per FL4, dal blocco di commento a `_colors-light.scss:391-397`: esistono 15 nomi
dichiarati sia da `styles/tokens/` sia da `styles/tokens.css` con valori diversi, e
`tokens.css` vince la cascata; `--color-form-surface` e `--color-form-panel` erano proprio
finiti invertiti. `--color-form-panel` e' scritto per esteso li' apposta. Non aliasarlo.

## 6. Collisioni verificate prima di scrivere (P2)

`command grep -rn <nome> frontend/src`, conteggi:

| Nome | Occorrenze | Esito |
|---|---|---|
| `FormTheme` | 4 | **occupato** — §3, convivenza fra moduli |
| `LabelPlacement` | 4 | tutte `irLabelPlacement` / `labelPlacement` (campi, non il tipo); il **tipo** e' libero |
| `SectionStyle` | 0 | libero |
| `DensityScale` | 0 | libero |
| `FORM_THEME_*` | 0 | libero |
| `DENSITY_SCALE` | 0 | libero |
| `LABEL_COLUMN_*` | 0 | libero |
| `SECTION_CHROME` | 0 | libero |

`Density` come parola intera: 4 occorrenze, tutte stringhe di UI o prosa
(`envgen`, `polymetric`, un commento), **nessun tipo**. Libero.

## 7. Perimetro e rischi

File che FL2 scrive: `frontend/src/jjform/themes.ts` (nuovo),
`frontend/src/jjform/__tests__/themes.test.ts` (nuovo), `frontend/src/jjform/index.ts`
(sole aggiunte di export). Tre file, sotto la soglia di Regola 19.

Nessun file di CLAUDE.md §3.1 nel perimetro: nessun Layer Impact Report dovuto.
Zero import nel modulo, quindi zero propagazione a D-layer, L-layer, sync o JjOM.

Disgiunzione dalle parallele, come il prompt chiede: FL1 scrive `jjform/layout.ts`,
FL3 il registro dei widget, FL4 e' l'unico che tocca `IRForm.tsx`. `jjform/index.ts` e'
l'unico file condiviso con FL1/FL3 — export in coda, blocchi separati, conflitto testuale
possibile ma banale.

## 8. Domande aperte

1. La board `Form Auto Layout.dc.html` va depositata nel repo? Finche' manca, i due valori
   di §5 restano una scelta motivata e non una lettura.
2. FL4 dovra' decidere il destino di `FormSpec.theme` / `FormSpec.labelPlacement`. Non si
   possono rimuovere (R-B9). Sopravvivono come layer piu' basso, si mappano sui preset
   nuovi, o convivono? Non e' una domanda di FL2, ma nasce qui.
3. Il nome del campo di persistenza sul viewpoint per il tema nuovo: FL2 non lo sceglie
   — «l'aggancio D-graph sta nell'adapter» — ma FL4 lo dovra' scegliere dentro `FormSpec`,
   che e' additivo e senza migrazione.
