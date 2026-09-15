# Prompt Claude Code: discovery mappatura JjOM ↔ LionWeb (Fase 1, read-only)

**Data**: 2026-09-05 13:40
**Tipo**: discovery (Fase 1 del two-phase). Nessuna modifica al codice.
**Effort**: xhigh
**Repo**: `~/jjodel` (jjodel-frontend), branch `alfonso-frontend-jjtl`
**Memo di riferimento**: `docs/ratifiche/claude_2026-09-05_1340_memo_ratifica_lionweb_mapping.md` (leggerlo per intero prima di iniziare; contiene le regole proposte R-LW-1..8 e le domande aperte)

Leggi `CLAUDE.md` e `docs/claude-code-log.md` prima di tutto.

## COSA

Misurare sul JjOM reale e sui metamodelli/modelli di esempio del repo quanti costrutti cadono nei casi di frizione della mappatura verso LionWeb 2024.1, e raccogliere i fatti strutturali che il memo dà per verificare. Output: un discovery report, niente codice.

## DOVE (file da leggere)

- `frontend/src/model/logicWrapper/LModelElement.tsx`: le classi `DModel`, `DModelM1`, `DPackage`, `DClass`, `DDataType`, `DStructuralFeature`, `DAttribute`, `DReference`, `DEnumerator`, `DEnumLiteral`, `DOperation`, `DAnnotation`, `DAnnotationDetail`, `DObject`, `DValue`. Leggi i campi persistiti, non i metodi.
- `frontend/src/services/export/EcoreService.ts`, `XMIService.ts`, `JsonModelService.ts`: come oggi si attraversa il D-graph in export e in quale ordine; sono il modello per il futuro modulo.
- `frontend/src/components/common/ExportImportMenu.tsx`: solo per capire come si registra un formato di export (non modificare).
- I metamodelli e modelli di esempio: cerca con `grep -rl "Pointer_" --include=*.json --include=*.ts` fuori da `node_modules` e in `public/`, `frontend/src/examples`, `frontend/src/**/fixtures`, `frontend/src/**/__tests__`. Elenca nel report dove stanno e quanti sono.

## COME

Per ogni punto, riporta il dato misurato con il comando usato; un'asserzione di assenza vale solo con la ricerca dichiarata.

1. **Primitivi (R-LW-3)**. Elenca i `DDataType` primitivi built-in di Jjodel (nome, id) e come si distinguono da un `DDataType` definito dall'utente. Indica quali dei tre built-in LionCore (`Boolean`, `Integer`, `String`) hanno un corrispettivo diretto e quali no.
2. **Multiplicità (R-LW-1)**. Nei metamodelli di esempio, conta i `DAttribute` con `upperBound !== 1` (incluso `-1`). Riporta nome della classe e dell'attributo per ciascuno.
3. **Ereditarietà (R-LW-2)**. Conta le `DClass` con più di un supertipo; per ognuna indica se i supertipi oltre il primo sono `abstract`, `interface`, e se hanno attributi con `lowerBound >= 1`. Riporta come il campo `extends` di `DClass` è ordinato (array di Pointer? ordine di inserimento?).
4. **Opposti, derived, transient, operazioni (R-LW-4)**. Conta nei metamodelli di esempio le `DReference` con `opposite` valorizzato, le feature con `derived` o `transient` true, le `DOperation`.
5. **Annotazioni (R-LW-5)**. Conta le `DAnnotation` per `source`: quante con prefisso `jjodel/`, quali chiavi, quante con altri `source`. Localizza `parseDAnnotation` e riporta la sua firma.
6. **Id e chiavi (R-LW-6)**. Riporta come vengono generati gli id (`DModelElement.new`, `DPointerTargetable`, e qualunque funzione di generazione id). Verifica che l'alfabeto sia contenuto in `[A-Za-z0-9_-]`. Stabilisci se un id assegnato da `DObject.new()` può essere riscritto prima o durante la persistenza (`COMMIT`, `pendingActions`, `VersionFixer.tsx`, migrazioni): cita il codice, non l'ipotesi.
7. **Radici e contenimento (R-LW-7)**. Riporta come si trova la lista dei `DObject` radice di un modello M1 (`model.objects`? `DModelM1`?), come un `DObject` figlio conosce il padre e la feature di contenimento, e come è rappresentato l'ordine dei figli in un `DValue` multiplo.
8. **Nomi (R-LW-8)**. Verifica con grep globale che `lionweb`, `LionWeb`, `LionWebService`, `lionwebExport` non siano già in uso nel codebase (cartelle, identificatori, classi CSS, chiavi di context).
9. **Progetti multi-metamodello**. Un modello M1 può istanziare classi di più `DModel` M2? Se sì, l'export deve emettere più `languages`: riporta come si risale dal `DObject` al suo `DModel` M2.

## HARD STOP

Al termine dei nove punti scrivi il report e fermati. Nessuna implementazione, nessuna modifica a file esistenti, nessuna proposta di codice nel report oltre a un elenco di file che il modulo dovrà leggere.

## DISCOVERY REPORT (obbligatorio)

Salva il report in `docs/discovery/discovery_2026-09-05_lionweb_mapping.md` (se ne esiste già uno con questo nome, usa il suffisso `_2`). Contenuto minimo: obiettivo; file letti con path completi; per ciascuno dei nove punti il dato misurato e il comando; dipendenze e rischi; domande aperte per Alfonso, in particolare una risposta documentata alle quattro domande del §5 del memo, dove il codice permette di rispondere.

## COMMIT E LOG

Committa il solo report: `git add -- docs/discovery/discovery_2026-09-05_lionweb_mapping.md` poi `git commit -m "docs(discovery): JjOM to LionWeb mapping, phase 1" -- docs/discovery/discovery_2026-09-05_lionweb_mapping.md`. Non pushare. Prima del commit verifica che non esista `.git/index.lock`; se esiste, fermati e segnalalo. Aggiungi l'entry in `docs/claude-code-log.md` (tipo `docs`, esito, nome del documento prompt `2026-09-05 13:40`) e committala insieme al report.
