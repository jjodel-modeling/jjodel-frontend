# GO commit B: cascata tipografica del nodo, con due righe sull'input inline

**Data**: 2026-08-25 14:00
**Riferimento**: `docs/prompts/claude_2026-08-25_1320_prompt_symbol_text_cascade_padding.md`, §3.3
**Commit A**: `0864c8824`, verificato a schermo sulla porta 3000 (esito sotto)

---

## 1. Esito della verifica visiva del commit A

Fatta dalla chat con il Chrome di Alfonso su `http://localhost:3000/`, progetti «State Machine v1» (Class Diagram: rettangoli con compartimenti) e «test layout» (ellissi).

| Prova | Esito | Misura |
|---|---|---|
| A1 | passa | header `4px 8px` = compartimenti; label e righe a 13px; Person 140x90, Ruolo 140x72 content-hug |
| A2 | passa | ellisse con nome di 42 caratteri cresce a 302px (D8), testo intero dentro il contorno; nessuno sforamento |
| A3 | passa | Advanced: sezione Padding dopo Border, Normal preselezionato; Large = `8px 16px` (Person 143x106), Small = `2px 4px` (140x82); Normal rimuove classe e chiave (Source pulito, `isProjectModified` falso). Basic: sezione assente |
| A4 | passa alla lettera | input a 13px come il testo; ma vedi §2 |
| A5 | passa | Permission (`ir-sized`, 176x74) non si muove e non cambia taglia con nessun preset; i content-hug crescono e tornano |

Osservazioni fuori perimetro, solo da registrare nel log: con Large un nodo a taglia esplicita taglia l'ultima riga (`overflow: hidden`, prezzo della taglia manuale); il commit dal pannello arriva a schermo con ~1,5 s di latenza (oltre il debounce di 300 ms); il canvas non segue la rinomina finché non cambia il viewpoint (difetto IR preesistente di `useIRView`, todo del checkpoint).

## 2. Due righe in più nel commit B

In A4 l'input inline salta: Person da 140x90 a 167x84. Tre cause, tutte preesistenti al commit A: l'input perde il padding della label (`0 4px` contro `4px 8px`), non riceve lo stile autorato della label (il campo esce in Inter semibold mentre l'intestazione è mono normal), e ha una larghezza intrinseca di ~149px che il content-hug misura. Le prime due si chiudono in B, perché toccano esattamente i due file che B apre e non cambiano la misura; la terza resta in backlog (cambia il content-hug).

**`irStyle.ts`**, regola `.ir-node-content .ir-label__input, .ir-node-content .ir-row__input`: il padding diventa `calc(var(--ir-pad-y) - 1px) calc(var(--ir-pad-x) - 1px)`; il pixel compensa il bordo da 1px dell'input, così il box in edit ha la stessa altezza della label. Commento in inglese di una riga sul perché.

**`IRNodeContent.tsx`**, l'`<input>` della label (ramo `l.editsName && editingLabel === i`): aggiungere `style={resolveTextStyle(l.style, readCtx, objectId)}`, lo stesso dello span. Con la cascata di B lo stile del nodo arriva già per ereditarietà; questa riga porta sull'input anche lo stile della singola label.

Tutto il resto del commit B resta come in §3.3 del prompt: `ShapeSpec.text`, `CompiledView.text`, compile, `Object.assign(inlineStyle, resolveTextStyle(compiled.text, ...))`, sezione "Symbol text" nel tab Text, i tre test.

## 3. Prove dopo il commit B

Le B1-B4 del prompt, più:

- **B5** Doppio clic sull'intestazione di Person (label con stile mono/normal): l'input esce in mono e peso normale, alto quanto la label (25px a Normal), e l'altezza del nodo non cambia entrando e uscendo dall'edit. La larghezza puo' ancora saltare: dichiarato, backlog.

Messaggio di commit sotto i 72 caratteri, per pathspec. Poi hard stop; addendum alla spec e log dopo il GO finale.
