# Prompt Claude Code, 2026-08-23 14:25: `2.228` slice 2, commit 2b

**Fase**: 2, implementazione scoped. **Un commit solo.**
**Zona critica**: sì, `frontend/src/redux/VersionFixer.tsx`.
**Branch**: `alfonso-frontend-jjtl`. **Base**: `62d207664` o successivo.
**Corsia**: completa (`RC-3`: zona critica).
**Prompt normativo di riferimento**: `docs/prompts/claude_2026-08-18_1656_prompt_2228_fase2.md`,
sezione «Commit 2b, il tipo, i siti, l'adapter». **Questo prompt non lo sostituisce: lo riprende dopo
quattro giorni e lo riallinea.** In conflitto fra i due, vince il prompt del 18, e tu segnali.

---

## Perché riparte adesso

Il commit 2a è chiuso (`2026-08-19`) e la **verifica visiva di Alfonso è passata il 2026-08-23**:
il ritorno ad «Abstract syntax» sopravvive a salva-e-riapri, e il selettore non produce `<select>`
vuoti né warning React di controllo non controllato. L'entry di log del 2a è stata aggiornata in
place. L'hard stop che bloccava il 2b è quindi caduto.

**Fatto nuovo dal 19 agosto, che allarga il valore di questo commit senza allargarne il perimetro**:
la serie `R-LAY-1..10` è ora a registro (`docs/decisions.md` righe 1675-1693). **`R-LAY-10` vieta
ogni implementazione del fronte layout finché non è accertato che il viewpoint attivo abbia una sola
sorgente**, e mette quella verifica «in perimetro `2.228` slice 2, non in un fronte a parte». Le righe
che nomina, `NestedView.tsx:111` e `:315`, sono già nella tabella dei file del 2b. Vedi la sezione
«L'accertamento di R-LAY-10» più sotto: è un obbligo di **misura e di referto**, non di rimedio
allargato.

---

## Passo zero

1. Leggi `CLAUDE.md` e `docs/PROTOCOL.md`.
2. Leggi **dal file** `docs/decisions.md`: `R-IRN-11..24` e `R-LAY-1..10`. Non fidarti di come questo
   prompt le riassume.
3. Leggi per intero `docs/prompts/claude_2026-08-18_1656_prompt_2228_fase2.md`, in particolare la
   sezione del commit 2b e i vincoli trasversali.
4. Rileggi `docs/discovery/discovery_2026-08-18_2228_seed_e_activeviewpoint.md` §5.1, §5.3, §5.4 e
   `docs/discovery/discovery_2026-08-18_4_lir_versionfixer_2228.md` §4.3.

**Il Layer Impact Report esiste già** (`discovery_2026-08-18_4_lir_versionfixer_2228.md` §4.3) e
copre le tre modifiche a `VersionFixer.tsx`. **Non produrne un altro**: il prompt del 18 lo vieta
esplicitamente. Rileggilo prima del diff e cita quel path nella entry di log.

---

## Riallineamento delle premesse, misurato il 2026-08-23

Il prompt del 18 è stato scritto contro il codice del 18. Ho verificato oggi le righe che cita.
**Quattro premesse tengono, una è cambiata.** Riverificale tu prima di scrivere: se una di queste
misure non torna, fermati e segnala invece di adattare il piano.

