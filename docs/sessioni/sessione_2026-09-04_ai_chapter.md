# Sessione 2026-09-03/04: capitolo AI in Jjodel e revisioni User Guide

Chat di progetto, sera del 3 settembre fino al 4. Lavoro interamente su `jjodel-docs`, branch `docs/2026-09-update`, con la cartella connessa al bridge e il Chrome di Alfonso su `localhost:3000` per gli screenshot. Sessione parallela a `sessione_2026-09-04.md` (screenshot, Concepts, Reference), che resta valida: le due si integrano, non si sostituiscono.

## Stato a fine sessione

Tutto committato e pushato: `docs/2026-09-update` è allineato a `origin`. Il capitolo AI è entrato con `33bdb79` (commit fatto dalla sessione parallela, che ha raccolto i file scritti da questa), gli screenshot dei mapping con `ea1482b` e `c937cd6`. Il tree view riscritto è in `c52535f`, unico commit fatto da questa chat dal bridge.

| Cosa | Dove | Stato |
|------|------|-------|
| Dashboard: sezione Importing and Exporting | `user-guide/dashboard.md` | committato da Alfonso |
| FAQ: import/export riscritta, domanda Does Jjodel use AI? | `faq.md` | committato |
| Tree View riscritta da zero | `user-guide/tree-views.md` | `c52535f` |
| Capitolo AI in Jjodel, sei pagine | `src/content/docs/ai/` | `33bdb79` |
| Quattro screenshot Jjodie | `ai/images/jjodie-*.png` | `33bdb79` |
| Rimandi al capitolo | `console.md`, `jjscript.md`, `transformation-editor.md`, `glossary.md`, `whats-new.md` | committati |
| Gruppo sidebar AI in Jjodel | `astro.config.mjs` | committato |

## Decisioni prese

