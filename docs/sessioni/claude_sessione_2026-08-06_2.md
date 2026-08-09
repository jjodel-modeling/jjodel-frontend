# Sessione 2026-08-06_2 — Voce 4, review, voce 5: coda arco A chiusa; RC-7 avviata

Checkpoint della seconda sessione del 2026-08-06 (pomeriggio, sera, tarda sera); notte e
mattina sono nel checkpoint v3 (`sessione_2026-08-06.md`). Aggiornato a coda chiusa e RC-7
in moto: questo file più `contesto_progetto.md` bastano ad aprire la prossima sessione.
Dove i due divergono (avvio di RC-7), fa fede questo file: il contesto è stato consolidato
prima della revisione 2 del prompt RC-7.

## Stato a fine sessione

- **Coda arco A: CHIUSA con GO.** Verifica visiva unica su 17 prove (blocco A barra 12
  punti, blocco B capi 5 punti alla loro prima verifica), nessun rosso; GO registrato come
  dichiarazione di Alfonso. Verbale: `claude/verifica_2026-08-06_voce5_chiusura_coda.md`.
- **Push `383170dc0..5fcef39ef`, 15 commit, il primo dal 3 agosto: remoto allineato.**
  Sequenza della giornata: `fd92b3d1c` (partizione a cinque tab), `648de9a72`
  (normalizzazione log, da solo, +8 −5), `e15eb5081` (R-H e disposizioni), `f15a22bd2`
  (voce 2, trappola `.gitignore`), `363f8166d` (regen `AGENTS.md`, scoperto mancante dal
  preflight), `5fcef39ef` (entry di chiusura).
- **RC-7 (voce 1 della coda nuova) già in moto**: prompt revisione 2 post Fase 0 agli atti
  (`claude/2026-08-06_prompt_rc7_igiene_gate.md`, "2026-08-06 19:10"); Fase 0 eseguita, report
  `docs/discovery/discovery_2026-08-06_rc7_gates_reanchor.md` **untracked nel repo** (entra
  nel commit unico della voce, P4); le due decisioni aperte sono ratificate e l'addendum con
  le note tecniche è riportato verbatim qui sotto. **Fase 1 da eseguire.**
- Working tree: pulito salvo `CLAUDE-BAK-NOT-TO-USE.md` e il report RC-7 untracked.
- Gate a chiusura coda: tsc 33 Δ0; vitest 1081 più 9 suite baseline (viewpoint 200/200);
  build 0; `check:docs` 2/2 sul committato (4 warning noti del resolver, che RC-7 porta a 1).
- **URL della verifica visiva: http://localhost:3000/** (vite.config; su 3001 nulla;
  istruzioni di progetto ancora da aggiornare).

## Decisioni prese

- **R-H** (Q1 della 1.5, Alfonso): Applies to assorbe verbatim i controlli autoritativi del
  tab legacy (Name; father: Viewpoint/Parent); write path invariati; bug del doppio writer
  intatto; breadcrumb rinviata. In `docs/decisions.md` da `e15eb5081`.
- **Disposizioni emendamento 1** (Q2-Q5, padding): reference col matching in Applies to; pin
  senza UI; breadcrumb rimossa; row Text = Template, Visible, Label; corpi dei tab dentro la
  `section.properties-tab.properties-panel` (regole `!important` a figlio diretto).
- **Finestra Style accettata per iscritto** (3.6 in coda nuova).
- **Esito voce 2**: delle 156 righe solo 14 con destinazione; jjtl 29 righe tracciate; 142
  ricostruite nel root, cancellazione a decisione esplicita (nota 2 di `f15a22bd2`).
- **Coda nuova ratificata da Alfonso**: 1. RC-7 con gate "generato allineato al sorgente";
  2. micro-slice 3.6; 3. micro-slice `routing:""` più placeholder; 4. slice di design del
  `father`; 5. grappolo igiene; 6. pass di lingua R-4 per ultima. Annotazioni: 1.6
  parcheggiata (precondizione R-2 soddisfatta dopo la 3.6); 142 righe sospese. Rider:
  micro-commit docs su `docs/viewpoint-codebase-map.md` §3, subito.
