# Discovery — RC-7, re-ancoraggio dell'igiene dei gate

**Documento prompt**: 2026-08-06 19:10 RC-7 igiene dei gate
**Fase**: 0 (re-ancoraggio e fotografia), read-only sul codice
**HEAD**: `5fcef39ef`
**Esito**: **hard stop, regola di uscita 8**. Due assunzioni del CONTESTO non reggono a HEAD e la
seconda invalida il fix prescritto per il punto 2: applicato alla lettera, **peggiora** il gate
invece di ripararlo. Misurato, non dedotto (§5 di `CLAUDE.md`: un comparatore non si valida
leggendolo). Il punto 1 e il punto 3 reggono e sono pronti a partire.

---

## Obiettivo

Ri-ancorare a HEAD i tre difetti di igiene della catena dei gate — allineamento del generato
`AGENTS.md`, resolver di `check:docs`, descrizione della baseline tsc — verificando path,
`file:riga`, determinismo e numeri prima di scrivere una riga di implementazione.

## File letti

- `/Users/alfonso/jjodel/CLAUDE.md`
- `/Users/alfonso/jjodel/AGENTS.md` (solo hash e diff)
- `/Users/alfonso/jjodel/docs/claude-code-log.md`
- `/Users/alfonso/jjodel/docs/claude-code-log-archive.md`
- `/Users/alfonso/jjodel/docs/decisions.md`
- `/Users/alfonso/jjodel/docs/PROTOCOL.md`
- `/Users/alfonso/jjodel/scripts/generate-agents.mjs`
- `/Users/alfonso/jjodel/frontend/package.json`
- `/Users/alfonso/jjodel/frontend/scripts/gates/check-docs.ts`
- `/Users/alfonso/jjodel/frontend/scripts/tsconfig.json`
- `/Users/alfonso/jjodel/frontend/src/jjtl/CLAUDE.md`, `.../AGENTS.md` (esistenza e hash)

---

## (a) Script e catena

| Cosa | Dove | Valore |
|---|---|---|
| Generatore | `frontend/package.json:107` | `gen:agents` → `node ../scripts/generate-agents.mjs` |
| Gate docs | `frontend/package.json:100` | `check:docs` → `node --experimental-strip-types scripts/gates/check-docs.ts` |
| Type gate | `frontend/package.json:96` | `typecheck` → `tsc --noEmit` |
| Type gate degli script | `frontend/package.json:99` | `typecheck:scripts` → `tsc --noEmit -p scripts/tsconfig.json` |

**Non esiste uno script aggregato dei gate.** Nessun husky (`.husky/` assente), nessun
`core.hooksPath`, nessun hook non-sample in `.git/hooks/`. La catena è **documentata, non
eseguibile**: vive in `CLAUDE.md:5` (intestazione: dopo aver modificato il file, `gen:agents` poi
`check:docs`) e in `CLAUDE.md:769-774`, §17 «Verification gates before commit», quattro voci
(`build`, `typecheck`, `test`, `check:docs`).

**Conseguenza per la Fase 1**: «wiring allo stesso livello di `check:docs`» significa due edit e
non tre — una riga in `frontend/package.json` e una voce nell'elenco di `CLAUDE.md` §17, con
`AGENTS.md` rigenerato di conseguenza. Non c'è un aggregato da toccare.

Nota: `frontend/scripts/tsconfig.json:12-15` include `gates/**/*.ts`, quindi il nuovo
`check-agents.ts` entra automaticamente nel perimetro di `typecheck:scripts`.

## (b) Generatore

- **Path reale**: `scripts/generate-agents.mjs` (root del repo, **non** `frontend/scripts/`), 137 righe.
- **Sorgenti**: ogni `CLAUDE.md` dell'albero, raccolto ricorsivamente escludendo `node_modules` e
  dotdir (`:58-66`), filtrato da `isProjectable` (`:72-75`: non vuoto e con almeno un heading).
  Più, per il solo root, il frammento §0 `docs/_agents/runtime-codex.md` (`:42`, `:79-84`).
- **`docs/decisions.md` NON è un sorgente del generatore.** Il punto 3 della Chiusura del prompt lo
  ipotizza: l'ipotesi è **falsa**, quindi aggiungere la riga RC-7 a `decisions.md` non impone di
  rigenerare `AGENTS.md`.
- **Destinazione**: `resolve(dirname(src), 'AGENTS.md')` (`:128`), cioè accanto a ogni sorgente.
  **Nessun parametro di output path oggi**; nessuna lettura di `process.argv`. `ROOT` è derivato
  dalla posizione dello script (`:40`) e non da `process.cwd()`, quindi il generatore è
  indifferente alla directory da cui parte.
