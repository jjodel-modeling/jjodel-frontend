# Prompt di handoff — #157 modalità stand-alone/environment
Status: eseguito 2026-09-24 · staging (Juri Di Rocco, #157), outside this harness; line added at reintegration by the chat (P-2026-10-01-2240)

**Data**: 2026-09-24
**Branch**: `feat/157-environment-config`
**Scopo**: passaggio di consegne a una nuova sessione. Stato F0-F3 implementato e committato; F3b/F4 aperte.

---

Riprendi il lavoro sulla issue #157 (modalità "stand-alone"/environment) del progetto jjodel.
Sei su Opus 5, effort xhigh. Lingua: rispondimi in italiano.

## Prima di toccare qualsiasi cosa
1. Leggi CLAUDE.md (regole NON-NEGOTIABLE + critical zone §3).
2. Leggi docs/PROTOCOL.md (P1..P15) e docs/decisions.md.
3. Leggi le ultime 8-10 entry di docs/claude-code-log.md (le più recenti sono #157).
4. Leggi la memory di progetto: memory/157-standalone-environment.md.
5. Leggi il piano: docs/discovery/discovery_2026-09-23_157_standalone_configurator.md
   e i referti di fase: ..._157_consolidation_envgen_merge.md, ..._157_fase1_configurator.md,
   ..._157_fase3_consumer_shell.md.

## Contesto (già implementato, TUTTO committato su branch `feat/157-environment-config`)
Obiettivo #157: dato un progetto, generare un ambiente stand-alone raggiungibile a URL dove i
"consumer" editano solo MODELLI (M1) + sintassi concrete + Data Manager; metamodelli, viewpoint,
validazione e authoring NON editabili/visibili. Un language developer in jjodel classico; N
consumer in ambienti ristretti.

Decisioni: D1 enforcement SOFT frontend (UX, non sicurezza). D2 ambiente = coppia (progetto,
profilo) nell'URL: `#/project?id=X&profile=Y`. D3 entità dedicata, non campi su DProject.

Fatto F0-F3:
- Entità DEnvironmentConfig + DProfile in frontend/src/joiner/classes.ts; helper puri in
  frontend/src/joiner/environmentConfig.ts (+ 21 test). typePermissions: Dictionary<Pointer<DClass>,
  'hidden'|'read'|'edit'>.
- Configuratore FUSO nel wizard EnvGen (components/envgen/EnvGenWizardModal.tsx): step
  general/design/features/metaclasses/profiles. "role"->"profile". Rimossi tech-stack/concrete-
  syntax/output. Permessi per-tipo via SegmentedControl. Metaclassi etichettate `metamodel:class`.
- Runtime overlay ConfiguratorTab.tsx: legge ?profile= (U.getHashParam), applica i permessi
  (read-only/hidden, New disabilitato), header chip col profilo attivo.
- F3 shell consumer: components/environment/consumerMode.ts (isConsumerMode()=
  !!U.getHashParam('profile')). LeftBar nasconde Metamodels/Transforms/Viewpoints/Megamodel/
  «Configure environment»; DockManager rifiuta metamodelli/viewpoint in consumer.

## Vincoli (RISPETTA)
- NON aprire PR (vincolo dell'utente per tutta la feature).
- Baseline typecheck: 14 errori pre-esistenti — non aumentarli.
- Docs e codice in commit SEPARATI (§6.4). Aggiorna docs/claude-code-log.md a fine task.
- Rule 19: se un task tocca >5 file, elenca e chiedi conferma prima.
- CLEANUP tracciato da rimuovere SOLO a fine feature (ricordalo all'utente): EnvGenGeneral.metamodelId
  in components/envgen/types.ts e il memo metamodelInfo in hooks/useEnvGenWizard.ts (§7.1 del referto
  consolidation). NON rimuoverli ora (Rule 9).

## Da fare (l'utente sceglie l'ordine — CHIEDI prima di partire)
- F3b: trim della Navbar in consumer mode (New Metamodel/Model, Tools->Configure Environment,
  Analyze/validazione, viewpoint).
- Toggle live del LeftBar via listener `hashchange` (ora isConsumerMode() è letto al render -> serve reload).
- F4: assegnazione profilo->utente + generazione «Copy stand-alone link» per profilo.
- Permessi field-level (v1 è solo per-tipo).
- Delete-profile come vero DeleteElementAction (ora soft-delete, // TODO: cleanup).

Stato di verifica: F0-F2 confermati a runtime dall'utente (screenshot). F3 implementato ma
smoke visivo NON ancora eseguito — vale la pena farlo prima di procedere: aprire
`#/project?id=<PROJECT_ID>&profile=<PROFILE_ID>` (profilo DI QUEL progetto) e verificare che il
LeftBar sia ridotto; senza &profile= torna developer (con reload).