| Sito | Stato al 2026-08-23 |
|---|---|
| `joiner/classes.ts:2899` e `:2924` | il tipo è **già** `Pointer<DViewPoint, 0, 1>`; a cambiare resta il **valore di default**, oggi ancora `Defaults.viewpoints[0]`, che va a `null`. Il prompt del 18 descriveva il cambio come se toccasse anche la molteplicità: **tocca solo il default**. |
| `joiner/classes.ts:3353` | invariato, il getter porta ancora `\|\| Defaults.viewpoints[0]`. |
| `joiner/classes.ts:3355-3361` | il setter **regge già `null`**, e c'è un commento nel file che lo documenta (`Pointers.from(null)` ritorna `null`, l'implementazione apre con `if (!data) return null`). §5.3 è quindi soddisfatta: **verifica e non toccare**. |
| `joiner/classes.ts:1181` | invariato, prima bocca del rubinetto. |
| `utils/lastViewpoint.ts:146-152` | invariato, terzo fallback di `resolveParentViewpoint`. I due chiamanti sono slittati di qualche riga: cercali per nome, non per numero. |
| `view/viewElement/view.tsx:339-340` e `:373-375` | invarianti, seconda bocca del rubinetto e `newDefault`. |
| `api/persistance/projects.ts:338` | invariato (`pointers.activeViewpoint = raw.activeViewpoint;`). Agisci secondo §5.4, che **non dice quello che la riga sembra dire**: rileggila. |
| **`redux/selectors/selectors.ts:529`** | **cambiato.** Il prompt del 18 la dà come `project.activeViewpoint.id` **senza** optional chaining; oggi porta già `project.activeViewpoint?.id`. **Quel punto è già a posto**: verifica e non toccare. Se trovi altrove un accesso non protetto, quello sì rientra. |

---

## Che cosa fare

La tabella normativa è quella del prompt del 18, sezione «Commit 2b». In sintesi, e senza sostituirla:

- `joiner/classes.ts`: default a `null` (righe 2899, 2924), il getter perde il fallback ed espone
  `LViewPoint | null` (`R-IRN-18`), prima bocca del rubinetto a 1181.
- `utils/lastViewpoint.ts`: terzo fallback di `resolveParentViewpoint`, più i **due** chiamanti
  verificati contro il ritorno `null`.
- `view/viewElement/view.tsx`: i due default di `new2`, e `newDefault` riscritto per il caso vuoto.
- `redux/selectors/selectors.ts`: solo se resta un accesso non protetto dopo il riallineamento sopra.
- `components/editors/views/NestedView.tsx`: righe 82, 110-111, 314-315, 544.
- `redux/VersionFixer.tsx`: nuovo adapter `private ['2.227 -> 2.228'](s: DState): DState`. Normalizza
  il valore salvato: se `activeViewpoint` è un viewpoint di sistema secondo `Defaults.isSystemViewpoint`,
  diventa `null`. Trasformazione pura, idempotente, niente azioni Redux, niente L-proxy, guardia
  `typeof e !== 'object'` su ogni ciclo che itera `idlookup` (`R-IRN-13`). **Nessuna purga**
  (`R-IRN-19`).
- `redux/__tests__/versionfixer_2228_migration.test.ts`: file nuovo (`R-IRN-20`), corpo dell'adapter
  duplicato con commento in testa che nomina la sorgente e dichiara che è una copia. Copertura:
  viewpoint di sistema → `null`; viewpoint utente invariato; doppio run deep-equal; fixture pulita
  no-op; fixture con `idlookup.clonedCounter` numerico.

**Non toccare** `Defaults.ts` e `reducer.ts`, in nessuna slice. **Non fare** il commit 2c (il bottone
di `NestedView.tsx:396`): è un commit suo e viene dopo.

---

## L'accertamento di R-LAY-10

`NestedView.tsx:110-111` e `:314-315` scrivono `project.activeViewpoint` **senza passare da
`activateViewpoint`**, quindi senza aggiornare `state.viewpoint`. La discovery del 22 lo ha
**tracciato a codice e non verificato a runtime**, e lo registra come rischio, non come misura.

Mentre sei dentro quelle righe per il cambio di tipo, **accerta e refertizza**:

1. Quanti scrittori di `project.activeViewpoint` esistono in tutto `frontend/src`, con controllo
   positivo nella stessa invocazione e glob quotati (`RC` clausola (b), e `R-RAIL-28`).
2. Se `state.viewpoint` e `project.activeViewpoint` possano divergere per effetto di quelle due
   scritture, e per quale percorso utente.
3. Se dopo questo commit la divergenza resti possibile, sia chiusa per costruzione, o richieda un
   intervento **che non fai qui**.

**Perimetro**: questo è un obbligo di misura e di referto. Non allargare il commit per chiudere la
divergenza. Se la chiusura è a una riga e dentro i file già dichiarati, **fermati e chiedi** prima di
scriverla. Il referto va nella entry di log e in un discovery report (sotto), perché è la condizione
che sblocca l'intero fronte layout: qualcun altro lo leggerà per decidere.

