# Memo di ratifica: le skin della form del Data Manager (serie R-SKIN)

**Data**: 2026-09-04 23:02
**Chat**: sessione Cowork del 4 settembre, dopo la chiusura della Fase 2 R-DMV (`317ec973b`).
**Serie**: R-SKIN. Non supera nulla; si affianca al tema di layout (FL2, `jjform/themes.ts`).

## 1. Il fabbisogno

Alfonso (4 set 2026): «vorrei diverse skin, dei preset, niente di customizzabile». Le skin riguardano
l'ASPETTO della form del Data Manager (superfici, bordi, contrasto), non il layout, che resta al tema
a tre campi (labelPlacement, density, sectionStyle) ratificato il 31-08 con registro chiuso.

## 2. La decisione

Una skin è un preset chiuso che rimappa una manciata di token già usati da `irFormStyle.scss`
(`--color-form-surface`, `--color-form-border`, `--color-form-muted`, `--color-bg-tertiary` dei
campi, `--radius-sm`; il censimento esatto è compito della discovery). Asse ORTOGONALE al tema di
layout: `Compact` + `Paper` è una combinazione legittima. Nessuna proprietà CSS nuova, nessun
colore scelto dall'utente, nessun slider: un registro chiuso di nomi, come per il tema.

Forma, a specchio del tema: registro `jjform/skins.ts` con zero import; nome persistito come stringa
su un campo opzionale del singleton Data Manager Viewpoint (`formSkin?`), additivo, senza migrazione;
`data-skin` sulla radice `.ir-form` accanto ai tre `data-*` del tema; rimappature dei token in
`styles/tokens/` per light E dark (regola 28: mai variabili CSS nei componenti); select nel pannello
del singleton sotto Form theme. Default `Slate` = l'aspetto di oggi: nessun progetto cambia.

Catalogo, quattro e non più: `Slate` (l'attuale, superfici fredde e bordi slate), `Paper` (superficie
calda avorio, bordi sottili e morbidi), `Ink` (alto contrasto, bordi netti e scuri, testo pieno),
`Mist` (quasi senza bordi, campi distinti dal solo tono della superficie). Ogni preset è completo in
light e dark.

Le skin per view di `irTypes.ts` (`FormTheme = 'plain' | 'card' | 'compact' | 'inspector'`) NON
entrano in conflitto: nonostante il nome sono rimappate su preset di LAYOUT (`LEGACY_SKIN_PRESET`,
`formAutoLayout.ts:258`), sono literal persistiti e definitivi (R-B9) e non si toccano.

## 3. Domande per la discovery

Quali token la form usa davvero, e quanti li condividono i widget (`ReferencePicker`,
`ChipInputWidget`, `TextWidget`) e il drawer del manager; se `--color-form-*` sono definiti in
entrambi i file colori; se la rimappatura per `[data-skin]` può stare in `tokens/` senza toccare
`irFormStyle.scss`; dove il pannello legge/scrive `formTheme` per aggiungere `formSkin` accanto;
se il tema del canvas scuro (`_colors-dark.scss`) impone vincoli ai quattro preset.
