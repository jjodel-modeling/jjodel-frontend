# 2026-08-28 17:45 — L'ispettore dei renderer ha bisogno di un'affordance visibile

Segue `claude_2026-08-28_1705_prompt_row_view_library.md`, che ha consegnato la libreria e
l'ispettore ma lo ha lasciato raggiungibile solo con Alt+click.

## Richiesta

> Alt+click resta, come acceleratore — non come unico modo di entrarci.

Icona `bi-sliders`, 14px, slate-400, al bordo destro della cella valore, rivelata sull'hover della
riga: `opacity: 0 → 1`, 150ms ease-out. E' lo schema gia' stabilito dal design system — le card di
progetto scoprono le loro icone d'azione allo stesso modo — quindi non costa vocabolario nuovo. Il
click apre lo stesso ispettore che apre Alt+click.

Tre vincoli:

1. L'icona non deve cambiare l'altezza della riga ne' far scorrere il valore. Riservare il suo slot
   nella griglia, oppure posizionarla in assoluto sopra il padding destro della cella. «Un valore che
   si sposta di lato sull'hover e' peggio di nessuna affordance.»
2. Deve fermare la propagazione, come il chip `+k`: ispezionare non e' selezionare, e il click target
   della riga resta quello di oggi.
3. Su una riga il cui renderer e' gia' `dichiarato`, l'icona compare comunque — il pannello della
   ladder e' dove si va per annullare un override, quindi nasconderlo li' chiude l'unica uscita.

Documentare entrambi i percorsi nell'entry di log: l'icona e' la via scopribile, Alt+click la via
veloce per chi sta controllando molte proprieta' di fila.

## Re-pull del bundle: non eseguito

Richiesto, non possibile da qui, e va detto perche' cambia cosa e' stato usato come riferimento.
`Instance Node Proposal.dc.html` sul disco e' fermo alla versione delle 16:54: la didascalia del `5c`
non menziona l'icona e `bi-sliders` non compare nel file. Il canvas non e' raggiungibile —
`Artifact action:list` con `scope: all` non lo elenca (ne' fra i propri ne' fra i condivisi), e
`DesignSync` risponde che serve `/design-login`, che e' un gesto dell'utente.

L'implementazione segue quindi la specifica nel messaggio, che e' completa: geometria, colore,
transizione e i tre vincoli. **Il file di design e il codice restano fuori sincrono** finche' qualcuno
non fa il pull: chi leggesse il `5c` sul disco non troverebbe l'icona documentata.

## Due scostamenti dalla lettera, imposti dal DOM

1. `.mm-object__row` non esiste — label e valore sono figli diretti di una griglia a due colonne.
   Hover di riga ottenuto con due selettori su fratelli adiacenti, senza toccare il DOM.
2. Slot riservato con `padding-right: 18px` fisso sulla cella, prima delle due opzioni offerte.

Entrambi motivati nel commento accanto al codice e in
`docs/sessioni/sessione_2026-08-28_row_view_library.md`.

## Esito

Due file di codice (`ObjectNode.tsx`, `instanceNode.scss`). Gate: typecheck 33 = baseline, 1717 test
passati, build exit 0, regole verificate sul bundle compilato. Smoke visivo non eseguito: quattro
punti aggiunti alla checklist di Alfonso.
