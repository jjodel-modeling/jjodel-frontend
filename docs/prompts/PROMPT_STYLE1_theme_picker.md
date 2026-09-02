# PROMPT — STYLE1: selettore tema form nel tab Style + formSpec di verifica (PARALLELO)

Chiude il debito di verifica dichiarato a FL4: i 4 preset (Comfortable, Compact, Sectioned, Dense) rendono end-to-end ma nessuna verifica VISIVA dei quattro è mai stata fatta, perché manca una via UI per cambiare tema. FL2 lo prevedeva: «UI di scelta tema — può essere un select nel tab Style già esistente».

## Cosa fare

- Nel tab Style, un select «Form theme» con i 4 preset di `themes.ts`. Scrive dove FL2 ha stabilito che il tema risolve (cascata metamodel → viewpoint, punto unico in `formAutoLayout.ts`) — NON un canale nuovo: prima trova il read path di FL2 e scrivi sulla stessa sorgente che quel path legge. Se FL2 non ha lasciato una write surface, fermati e riporta (diventa decisione di design, non improvvisarla).
- Default assente = comportamento di oggi (assert di non-regressione: senza scelta, il resolved theme è identico al before).
- Verifica visiva: sonda che applica i 4 preset in sequenza su una form reale e cattura 4 screenshot nel referto — è il deliverable principale della slice, non un extra.

## Test attesi

- Select riflette il tema risolto corrente; scelta → il resolved theme cambia (assert sull'adapter, non sui pixel).
- Cascata rispettata: scelta a viewpoint vince su metamodel (se la write surface distingue i livelli; altrimenti dichiara il livello unico scelto).
- Nessuna scelta → identico al before.

## Fuori scope

Nuovi temi, modifiche a `layout.ts`/`themes.ts`/widget FL3, il manager (10j in chiusura), persistenza oltre quella che la cascata FL2 già usa.

## Coordinamento

Parallelo alla chiusura 10j e a ENG1: il tuo perimetro è il tab Style + l'eventuale punto di write della cascata. NON toccare `InstanceManagerTab.tsx`, `LModelElement.tsx`, il renderer IRForm. Lezione barrel FL1/FL2: se devi toccare `jjform/index.ts`, dichiaralo e committa per primo. Pathspec, entry di log in commit separato.
