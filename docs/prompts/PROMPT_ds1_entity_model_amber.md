# PROMPT — DS-1: la coppia `model` esce dai contenitori e torna ambra

Corsia veloce (RC-3). Slice sui token di entità, aperta il 2026-08-31 dopo 10f.

## Perché

`docs/DESIGN-SYSTEM.md` §2.2 dice **«Model — Amber»**, con la rampa per esteso
(`#FAEEDA` bg chiaro, `#854F0B` testo, `#f59e0b` strong, lettera `m` minuscola).
La scala entity dice un'altra cosa: `--color-entity-model-*` **aliasa la famiglia
contenitori** (`#E2EAF5 / #45566F`, un blu-ardesia) in entrambi i temi,
`_colors-light.scss:356-357` e `_colors-dark.scss:264-265`.

Non è il DS a essere in ritardo: è la scala. R-RAIL-30 (2026-08-11) ha generato le
nove coppie canoniche in OKLCH e ha messo `model` fra i sette alias del contenitore,
sovrascrivendo §2.2 sulle superfici che leggono i token — senza che la divergenza
fosse registrata da nessuna parte.

Il prodotto, intanto, dipinge il modello d'ambra in **quattro** posti, con quattro
valori diversi, tutti letterali:

| Sito | chiaro | scuro |
|---|---|---|
| `element-badge.scss:28` `--model` | `#FAEEDA / #854F0B` | `rgba(186,117,23,.2) / #FAC775` |
| `MegamodelView.scss:256,266` card | `#FAEEDA / #854F0B` | — |
| `MegamodelView.scss:462` swatch legenda | `#FAEEDA`, bordo `#FAC775` | — |
| `dashboard.scss:1129` `.psb-badge--m` | `#fef3c7 / #92400e` | — |
| `EditorV2.scss:~810` `&__badge` | ambra-600 `#d97706` | — |

L'ultimo porta un commento che dichiara la scelta e la rinvia: «literal and not a
token because repainting `--color-entity-model-*` would also repaint
`.jj-type-badge--model` … a wider change than this bar, **to be decided on its
own**». Questa slice è quella decisione.

**Nota di rettifica.** I referti 10e e 10f hanno scritto «la coppia model non è
ambra — premessa falsificata». È il contrario: il DS dice ambra, e il file dei token
è la deviazione. Chi esegue non riparta da quella frase.

## Il vincolo misurato — leggere prima di scegliere un colore

La scala non è una tavolozza, è una costruzione: **6 tinte × 2 gradi di croma**, con
L fissa. Misurato il 2026-08-31 su tutte e nove le coppie committate:

```
chiaro   bg L 0.935  C 0.017 (tenue) | 0.031 (satura)     fg L 0.450  C 0.046 | 0.085
scuro    bg L 0.300  C 0.031 (tenue) | 0.056 (satura)     fg L 0.845  C 0.043 | 0.077
tinte    class/object 356°   enum/literal 56°   attribute/parameter 175°
         reference 115°   operation 296°   container 256° (grado tenue; il satura è LIBERO)
```

Il problema è che **l'ambra del DS sta a H 64-81°, e `enum`/`literal` occupano 56°**.
È il vicinato più stretto della scala. Candidati al grado saturo, con ΔE OKLCH del
fondo contro `enum`:

| H | chiaro bg / fg | ΔE vs enum | scuro bg / fg | ΔE vs enum |
|---|---|---|---|---|
| 70 | `#F7E6D4` / `#734C17` | 0.0070 | `#402809` / `#EDC495` | 0.0120 |
| 80 | `#F5E8D3` / `#6E4F11` | 0.0127 | `#3D2A07` / `#E7C793` | 0.0210 |
| **85** | **`#F3E8D3` / `#6B5110`** | **0.0146** | **`#3B2B06` / `#E4C992`** | **0.0263** |
| 90 | `#F1E9D3` / `#685310` | 0.0180 | `#392C06` / `#E0CB92` | 0.0310 |

**Il pavimento che la scala già tollera** — ΔE minima fra i fondi di due famiglie
diverse — è **0.0143** in chiaro e **0.0243** in scuro (entrambi `class`/`object`).
Sotto quel numero si introduce una coppia meno distinguibile di ogni coppia esistente.