- **Il generatore scrive DUE file**, non uno: `AGENTS.md` in root e `frontend/src/jjtl/AGENTS.md`.
  I `CLAUDE.md` proiettabili nell'albero sono esattamente due (root e `frontend/src/jjtl/`); il
  probe `[CANARY]` citato nel docstring `:15-16` non esiste più (`0 skipped` a ogni run).
- **Determinismo: confermato per misura.** Due run consecutivi, hash identici:
  ```
  9f7af914a67694800bee9a2b1a328c03a87897bfcfa92bc9e9792fcafe7291c9  AGENTS.md
  2466d4e629491de2ffdf1af7881dcc187f5e317a2207b39962868961a2bfd428  frontend/src/jjtl/AGENTS.md
  ```
  Coerente con la costruzione: lo script non rilegge mai `AGENTS.md` (`:9-11`).
- **Regen a HEAD: diff vuoto.** `git status --short` non mostra `AGENTS.md` dopo il run. La regola
  di uscita 3 **non** scatta e non c'è nessun `git restore` da fare. Atteso: il riallineamento
  `363f8166d` della voce 5 è di sei ore fa.
- **Parametrizzabile con edit minimale: sì**, ma la forma non è quella che il prompt presuppone.
  Non un *output file path* — il generatore scrive N file — bensì una **output root directory** che
  rimappa `dirname(src)` relativo a `ROOT`. Sono ~6 righe attorno a `:127-129`. La regola di uscita
  6 non scatta.

## (c) `check-docs.ts` — le due chiavi

Path reale: `frontend/scripts/gates/check-docs.ts`, 409 righe. I due punti citati dal prompt come
«268» e «313» sono ancora validi a HEAD, con una precisazione sul secondo:

| Punto | `file:riga` | Chiave |
|---|---|---|
| Costruzione dell'insieme | `check-docs.ts:268` — `known.add(n.trim())` | **nome intero**, es. `2026-08-05 13:10 prompt_sliceA_endpoint_editing_non_distruttivo` |
| Risoluzione del riferimento | `check-docs.ts:314` — `known.has(m[1])` | **solo prefisso timestamp**, `m` da `TIMESTAMP_PREFIX.exec(v)` a `:303` |

`TIMESTAMP_PREFIX` è definito a `:59` come `/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})(\s|$)/`, e il commento
`:53-57` dichiara esplicitamente che un'annotazione in coda è ammessa. La meccanica corrisponde
**esattamente** a quella descritta dal CONTESTO: la regola di uscita 4 non scatta su questo.

**Fotografia dei 4 warning correnti** (`check:docs` → 2/2 PASS, 4 warning):

| # | Entry | Valore di `Corregge` | Il bersaglio esiste? |
|---|---|---|---|
| 1 | `claude-code-log.md:55` | `2026-08-05 13:10` | **sì**, `claude-code-log.md:185` |
| 2 | `claude-code-log.md:68` | `2026-08-05 13:10` | **sì**, `claude-code-log.md:185` |
| 3 | `claude-code-log.md:121` | `2026-07-18 00:00` | **NO**, in nessun punto del log né dell'archivio |
| 4 | `claude-code-log.md:213` | `2026-08-04 15:25` | **sì**, `claude-code-log.md:250` |

**Prima assunzione che non regge**: il CONTESTO dice «i 4 warning noti, tutti falsi positivi (i
documenti esistono)». Tre lo sono; **il terzo è un vero positivo** — `2026-07-18 00:00` non
corrisponde ad alcun `**Prompt document name**`, né intero né per prefisso. Il gate sta segnalando
correttamente un riferimento irrisolto, e per §21.3 va bene così («Fine if that task was never
logged»). Ne segue che il criterio del test 4 della Fase 1 — «dai 4 warning a 0» — **non è
raggiungibile**: l'esito corretto dopo il fix è **1**.

### La misura che ferma il punto 2

Il fix prescritto è «chiave unica: il nome file intero, sia nella costruzione sia nella
risoluzione». Ho eseguito le quattro varianti sui dati reali (271 nomi noti fra log e archivio, 7
riferimenti `Corregge` in scope) invece di giudicarle a vista:

| Variante | Insieme | Lookup | Warning |
|---|---|---|---|
| **V0**, oggi | nome intero | prefisso | **4** |
| **V1**, la lettera del prompt | nome intero | valore intero | **5** |
| **V2** | **prefisso** | prefisso | **1** |
| V3, prefix match tollerante | nome intero | valore o suo prefisso | **5** |

