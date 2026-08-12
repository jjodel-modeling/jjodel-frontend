# Discovery — triage del residuo working tree (serie U, Fase 0)

**Data**: 2026-08-10
**Branch**: `alfonso-frontend-jjtl`
**HEAD reale**: `53dbb6704` (docs: retroactive log entries for 4c82095dc/4701b735b, close sky-500 token decision, record 2026-08-10 no-op)
**HEAD atteso dal prompt**: `6e4b02fcc`
**Tipo**: discovery read-only. Nessuna modifica, nessun `git add`, nessun commit, nessuno scarto.
**Prompt**: «Fase 0: triage del residuo working tree (serie U)», 2026-08-10.

---

## Esito in una riga

**Il residuo da triare non esiste più: è stato interamente consumato da commit già
in cronologia e già pushati.** Il working tree porta **un solo** file non tracciato,
che non è nessuno dei tre elementi elencati dal prompt. La Fase 0 non ha oggetto.

Questo è il **secondo** triage consecutivo di questo stesso residuo che si risolve in
un no-op: il primo è già a verbale nella entry `2026-08-10 — chore: prompt di ripresa
della serie U non eseguito` (`docs/claude-code-log.md:3`). Verificato di nuovo da zero
qui, non ripreso da quella entry, come impone la Regola 15.

---

## Passo 1 — Inventario esatto

### `git log --oneline -3`

```
53dbb6704 docs: retroactive log entries for 4c82095dc/4701b735b, close sky-500 token decision, record 2026-08-10 no-op
7c58738d5 docs: log entry for the knowledge base archive migration
5f9c969a8 docs: flag divergent duplicates from knowledge base import
```

### `git status --porcelain`

```
?? docs/discovery/discovery_2026-08-09_fusione_spec_v12.md
```

Una sola riga. Confermata con `--untracked-files=all`: **1** voce totale, nessun file
modificato, nessuna directory non tracciata nascosta dietro il riepilogo di default.

### Delta rispetto allo stato atteso

| Dimensione | Atteso dal prompt | Reale | Delta |
|---|---|---|---|
| Tip | `6e4b02fcc` | `53dbb6704` | **+6 commit** |
| Ahead di origin | 0 | 0 (`rev-list --left-right --count` → `0  0`) | nessuno — ma i 6 commit sono *tutti già pushati* |
| File modificati | 2 (CSS/SCSS) | **0** | −2 |
| Path docs non tracciati | 2 | 1, **diverso da entrambi** | −2, +1 |
| Report U-2 non tracciato | sì | **no — è tracciato** | risolto |

I 6 commit interposti fra `6e4b02fcc` e HEAD:

```
4c82095dc 2026-08-09 docs: add pending discovery reports (segmented control, u2 breadcrumb)
4701b735b 2026-08-10 refactor: introduce sky-500 token for DS interactive accent
28db0a38d 2026-08-10 docs: add documentation archive structure migrated from project knowledge
5f9c969a8 2026-08-10 docs: flag divergent duplicates from knowledge base import
7c58738d5 2026-08-10 docs: log entry for the knowledge base archive migration
53dbb6704 2026-08-10 docs: retroactive log entries …
```

Nessuno di questi è stato perso o riscritto: `git reflog` non mostra reset, rebase o
checkout distruttivi. Le 4 stash presenti sono tutte antecedenti (2026-07-28 e prima)
e non pertinenti a questo residuo.

---

## Passo 2 — Contenuto delle modifiche CSS

**Non c'è nulla da diffare: `git diff` è vuoto.** I due file sono puliti rispetto a HEAD.

### Identificazione dei due file

L'identità dei due CSS che il prompt dà per modificati è ricostruibile con certezza,
perché il report U-2 del 9/8 li ha fotografati nella sua verifica d'ingresso
(`docs/discovery/discovery_2026-08-09_u2_breadcrumb_anchors.md:18-19`):

```
 M frontend/src/components/ui/SegmentedControl/SegmentedControl.module.css
 M frontend/src/styles/tokens.css
```

