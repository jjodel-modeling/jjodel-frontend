# S2: il tab Template non deve più fingere di funzionare sulle view legacy

**Data**: 2026-08-04 17:31
**Tipo**: fix di superficie di authoring, scope stretto.
**Branch**: `alfonso-frontend-jjtl`
**Effort**: high
**Ordine**: eseguire **dopo** S1 (`2026-08-04 17:30`) e dopo la sua verifica visiva.

---

## CONTESTO

Dall'Area C del censimento del 2026-08-04, confermato sul codice: su una view senza `ir`, il
tab **Template** viene montato, mostra il `jsxString`, accetta gli edit, li persiste e li
ricompila via `VIEWS_RECOMPILE_jsxString`. E non ha alcun effetto: l'unico ramo di rendering
che nomina quel `jsxString` è `ClassNode.tsx:424`, il cui input non viene mai popolato dopo lo
spegnimento del classic (Fase 5a, `197b6c3d0`).

Il problema non è un pannello inerte, che sarebbe innocuo. È un pannello che si comporta come
se fosse autoritativo: contenuto giusto, edit accettati, salvataggio riuscito, effetto zero.
Chiunque lo usi conclude che il suo template non funziona per un bug del template, e ci perde
del tempo.

La condizione di montaggio è in `frontend/src/components/editors/views/ViewData.tsx:61`,
`(isV && !ir && view.isEdge !== true)`; il tab Template è montato perché `isV` è vera. Rileggere
il file: il numero di riga viene dal censimento e può essere shiftato.

## DECISIONE PRESA (non riaprirla)

**Il tab resta montato e diventa esplicitamente di sola lettura**, con un avviso che dice cosa
sta succedendo. Non si rimuove.

Motivo: rimuoverlo cancellerebbe l'unico posto in cui il contenuto del `jsxString` è ancora
ispezionabile, e quel contenuto è l'unica traccia della notazione originale su una view
degradata. Vale finché non esiste un percorso di recupero verso l'IR. Sola lettura ottiene
tutto il beneficio (nessuno crede più di star modificando qualcosa) senza distruggere
informazione.

## COSA

Sulle view **senza `ir`** (quindi il ramo legacy, non le view IR-authored):

1. **Editor in sola lettura.** Il contenuto resta visibile e selezionabile, la modifica no.
   Usare la modalità read-only dell'editor già in uso, non una disabilitazione che ne cambi
   l'aspetto rendendolo illeggibile.
2. **Nessuna scrittura.** Il percorso di commit e la ricompilazione
   (`VIEWS_RECOMPILE_jsxString`) non devono più partire da questo tab per queste view. Non
   rimuovere l'azione: renderla irraggiungibile da qui.
3. **Un avviso sopra l'editor**, breve e non allarmista, che dica: questo template non è più
   interpretato, il rendering usa la notazione astratta, e l'authoring passa dall'IR. Testo
   esatto da concordare, proposta: *"Questo template non viene più interpretato. Il rendering
   usa la notazione astratta; per definire una sintassi concreta, abilita l'IR."* Senza em
   dash.
4. **Le view IR-authored non cambiano in nulla.** Se il tab Template oggi non è montato per
   loro, resta così.

## DOVE (perimetro, `git add` solo questi)

| File | Modifica |
|---|---|
| `frontend/src/components/editors/views/ViewData.tsx` | passaggio del flag read-only al tab Template sul ramo senza `ir` |
| il componente del tab Template (individuarlo leggendo `ViewData.tsx`, non assumerne il path) | modalità read-only + avviso |

Se la modifica richiede di toccare un terzo file, **elencarlo e chiedere prima di procedere**.

## COME (vincoli)

- Non toccare `EnableIRPanel.tsx`, i pannelli di authoring IR, `irValidate`, `irCompile`.
- Non rimuovere `VIEWS_RECOMPILE_jsxString` né alcuna azione esistente: questo task cambia chi
  la può invocare, non la sua esistenza.
- Non rinominare classi CSS/SCSS esistenti. Se serve una classe nuova per l'avviso, grep
  anti-collisione prima di crearla.
- Nessuna dipendenza nuova. Riusare le primitive esistenti per l'avviso.
- Verificare che il `jsxString` resti leggibile e copiabile: è il punto della decisione.

## GATE

- Typecheck baseline invariata, vitest invariata, `npm run build` verde.
- HARD STOP per verifica visiva di Alfonso su localhost:3000 (nota: **3000**, non 3001) con
  hard refresh: aprire una view senza IR e controllare che il template si veda, non si possa
  modificare, e che l'avviso sia presente; poi aprire una view IR-authored e controllare che
  nulla sia cambiato.
- Non committare: preparare l'indice con i soli file del perimetro e fermarsi.

## REPORT

Entry in `docs/claude-code-log.md` nella forma prescritta. Non rettificare le due entry
malformate del 2026-08-03: hanno un task loro.

Nome di questo documento prompt: `2026-08-04 17:31`.
