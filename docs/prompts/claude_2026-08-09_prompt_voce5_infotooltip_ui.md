# Prompt Claude Code: voce 5, consolidamento InfoTooltip in components/ui/

**Nome del documento prompt**: 2026-08-09 15:59
**Tipo**: refactor (igiene, estrazione primitiva condivisa)
**Branch**: `alfonso-frontend-jjtl`
**Vincolo generale**: CLAUDE.md è la fonte di verità; se questo prompt lo contraddice, segnalare il conflitto e fermarsi.

## Contesto

Ultimo punto aperto della voce 5 (grappolo igiene). La ricognizione di Fase A (commit `e23fb6439`) ha censito 4 copie byte-identiche (md5 `47b49fac269cb6f677866c6d891615f3`) di una funzione locale `InfoTooltip` di 12 righe: span con classi `jj-info-icon-wrapper` / `jj-info-icon` / `jj-info-tooltip`, `useState` per lo show su hover, props `{ text: string }`.

Ratifica di Alfonso (2026-08-09, chat Cowork, opzione A): il componente diventa primitiva condivisa in `components/ui/InfoTooltip/InfoTooltip.tsx` e si consolidano **tutti e 4 i siti**, incluso `editors/Info.tsx` (fermo dal 2026-07-05: il touch è ratificato e deve restare meccanico, via la definizione locale più un import, nient'altro). Etichetta a registro: **D-5-1**.

Vincoli ratificati insieme all'opzione:

- Le classi `jj-info-*` sono API interne: **non** si rinominano, **non** si spostano, **non** si migra a CSS Module. Il mandato è resa identica.
- Nessun ingresso in vetrina ora (rinviato al punto 4 della sequenza DS).
- Resa byte-identica per costruzione, stesso criterio del precedente B-5 (`authoringMessages.ts`, commit `e5d238cd9`): l'identità si dimostra col confronto md5, non a video.

## COSA

1. Creare la primitiva condivisa `InfoTooltip` in `components/ui/InfoTooltip/InfoTooltip.tsx`.
2. Nei 4 siti censiti: rimuovere la definizione locale e importare la primitiva. Le occorrenze d'uso e i loro testi restano intatti.
3. Aggiungere la riga D-5-1 in `docs/decisions.md`.
4. Aggiungere l'entry in `docs/claude-code-log.md`.
5. Un solo commit, scope chiuso, **niente push**.

## DOVE (scope chiuso)

File toccabili, nessun altro:

- `frontend/src/components/ui/InfoTooltip/InfoTooltip.tsx` (nuovo)
- `frontend/src/components/editors/Info.tsx`
- `frontend/src/components/editors/views/data/InfoData.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx`
- `frontend/src/components/viewParenting/ViewParentingFields.tsx`
- `docs/decisions.md`
- `docs/claude-code-log.md`
- `docs/discovery/discovery_2026-08-09_infotooltip_ui_consolidation.md` (nuovo, report di Fase 0)

Se durante il lavoro emerge la necessità di toccare qualsiasi altro file (incluso un eventuale barrel/index di `ui/`), fermarsi e chiedere prima.

## COME

### Fase 0: verifica d'ingresso (read-only) con report obbligatorio

1. **Censimento definizioni**. `grep -rn "jj-info-icon-wrapper" frontend/src/` e `grep -rn "InfoTooltip" frontend/src/`. Attese: 4 definizioni locali, una per file elencato in DOVE. Riferimenti Fase A: `Info.tsx:64,:97`; `InfoData.tsx:33`; `irTabs.tsx:66,:114`; `ViewParentingFields.tsx:33`. Per `Info.tsx` chiarire se `:64`/`:97` sono definizione più uso o due definizioni; se sono due, entrambe rientrano nel consolidamento e va annotato nel report. Nessuna quinta occorrenza di definizione altrove.
2. **Identità**. md5 del corpo di ciascuna definizione (stessa normalizzazione della Fase A): tutti uguali a `47b49fac269cb6f677866c6d891615f3`.
3. **Collisione nomi**. Nessun altro identificatore `InfoTooltip` nel codebase (tipi, export, test) oltre alle definizioni censite; nessuna primitiva tooltip o popover già presente in `components/ui/`.
4. **Convenzioni ui/**. Rilevare come esporta `Select` (`components/ui/Select/Select.tsx`): named o default export, presenza o assenza di barrel; come la importano i consumatori. La nuova primitiva replica quel pattern. Se esiste un barrel che andrebbe modificato, si applica la regola di DOVE: fermarsi e chiedere.
5. **Censimento stili (solo report)**. `grep -rn "jj-info-" frontend/src --include=*.scss --include=*.css` (estendere a tutto il repo se vuoto): dove sono definite le tre classi. Non toccarle in nessun caso.
6. **Etichetta**. Verificare in `docs/decisions.md` che D-5-1 sia libera.
7. **Report obbligatorio**: salvare `docs/discovery/discovery_2026-08-09_infotooltip_ui_consolidation.md` con: obiettivo, file letti (path completi), findings (righe esatte delle definizioni, md5, sede delle classi, pattern export di `ui/`), rischi, eventuali domande per Alfonso. La Fase 0 non è completa finché il report non è scritto.

**Gate di uscita Fase 0**: se tutti i check corrispondono alle attese, procedere a Fase 1 senza fermarsi. Se anche uno solo devia (md5 diverso, quinta definizione, collisione di nome, primitiva tooltip già esistente, D-5-1 occupata, barrel da toccare), **HARD STOP**: salvare comunque il report e riportare in chat, senza scrivere codice.

### Fase 1: implementazione

1. **Nuovo file** `InfoTooltip.tsx`: funzione estratta character-identical (stesso corpo JSX, stesse classi, stessa firma `{ text: string }`), con export secondo il pattern rilevato al punto 4 di Fase 0. Docstring breve in testa al file: primitiva nata dal consolidamento della voce 5 (4 copie byte-identiche, ratifica D-5-1); le classi `jj-info-*` sono globali e definite in [sede dal censimento], deliberatamente non migrate a CSS Module perché il mandato è resa identica; ingresso in vetrina rinviato al punto 4 della sequenza DS.
2. **Nei 4 siti**: rimuovere la definizione locale, aggiungere l'import con lo stile già in uso nel file (path relativo coerente con gli import esistenti; niente riordino degli import presenti). Nessun'altra modifica: usi e testi invariati, zero refactoring adiacente.
3. **Verifica d'identità per costruzione**: md5 del corpo della funzione nel nuovo file (al netto della sola keyword `export`, se il pattern la antepone) uguale a quello delle definizioni rimosse. Riportare i due md5 nell'esito.
4. **Niente test nuovi, deliberato**: sotto `ui/` non esiste una convenzione di test (punto aperto del fronte DS) e istituirla in un commit di igiene sarebbe fuori mandato.
5. **`docs/decisions.md`**, nuova riga: **D-5-1 (2026-08-09)**: `InfoTooltip` primitiva condivisa in `components/ui/InfoTooltip/`; consolida i 4 siti byte-identici (incluso `editors/Info.tsx`, fermo, touch ratificato); classi `jj-info-*` invariate (API interne); niente CSS Module; ingresso in vetrina al punto 4 della sequenza DS.
6. **Gate**: `npm run build` (0 errori); `tsc` (baseline 33 errori, delta zero, nessun errore nei file toccati); vitest tutto verde con totale invariato (ultimo gate a HEAD: 204/204; se il totale differisce, riportarlo senza forzare); `npm run check:docs` 2/2 PASS (restano i due warning noti `Corregge` senza `HH:mm`: `2026-07-18 00:00` e `2026-08-08 00:00`).
7. **Log**: entry in `docs/claude-code-log.md` nel formato standard, con **Nome del documento prompt**: `2026-08-09 15:59`. Se le entry superano 20, ruotare le più vecchie in `docs/claude-code-log-archive.md`.
8. **Commit unico**, `git add` dei soli file elencati in DOVE (mai `git add .`). Messaggio: `refactor(ui): extract shared InfoTooltip primitive from four duplicated copies`. **Niente push**.

### Dopo il commit

Riportare in chat: esiti dei gate, diff per file (righe rimosse/aggiunte), sede delle classi `jj-info-*` dal censimento, i due md5 di conferma. Poi consegnare ad Alfonso la checklist smoke (verifica visiva su http://localhost:3000/, hard refresh):

1. Vecchio pannello Properties (`editors/Info.tsx`): hover sulle icone "i", tooltip visibile e identico a prima.
2. Pannello proprietà delle view (`InfoData.tsx`): idem, è il consumatore più pesante (~9 usi).
3. Tab di authoring IR (`irTabs.tsx`): idem.
4. Applies to / parent view (`ViewParentingFields.tsx`): idem.

Attesa unica per tutti e quattro: icona e tooltip indistinguibili da prima del commit.

## RIFERIMENTI

- Fase A del grappolo igiene: commit `e23fb6439` (entry in `docs/claude-code-log.md` del 2026-08-09), con siti e md5.
- Precedente di metodo: B-5, commit `e5d238cd9` (`editor-v2/viewpoint/authoring/authoringMessages.ts`): estrazione con resa identica dimostrata per costruzione.
- Siti censiti in Fase A: `editors/Info.tsx:64,:97`; `editors/views/data/InfoData.tsx:33`; `editor-v2/viewpoint/authoring/irTabs.tsx:66,:114`; `components/viewParenting/ViewParentingFields.tsx:33`.
- Corpo atteso della funzione (dal censimento, per riscontro rapido): span wrapper con `onMouseEnter`/`onMouseLeave` su `useState(false)`, figlio `jj-info-icon` con testo "i", figlio condizionale `jj-info-tooltip` con `props.text`.
- Ratifiche DS collegate: regola anti-drift (primitiva nuova solo dopo fermata e ratifica: questa), sede primitive `components/ui/`, vetrina DS-8.
- CLAUDE.md: scope delle modifiche, classi CSS come API interne, verifica nomi prima di crearne di nuovi, discovery report obbligatorio.