- **2026-09-03: il capitolo AI è un gruppo di sidebar autonomo**, secondo dopo User Guide, directory `src/content/docs/ai/`, sei pagine: Overview, Jjodie, Mapping Suggestions, Documentation, Providers, System Prompts. Alfonso vuole che l'uso di LLM sia valorizzato e che le altre pagine rimandino qui invece di descrivere ciascuna il proprio pezzo.
- **2026-09-04: etichetta del gruppo "AI in Jjodel"**, uguale al titolo della pagina di apertura. Discussa la ridondanza con gli altri gruppi (nomi secchi); scelta motivata dal fatto che l'etichetta dichiara una tesi e risalta. Le URL restano `/ai/...`.
- **2026-09-04: il paper MODELS 2026 è citato in Overview**, sezione Script-Mediated Generation, senza link (nessun DOI ancora, materiale demo non ancora pubblico).
- **2026-09-03: i limiti dichiarati in Tree View sono stati rimossi** su indicazione di Alfonso (drag & drop, rename nell'albero, Documentation non cablata): tutti risolti.
- **2026-09-03: gli screenshot delle crop di dettaglio restano a risoluzione nativa (2x)**, non a 1x come nel commit `75d3bf1`: a 1x su retina sono sfocati. Il testo dell'interfaccia risulta più grande del corpo; soluzione pulita rimandata (vedi Todo).
- **2026-09-03: la pagina FAQ non dice più che Ecore/XMI sono "planned"**: import ed export ci sono, insieme al JSON.

## Bug e limiti scoperti

- Un `git commit` dalla VM del bridge riesce ma lascia `HEAD.lock`, `index.lock`, `next-index-*.lock`, `objects/maintenance.lock` e decine di `tmp_obj_*` che la VM non può cancellare. Spostati in `_to_delete/git-locks/`, dove ce n'erano già dalle sessioni precedenti: la cartella va svuotata dal Mac. Regola ribadita: dal bridge si scrivono i file, il commit lo fa Claude Code o Alfonso.
- `npm run build` non gira dalla VM (`node_modules` darwin-arm64, rollup senza binding Linux). Verificato nel container cloud con un clone: 43 pagine, tutti i link del capitolo risolvono.
- Il primo build nel container avvisa che il linguaggio `jjscript` non è registrato in expressive-code e ripiega su `txt`; le altre dieci fence `jjscript` del sito hanno lo stesso comportamento, quindi è una convenzione esistente, non una regressione.
- Nella Console espansa la pillola **Simulation** del canvas resta sopra il campo di input e lo copre in parte; la finestra espansa copre il nodo appena creato, visibile solo nella minimappa.
- Jjodie genera `type String` e `type int`, non `type EString [1]` come scrive `console.md`: il parser accetta entrambe le forme, ma gli esempi nel capitolo AI seguono l'output reale.

## Info strutturali scoperte (per sessioni future)

- Tree view: `components/TreeViewSidebar/TreeViewContent.tsx` (2657 righe), `treeViewScope.ts` (scope bar per viewpoint: reso / dimmed / fuori scopo), `TreeViewScopeBar.tsx`; il rail è `components/editors/PropertiesWithTreeView.tsx` con posture Browse/Focus (foglie: `DAttribute`, `DReference`, `DOperation`, `DEnumLiteral`), J/K per i fratelli, Escape per tornare, ⌘B per il pane (`utils/keyboardShortcuts.ts`), splitter orizzontale reintrodotto il 26/8. Stato di espansione in `DProject.expandedTreeNodes`.
- AI: registro provider in `types/jodie.ts` (undici nomi UI: GPT, Claude, Gemini, DeepSeek, Mistral, Groq, Kimi, Ollama, Llama, Copilot, Custom; Llama e Copilot lanciano "not yet supported"). Feature id `chat`, `documentation`, `mappings`, `explain`; `scriptblock` è dichiarato ma senza consumatore. Risoluzione: override per feature in localStorage, altrimenti primo provider abilitato; non esiste più il default globale. Chiavi in localStorage; richieste dirette al provider; solo il test di connessione di Claude passa dal worker `jjodel-ai-proxy`.
- Prompt: `constants/defaultPrompts.ts`, `services/PromptService.ts` (default / global / project, versione base, badge Default updated), UI in `components/settings/PromptsSettingsSection.tsx` e `PromptEditor.tsx`. Solo Chat Assistant e Analyze Metamodels sono letti; gli altri cinque non hanno consumatore. Documentation usa un prompt inline in `services/DocumentationService.ts`.
- Jjodie: `components/Jodie/`, contesto da `services/JjodieContext.ts` (artefatto in focus, conformance report per M1), RAG locale TF-IDF in `services/JjodieRagService.ts`. I blocchi JjScript passano da `MarkdownRenderer` (Run) a `jjscript/components/ScriptBlock.tsx` (Step/Run/Stop). `components/JjodieWidget/` e `jjodie-integration/` sono codice morto. Stop della chat e Cancel dei mapping sono solo UI (nessun AbortController).
- Mapping: `jjtl/services/AIMatcher.ts`, `jjtl/views/SuggestedMappingsPanel.tsx`, `MappingCard.tsx`; pill auto-resolved (un lato non primitivo) e auto-converted (entrambi primitivi e diversi). Fallback `SimpleMatcher`.
- Documentazione: `DocumentationSection.tsx` (card progetto, sempre locale) e `abstract/tabs/DocumentationTab.tsx` (Regenerate via Jjodie se c'è un provider, altrimenti locale; `@protected`/`@end`; badge Outdated per hash del progetto; output in localStorage `jjodie_doc_<projectId>`). Lookup Wikidata prima della chiamata.
- Import/export dei formati: `.jjodel` per il progetto (Dashboard e File > Import Project); dentro `ProjectEditor.tsx` metamodelli Import Ecore, Export Ecore o JSON; modelli Import XMI (`.xmi`, `.xml`), Export XMI (con metamodello embedded) o JSON.
- Chrome di Alfonso via extension raggiunge `localhost:3000` con il provider GPT-4o già configurato: gli screenshot di Jjodie si fanno lì. Le catture con `zoom` arrivano nel container in `/tmp/claude-chrome-screenshots-*/`.
- Progetto **Docs Jjodie** creato sull'account di Alfonso per gli screenshot (metamodello con `Person`): si può cancellare o riusare.

## Prompt generati per Claude Code

Nessuno: tutto il lavoro è stato scritto direttamente su disco via bridge.

## Todo

1. Risoluzione delle immagini: passare le pagine con crop di dettaglio a `.mdx` con `<Image width={…} densities={[1, 2]}>`, così la crop si mostra a dimensione naturale ma nitida su retina. Vale per `ai/jjodie.md` e per le crop già a 1x in `user-guide/images` (tree view, palette, properties, project card).
2. Screenshot mancanti nel capitolo AI: Providers (Settings > AI > Providers con un provider testato), System Prompts (editor con badge Project Override), Documentation (tab con documento generato). Mappings è già coperto dalla sessione parallela.
3. Decidere se il rimando al paper MODELS in Overview resta "presented" o diventa "to be presented" fino a ottobre; aggiungere il link quando ci sarà il DOI o il materiale nel repo `papers`.
4. Frontend: pillola **Simulation** sopra l'input della Console espansa; valutare se la Console espansa debba lasciare visibile il canvas.
5. `_to_delete/git-locks/` in `jjodel-docs` da svuotare dal Mac.
6. Verificare a occhio le pagine del capitolo AI sul dev server (hard refresh), in particolare la resa delle tabelle e delle immagini a 2x.

## Cronologia

Aperta con una riga sul Dashboard (import/export in Ecore/XMI e altri formati), che ha portato a correggere anche la FAQ, ferma a "planned". Poi la riscrittura del Tree View contro il codice reale (rail destro, posture, scope bar), con i limiti dichiarati e subito tolti perché risolti. Alfonso ha notato che mancava una sezione sull'AI: non era mai esistita, il materiale era sparso in quattro pagine. Da lì il capitolo: discovery del sottosistema AI con un agente Explore sul clone, verifiche sul tree locale, sei pagine scritte per rispecchiare le etichette dell'interfaccia e i limiti reali, rimandi dalle pagine esistenti, build verificata nel container. Discussione sul nome (Jjodie, AI Assistance, AI in Jjodel): scelto "AI in Jjodel" per il gruppo. Aggiunta la pagina System Prompts su richiesta (a cosa servono, perché e come modificarli, i tre livelli), con Providers ridotta di conseguenza. Screenshot della sequenza richiesta → script → Run/Step → Completed, catturati in Chrome; prima a 1x per seguire una convenzione precedente, poi rifatti a 2x su segnalazione di Alfonso. Infine il rimando al paper di MODELS nella sezione sulla generazione script-mediated. Nel frattempo la sessione parallela ha committato il capitolo insieme al suo lavoro.
