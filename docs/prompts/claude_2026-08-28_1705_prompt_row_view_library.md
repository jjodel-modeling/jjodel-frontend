# 2026-08-28 17:05 — Livello 3: la libreria Row view

Prompt ricevuto in chat. Il testo integrale sta in
`docs/design/design_handoff_instance_node/PROMPT_row_view_library.md`, arrivato col pull del bundle
di handoff e **non ancora committato** al momento di questo lavoro: il bundle e' un artefatto unico
e meta' dei suoi file sono modifiche non mie, quindi resta ad Alfonso versionarlo. Questo documento
non duplica quel testo e registra invece cosa e' stato chiesto in piu', cosa e' stato deciso e con
quale motivazione.

## Richiesta

Nove renderer di valore, una sola implementazione ciascuno, usati identicamente da riga di
compartimento e — per i tre il cui valore puo' essere un oggetto a se' — da nodo standalone. Punto 1
di «Implementation order» in `README.md`. Poggia sulla pill singleton (`ee0eb3bdb`, `eb9645761`),
primo membro della libreria e forma da imitare: modulo di risoluzione puro piu' un componente
presentazionale con `variant: 'node' | 'row'`.

Riferimento visivo: `Instance Node Proposal.dc.html`, Turno 5 (`5a` la libreria, `5b` collection e
reference rotte, `5c` l'ispettore). Il bundle era gia' al Turno 5 in working tree (mtime 16:54,
+147 righe su HEAD): nessun ri-pull necessario, verificato prima di iniziare.

Fuori scope dichiarato: thumbnail immagine, il layout dello stato espanso del `+k` oltre
all'espansione in place, i campi di livello 2 del tab Structure, il routing degli archi verso le pill.

## Domande poste prima del diff, e risposte di Alfonso

La discovery ha trovato due cose su cui il prompt poggia e che nel codebase non esistono. Portate in
chat con le opzioni, prima di scrivere qualsiasi diff.

1. **Le annotazioni del metamodello non funzionano** — `EcoreParser.parseDAnnotation` ritorna `[]`
   alla prima riga, `DAnnotationDetail` e' una classe vuota col corpo `// todo`, `addAnnotation` ha
   zero call site. Quindi unita', bounds, `code` e la dichiarazione di regola 1 su cui poggia
   l'override non avevano dove stare.
   → **Codificare in `DAnnotation.source`** (`jjodel/<chiave>=<valore>`), nessuna modifica al core.

2. **Una reference rotta era invisibile** — `jjomTransformers.ts` scartava i puntatori non risolti, e
   il nome dell'oggetto cancellato non e' conservato da nessuna parte.
   → **Mappa di sessione con l'id accorciato come fallback.**

3. **Dove montare l'ispettore** — `panels/M1PropertiesPanel.tsx` e' codice morto (zero mount site,
   verificato con controllo positivo su `PalettePanel`), e `EditorV2.tsx` registra in due punti che
   l'editing delle proprieta' e' passato di proposito al pannello Info del dock.
   → **Popover ancorato alla riga**, in portal su `body`, coi precedenti in-repo di
   `TextStyleField.tsx` e `NodeProblemOverlay.tsx`.

Il Layer Impact Report e' stato prodotto in chat prima del diff, come richiede §3.2: la scrittura
dell'annotazione passa da `DAnnotation.new`, che e' un percorso di scrittura del D layer.

## Decisione presa in corso d'opera

Il trigger dell'ispettore e' **Alt+click**, non il tasto destro. Il canvas lega gia'
`onNodeContextMenu` su ogni nodo (`EditorV2.tsx:2749`) e prenderlo sulle celle valore avrebbe tolto
quel menu su parte di ogni nodo istanza: regressione su comportamento committato, regola 3. Alt+click
non ombreggia nessun gesto esistente.

## Esito

Diff su 18 file (7 nuovi), tre oltre l'elenco concordato e riportati nell'entry di log. Gate:
typecheck 33 = baseline, 1717 test passati, build exit 0, regole CSS verificate sul bundle compilato.
Smoke visivo non eseguito: la checklist a otto punti, uno per criterio di accettazione, e' consegnata
ad Alfonso.

Ragionamento completo, misure e opzioni scartate:
`docs/sessioni/sessione_2026-08-28_row_view_library.md`.
