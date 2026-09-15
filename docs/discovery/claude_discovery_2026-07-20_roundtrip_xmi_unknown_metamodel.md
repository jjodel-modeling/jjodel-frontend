# Discovery: round-trip XMI, "(unknown metamodel)" e warning xmi:Documentation

Data: 2026-07-20. Worktree: /home/claude/xmi-work (HEAD c5c3f524e = base 2d312654f + fix d0c8e464a + docs). Verifica dinamica su build di produzione, vite preview porta 3013, Playwright offline mode. Artefatti in /home/claude/roundtripwork/ (run_withfix.json, run_base.json, exported_withfix.xmi, exported_base.xmi, roundtrip.mjs).

## Obiettivo

Stabilire se i due sintomi osservati da Alfonso nel re-import di un XMI esportato (Metamodel "(unknown metamodel)" nel modal; warning "System element <xmi:Documentation> under <xmi:XMI> skipped") sono una regressione del commit d0c8e464a o comportamento pre-esistente della base 2d312654f. In entrambi i casi: root cause del mancato binding con file:riga e fix candidato.

## Verdetto: PRE-ESISTENTE, non regressione

Sequenza riprodotta identica a quella di Alfonso su entrambe le build (import mini.ecore, import mini.xmi, rename Alice in Alicia via proxy L, export XMI, re-import del file esportato). Matrice dei due run:

| Sintomo | Base 2d312654f | Con fix d0c8e464a |
|---|---|---|
| "(unknown metamodel)" al PRIMO import xmi | SI | SI |
| "(unknown metamodel)" al re-import | SI | SI |
| Warning xmi:Documentation al re-import | SI (identico byte a byte) | SI |
| Status modal re-import | "Import successful with warnings" | "Import successful with warnings" |
| Binding reale nello store (DModel.instanceof) | corretto (minipkg) | corretto (minipkg) |
| Integrita dati round-trip | CORROTTA: pets esportati 2 volte (4 righe `<pets>`, xmi:id duplicati), re-import crea 4 Pet invece di 2 | corretta: 2 pets, 5 oggetti, slot singoli |

I due sintomi sono identici sulle due build. In piu la base ha un difetto reale che il fix elimina: i values duplicati del containment ([c1,c2,c1,c2], bug pre-fix) facevano esportare ogni figlio due volte con lo stesso xmi:id (XMI invalido), e il re-import materializzava 4 Pet distinti. Il commit d0c8e464a MIGLIORA il round-trip, non lo peggiora. Il codice toccato dal fix (getConformitySlot, processAttribute, processContainment, populateReferenceValue) non tocca in alcun punto la risoluzione del metamodello, verificato sia sul diff (85 righe, solo slot reuse) sia a runtime.

Nota: il sintomo appare anche al primo import, dove il modal dice "Import successful" senza warnings; per questo passa inosservato. Non c'entra il re-import in se.

## File letti

- /home/claude/xmi-work/frontend/src/services/export/XMIService.ts (export M1, importM1FromXML, getMetamodelByNsURI, RT10)
- /home/claude/xmi-work/frontend/src/components/import/buildImportSummary.ts (buildXmiImportSummary)
- /home/claude/xmi-work/frontend/src/components/import/ImportSummaryModal.tsx (markup modal)
- /home/claude/xmi-work/frontend/src/components/project/ProjectEditor.tsx (handleXmiFileChange, handleExportXMI, menu card)
- git diff 2d312654f..d0c8e464a e versione base di XMIService.ts via git show

## Root cause del mancato binding

Confidenza: CERTA (statica + dinamica su entrambe le build).

Non c'e nessun mancato binding. E un bug di sola visualizzazione del modal: il risultato dell'import non riporta il metamodello risolto.

Catena, con file:riga (numerazione HEAD con fix):

1. `XMIService.ts:575-590`: `importM1FromXML` risolve il metamodello con `getMetamodelByNsURI(xmlnsDefault)` e in caso di fallimento ritorna errore esplicito. Nel run la risoluzione riesce.
2. `XMIService.ts:593`: `DModel.new(modelName, metamodel.id, false, true)` lega il modello al metamodello. Verificato nello store dopo il re-import: `DModel.instanceof` punta al DModel del metamodello minipkg, tutti gli oggetti risolvono le metaclassi giuste (Person, Pet).
3. `XMIService.ts:698`: il return di successo e `{ success: true, model: lModel, errors, warnings, pattern }`. Manca il campo `metamodel`, che pure esiste in `XMIImportResult` (riga 74) ed e valorizzato dal path legacy `importFromXML` (riga 471). Identico alla base (riga 693 su 2d312654f): il campo non e mai stato emesso da questo path.
4. `ProjectEditor.tsx:917`: `buildXmiImportSummary(result.model, result.metamodel, ...)` passa quindi `undefined`.
5. `buildImportSummary.ts:168-170`: con `metamodel === undefined`, `metamodelName` cade sul fallback `'(unknown metamodel)'` e `metamodelNsURI` diventa `'(name: (unknown metamodel))'`. Esattamente le due stringhe del modal.

