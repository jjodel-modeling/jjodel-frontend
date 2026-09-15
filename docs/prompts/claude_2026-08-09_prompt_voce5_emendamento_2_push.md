# Emendamento 2 al prompt voce 5 InfoTooltip: push di chiusura

**Nome del documento prompt**: 2026-08-09 20:56
**Emenda**: prompt base "2026-08-09 15:59" ed emendamento 1 "2026-08-09 16:32", che restano validi integralmente. Questo emendamento sostituisce il solo vincolo **"niente push"** presente in entrambi.
**Tipo**: chore (push di chiusura della voce 5)
**Branch**: `alfonso-frontend-jjtl`
**Vincolo generale**: CLAUDE.md è la fonte di verità; se questo emendamento lo contraddice, segnalare il conflitto e fermarsi.

## Contesto

I due prompt della voce 5 chiudevano con "niente push" perché il push era da autorizzare a parte. Alfonso ha autorizzato il push a valle della sequenza completa (sessione Cowork del 2026-08-09 sera). Verifica fatta al momento della generazione di questo emendamento (20:56, `git ls-remote`): `origin/alfonso-frontend-jjtl` è a `e5d238cd9`, cioè l'HEAD del push di stanotte; nessun lavoro della voce 5 risulta già pushato da altri canali.

## Sequenza aggiornata (invariata nei passi, cambia solo la chiusura)

1. Commit 1 (prompt base: Fase 0 con report, poi estrazione identica) → hard stop → smoke di identità di Alfonso (4 hover) → **GO**.
2. Commit 2 (emendamento 1: Fase 0-bis, poi restyle più `title?`) → hard stop → smoke della grafica nuova → **GO**.
3. Solo dopo il secondo GO: **push** (questo emendamento). Gli hard stop restano vincolanti: niente push prima del GO sullo smoke del commit 2.

## COME (push)

1. **Pre-push**: `git log --oneline origin/alfonso-frontend-jjtl..HEAD`. Attesi **esattamente 2 commit**: `refactor(ui): extract shared InfoTooltip primitive from four duplicated copies` e `feat(ui): dark panel styling and optional title for InfoTooltip`. Se il numero o i messaggi differiscono (commit estranei, commit mancanti), **HARD STOP**: riportare in chat senza pushare.
2. `git push` semplice sul branch corrente (nessun force, nessun'altra ref, nessun tag).
3. Riportare in chat il range pushato (`vecchioHEAD..nuovoHEAD`) e l'esito.

## Casi che annullano questo emendamento

- Se un HARD STOP di Fase 0 o di Fase 0-bis scatta (md5 diverso, riferimenti esterni alle classi, clipping), la questione torna in chat e il push non si applica finché la sequenza non è completata con i due GO.
- Se Alfonso non dà il GO su uno dei due smoke, il push non si esegue.

## RIFERIMENTI

- Prompt base: "2026-08-09 15:59" (`claude/2026-08-09_prompt_voce5_infotooltip_ui.md`), ratifica D-5-1.
- Emendamento 1: "2026-08-09 16:32" (`claude/2026-08-09_prompt_voce5_infotooltip_emendamento_1_restyle.md`), ratifica D-5-2.
- Precedente di metodo per il pre-push: verifica del 2026-08-09 notte (`git log --oneline origin/alfonso-frontend-jjtl..HEAD` come fonte primaria, mai ricostruzione da chat).
