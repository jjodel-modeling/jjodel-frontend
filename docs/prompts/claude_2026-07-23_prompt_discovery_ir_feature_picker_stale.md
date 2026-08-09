# Prompt Claude Code — Discovery Fase 1: feature-picker IR mostra feature stale

**Tipo**: discovery read-only (two-phase, Fase 1). NESSUNA modifica al codice sorgente.
**Branch**: `alfonso-frontend-jjtl` (lavora sul working tree locale; il codice dell'authoring IR NON è ancora pushato, non fidarti di GitHub).
**Data**: 2026-07-23

---

## Obiettivo

Capire perché il dropdown "Select feature..." del pannello di **authoring IR** (label / predicate builder) elenca una lista di feature **stale e parziale** invece delle feature reali della classe target. Trovare la fonte esatta di quella lista e il punto in cui diverge dalle feature live della classe M2. Produrre un discovery report. **Non correggere nulla in questa fase.**

## Sintomo osservato (dogfooding, verificato in UI da Alfonso)

- Metamodello di una state machine. Classe `State`:
  - eredita `name : EString` da `NamedElement` (superclasse);
  - attributi diretti: `isFinal : EBool`, `isInitial : EBool`, `attr_0 : EString`, `attr_1 : EInt`.
- Le **istanze** M1 di `State` mostrano tutte correttamente `isFinal` e `isInitial`: il metamodello (M2) e il modello (M1) sono sani, la feature esiste ed è propagata.
- Il dropdown "Select feature..." nel pannello IR mostra **solo** `name` (ereditata) e `isInitial`. Mancano `isFinal`, `attr_0`, `attr_1`.
- Il taglio è **temporale**: `name` esiste da sempre (via eredità), `isInitial` esisteva a un certo istante, mentre `isFinal`/`attr_0`/`attr_1` sono state aggiunte **dopo** quell'istante (in particolare, con ogni probabilità, dopo l'abilitazione dell'authoring IR su quella view).
- **Escluso il filtro per tipo**: il dropdown mostra `name` (EString) e `isInitial` (EBool) ma non `attr_0` (EString) né `isFinal` (EBool); quindi non sta filtrando per tipo.

## Ipotesi di lavoro (da confermare o smentire nel report)

Il picker enumera le feature dal **documento `.ir`** (le feature seedate da `defaultObjectViewIR()` al momento dell'enable, oppure le feature già mappate nelle label/binding esistenti) invece che dalla **classe M2 target**. Le feature aggiunte alla classe dopo l'enable non entrano nel `.ir`, quindi non compaiono nel picker.

## COSA fare (discovery read-only)

1. **Localizzare il componente** che renderizza il "Select feature...". Anchor di ricerca utili (stringhe visibili nella UI, probabilmente letterali nel codice):
   - `grep -rn "Select feature" frontend/src`
   - in subordine, le label italiane visibili nello stesso pannello: `"Sinistra"`, `"Destra"`, `"Path"`, `"Valore"`.
2. **Tracciare la fonte della lista di opzioni**: da quale struttura dati arriva l'array di feature renderizzato nel dropdown? Distinguere in modo netto tra:
   - feature lette **live dalla classe M2 target** (dirette + ereditate), risolta via `appliableToClasses` / metaclass del documento IR;
   - feature lette dal **documento `.ir`** (label/binding già presenti, seed di `defaultObjectViewIR()`).
3. **Stabilire se la lista è persistita o runtime**: è salvata dentro il `.ir` del progetto (quindi un reload non la cambia) oppure è calcolata a runtime (`useMemo`/`useState`/selector) con dipendenze o eventi di invalidazione che non includono l'aggiunta di feature alla classe?
4. **Confrontare con il percorso "buono"**: il pannello proprietà delle **istanze** elenca correttamente tutte le feature della classe (dirette + ereditate). Individuare la funzione/utility che quel percorso usa per enumerare le feature di una classe (inclusa la risoluzione dell'ereditarietà da `NamedElement`), e confrontarla con ciò che fa il picker IR. Il delta tra i due percorsi è il cuore del bug.
5. **Individuare il punto esatto** in cui la lista del picker diverge dalle feature live della classe.

## DOVE guardare (piste, da verificare con grep — non assumere che siano esatte)

- Componenti dell'arco authoring IR: label/compartment/badge editor (Fase B2a), `ConditionalEditor<T>` + `PredicateBuilder` (B2b-i).
- `EnableIRPanel` e il seed `defaultObjectViewIR()` (B2c-ii): cosa cattura al momento dell'enable e cosa scrive nel `.ir`.
- Schema e resolver IR: `irTypes.ts`, `irResolve.ts`.
- `ViewData.tsx` (monta il tab IR).
- Enumerazione feature di una classe M2 (percorso "buono"): cercare le utility usate dal pannello proprietà delle istanze per elencare le feature, incluse le ereditate. Anchor possibili: `grep -rn "allFeatures\|getFeatures\|eAllStructuralFeatures\|features(" frontend/src` (adatta ai nomi reali del codebase).

## Domande a cui il report DEVE rispondere

1. Il picker legge le feature dalla **classe M2 live** o dal **documento `.ir` / seed**?
2. La lista è **persistita** nel `.ir` salvato o **calcolata a runtime**? (Se runtime: con quali dipendenze, e perché non si invalida quando si aggiunge una feature alla classe?)
3. Come vengono trattate le feature **ereditate** (perché `name` compare)? Il percorso del picker le risolve o le eredita dallo snapshot?
4. È un **bug puro** o una **scelta di design** (offrire solo le feature già mappate nell'IR)? Se emerge una ragione di design, riportarla senza rimuoverla.
5. Qual è il **fix minimo** ipotizzabile (senza implementarlo): far enumerare al picker le feature live della classe target, usando il `.ir` solo per marcare quali sono già mappate? Elencare i file che un tale fix toccherebbe e i rischi (in particolare eventuali punti in critical-zone).

## Vincoli e output

- **Read-only**: nessuna modifica al codice sorgente, nessun refactoring, nessun commit del codice.
- **Discovery report OBBLIGATORIO**, salvato in `docs/discovery/discovery_2026-07-23_ir_feature_picker_stale.md`. Se la cartella non esiste, crearla. Contenuto minimo: obiettivo, file letti/analizzati (con path completi), findings, fonte della lista, confronto col percorso "buono", dipendenze e rischi, risposte alle 5 domande sopra, domande aperte per Alfonso.
- Committare **solo** il file del report con `git add docs/discovery/discovery_2026-07-23_ir_feature_picker_stale.md` (add mirato, mai `git add .`), messaggio `docs: discovery ir feature picker stale`.
- Aggiornare `docs/claude-code-log.md` con l'entry della discovery (tipo `docs`).
- **Hard stop dopo il report.** Nessuna Fase 2 (implementazione) senza go-ahead esplicito di Alfonso. L'analisi in chat parte dal report salvato, non dall'output volatile del terminale.
