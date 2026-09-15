# PROMPT — DS3: quinto eyebrow `&__draft-label` a 0.04em (micro, PARALLELO)

Divergenza dichiarata dal referto 10i (`discovery_2026-09-01_10i_uppercase_columns.md` §divergenze): `&__draft-label` è un eyebrow a `letter-spacing: 0.04em` mentre la banda del DS è `0.08em` letterale (R-RAIL-10, eccezione nominata). 10i l'ha fissata con un test perché non venisse «riscoperta»; questa slice la chiude.

## Cosa fare

- Porta `&__draft-label` alle stesse quattro dichiarazioni eyebrow di 10i (11px/600/uppercase/`0.08em`, colore muted). Se una delle quattro c'è già, il diff è solo il delta — dichiara il before nel referto.
- Aggiorna il test di 10i che fissa lo 0.04em: da «fissa la divergenza» a «afferma la convergenza». Non cancellarlo.
- Sonda visiva before/after sul badge draft (serve un draft sporco: apri una form e modifica un campo senza salvare — se il flusso draft non è raggiungibile a runtime, dichiara come hai reso lo stato).

## Fuori scope

Ogni altro eyebrow (i 13 punti a 0.08em sono già conformi), l'inventare un token `--tracking-eyebrow` (già escluso in 10i), la tabella e l'empty state (10j in chiusura).

## Coordinamento

Parallelo alla chiusura 10j: il tuo perimetro è il foglio della form (`irFormStyle` o dove `&__draft-label` vive — verificalo con grep, non assumerlo) + il test 10i. NON toccare `InstanceManagerTab.tsx` né il foglio della tabella. Pathspec, entry di log in commit separato.
