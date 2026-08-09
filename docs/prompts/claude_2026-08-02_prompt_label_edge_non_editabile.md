# Prompt Claude Code: label degli edge IR non editabile per default

**Documento prompt**: 2026-08-02 17:10
**Tipo**: fix (one-shot con mini-discovery)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Hard stop**: sul diff, prima del commit.

## Prima di iniziare

1. Leggere `CLAUDE.md`. In caso di conflitto con questo prompt, segnalare senza procedere.
2. Leggere le ultime entry di `docs/claude-code-log.md` (E-obj `d1dc55649` e il backfill `b3aa05378`).
3. **WIP estraneo nel working tree** (lane TextStyle piu' altri file). Staging file per file, mai `git add .`.

## CONTESTO

La label centrale di un edge IR-autorato e' oggi **editabile inline**, ma la modifica **non raggiunge il modello**: il nome dell'istanza corrispondente all'edge non cambia. E' una scrittura morta: l'utente crede di aver modificato il modello e ha modificato dei pixel.

La feature vera, cioe' un flag di editabilita' con scrittura all'indietro verso lo slot corretto, arrivera' con la slice E-lab dell'arco "Espressivita' edge v2" e richiede una discovery. Questo prompt fa **solo la cosa sicura e immediata**: togliere l'affordance finche' non c'e' la scrittura dietro.

## Mini-discovery (obbligatoria, report incluso)

Prima di qualunque edit, rispondere a queste quattro domande con `file:riga`:

1. **Dove nasce l'affordance di edit** della label di un edge: quale componente la rende editabile, con quale gesture (doppio click, click, altro), e quale stato o handler la governa.
2. **Dove finisce oggi la modifica**: la scrittura sopravvive al re-render, resta in uno stato locale, o va perduta subito? Riportare il sito preciso in cui il valore viene scritto e dire se da li' esiste o no un percorso verso JjOM.
3. **L'affordance e' condivisa** con le label delle edge classiche non-IR, con le label dei vertici, o con altre superfici? Elencare i consumatori.
4. **Il gate `data.irEdgeViewId`** e' disponibile nel punto in cui va applicata la disattivazione? E' il gate che il progetto usa dalla fase E0 per distinguere edge IR da edge classiche.

Salvare il report in `docs/discovery/discovery_2026-08-02_edge_label_editability.md` (creare la cartella se manca), col contenuto minimo previsto da `CLAUDE.md`: obiettivo, file letti, findings con `file:riga`, dipendenze e rischi, domande aperte.

## Regola di procedura

- **Se le quattro risposte sono chiare e la disattivazione e' applicabile con il gate su `data.irEdgeViewId`**: procedere con l'edit e fermarsi al diff.
- **Se l'affordance risulta condivisa in modo non separabile** con le edge classiche o coi vertici, oppure se il gate non e' disponibile in quel punto: **STOP**, consegnare il report e non toccare codice. In quel caso la disattivazione non e' piu' un micro-fix e torna in chat.

## COSA / COME

La label centrale degli edge **con `data.irEdgeViewId` presente** smette di essere editabile: nessuna gesture di edit, nessun cursore di testo, nessuna affordance visiva che suggerisca l'editabilita'.

- Le edge **classiche non-IR** restano esattamente com'erano. Il comportamento attuale non e' oggetto di questa segnalazione e una regressione li' sarebbe peggiore del bug che stiamo togliendo.
- Le label dei **vertici** non si toccano.
- Nessun campo nuovo nell'IR, nessuna modifica a `irTypes.ts` / `irCompile.ts` / `irValidate.ts`. Il flag di editabilita' e' materia della slice E-lab, non di questo prompt.
- Zero refactoring opportunistico, nessun rinomino di identificatori esistenti, edit puntuali.
- Se durante l'edit emerge che la rimozione dell'affordance lascia codice apparentemente inutilizzato, **non rimuoverlo**: servira' a E-lab. Annotarlo nel report.

## Verifica

1. `npm run build` verde, typecheck a baseline, suite esistente verde.
2. Verifica visiva (la esegue Alfonso): su un edge IR-autorato la label non e' piu' editabile; su un edge classico non-IR il comportamento e' invariato; le label dei vertici sono invariate.

## Output e chiusura

1. Report di mini-discovery salvato.
2. **HARD STOP sul diff**, prima del commit: consegnare il diff e l'esito dei gate, attendere il go-ahead.
3. Dopo il go-ahead: entry in `docs/claude-code-log.md` (tipo `fix`) che cita questo documento prompt con data e ora, `git add` dei soli file toccati, commit `fix(editor-v2): disable inline editing of IR-authored edge labels`. **Nessun push** senza go-ahead separato.

## RIFERIMENTI

- Ratifiche dell'arco: `ratifiche_2026-08-02_edge_expressiveness_v2.md` (KB), in particolare R-A5 e R-A6.
- Fase precedente chiusa: E-obj `d1dc55649`, ratifiche `ratifiche_2026-08-02_eobj_object_as_edge.md`.
- Gate E0 su `data.irEdgeViewId`: `spec_2026-07-26_ir_edge_authoring_addendum.md` §D1.
