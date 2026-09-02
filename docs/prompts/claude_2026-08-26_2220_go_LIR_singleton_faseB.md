# GO: ACK al Layer Impact Report del commit B (singleton, select sulle righe reference)

**Data**: 2026-08-26 22:20
**Riferimento**: `docs/prompts/claude_2026-08-26_1820_prompt_singleton_faseB_impl.md`, hard stop di 3.1 punto 3
**Decisioni**: R-SGL-10 invariata; questo GO emenda il §1.4 del prompt sul filtro dei candidati

ACK al Layer Impact Report. Procedi con `canvasToJjom.ts` e `IRNodeContent.tsx`, nell'ordine del prompt (3.1 punto 4), poi gate e commit unico.

## ① Filtro dei candidati: approvato, ed è un errore del prompt

`model` è un getter L che risale `father` (`LModelElement:688`, override `LObject:6225`); su una entry raw di `idlookup` non esiste, e il predicato `o.model === ctx.modelId` sarebbe stato sempre falso. Sostituisci con:

- itera `lookup[ctx.modelId].objects` (`DModel.objects`, `:4867`);
- guardia `typeof e === 'object'` sulle entry risolte;
- filtra su `classIds.has(o.instanceof)`;
- in `append`, escludi gli id già presenti in `lookup[row.key].values`.

Da dichiarare nel log: (a) `DModel.objects` è la stessa sorgente di `useM1ReferenceEdges` (`:69`, `:131`) e `useJjomSync` (`:309`, `:485`, `:636`); (b) se `objects` contiene solo le radici o anche i figli di composizione: per i singleton è indifferente (nascono da `addObject` con `father = model.id`, sono radici per costruzione), ma va scritto. In `Note`: è il terzo predicato di questo fronte che confronta due specie di id (`isSingletonSuppressed(objId)` in `useJjomSync.ts:670`, `Dummy.ts:254`, `o.model` qui); candidato a gotcha per `CLAUDE.md`, che scrive Alfonso.

## ② Zero candidati: approvato

La select si apre e mostra la riga «No conforming singleton instances» con la classe `.inline-type-select__group` esistente, non selezionabile; Escape e click fuori chiudono. Nessuna scrittura.

## Invarianti confermate

- Perimetro (α): `useJjomSync.ts` non si tocca. I tre effetti attesi del LIR (arco che passa il filtro incrementale `:1302`, nessun `setEdges` nel ramo `hide`, archi esclusi in init che non tornano al `show`) si misurano ai passi 6 e 7 della verifica e si riportano testualmente nel log: sono il numero di partenza del fronte (β).
- Portal con stile inline (`position: fixed`), nessuno SCSS oltre `.inline-type-select*`; `nodrag nowheel` sul popover.
- Due passi di undo (valore, poi arco) dichiarati, non un fallimento.
- Firma di `compartmentSig`: il token `feat.type` e l'effetto sul retarget verso un tipo omonimo vanno nel log.

## Dopo il commit

**HARD STOP** per la verifica visiva degli undici punti del §4 del prompt. Entry di log e commit `docs:` separato solo dopo il GO finale.