Confronto byte tra nsURI esportato e registrato: l'export scrive `xmlns="http://mini/1.0"` (`XMIService.ts:142` usa `pkg.__raw.uri`, poi riga 159); nello store `DPackage.uri` vale `http://mini/1.0`. Identici byte a byte, e infatti `getMetamodelByNsURI` (riga 40, match su `p.__raw?.uri === nsURI`) risolve al primo colpo. La simmetria export/import sul fallback name (riga 142 export, righe 49-56 import) e rispettata.

## Origine e valutazione del warning xmi:Documentation

Origine: l'export emette sempre l'embedded metamodel dentro `<xmi:Documentation><embeddedMetamodel>` (`XMIService.ts:162-177`; `includeMetamodel` default true e `handleExportXMI` in `ProjectEditor.tsx:946` chiama `exportToFile(model)` senza opzioni). Al re-import, il path M1 wrapper salta ogni chiave `xmi:*` / `xsi:*` sotto `<xmi:XMI>` con quel warning (RT10, `XMIService.ts:627-635`).

Valutazione: benigno by design a livello dati. L'elemento va davvero saltato: non e un'istanza del modello. Il path M1 non usa l'embedded metamodel (lo parsa solo il path legacy `importFromXML`, righe 414-431); si affida al metamodello gia caricato via xmlns, che e il comportamento voluto. Il problema e UX: un file prodotto da Jjodel stesso genera al re-import uno status "with warnings" per un elemento che Jjodel stesso ha scritto. Il warning e utile per xmi:Extension o profili sconosciuti, rumoroso per xmi:Documentation auto-prodotta.

## Impatto

Con la build fixata (HEAD attuale), zero impatto sui dati:

- Il modello re-importato e legato al metamodello giusto; ogni oggetto riceve la metaclasse corretta (3 Person, 2 Pet).
- Attributi, reference (friends con 2 pointer) e containment (pets con 2 pointer) popolati correttamente, uno slot per feature, nessun mirage residuo sulle feature valorizzate.
- Il rename sopravvive al round-trip: name="Alicia" nel file esportato e nello slot dopo il re-import.
- Il modello e pienamente usabile; il sintomo vive solo nel modal.

Sulla base, invece, il round-trip duplicava i figli containment (4 Pet da 2): altro punto a favore del fix gia committato.

Bug secondario emerso nei numeri del modal: "Nested objects" conta TUTTI i DObject dello store meno le radici del modello importato (`buildImportSummary.ts:151-164`: `allObjectsCount` non filtra per modello). Al re-import con il primo modello ancora in store: Nested 7 invece di 2 (base: 9). "Values" invece e gia scopato per modello.

## Fix candidato chirurgico (non implementato)

1. Binding nel modal: in `XMIService.ts:698` aggiungere il campo al return: `return { success: true, model: lModel, metamodel, errors, warnings, pattern: ... }`. Una parola; il tipo lo prevede gia, il chiamante lo consuma gia. Nessun altro file da toccare.
2. Warning Documentation (opzionale, decisione di Alfonso): in RT10 (`XMIService.ts:630`) trattare `xmi:Documentation` come caso noto: `console.info` senza push nel array warnings, mantenendo il warning per gli altri `xmi:*` / `xsi:*`. Il re-import di un file auto-prodotto tornerebbe "Import successful" pulito.
3. Conteggio Nested objects (opzionale, separato): scopare `allObjectsCount` al modello importato, per esempio verificando che la catena dei father risalga a `modelId`; oppure contare i DObject il cui father e un DValue posseduto da oggetti del modello. Da trattare come task a parte su `buildImportSummary.ts`.

## Domande aperte per Alfonso

1. Il warning per xmi:Documentation va silenziato (fix 2) o preferisci tenerlo come traccia visibile del contenuto embedded ignorato?
2. L'embedded metamodel nell'export M1 oggi non serve al re-import in Jjodel (il path M1 lo ignora). Lo teniamo per interoperabilita con l'idea di usarlo in futuro come fallback quando il metamodello non e caricato, o si valuta un'opzione di export senza embedding?
3. Il fix 1 e una riga: lo includo nel prossimo prompt Claude Code insieme al fix 2, o preferisci separare?
4. Nel tuo progetto reale il primo import di sm_1.xmi mostrava anch'esso "(unknown metamodel)"? Dalla riproduzione deve essere cosi; se invece li vedevi il nome del metamodello, dimmelo perche indicherebbe un percorso diverso da quello riprodotto.