- **RC-7, due decisioni ratificate da Alfonso (sera)**: il warning residuo
  `2026-07-18 00:00` **resta a suonare** (riferimento con ogni probabilità irrisolvibile:
  i documenti del 18 luglio non hanno orario nel nome; fa da prova vivente del test 6); la
  composizione della baseline tsc **entra in CLAUDE.md §17**, forma compatta. Il fix del
  resolver va in direzione **prefisso** (V2, misurato: 4 warning → 1), opposta a quella
  inizialmente ipotizzata: la misura di Fase 0 l'ha imposta e la entry di log lo dichiara.

## Addendum al prompt RC-7 (verbatim, da appendere al prompt se non già consegnato)

```
ADDENDUM (ratifiche e note, 2026-08-06):
1. Le due decisioni aperte sono ratificate come il prompt assume: il warning residuo
   2026-07-18 00:00 resta a suonare (prova vivente del test 6); la composizione della
   baseline entra in CLAUDE.md §17, forma compatta.
2. HEAD: 5fcef39ef è l'atteso, ma se sopra c'è il micro-commit docs del rider
   (viewpoint-codebase-map §3) è previsto e benigno. Qualsiasi altro delta: fermarsi
   e riportare.
3. Se il regen tocca anche frontend/src/jjtl/AGENTS.md, quel file entra nel commit
   (decimo file: dichiararlo nell'elenco di conferma di regola 19).
4. Il generatore sta nella root, il gate in frontend/scripts/gates: verificare il cwd
   dell'invocazione del generatore dalla temp (node ../scripts/generate-agents.mjs o
   npm run dalla root) prima del test 1, col report di Fase 0 alla mano.
```

## Bug risolti

- Trappola `.gitignore` (`f15a22bd2`). `AGENTS.md` riallineato (`363f8166d`; seconda volta
  in tre giorni: movente misurato di RC-7). `check:docs` sul committato (`648de9a72`).
  Smoke sospese saldate dalla voce 5.

## Bug nuovi / Todo (mappati sulla coda nuova)

- Voce 1 RC-7 **(in corso)**: gate `check:agents`, fix resolver (chiave prefisso a :268),
  baseline in §17 e entry canonica.
- Voce 2 (3.6): finestra Style. Voce 3: `routing:""` più placeholder. Voce 4: doppio writer
  `father` (sblocca breadcrumb). Voce 5: grappolo igiene (InfoTooltip ×3, B-5 ×3, test
  duplicato). Voce 6: pass di lingua R-4 (più gli item DS: stepper, gerarchia titoli).
- Fuori coda: 142 righe `CLAUDE.md` root (sospesa); domanda PathExpr preview/editabile;
  istruzioni di progetto URL 3000; `bordr`; il resto in `contesto_progetto.md`.

## Documenti aggiornati