**Seconda assunzione che non regge, ed è quella grave**: V1 non ripara nulla e rompe due
riferimenti che oggi funzionano — `2026-08-06 11:34 (la voce 3 lasciò AGENTS.md disallineato…)` e
`2026-08-02 16:00 (E-obj, Fase 2…)`, dove è il **`Corregge`** a portare l'annotazione e il
`Prompt document name` bersaglio a essere nudo. Il caso è simmetrico a quello che il CONTESTO
descrive, e l'uguaglianza fra nomi interi lo manca in entrambe le direzioni.

L'unificazione che funziona è **V2**, cioè l'opposto: normalizzare al prefisso timestamp anche in
**costruzione** (`:268`), lasciando `:314` intatto. Il prefisso è l'unica parte che §21.2 fissa come
formato (`**Prompt document name**: YYYY-MM-DD HH:mm`); l'annotazione è un'estensione informale che
compare da entrambi i lati e non è mai stata un identificatore. Diff di una riga, come chiede il
prompt — solo su una riga diversa da quella prevista.

**Perdita di precisione, misurata e accettabile.** Fra log e archivio ci sono 273 nomi distinti (il
parser del gate ne conta 270, prendendo la prima occorrenza del campo per entry). La chiave a
prefisso li porta a 269: **due timestamp sono condivisi da due documenti ciascuno**,
`2026-06-17 18:00` e `2026-08-03 17:10`. Su quelle due coppie il gate non saprebbe dire *quale* dei
due documenti sia il bersaglio — ma `Corregge` è un puntatore umano e §21.2 fissa come formato il
solo timestamp, quindi la coppia non era distinguibile nemmeno prima. Nessuno dei 7 riferimenti in
scope cade su quei due prefissi.

*(Nota di rettifica: la prima stesura di questo report riportava «79 prefissi distinti su 271 nomi».
Era un artefatto del parser usato per la sonda, che scartava i nomi il cui prefisso non combaciava
col regex invece di tenerli. Le misure delle quattro varianti — calcolate sui 7 riferimenti in
scope — non cambiano, e sono state poi confermate dal gate reale: 4 warning → 1.)*

## (d) Baseline tsc

`npx tsc --noEmit` (da `frontend/`): **33 errori**, totale conforme.

Ripartizione **conforme al CONTESTO**, verificata per file e per codice:

- **19 di casing** — `TS1261` ×12 + `TS1149` ×7, tutti sulla collisione `Settings/` vs `settings/`:
  `UnifiedSettingsModal.tsx` ×7, `Settings/UnifiedSettingsModal/sections/index.ts` ×7,
  `SettingsModalContext.tsx`, `ProvidersSection.tsx`, `PromptsSection.tsx`,
  `UnifiedSettingsModal/index.ts`, `PromptsSettingsSection.tsx`.
- **14 sparsi** — `api/data.ts(837,22)`, `(837,34)`, `(1095,44)`; `Measurable.tsx(271,86)`,
  `(287,21)`, `(289,32)`, `(292,40)`, `(298,79)`, `(302,36)`; `Dummy.ts(46,17)`;
  `EditorV2.tsx(2886,86)`; `ChatMessages.tsx(246,13)`; `ProjectEditor.tsx(220,67)`;
  `Dashboard.tsx(570,66)`.

La regola di uscita 5 non scatta.

**Dove la baseline è descritta** — e qui il CONTESTO è più severo del vero:

| Punto | Cosa dice | Giudizio |
|---|---|---|
| `frontend/scripts/tsconfig.json:6` | «the `npm run typecheck` baseline (33 errors)» | **già corretto** |
| `CLAUDE.md:120` (§2), `CLAUDE.md:772` (§17) | «a known non-zero baseline exists; do not increase the count» | corretto ma **senza numero né composizione** |
| `docs/claude-code-log.md:74`, `:180` | «33 errori … tutti nei moduli della baseline nota (casing di `Settings/`, `Dashboard.tsx:570`)» | numero giusto, **due soli esemplari** citati |
| `docs/claude-code-log-archive.md:1547` | «19 casing (TS1261 12 + TS1149 7) + 13 genuini + 1 fuori-scope Dummy.ts» | **già completo**, stessa 33 con raggruppamento 13+1 invece di 14 |