**H = 85 è l'unica tinta che supera il pavimento in ENTRAMBI i temi.** Contrasto
6.16:1 chiaro (identico a `container`) e 8.52:1 scuro.

## La decisione che il prompt NON prende

H 85 è ambra che tira al giallo: il DS ha il suo stop di fondo a 80.7°. Chi esegue
**guarda i due pastelli affiancati** (`model` accanto a `enum`) e decide:

- **(A) H 85, grado saturo** — default. Rispetta R-RAIL-30 e il pavimento.
- **(B) H 70-80 con croma alzata** oltre 0.031, per separare alla tinta del DS.
  Introduce un terzo grado: è una modifica alla costruzione della scala, non un
  colore in più. Se serve, si ferma e si riapre come slice di scala.
- **(C) Non si fa**: si registra la divergenza in §2.2 («sulle superfici a token il
  modello è ardesia»), e i quattro letterali restano. Esito legittimo.

Se a schermo `model` ed `enum` non si distinguono, **(A) fallisce e la slice si ferma**:
meglio nessun cambiamento che due pastelli indistinguibili in una legenda.

## Perimetro

- `styles/tokens/_colors-light.scss` — `model` esce dal blocco alias ed entra fra le
  coppie canoniche. I sei contenitori restanti (metamodel, package, viewpoint,
  transformation, refactoring, view) **non si toccano**.
- `styles/tokens/_colors-dark.scss` — identico. Entrambi i file, sempre (Regola 28).
- Un file di test nuovo.

Tre file. Nessun file di §3.1: Layer Impact Report non richiesto.

## I consumatori, tutti e tre — verificarli a schermo

`--color-entity-model-*` ha esattamente due lettori, e da lì tre superfici:

1. `_form-system.scss:1255` `.jj-type-badge--model` →
   `Info.tsx:1085,1088` (glifo e chip del rail Properties) e
   `InstanceManagerTab.tsx:883` (il badge `m` dell'outline, 10f).
2. `constants/documentTypes.ts:46-47` → `Navbar.tsx:295`, il menu «New document».

Tutte e tre devono diventare ambra nella stessa corsa. Una che resta ardesia
significa che legge un letterale, non il token: si trova e si riporta.

## Test attesi

- Asserzione che `model` non è più un alias di `container` e che i sei contenitori
  lo sono ancora — in entrambi i file.
- L e C della coppia nuova dentro la tolleranza della scala (±0.003 su L, il grado di
  croma esatto). È la regola di costruzione, e un test che guardi solo l'esadecimale
  non la difende.
- ΔE contro `enum` e `literal` sopra il pavimento misurato, in entrambi i temi.
- Contrasto ≥ 4.5:1 su entrambe le coppie.

## Gate

Typecheck a baseline (33, conteggio su output completo), vitest sui file toccati,
build exit 0. Sonda visiva before/after con `PROBE_LABEL`, pattern 10d/10f, sulle
**tre** superfici: rail Properties, outline del manager, menu «New document». Ritagli
nel referto, in tema chiaro **e** scuro — una coppia si giudica in due temi o in
nessuno.

## Fuori scope, dichiarato

- I quattro letterali ambra della tabella sopra. Convergono sul token in una slice a
  valle, quando il token esiste; qui si **contano**, non si toccano.
- `viewpoint`, che nella card megamodel collide con `model` su `#FAEEDA / #854F0B`
  già oggi — difetto anteriore alla scala, registrato il 2026-08-12 e non ancora
  chiuso.
- La legenda del megamodel e il limite della famiglia contenitori: è la decisione
  aperta dalla ratifica `claude_2026-08-12_classificazione_teal_e_limite_della_famiglia_contenitori.md`,
  §3 punto 2, e questa slice ne chiude un membro solo, non la regola.

## Coordinamento

Seriale. Verificare che nessuna sessione stia scrivendo in `styles/tokens/` prima di
aprire i file — 10f ha trovato 10e in corso negli stessi due file e ha dovuto
fermarsi. Pathspec, entry di log in commit separato.
