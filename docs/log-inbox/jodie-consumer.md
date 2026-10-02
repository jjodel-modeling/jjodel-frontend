# log-inbox — lane «jodie-consumer» (#168)

Entries written by the #168 lanes (Jodie for the stand-alone consumer of #157) while sessions
share the trunk `feat/168-jodie-consumer` (P9, parallel lanes). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file. The
active log is not touched by these lanes.

---

## 2026-10-02 — feat(#168): Jodie segue la selezione del Configurator e vede solo ciò che il profilo mostra (J1, J2)
**Prompt**: `P-2026-10-01-2301` (#168 A): nello stand-alone l'artefatto di Jodie è la selezione del Configurator (sempre M1) e il contesto è filtrato dal profilo. Fase 1: referto `discovery_2026-10-01_168_a_context.md` (`72dca4dc3`); GO di Juri del 2026-10-02 con le sette raccomandazioni del §0 adottate.
**Files touched**: `39b6b7cde`: `events/registry.ts`, `environment/consumerJodieContext.ts` (nuovo), `environment/ConfiguratorTab.tsx`, `Jodie/Jodie.tsx`, `environment/__tests__/consumerJodieContext.test.ts` (nuovo). Sonde `_tmp_168_a_p0.ts`, `_tmp_168_a_dev.ts`, `_tmp_168_a_verify.ts` non committate.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` output COMPLETO **14**, insieme di §17 (diff vuoto); build exit 0; vitest 134/134; sonda 17/17; corpo della richiesta developer identico byte per byte alla Fase 1 (sha1 `dc3a1380`).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1; solo letture di `idlookup` e un evento nuovo.
**Smoke visivo**: fallito (voci 2-4: la riga «Now looking at» non in corsivo, trattini bassi letterali; misurato da Juri e dall'orchestratore il 2026-10-02) — sonda 17/17 sul contesto; corretto da `491e3a022`.
**Notes**: Misurato prima: al primo caricamento Jodie mandava tutti i metamodelli senza artefatto; dopo una tab di metamodello rimasta aperta timbrava M2; Vault in ogni richiesta. Dopo: M1 sul modello dell'istanza, zero nomi o id nascosti, riga «Now looking at» una per selezione. Classi abbinate per nome (il contesto non ha id di classe). Banco 10/10 mutazioni uccise. RAG spento nel consumer.
**Prompt document name**: 2026-10-01 23:01

## 2026-10-02 — fix(#168): la riga della selezione del fruitore in corsivo; la chiave della dedup si muove solo quando la riga è scritta
**Prompt**: rework di Fase 2 di `P-2026-10-01-2301` dopo la verifica visiva fallita sulle voci 2-4: la riga usciva come testo semplice con i trattini bassi letterali; verificare un percorso in cui la riga di un'istanza non compare.
**Files touched**: `491e3a022`: `Jodie/Jodie.tsx`, `environment/consumerJodieContext.ts`, `environment/__tests__/consumerJodieContext.test.ts`. Sonda `_tmp_168_a_verify.ts` aggiornata, non committata.
**Outcome**: ✅ completed
**Corregge**: 2026-10-01 23:01 (Fase 2, `39b6b7cde`)
**Causa**: (d)
**Regressions**: no — `npx tsc --noEmit` output COMPLETO **14**, insieme di §17; build exit 0; vitest 136/136; sonda 21/21 a clic reali; corpo developer identico byte per byte (sha1 `dc3a1380`).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato — verifica visiva di Juri del 2026-10-02, voci 1-6 (corsivo confermato da screenshot); sonda Playwright 21/21 su 3045, con `_…_` rimesso 5 rossi (controllo).
**Notes**: Causa: `MarkdownMessage.hasMarkdownSyntax` riconosce il corsivo solo come `*…*`; ora `*…*`, `MarkdownMessage` intatto. La chiave della dedup ora si muove solo alla scrittura (`consumerSelectionLine`, banco 12/12). «Niente dopo Antonio» non riprodotto: la pagina pubblica solo sui cambi, nessuna sequenza di clic trovata che salti una selezione nuova.
**Prompt document name**: 2026-10-01 23:01

## 2026-10-02 — feat(#168): Jodie segue la navigazione dentro il dettaglio del Configurator
**Prompt**: estensione decisa da Juri il 2026-10-02 dentro `P-2026-10-01-2301`: l'elemento a fuoco è il passo corrente del breadcrumb del dettaglio (`NavState`), altrimenti la riga; il tipo nascosto non è mai il fuoco; una riga in chat per fuoco nuovo.
**Files touched**: `800238541`: `environment/consumerJodieContext.ts`, `environment/ConfiguratorTab.tsx`, `environment/__tests__/consumerJodieContext.test.ts`. Sonda `_tmp_168_a_drill.ts`, non committata.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` output COMPLETO **14**, insieme di §17; build exit 0; vitest 143/143; sonde 23/23 (drill) e 21/21 (precedente); corpo developer identico byte per byte (sha1 `dc3a1380`).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1; `NavState` solo letto.
**Smoke visivo**: passato — verifica visiva di Juri del 2026-10-02 su `800238541`, voci 1-6 della checklist sulla navigazione nel dettaglio; sonda Playwright 23/23 su 3045 a clic reali, con il fuoco della sola riga 12 rossi (controllo).
**Notes**: `consumerFocusOf`: il passo più profondo del breadcrumb non nascosto, altrimenti la riga; ignorati gli stati di un commit (riga di altro tipo dopo un cambio di tipo, strada di un'altra riga). Banco 6/6 sulle righe nuove. Il pannello rifiuta già di aprire un elemento nascosto (`InstanceDetail.drillTo`).
**Prompt document name**: 2026-10-01 23:01

**Ticket** (nota, non slot): il dettaglio mostra il riferimento a un elemento di tipo hidden come etichetta bloccata `vault_alpha: Vault` (`InstanceDetail.tsx:139-151`), mentre il contesto di Jodie lo omette (referto §0 Q2, decisione del 2026-10-02: `InstanceDetail` non si tocca qui). A 1440×900 la finestra di Jodie copre i link in basso nel dettaglio (`elementFromPoint` → `div.jodie-messages`, misurato in D3, D6, D8 e D10): per raggiungerli il fruitore chiude Jodie.

## 2026-10-02 — ticket: la testata di Jodie mostra «M2 · <metamodello>» nello stand-alone
**Ticket**: `JodieHeader.tsx:70-90` calcola l'etichetta da `getActiveModel()`, con ripiego sul primo metamodello. Nel consumer legge «M2 · ScenarioMM» anche dopo la lane A, mentre contesto e scope sono M1 sul modello della selezione (misurato V1-V5): gergo e artefatto sbagliato. Assegnato a J7 (linguaggio di Jodie), decisione di Juri del 2026-10-02.
**Priority**: medium
**Found in**: P-2026-10-01-2301
**Detail**: docs/discovery/discovery_2026-10-01_168_a_context.md

## 2026-10-02 — ticket: developer → consumer senza ricarica lascia il rail destro sul metamodello
**Ticket**: Con una tab di metamodello aperta, aggiungere `&profile=` senza ricarica lascia il rail destro sull'albero e sulle Properties del metamodello (tipi hidden compresi) e la status bar su «ScenarioMM 4 classes»; le righe del Configurator finiscono sotto la LeftBar (`elementFromPoint` al centro di `Arco_0` → `.psb-action--danger`), il clic non arriva. Misurato in S3 e V4; #157 R5/R9 nel verso opposto, non corretto in A.
**Priority**: medium
**Found in**: P-2026-10-01-2301
**Detail**: docs/discovery/discovery_2026-10-01_168_a_context.md

## 2026-10-02 — ticket: le righe di avviso di Jodie mostrano il pulsante «Source» del markdown
**Ticket**: ogni riga di avviso in chat («Now looking at: …», e l'avviso developer «Context switched to …») passa per `MarkdownMessage` e mostra sotto di sé il pulsante «Source» del markdown (misurato: `innerText` della riga = «Now looking at: Scenario «Scenario_0»» seguito da «Source»). Per il fruitore è rumore: serve uno stile di avviso dedicato, senza il pulsante. Assegnato a J7 (linguaggio e aspetto di Jodie), richiesta di Juri del 2026-10-02.
**Priority**: low
**Found in**: P-2026-10-01-2301