### Dove sono finiti

Entrambi, e **solo** quei due, compongono il commit `4701b735b`:

```
 frontend/src/components/ui/SegmentedControl/SegmentedControl.module.css | 2 +-
 frontend/src/styles/tokens.css                                          | 5 +++++
 2 files changed, 6 insertions(+), 1 deletion(-)
```

Diff integrale (6 righe, sotto la soglia delle 80):

```diff
--- a/frontend/src/components/ui/SegmentedControl/SegmentedControl.module.css
+++ b/frontend/src/components/ui/SegmentedControl/SegmentedControl.module.css
@@ -59,7 +59,7 @@
 .segmentIcon {
-  color: var(--color-cyan-500);
+  color: var(--color-sky-500);
   font-size: var(--font-size-sm);
 }

--- a/frontend/src/styles/tokens.css
+++ b/frontend/src/styles/tokens.css
@@ -36,6 +36,11 @@
   --color-cyan-900: #164e63;
 
+  /* ========================================
+     COLORS - Sky
+     ======================================== */
+  --color-sky-500: #0ea5e9; /* DS interactive accent; sky family introduced with grade 500 only */
+
   /* ========================================
      COLORS - Red (Error/Danger)
```

### Valutazione di correlazione — richiesta esplicita del prompt

**Correlazione con la Slice B2: NEGATIVA.** Il prompt chiedeva di verificare
esplicitamente se uno dei due file fosse `properties-with-tree-view.scss` o toccasse
selettori di stepper/NumberInput. **Nessuno dei due lo è**: i path sono
`ui/SegmentedControl/SegmentedControl.module.css` e `styles/tokens.css`, e il diff non
nomina né stepper né `NumberInput` né `input[type="text"]`. Il file della Slice B —
`frontend/src/components/editors/properties-with-tree-view.scss` — **non compare** in
`4701b735b` ed è pulito rispetto a HEAD (`git diff --stat` vuoto).

Nota di path: il prompt cita `properties-with-tree-view.scss` senza directory. Il file
vive in `frontend/src/components/editors/`, **non** in `frontend/src/styles/components/editors/`
(quel path non esiste). Rilevato perché la Regola 15 vieta di assumere un path.

**Correlazione reale: la Slice A3-bis della stessa serie U.** Le due modifiche erano la
bozza del token sky, non un esperimento abbandonato e non materiale di B2. Il commit
che le ha assorbite è retroattivamente a verbale nella entry
`2026-08-10 — refactor(design-system): token --color-sky-500 …` (`docs/claude-code-log.md:29`).

**Non è un rename innocuo**: `--color-cyan-500` vale `#06b6d4`, `--color-sky-500` vale
`#0ea5e9`. È un cambio di colore vero. Va detto qui perché la descrizione del residuo
come «abbozzo o esperimento» ne sottostimava la portata.

---

## Passo 3 — Identità dei path docs non tracciati

I due path del prompt sono anch'essi fotografati dal report U-2
(`discovery_2026-08-09_u2_breadcrumb_anchors.md:20-21`):

| Path atteso | Stato oggi | Verifica |
|---|---|---|
| `docs/discovery/discovery_2026-08-08_property_card_segmented_control.md` | **tracciato**, committato in `4c82095dc` (115 righe) | `git show --stat 4c82095dc` |
| `docs/_to_delete/` | **non esiste più su disco** | `ls docs/_to_delete` → *No such file or directory*; `find docs -maxdepth 1 -name "_to_delete"` → zero hit |

Su `docs/_to_delete/`: la cartella è sparita senza passare da un commit (non compare in
nessuno dei 6 commit interposti). È stata rimossa a mano fuori sessione. Non essendo mai
stata tracciata, non c'è nulla da recuperare né da scartare, e il suo contenuto non è
ricostruibile da git. Se conteneva qualcosa di significativo, quel qualcosa è perso —
ma il nome della cartella suggerisce che fosse quello lo scopo.

### Elemento non previsto dal prompt: l'unico untracked reale

