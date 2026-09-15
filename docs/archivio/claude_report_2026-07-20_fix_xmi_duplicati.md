# Report — Fix duplicati DValue import XMI M1

Data: 2026-07-20. Worktree: /home/claude/xmi-work su base 2d312654f. Commit prodotti: d0c8e464a (fix), c5c3f524e (docs). Patch in /home/claude/patches-xmi/.

## Esito conferma dinamica (Fase A)

Root cause CONFERMATA su build di produzione (vite preview porta 3012, Playwright, offline mode). Fixture minima generata fuori repo (/home/claude/xmi-fixtures/): metamodello Person (name, age, friends 0..*, pets containment 0..*) + Pet (nick); XMI con 3 Person e 2 Pet nested.

Numeri pre-fix (verify_before2.json):

- Alice (Pointer...USER_195): 12 entry in `features` per 4 feature. perFeature: name 3, age 3, pets 3, friends 3. Per ogni feature: 1 slot mirage vuoto (isMirage true, values []) + lo stesso slot valorizzato listato DUE volte (stesso id, es. USER_210 name=Alice agli indici 0 e 8).
- Bob e Carol: 8 entry ciascuno (name 3, age 3; friends e pets solo mirage 1, feature assenti dal file: comportamento atteso).
- Pet Rex e Bolt: 3 entry per nick (mirage + valorizzato x2).
- Containment: `pets` di Alice aveva i child DOPPI in values: [c1, c2, c1, c2].
- Controprova Ecore-only: DObject.new programmatico sulla stessa metaclasse produce esattamente 1 slot per feature, tutti mirage. Nessun duplicato.

Due precisazioni rispetto alla discovery, emerse solo a runtime:

1. Il commit Redux è differito: TRANSACTION è `async` e la END scatta in un microtask. Durante il walk sincrono dell'import NULLA è ancora nello store; gli slot mirage vivono solo in `DPointerTargetable.pendingCreation`. Il fix deve cercarli lì, non in `store.getState()`.
2. I push locali post-persist non sono dead-write: `CreateElementAction` porta l'oggetto pending PER RIFERIMENTO, quindi il push viene serializzato nell'elemento creato E ri-appeso dall'azione '+='. Da qui il terzo entry in `features` e il raddoppio dei child in `values` dei containment. A render il doppio id in features è mascherato dal dedup per id di get_children; il mirage no, ed è la riga vuota visibile.

## Fix applicato

File: frontend/src/services/export/XMIService.ts (unico file di codice toccato, più test).

- Nuovo campo `conformitySlots` in `XMIImportContext` (cache per oggetto: feature id -> DValue slot).
- Nuovo helper `getConformitySlot(dObject, featureId, ctx)` (righe ~745-775): scandisce `DPointerTargetable.pendingCreation` cercando DValue con father = dObject.id, con fallback sullo store per il caso già committato; costruisce la mappa una volta per oggetto.
- `processAttribute` (righe ~855-867): se lo slot esiste, `SetFieldAction` replace su `values` + clear di `isMirage` (stesso pattern Direction A di LModelElement set_name); altrimenti fallback identico al comportamento B.1 (DValue.new + push).
- `processContainment` (righe ~960-996): riusa lo slot come containment DValue (clear isMirage), altrimenti lo crea come prima. Rimosso il push diretto dei child in `containmentDValue.values`: la registrazione avviene già via azione '+=' di Constructors.DObject e il push raddoppiava ogni child (verificato dinamicamente).
- `populateReferenceValue` (righe ~1225-1245): riusa lo slot con append '+=' PER SINGOLO target invece del replace, perché le reference XMI Format B arrivano come una pendingRef per elemento nested; il replace avrebbe tenuto solo l'ultimo target. Fallback invariato.

Nessun rename, nessun refactoring, VersionFixer.tsx non toccato.

Test: 4 test strutturali aggiunti a src/services/export/__tests__/ecore-io.test.ts (helper presente, riuso nei 3 siti, assenza del push nei values). Un test funzionale runtime dell'import non è fattibile in vitest node env senza scaffolding pesante: l'import di XMIService trascina Monaco (`window` not defined), stessa limitazione documentata nel file per W2. La verifica funzionale è lo script Playwright riproducibile in /home/claude/xmi-fixtures/verify_slots.mjs.

## Gate