Nessun punto del repo afferma «la baseline è 19»: il numero 33 è scritto in modo coerente in ogni
entry recente. Ciò che manca è la **composizione** in un luogo non datato: chi legge §17 non trova
il numero, e chi legge una entry trova due esemplari. Il rischio descritto dal CONTESTO resta reale
ma è più piccolo di come è formulato, e il rimedio è additivo: la composizione va scritta in
`CLAUDE.md` §17 (che è anche la sezione della catena dei gate, quindi lo stesso perimetro
autorizzato dal punto 1) e nell'entry di chiusura. **Nessuno script codifica un numero atteso di
errori**, quindi non c'è nulla da aggiornare lì.

## (e) Fotografia git

```
5fcef39ef docs: land the voce 5 entry and close the arco A queue
363f8166d chore: regenerate AGENTS.md
e15eb5081 feat(editor-v2): Applies to absorbs the legacy authoritative controls (R-H)
648de9a72 docs: normalize Causa in two 2026-08-03 log entries
fd92b3d1c feat(editor-v2): five-tab partition for IR views (all tabs mounted, display none)
061be4b5c docs: seed decisions.md with active binding decisions
```

HEAD = `5fcef39ef`, come atteso. **Il rider su `docs/viewpoint-codebase-map.md` §3 non è atterrato**:
nessun commit successivo, il file è fermo a `604a96270` (2026-03-28) e la sua §3 descrive ancora
`ViewData.tsx` con sei sub-tab. Non interferisce con questa voce; resta agli atti.

`git status --short`: un solo file sporco, `?? CLAUDE-BAK-NOT-TO-USE.md`, untracked in root, **non
toccato**. Nessun file bersaglio della Fase 1 è sporco: la regola di uscita 7 non scatta.

## (f) Collisioni di nomi

Grep globale su `.ts`, `.tsx`, `.mjs`, `.json`, `.md` (esclusi `node_modules` e `.git`):
`check:agents` **0**, `check-agents` **0**, `checkAgents` **0**. Nessuna collisione; i nomi previsti
dal prompt sono coerenti con le convenzioni reali di (a).

---

## Dipendenze e rischi

1. **Il gate deve coprire due file, non uno.** Il prompt descrive il confronto contro «l'`AGENTS.md`
   presente in root». Fermarsi lì lascerebbe `frontend/src/jjtl/AGENTS.md` scoperto — la stessa
   classe di drift, sullo stesso generatore. Generando nella temp una radice speculare, il
   confronto su entrambi è la stessa quantità di codice. **Proposta**: confrontare tutto ciò che il
   generatore produce, dichiarandolo come generalizzazione minima.
2. **`--out-dir` è una directory, non un file.** Vedi (b): la forma del parametro cambia rispetto
   alla lettera del prompt, la sostanza no.
3. **Il gate non deve sporcare il working tree**: con `--out-dir` verso `mkdtemp` di sistema il
   requisito è strutturale, non una precauzione — il generatore non scriverebbe mai in repo.
4. **Ordine dentro il commit unico**: se `CLAUDE.md` §17 viene toccato (voce `check:agents` +
   composizione della baseline), `AGENTS.md` va rigenerato **prima** di committare, altrimenti il
   gate appena introdotto fallirebbe sul proprio commit. È la prova end-to-end migliore che
   abbiamo e va eseguita in quest'ordine di proposito.
5. **`docs/decisions.md` non tocca `AGENTS.md`**: vedi (b). Il punto 3 della Chiusura del prompt va
   letto con la sua condizione falsa.

## Domande aperte per Alfonso

1. **Punto 2, direzione della chiave.** La lettera del prompt (V1) porta i warning da 4 a 5;
   l'unificazione sul prefisso timestamp (V2) li porta a 1. Confermi **V2** — `:268` normalizzato a
   prefisso, `:314` invariato — con il criterio del test 4 riscritto in «da 4 a 1»?
2. **Il warning residuo.** `2026-07-18 00:00` è un riferimento genuinamente irrisolto. Resta com'è
   (il gate fa il suo mestiere) oppure vuoi che la voce lo indaghi e, se il documento esiste fuori
   dal repo, corregga il valore? Fuori perimetro di questa voce, quindi lo chiedo invece di deciderlo.
3. **Copertura del gate**: confermi il confronto su entrambi gli `AGENTS.md` generati (rischio 1)?
4. **Baseline tsc**: la composizione va in `CLAUDE.md` §17 — stessa sezione della catena dei gate,
   quindi dentro il perimetro concesso dal punto 1 — o preferisci che resti solo nell'entry di
   chiusura, lasciando §17 senza numero com'è oggi?
