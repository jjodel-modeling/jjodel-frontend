# Verbale: voce 5, verifica visiva unica e chiusura della coda arco A

**Data**: 2026-08-06
**Esito**: **GO. La coda arco A è chiusa.**
**Ramo**: `alfonso-frontend-jjtl`; HEAD alla verifica `363f8166d`, chiusura con `5fcef39ef` (entry di log); **push `383170dc0..5fcef39ef`, 15 commit, il primo dal 3 agosto**.
**Attori**: verifica a video di Alfonso (GO complessivo senza rossi; il protocollo prevede dettaglio solo sui rossi, quindi il GO secco è conforme; la entry di log lo registra come dichiarazione di Alfonso, non come osservazione della sessione git, che a video non ha accesso). Preflight, commit di sblocco e chiusura git: Claude Code. Verbale e consolidamento del KB: chat di progetto.

## Preflight (P-1..P-5)

Tutto verde, con un prerequisito mancante davvero: il regen di `AGENTS.md`, committato `363f8166d` prima di proseguire (diff reale di 2 righe: il rinvio a `docs/decisions.md` appeso alla regola 16 dalla voce 3, mai recepito dal generato). P-2 pulito salvo `CLAUDE-BAK-NOT-TO-USE.md` untracked; P-3 verde (`.gitignore:61` = `/CLAUDE.md`, file annidato tracciato e non ignorato); P-4 R-H in coda alla sezione Arco A di `decisions.md`; P-5 `check:docs` 2/2 PASS coi 4 warning noti del resolver.

**Fatto che pesa**: è la seconda volta in tre giorni che `AGENTS.md` resta indietro. La prima (nota 3 della voce 2) è durata dal 2 al 5 agosto e comprendeva una regola NON-NEGOTIABLE. Due occorrenze indipendenti della stessa classe: RC-7 non è più un'ipotesi di igiene, è una lacuna misurata. Il pezzo forte della sua slice: un check che rigenera `AGENTS.md` in temp e confronta col committato.

## Blocchi a video

Diciassette prove: blocco A (barra, 12 punti) e blocco B (capi C-1..C-4 più B-5, 5 punti, alla loro prima verifica visiva). **GO complessivo, nessun rosso segnalato.** Con questo si saldano le tre smoke sospese: `fd92b3d1c` ed `e15eb5081` (rinviate all'hard stop unico) e i cinque punti dei capi del 2026-08-05.

## Rettifiche al protocollo, registrate

1. **URL della verifica: http://localhost:3000/** (vite.config fissa `port: 3000`; su 3001 nulla in ascolto). Istruzioni di progetto ancora da aggiornare.
2. P-3 diceva "156 righe tracciate": sono **29**. Delle 156 dello sfoltimento originario solo 14 avevano destinazione reale; le 142 restanti sono ricostruite nel root e la loro cancellazione resta rinviata a decisione esplicita (nota 2 di `f15a22bd2`).

## Coda arco A, chiusa

| Voce | Commit |
|---|---|
| 1, capi: modulo puro più messaggistica C-1..C-4, B-5 | `59dfb096d`, `d8159c2f0` |
| 2, trappola `.gitignore` | `f15a22bd2` |
| 3, `docs/decisions.md` | `061be4b5c` |
| 4, barra a cinque tab più ricollocazione R-H | `fd92b3d1c`, `e15eb5081` |
| 5, regen, verifica, chiusura | `363f8166d`, `5fcef39ef` |
| E-route, per deroga d'ordine | `423f19f01` |

Più `648de9a72`, il micro-commit della normalizzazione del log, atterrato da solo fra `fd92b3d1c` ed `e15eb5081`.

I falsi positivi del protocollo restano tali e non contano come regressioni: lingua mista (pass R-4), Viewpoint e Parent view identici (doppio writer di `father`, registrato in R-H), `"routing": ""` col placeholder "Select...", intro ripetuta sui tab, Structure quasi vuoto sulla natura reference (esito Q2), Text magro (E-lab congelata).

## Coda nuova, ratificata da Alfonso (2026-08-06)

1. **RC-7, igiene dei gate** (prima voce, già decisa alla chiusura precedente): pezzo forte il gate "generato allineato al sorgente" (regen di `AGENTS.md` in temp più confronto), che chiude una classe e non un'istanza; dentro anche il bug del resolver di `check:docs` e la descrizione incompleta della baseline tsc.
2. **Micro-slice 3.6, finestra Style**: l'unico rischio di correttezza vivo (un progetto a `cssIsGlobal = true` ridipinge i nodi IR e non esiste più una superficie da cui accorgersene).
3. **Micro-slice `routing:""`**: drop della chiave su `''` più placeholder "Manhattan (default)".
4. **Slice di design del `father`**: la più grossa; decisione di design in chat prima del codice; sblocca la breadcrumb.
5. **Grappolo igiene**: InfoTooltip ×3, stringa B-5 ×3, test duplicato; naturale nell'unificazione dei tre pannelli, se e quando arriva.
6. **Pass di lingua R-4**, per ultima e di proposito: è una passata su tutta la superficie, farla prima che i pannelli si stabilizzino significherebbe farla due volte.

Annotazioni a verbale: **1.6** (rimozione dei tab morti) resta parcheggiata; con la 3.6 fatta, la sua precondizione R-2 sarà soddisfatta quando la si vorrà riaprire. La decisione sulle **142 righe** di `CLAUDE.md` root resta sospesa e non blocca nulla. **Rider ratificato, in esecuzione subito**: micro-commit docs su `docs/viewpoint-codebase-map.md` §3 (fermo al 2026-03-28: descrive i sei sub-tab legacy, oggi esatti solo per le view classic), aggiornato con la barra a cinque per le view IR.

## Residui a valle della chiusura

`CLAUDE-BAK-NOT-TO-USE.md` untracked: eliminazione a mano di Alfonso, ora possibile (coda chiusa). Istruzioni di progetto: aggiornare l'URL di verifica a 3000. Il prossimo fronte apre dalla coda nuova, voce 1 (RC-7).