- `npm run typecheck`: 14 errori = baseline cloud, delta zero, nessuno nei file toccati.
- `npm run build`: verde (1m33s, solo il warning chunk-size pre-esistente).
- ecore-io.test.ts: 36/36 (32 baseline + 4 nuovi).
- Suite intera: 868 passed, 9 file di suite falliti per errori d'ambiente = baseline (864 + 4 nuovi passati, stessi 9 file falliti).

## Verifica dinamica post-fix

Stessa procedura di Fase A sulla build fixata, due run (verify_after.json, verify_after2.json), risultati identici:

- Ogni Person: 4 slot, UNO per feature. Alice: name=[Alice], age=[30], friends=[Bob, Carol] (2 pointer), pets=[Rex, Bolt] (2 pointer, non più doppi), tutti isMirage false.
- Bob e Carol: name e age valorizzati (isMirage false); friends e pets slot mirage vuoti, come per un oggetto creato da UI.
- Pet: 1 slot nick valorizzato.
- Gli id degli slot riusati coincidono con quelli creati da _forceConformity subito dopo l'oggetto (es. Alice USER_195 -> slot USER_196..199): riuso effettivo, non ricreazione.
- Controprova Ecore-only invariata: 4 slot mirage unici.

## Nota sulla bonifica VersionFixer (solo analisi, non implementata)

I progetti salvati prima del fix contengono i duplicati persistiti. Una migrazione (es. `2.226 -> 2.227`) dovrebbe, per ogni DObject in idlookup:

1. Dedup di `features` per id (l'id valorizzato compare due volte).
2. Raggruppare gli slot per `instanceof`; quando una feature ha più DValue: tenere quello valorizzato (values non vuoto, isMirage false), eliminare il mirage vuoto. Il pattern "mirage vuoto + sibling valorizzato sulla stessa feature" non ha semantica legittima, quindi il criterio è sicuro. Caso limite di due slot entrambi valorizzati: non dovrebbe esistere; se trovato, merge dei values con dedup.
3. Per lo slot eliminato: rimozione da idlookup, da father.features, dall'array `instances` della meta-feature, e pulizia dei pointedBy.
4. Dedup dei pointer doppi in `values` dei DValue containment ([c1,c2,c1,c2] -> [c1,c2]).
5. Dedup delle radici doppie in `DModel.objects` (stesso meccanismo, vedi Limiti).

Attenzione: VersionFixer è critical zone; servono go-ahead e Layer Impact Report. La migrazione tocca pointedBy e instances, i due punti più fragili; da testare su un progetto sporco reale esportato da Alfonso prima di scrivere codice.

## Limiti e cosa resta ad Alfonso

- Verifica visiva in app reale (localhost:3001, hard refresh): import .ecore + .xmi, righe singole nei renderer nativo e IR, salvataggio e riapertura.
- Edit di un attributo importato: post-fix `$feature` risolve l'unico slot, quindi il collaterale "edit aggiorna la riga vuota" dovrebbe sparire per i NUOVI import. Verificato solo a livello store, non con un edit da UI: test 3 della discovery ancora da fare a mano.
- Progetti già salvati restano sporchi: il fix non è retroattivo, serve la bonifica di cui sopra.
- Residuo non toccato: `dModel.objects` contiene le radici duplicate (push locale alle righe 648/669 + azione '+=' di Constructors.DObject). Meccanismo pre-esistente, identico pre e post fix, nessuna regressione; a valle risulta mascherato ma andrebbe nello stesso giro di bonifica. I child sono registrati una volta sola (riga 1011, unico canale).
- Path legacy `importFromXML` (XMI con metamodello embedded, EcoreParser in pausa) non toccato e non verificato dinamicamente.
- Scala: verificato su fixture minima (5 oggetti); bench.xmi (500 oggetti) non rieseguito. Il costo aggiunto è una scansione di pendingCreation per oggetto (cache per oggetto), lineare; da tenere d'occhio nel prossimo giro di benchmark M3.

## Artefatti

- Worktree: /home/claude/xmi-work (NON rimosso, per follow-up). Commit d0c8e464a + c5c3f524e su base 2d312654f.
- Patch: /home/claude/patches-xmi/0001-*.patch, 0002-*.patch.
- Evidenze: /home/claude/xmi-fixtures/verify_before.json, verify_before2.json, verify_after.json, verify_after2.json; script verify_slots.mjs; fixture mini.ecore, mini.xmi.
