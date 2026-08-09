# Sessione 2026-08-07 — RC-7 verificata e consolidata; voce 2 (3.6) fino alle ratifiche di Fase 1

Checkpoint della sessione Cowork del 2026-08-07 (pomeriggio). Questo file più
`contesto_progetto.md` bastano ad aprire la prossima sessione. Novità di metodo della
giornata: repo collegato al bridge, verifiche fatte sull'evidenza primaria (git log, diff,
docs) e non su riassunti.

## Stato a fine sessione

- **RC-7 (voce 1) CHIUSA e verificata sull'evidenza.** Commit unico `a6058b805`
  (`chore(tooling): add AGENTS.md alignment gate, fix check:docs resolver key`), 9 file col
  report di Fase 0 dentro (P4); 8 test verdi; tsc 33 Δ0; build 0; `check:docs` 4 → 1 col
  residuo `2026-07-18 00:00` ratificato; gate `check:agents` in catena
  (`frontend/package.json:101`, `CLAUDE.md` §17) e mai scrivente (misurato). Decimo file
  condizionale correttamente assente. Deviazione dichiarata: direzione del resolver al
  prefisso (V2), la lettera «nome intero» misurata dava 5 warning.
- **Passo 0 della voce 2 atterrato**: `6db2361ac` (map §3 aggiornata alla barra a cinque),
  `acf0249ce` (`CLAUDE.md:5` → `check:agents`, con regen `AGENTS.md`). Il rider map §3
  risultava «atterrato» a memoria e NON lo era: ripescato qui. Lezione registrata.
- **Fase 0 della 3.6 eseguita e committata**: `785da04ef`, report
  `docs/discovery/discovery_2026-08-07_style_window_channel.md`. Canale più ampio del
  ratificato: css di fabbrica con 12 `!important` annidati nel COSTRUTTORE di ogni
  `DViewElement` (`classes.ts:1125-1172`), `cssIsGlobal` acceso su tutti i viewpoint dalla
  migrazione `VersionFixer.tsx:428`; iniettore unico in `Dashboard.tsx:595-615`; gate di
  attivazione solo per esclusivi non-default (`view.tsx:778-782`); choke point
  `activateViewpoint` (`lastViewpoint.ts:46-57`).
- **Cinque decisioni di Fase 1 RATIFICATE** (vedi sotto). Emendamento 1 generato
  (`claude/2026-08-07_prompt_voce2_36_emendamento_1_fase1.md`, "2026-08-07 17:32") ed
  **eseguito a fine sessione**: commit `eea50266f`
  (`feat: warn on author-modified global !important css at viewpoint activation`), worktree
  pulito. **GO visivo di Alfonso sui 4 punti ("tutto ok") ed esito verificato in chat**:
  tsc 33 Δ0 (zero errori nei file toccati), vitest 1099 (+18 nuovi), build 0; riga R-2/3.6
  in `decisions.md`; sette file con fermata di regola 19 eseguita e opzione A ratificata
  (estrazione di `DEFAULT_VIEW_CSS` in `view/viewElement/defaultViewCss.ts`, sha256
  identico sui 943 byte; `classes.ts` in sola sottrazione, 5 righe contro 40). Limiti
  registrati: toast dal selettore Toolbar e dal ripristino EditorSwitch, non dall'albero
  Viewpoints né di norma all'apertura. **VOCE 2 CHIUSA.**
- **Git**: HEAD `eea50266f`, ramo **ahead 5** su origin (`5fcef39ef`); push da decidere.
  Working tree pulito salvo `.claude/settings.local.json` untracked (benigno).
  `CLAUDE-BAK-NOT-TO-USE.md` eliminato.
- Archivio KB sistemato: la copia del prompt RC-7 era la rev 1; ora porta nota di archivio
  con le differenze della rev 2 eseguita più l'addendum.

## Decisioni prese (tutte del 2026-08-07)