- `contesto_progetto.md` (consolidato a chiusura coda; non sa ancora dell'avvio RC-7),
  `claude/mappa_sintassi_concreta.md` (barra a cinque, R-B12, commit chiave).
- Nuovi nel KB oggi: prompt voce 4 base più emendamento 1, review dei cinque tab,
  protocollo voce 5, verbale di chiusura, prompt RC-7 (dalla chat nuova), questo checkpoint.
- Nel repo: report barra 1.5 con addendum; `docs/decisions.md` con R-H; `AGENTS.md`
  rigenerato; log della giornata; report Fase 0 RC-7 (untracked, entra col commit RC-7).

## Prompt pendenti

- **RC-7 Fase 1, in esecuzione**: prompt `claude/2026-08-06_prompt_rc7_igiene_gate.md`
  (rev 2) più l'addendum sopra. NON rigenerarlo. Esito atteso: commit unico
  `chore(tooling): add AGENTS.md alignment gate, fix check:docs resolver key`, 8 test con
  evidenza, riga in `docs/decisions.md`.
- **Rider**: micro-commit docs `viewpoint-codebase-map.md` §3 (basta il go ad
  Claude Code, ha già la diff in mente).
- Da generare dopo, una voce alla volta (RC-5): 3.6, `routing:""`, discovery/design
  `father`, grappolo igiene, pass R-4.

## Prossimi passi

1. Esito degli 8 test di RC-7: verificarlo contro il prompt (gate verde sul proprio
   commit; warning da 4 a 1 col residuo `2026-07-18 00:00`; typecheck 33 invariato;
   build 0) e consolidare contesto (RC-7 chiusa, `check:agents` in catena, baseline in
   §17). Una sola chat in guida (RC-5).
2. Rider map §3, se non ancora atterrato.
3. Alfonso: `CLAUDE-BAK-NOT-TO-USE.md` da eliminare a mano; URL 3000 nelle istruzioni di
   progetto; decisione sulle 142 righe quando capita.
4. Poi voce 2 della coda: prompt 3.6.

## Info strutturali scoperte

- `vite.config` fissa `port: 3000`.
- Padding pannelli: `.view-editor-tab-content > section.properties-tab.properties-panel`
  con `!important` (`viewapplyto.scss:28`, `properties-with-tree-view.scss:367`); corpi dei
  tab dentro la section, mai wrapper interposti.
- Ricollocazione R-H in `irTabs.tsx`: Input/Select per data/field, prop
  `{ viewpoints, readOnly }`, `readOnly = !debug && Defaults.check(view.id)`; `InfoTooltip`
  alla terza copia. `authoringMetaclassPins` visibile nel tab Source.
- Source di una view mai toccata: `"routing": ""` mentre `terminations` droppa `sourceEnd`.
- **Misure Fase 0 RC-7**: generatore `scripts/generate-agents.mjs` (root, non
  frontend/scripts), deterministico, scrive DUE file (root più `frontend/src/jjtl/AGENTS.md`),
  destinazione cablata a `:128`, nessun parametro di output. Resolver `check:docs`:
  `:268 known.add(n.trim())`, `:314 known.has(m[1])`, `TIMESTAMP_PREFIX :59`; varianti
  misurate V0=4, V1=5, V2=1, V3=5 warning (direzione: prefisso); dei 4 attuali, 3 falsi
  positivi e 1 vero (`2026-07-18 00:00`, bersaglio inesistente). Baseline tsc: 33 = 19
  casing (TS1261 ×12, TS1149 ×7, Settings/ vs settings/) più 14 sparsi; nessuno script
  codifica un numero atteso; `frontend/scripts/tsconfig.json:6` dice 33 e `:12-15` include
  già `gates/**/*.ts`; archivio a `:1547` con la composizione. Nessuno script aggregato dei
  gate, né husky né hook: la catena vive in `CLAUDE.md:5` e §17 `:769-774`.
  `docs/decisions.md` non è sorgente del generatore.
- `frontend/src/jjtl/CLAUDE.md`: 29 righe tracciate; `docs/viewpoint-codebase-map.md` §3
  fermo al 2026-03-28 (sei sub-tab legacy, esatti solo per le view classic).

## Cronologia

Pomeriggio: Fase 0 della voce 4 con hard stop regolare; Q1 ratificata come R-H; emendamento
1; esecuzione in tre commit, gate verdi; review critica dei cinque tab (bug `routing:""`,
finestra Style). Protocollo voce 5. Sera: preflight (voce 2 già atterrata `f15a22bd2`; regen
AGENTS mancante, committato `363f8166d`; rettifiche porta 3000 e 29 righe); blocchi A e B a
video: GO su 17 prove; chiusura `5fcef39ef`, push di 15 commit; coda nuova ratificata
(RC-7 → 3.6 → routing → father → igiene → lingua) col rider map §3. Tarda sera: la chat
nuova genera il prompt RC-7, Claude Code esegue la Fase 0 (misure sopra), la revisione 2
torna in questa chat per la review: due decisioni ratificate, addendum con 4 note. RC-5
richiamata: una sola chat in guida della voce. **Coda arco A chiusa; RC-7 a metà.**