```
?? docs/discovery/discovery_2026-08-09_fusione_spec_v12.md
```

- **Dimensione**: 10 118 byte, 158 righe. mtime **2026-08-10 00:51**.
- **Cos'è**: il report di **Fase 1 read-only** del prompt «Fusione spec IR v1.2 e ritiro
  di `docs/specs/`», eseguito a HEAD `7c58738d5`. Non è spazzatura né materiale
  scartato: è un discovery report completo e strutturato (obiettivo, file letti,
  censimento di `docs/specs/`, tabella a 8 hunk della divergenza, due ostacoli
  documentati, 7 domande aperte per Alfonso).
- **Esito che porta**: la divergenza fra le due copie della spec **non** è quella
  descritta dal prompt che l'ha generato. Due delta normativi non menzionati (hunk 7 e 8,
  la nota su `navigateRefHop` / `ReadCtx.getRef` e l'emendamento 2026-07-21 sul render
  multi-hop) vivono nella sola copia `docs/specs/`. Il report si è fermato lì e ha
  chiesto go-ahead. **È un blocco attivo, non materiale chiuso.**
- **Manca la sua entry di log**: `grep` su `docs/claude-code-log.md` e su
  `docs/claude-code-log-archive.md` per «Fusione spec» / «fusione_spec» /
  «ritiro di docs/specs» → **0 occorrenze in entrambi**. Il task che l'ha prodotto non è
  a verbale da nessuna parte.
- **Precedente diretto**: la nota (3) della entry dell'archivio KB
  (`docs/claude-code-log.md:26`) segnalava già la divergenza bidirezionale fra le due
  copie e la lasciava esplicitamente a decisione di Alfonso. Questo report è il seguito
  operativo di quella segnalazione.

**Violazione di P4 / Regola 16 in corso**: «un discovery report è committato nel task che
lo ha prodotto, mai lasciato non tracciato». Questo report lo è da ieri sera.

---

## Passo 4 — Report U-2

`docs/discovery/discovery_2026-08-09_u2_breadcrumb_anchors.md`:

- **Tracciato**, committato in `4c82095dc` insieme al report segmented control.
- **Integro**: 145 righe, `git diff --stat` sul path → vuoto (nessuna modifica locale
  rispetto alla versione committata).
- Contenuto coerente con la sua natura dichiarata (verifica di sei ancore in sola
  lettura a HEAD `8704221de`, non una nuova discovery).

Nessuna azione richiesta. L'elemento 3 del residuo è chiuso.

---

## Stato delle due slice che la Fase 0 doveva sbloccare

Verificato direttamente sul codice, non dedotto dai titoli dei commit.

### Slice B2 — **già atterrata e già pushata**

Commit `4e9255462` (2026-08-08), `fix: neutralize B4 generic input padding on stepper
inputs (U-5)`. Tocca `frontend/src/components/editors/properties-with-tree-view.scss`
(+34 righe) e porta con sé l'addendum di discovery (159 righe).

La regola è **viva a HEAD**, `properties-with-tree-view.scss:451`:

```scss
.jj-field div:has(> button:not([role="checkbox"]) + input) > input[type="text"] {
    padding: 0;
    border: none !important;
    border-radius: 0;
    background: transparent;
}
```

Corrisponde alla Direzione 1 ratificata: neutralizzazione **additiva** (la regola
generica non è toccata), combinatore discendente per raggiungere lo stepper annidato in
`ConditionalEditor`, `!important` sul solo `border` perché la generica lo dichiara tale.
Il commento sopra la regola documenta il limite noto (aggancio strutturale
`button + input + button`, che si rompe in silenzio se il markup di `NumberInput` cambia).

### Slice A3-bis — **già atterrata**

Commit `4701b735b`, sopra. Token a `tokens.css:42`, consumatore a
`SegmentedControl.module.css:62`.

---

## Raccomandazioni