- **D-3.6-1**: il predicato confronta col css di fabbrica (costante del costruttore,
  whitespace normalizzato) e segnala SOLO i css modificati dall'autore. Residuo accettato:
  fabbrica che morde resta invisibile.
- **D-3.6-2**: predicato a DUE congiunti (`cssIsGlobal === true` E `!important` nel testo);
  cade l'annidamento (deviazione motivata dalla lettera della ratifica originaria).
- **D-3.6-3**: si scansionano TUTTE le view e i viewpoint del progetto, col gate
  `view.tsx:778-782` replicato (esclusivi non-default solo se attivi; default, overlay e
  view normali sempre). L'attivazione è il momento del controllo, non il perimetro.
- **D-3.6-4**: superficie = TOAST, registro warning, uno per attivazione con gli N colpevoli
  aggregati, dedup di sessione (chiave: insieme colpevoli più hash css, memoria nel modulo).
  Source come sede persistente (R-2) rinviata.
- **D-3.6-5**: la 3.6 informa e non scrive; messaggio azionabile (nomi, flag, rimando al tab
  Style per le classic). Il «minimo per spegnere il flag» è micro-voce futura.
- Le cinque decisioni entrano in `docs/decisions.md` col commit di Fase 1 (punto 5 del COSA
  dell'emendamento).
- **CLAUDE.md:5**: deciso in apertura di giornata di accorparlo al passo 0 della 3.6 (niente
  rider dedicato) — eseguito con `acf0249ce`.

## Bug risolti

- RC-7 al completo (gate, resolver, baseline: vedi Stato). Due code docs saldate: map §3
  (`6db2361ac`) e `CLAUDE.md:5` (`acf0249ce`).

## Bug nuovi / Todo

- **[da registro, fuori 3.6] Le due radici della popolazione esposta**: (1) css di fabbrica
  con 12 `!important` annidati nel costruttore di ogni `DViewElement`; (2) migrazione
  `VersionFixer.tsx:428` che accende `cssIsGlobal` su tutti i viewpoint. Candidate a una
  bonifica propria, da decidere quando la 3.6 è chiusa.
- **[micro-voce candidata] Rimedio «spegni-flag»**: superficie minima da cui disattivare
  `cssIsGlobal` per colpevoli senza tab Style (viewpoint, view IR). Design prima del codice.
- **[cosmetico] Aritmetica della rettifica nel report RC-7** (273/270 → 269 con due sole
  coppie dichiarate): non torna esattamente, misure V0..V3 confermate dal gate reale.
  Da chiarire solo se capita un touch docs.
- Il resto della coda e dei congelati: invariato, vedi `contesto_progetto.md`.

## Documenti aggiornati

- `contesto_progetto.md` consolidato (RC-7 chiusa, git, passo 0, lezione 8).
- `claude/2026-08-06_prompt_rc7_igiene_gate.md`: nota di archivio più addendum in coda.
- Nuovi nel KB: `claude/2026-08-07_prompt_voce2_36_finestra_style_fase0.md`,
  `claude/2026-08-07_prompt_voce2_36_emendamento_1_fase1.md`, questo checkpoint.
- Nel repo (commit della giornata): map §3, `CLAUDE.md:5` più `AGENTS.md`, report Fase 0
  della 3.6.

## Prompt generati per Claude Code

- "2026-08-07 16:49" passo 0 più Fase 0 della 3.6 — ✅ eseguito (tre commit: `6db2361ac`,
  `acf0249ce`, `785da04ef`); hard stop rispettato, cinque domande portate in chat.
- "2026-08-07 17:32" emendamento 1, Fase 1 della 3.6 — ✅ eseguito (commit `eea50266f`);
  verifica visiva e verifica d'esito pendenti.

## Prompt pendenti

- Nessuno. La voce 2 è chiusa (GO visivo più esito verificato); il consolidamento di
  `contesto_progetto.md` è fatto. Il prossimo prompt da generare è quello della **voce 3**
  (`routing:""`), nella chat nuova.

## Prossimi passi

1. **Chat nuova** aperta da questo checkpoint più `contesto_progetto.md` (questa è oltre la
   soglia di contesto): genera il prompt della **voce 3** (`routing:""`: drop della chiave
   su `''` al commit del draft, writer da individuare con grep, placeholder
   "Manhattan (default)"; corsia veloce, dettaglio nella review dei cinque tab). Una voce
   alla volta (RC-5). Repo da ricollegare: ROOT `/Users/alfonso/jjodel`.
2. Azioni di Alfonso, quando capita: push del ramo (ahead 5); URL 3000 nelle istruzioni di
   progetto (ancora da fare); decisione sulle 142 righe (sospesa).

## Info strutturali scoperte

- **Canale css** (Fase 0 della 3.6): `DViewElement.css`/`cssIsGlobal` (`view.tsx:269-271`);
  `get_compiled_css` appende il css verbatim e lo scopa con `.viewid` oppure `body` se
  globale (`view.tsx:864-866`); iniettore unico che concatena TUTTO l'idlookup in un solo
  `<style>` (`Dashboard.tsx:595-615`); gli stili IR autorati sono inline senza `!important`
  (`irStyle.ts`), per questo un `!important` globale li batte.
- **Gate di attivazione** `view.tsx:778-782`: copre solo viewpoint esclusivi non-default;
  view normali, default e overlay iniettano sempre. Choke point di attivazione unico:
  `activateViewpoint` (`utils/lastViewpoint.ts:46-57`, scritture dirette commentate al
  `:33-45`).
- **Fabbrica**: blocco css nel costruttore `classes.ts:1125-1172` (12 `!important`, tutti
  annidati); `cssIsGlobal` default `false` (`:1175`), acceso in blocco da
  `VersionFixer.tsx:428`.
- **Superfici warning censite**: problems registry (`registry.ts:27-58`, per nodo, unione
  chiusa `NodeProblemKind`), toast (`toastDispatch.ts:116`), striscia di pannello
  (`VertexAuthoringPanel.tsx:257`, invisibile all'attivazione), tab Source (sede R-2),
  pill di validazione.
- **Bridge**: la cartella collegata giusta è la ROOT del repo (`/Users/alfonso/jjodel`), non
  `frontend/`; git read-only funziona (`--no-optional-locks`), `git commit` no.

## Cronologia

Apertura dal checkpoint del 2026-08-06_2 con RC-7 «a metà». Scoperto che la copia KB del
prompt RC-7 era la rev 1 (direzione «nome intero») mentre l'esecuzione reale era rev 2 post
Fase 0: nessun danno, archivio sistemato con nota. Esito RC-7 arrivato per punti; repo
collegato al bridge (prima `frontend/`, poi la root giusta) e verifica fatta sull'evidenza:
griglia tutta verde, con la correzione che il rider map §3 non era mai atterrato (il ricordo
diceva di sì, il log no). Consolidato `contesto_progetto.md`; deciso il destino di
`CLAUDE.md:5` (passo 0 della 3.6, niente rider). Generato il prompt della voce 2 (passo 0
più Fase 0 con hard stop); eseguito fuori chat in tre commit; le cinque domande della
discovery discusse qui e ratificate in blocco (D-3.6-1..5). Generato l'emendamento 1 di
Fase 1, eseguito subito fuori chat: commit `eea50266f` (sette file, fermata di regola 19
con opzione A ratificata al volo). Check visivo dettagliato in 4 punti fornito in chat,
eseguito da Alfonso: **GO ("tutto ok")**. Esito verificato sull'evidenza (gate, decisions,
`classes.ts` in sottrazione) e consolidamento fatto in coda alla sessione stessa.
**Voce 2 CHIUSA. La chat nuova apre sulla voce 3.**