---

## Discovery report

Questo task ha una fase esplorativa (il riallineamento e l'accertamento di R-LAY-10), quindi il
report è **obbligatorio**, anche se breve.

- **Path**: `docs/discovery/discovery_2026-08-23_2228_slice2b_riallineamento.md`
- **Naming**: `discovery_<data>_<descrizione>.md`, già rispettato sopra.
- **Contenuto minimo**: obiettivo, file letti con path completi, esito del riallineamento riga per
  riga (quali premesse del prompt del 18 tengono e quali no), l'accertamento di R-LAY-10 con i
  comandi e i controlli positivi, dipendenze e rischi, domande aperte per Alfonso.

---

## Gate

- `npx tsc --noEmit`: nessun errore **nuovo**. Baseline nota **33**, insieme identico.
- `npm run build`: exit 0.
- `npm run smoke`.
- `vitest` sui file toccati, più il test nuovo dell'adapter.

**Attenzione a che cosa lo smoke non copre, e dichiaralo invece di darlo per coperto**: i tre stati di
`states.ts` creano un progetto ex novo, nessuno apre un progetto salvato, quindi lo smoke **non
esercita `SaveManager.load`** e non vede migrazioni, seed, né normalizzazione degli stati persistiti.
È esattamente il perimetro dell'adapter. La verifica che conta è quella manuale qui sotto.

## Verifica funzionale, per Alfonso, da elencare nel report

1. Un progetto con un **viewpoint di sistema** salvato come attivo si apre con il selettore su
   «Abstract syntax» e senza `--active`.
2. Un progetto con un **viewpoint utente** attivo si apre invariato.
3. Creare una view dal «+» del tree e dal menu contestuale del canvas, **con e senza** viewpoint
   attivo: nessun TypeError, e la view nasce nel padre atteso.
4. Riaprire due volte: `conversionList` cresce **una volta sola**, `version.n` resta `2.228`.
5. Il selettore si comporta come dopo il 2a, metamodelli compresi.

**Difetto preesistente da non scambiare per una regressione**: `DProject.activeViewpoint` non viene
mai persistito correttamente (misurato il 2026-08-19 su entrambe le colonne del controllo positivo;
la root invece si persiste giusta). Dettagli in `discovery_2026-08-19_2228_2b_perimetro_activeviewpoint.md`. Se
lo incontri, va **citato**, non riparato qui.

---

## Vincoli

- **Un commit solo.** Non anticipare il 2c.
- **Scope stretto**: solo i file dichiarati. `git add` sui file specifici, mai `git add .`.
- **Zero refactoring opportunistico**, nessun identificatore rinominato.
- **Nessuna interfaccia esportata cambiata** oltre a quanto `R-IRN-18` prescrive; aggiungere proprietà
  opzionali è ammesso, cambiarne o rimuoverne di esistenti no.
- **HARD STOP** al termine, prima della verifica visiva di Alfonso e prima del 2c.
- **Entry di log** in `docs/claude-code-log.md` a fine task, con `Prompt document name`:
  `2026-08-23 14:25`, e il campo `Layer Impact Report` che cita
  `discovery_2026-08-18_4_lir_versionfixer_2228.md` §4.3 invece di riprodurlo.
- **Rotazione del log non in questo task**: è a 44 entry contro soglia 40 (P9), si fa a repo fermo con
  prompt suo.

## Riferimenti

- `docs/prompts/claude_2026-08-18_1656_prompt_2228_fase2.md` (normativo, sezione «Commit 2b»)
- `docs/decisions.md`: `R-IRN-11..24`, `R-LAY-1..10`
- `docs/discovery/discovery_2026-08-18_2228_seed_e_activeviewpoint.md` §5.1, §5.3, §5.4
- `docs/discovery/discovery_2026-08-18_4_lir_versionfixer_2228.md` §4.3 (il LIR, da non rifare)
- `docs/discovery/discovery_2026-08-19_2228_2b_perimetro_activeviewpoint.md` (il difetto preesistente)
- `docs/discovery/discovery_2026-08-22_layout_per_viewpoint.md` §B.5 e §B.8 (il rischio che
  `R-LAY-10` codifica)