| # | Elemento | Stato | Raccomandazione | Motivazione |
|---|---|---|---|---|
| 1 | 2 CSS modificati | non esistono più | **NESSUNA AZIONE** | Assorbiti da `4701b735b`, già pushato. Non erano materiale B2. |
| 2 | `discovery_2026-08-08_property_card_segmented_control.md` | tracciato | **NESSUNA AZIONE** | Committato in `4c82095dc`. |
| 3 | `docs/_to_delete/` | rimosso da disco | **NESSUNA AZIONE** | Mai tracciato, sparito fuori sessione, nulla da recuperare. |
| 4 | Report U-2 | tracciato e integro | **NESSUNA AZIONE** | Committato in `4c82095dc`, 145 righe, pulito. |
| 5 | `discovery_2026-08-09_fusione_spec_v12.md` | **non tracciato** | **COMMIT ORA**, con la sua entry di log mancante | Discovery report completo che porta un blocco attivo (2 delta normativi non autorizzati) e 7 domande aperte. Lasciarlo untracked viola P4 e rischia di perdere l'unico censimento della divergenza. |
| 6 | Slice B2 | committata e pushata | **NON RIESEGUIRE** | `4e9255462`; rieseguirla riscriverebbe un commit già su origin. |
| 7 | Slice A3-bis | committata | **NON RIESEGUIRE** | `4701b735b`. |
| 8 | Questo report | non tracciato per costruzione | **COMMIT** insieme al #5 | Il prompt chiede di non committarlo in questa fase; il prossimo giro docs è la sede naturale. |

Nessun elemento è candidato a SCARTA. Nessun elemento è candidato ad ASSORBI IN B2:
B2 è chiusa.

---

## Domande aperte per Alfonso

