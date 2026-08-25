# GO finale: chiusura del task symbol text cascade e padding, con un fix di una riga

**Data**: 2026-08-25 15:30
**Riferimenti**: prompt `_1320_`, GO B `_1400_`; commit A `0864c8824`, commit B `97c5a65e0`
**Verifica B1-B5**: fatta dalla chat con il Chrome di Alfonso su `http://localhost:3000/`, progetto «State Machine v1», modello Class Diagram, view «Class».

---

## 1. Esito delle prove B

| Prova | Esito | Misura |
|---|---|---|
| B1 | passa | Symbol text: Size 16 porta le righe a 16px (inline sul nodo `font-size: 16px`); Mono cambia il font di nodo e righe; Color `#b91c1c` colora righe e intestazione. L'intestazione, che ha un suo `fontSize` autorato a 13, resta a 13 |
| B2 | passa | Label #1 a Size 20: intestazione 20px, righe 16px. Precedenza label > nodo confermata in entrambe le direzioni (13 sotto 16, 20 sopra 16) |
| B3 | passa | Asse condizionale dal popover: `eq($name.value, "Ruolo") then 22`. Ruolo a 22px, Person e Activity a 13px (nessun override, non 16). Cambiando lo slot `name` in `Role` dal pannello, Ruolo scende a 13 e risale a 22 al ripristino: reattivo nei due versi |
| B4 | passa con una precisazione | Dopo **File > Save Project** e reload: `shape.text` = `{fontFamily, fontSize, color}` e `shape.padding: "large"` persistono e vengono resi; nessun `undefined` né `{}` nell'IR. Senza il salvataggio esplicito il reload perde le modifiche (versione che avanza solo al salvataggio, decisione del 24/8): non è un difetto di B, ma vedi §3 |
| B5 | passa | Doppio clic sull'intestazione di Ruolo (mono/normal, content-hug): l'input esce in mono 400 a 13px, alto 33px come la label (33px), altezza del nodo 97 entrando e 97 uscendo. La larghezza salta ancora (148 → 200): backlog dichiarato |

## 2. Regressione confermata sull'input di riga (da chiudere ora)

Misurata sul DOM di Ruolo a padding Large: una riga di compartimento passa da 22px a 38px quando contiene un `.ir-row__input` (padding calcolato `7px 15px`); a Normal il conto di Claude Code dà +5px. Prima del commit B la riga non si muoveva. Va chiuso come descritto nel report di B, in un commit `fix:` separato prima del `docs:`:

**`irStyle.ts`**: spezzare la lista di selettori. `.ir-node-content .ir-label__input` tiene il padding a token (`calc(var(--ir-pad-y) - 1px) calc(var(--ir-pad-x) - 1px)`); `.ir-node-content .ir-row__input` torna a `padding: 0 4px`, tutto il resto della regola in comune. Commento in inglese di una riga: la riga di compartimento è un flex a `line-height: 1.4` e l'input deve restare sotto la sua altezza. Nessun test nuovo (regola CSS pura); build e typecheck come gate.

Messaggio: `fix(editor-v2): row inline editor keeps its flat padding` (o equivalente sotto i 72).

## 3. Osservazioni da registrare nel log, senza fix in questo task

- **Intestazione schiacciata sotto taglia manuale**: su un nodo `ir-sized` il cui contenuto supera il box (Person 201x108 con righe a 16 e header a 20, oppure padding Large), il flex column comprime l'intestazione (label alta 20px invece di 34, testo tagliato sopra e sotto) e lascia intatte le righe. Candidato a una riga, `.ir-label { flex-shrink: 0 }`, che sposta il taglio sull'ultima riga; da decidere in chat, non qui.
- **`U.isProjectModified` resta falso** dopo un `view.ir = draft` dal symbol editor e dopo la modifica di uno slot dal pannello proprietà: chiudere il progetto senza salvare non avverte. Da verificare se voluto (il flag ha altri scrittori) o buco; non è di questo task.
- **Larghezza dell'input inline** (~150px intrinseci misurati dal content-hug): backlog dichiarato dal GO B.
- **Preview del modal** (`SymbolBoxPreview`): resta a 13px Inter 600 e non riflette `shape.text`: contratto dichiarato, fuori perimetro.
- Il progetto «State Machine v1» è stato riportato a `shape.text = {fontFamily: "mono"}` e `padding: "large"` (lo stato trovato prima delle prove) e salvato.

## 4. Chiusura

Dopo il fix di §2, nell'ordine:

1. Addendum §11 alla spec `docs/spec/claude_spec_2026-07-27_ir_textstyle_addendum.md` come nel prompt `_1320_` §6, con i tre hash reali (A, B e il fix di §2) e una riga in più: «l'input inline della label riceve lo stesso stile della label; l'input di riga tiene il padding piatto».
2. Entry di log in `docs/claude-code-log.md` nel formato in uso, una per i tre commit o una cumulativa con i tre hash, con l'esito delle prove A1-A5 (GO B §1) e B1-B5 (§1 qui) e le osservazioni di §3 nelle Note.
3. Commit `docs:` per pathspec, con anche questo GO in `docs/prompts/`.

Poi hard stop finale: nessun push, nessun altro file.