1. **Il residuo descritto dal prompt è vecchio di due giorni.** È il terzo caso di
   context drift della serie (Fase 1 voce 4; sessione Cowork dell'8/8; il no-op del 10/8),
   e la radice è la stessa: `contesto_progetto.md` **non è nel repo** — verificato,
   `git ls-files` e `find` danno zero hit — quindi vive nel Project Knowledge e nessun
   commit può sincronizzarlo. Finché resta fuori, ogni prompt costruito su di esso può
   descrivere uno stato del repo già superato. Vale la pena portarlo nel repo, o
   almeno far aprire ogni prompt di ripresa con una lettura di `git log -1` reale?
2. **`discovery_2026-08-09_fusione_spec_v12.md` va committato subito?** Raccomando sì,
   con la sua entry di log. In alternativa: c'è un motivo per cui è stato lasciato fuori?
3. **Le 7 domande aperte del report fusione restano senza risposta** e bloccano la Fase 2
   di quel prompt. In particolare la 1 (gli hunk 7 e 8, normativi e ancorati al codice a
   HEAD, entrano nella fusione?) e la 4 (perimetro dell'aggiornamento dei riferimenti a
   `docs/specs/`: 2 documenti vivi, 21, o tutte e 42 le occorrenze). Vanno affrontate in
   una sessione dedicata, non dentro la ripresa della serie U.
4. **Se «Ordinal di un `DEnumLiteral` risulta vuota» è ancora osservabile** — era la
   precondizione di lancio del prompt del 10/8 — allora il difetto **non** è quello che B2
   ha chiuso, perché la regola di `4e9255462` è viva a `:451` e il suo smoke dell'8/8 è
   passato. Servirebbe una diagnosi da capo, con la specifica formale richiesta dalla §5
   di CLAUDE.md (cosa si osserva, cosa ci si attende, criterio di accettazione).
5. **Rotazione del log**: le entry attive sono 20, esattamente alla soglia. La entry di
   questo task le porta a 21. La rotazione in questo repo è sempre stata un commit a sé.

---

## Comandi eseguiti (tutti in lettura)

```
git log --oneline -3
git status --porcelain
git status --porcelain --untracked-files=all
git rev-parse --abbrev-ref HEAD
git status -sb
git cat-file -t 6e4b02fcc
git reflog -15
git stash list
git log --oneline --since=2026-08-08
git rev-list --left-right --count origin/alfonso-frontend-jjtl...HEAD
git show --stat <6 commit>
git show 4701b735b
git show 53dbb6704 -- docs/claude-code-log.md
git ls-files docs/discovery/
git ls-files | grep properties-with-tree-view.scss
git diff --stat -- <path>            (×2, entrambi vuoti)
ls -la docs/discovery/ ; ls docs/_to_delete ; find docs -maxdepth 1 -name _to_delete
head/tail/sed/wc/grep su file di documentazione e sullo scss
```

Nessun `git add`, nessun `git checkout --`, nessun `git clean`, nessun `git stash`,
nessun commit. HARD STOP rispettato.

---

## Addendum 2026-08-12: la domanda sul contenuto perso ha una risposta

Il paragrafo su `docs/_to_delete/` (§ Passo 3) chiude con «se conteneva qualcosa di
significativo, quel qualcosa è perso». Per due file almeno, non lo è. Il paragrafo
originale resta com'è scritto: un report di discovery è una fotografia datata, e si
corregge in coda con la data della correzione.

Trovati in `.git/_to_delete/` durante la chiusura dell'arco 2 (commit `9031c6ce6`):
`migrated_design_doc_orig.md` (21 824 B, 268 righe) e `retired_spec_v12.md`
(14 832 B, 214 righe), entrambi datati 24 luglio 14:15. Non stanno nel working tree, e
`git status` non scandisce mai `.git/`: per questo non sono comparsi in nessun triage,
compreso questo.

Nessuno dei due è contenuto unico, misurato:

- `git hash-object` dà `9a540c9543baf8c2…` e `f968e41c802dbd5a…`, e `git cat-file -e`
  conferma che **entrambi gli oggetti sono già in git**. `git log --all --find-object`
  li colloca in `b0292b863` («docs: retire docs/specs/, migrate the slice-1 design doc,
  redirect note») e in `03363ce6a` («docs: merge the two divergent copies of the
  ViewpointIR v1.2 spec»). Sono gli originali messi da parte prima delle due operazioni
  che il loro nome annuncia, non contenuto unico.
- Le copie vive nel repo li contengono per intero.
  `docs/spec/design_2026-07-21_ir_authoring_surface_slice1.md` diverge per **una riga
  sola**: il path del companion spec, che passa da `docs/specs/` a `docs/spec/`. È la
  migrazione stessa.
  `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` è un **soprainsieme stretto**,
  divergente per quattro hunk tutti nella direzione del più: la riga `**Emendamenti**`,
  l'annotazione «emendamento 2026-07-18» sul fallback normativo della palette derivata,
  il paragrafo su `DVertex.irEdgeLayout` che sostituisce una nota al futuro sul gap #6,
  e la frase su `DVertex.irCollapsed`. Sono le ratifiche R-FS1..R-FS7: l'orfano è la
  copia **pre-fusione**.
  Misura dei due diff, per renderli riproducibili: `diff <orfano> <copia viva> | wc -l`
  dà **4** e **17**, cioè l'output completo di `diff`, intestazioni di hunk e separatori
  compresi. In righe cambiate sono 1+1 e 5+5. I byte vanno da 21 824 a 21 830 e da
  14 832 a 15 833.

**Non stabilito**: da quale `_to_delete/` vengano. Questo report parla di
`docs/_to_delete/`, i due file stanno in `.git/_to_delete/`. Non è stato accertato, e la
conclusione qui sopra non dipende dalla risposta: la domanda resta aperta.

**Registrato per inciso**, perché è il resto del contenuto della stessa cartella:
`.git/_to_delete/` raccoglie **32 file**, di cui **30 sono detriti di git** — 6
`HEAD.lock.*`, 7 `index.lock.*`, 4 `maintenance.lock.*`, 13 `tmp_obj_*` — cioè i file su
cui git fa `unlink` e che il mount del bridge Cowork non può cancellare (più una cartella
vuota, `specs_dir_4129`). È la traccia accumulata di R-RAIL-27 attraverso le sessioni.
Non va ripulita in questo passo: è inerte, sta fuori dal working tree, e come evidenza
vale più di quanto costi.
