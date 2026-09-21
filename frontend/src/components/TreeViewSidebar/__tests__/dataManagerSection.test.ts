/**
 * L'albero del megamodello: il concern «Data Manager» (R-DMV-5) e i tre concern sotto
 * `VIEWPOINTS` (R-VAL-19, emendata da R-VAL-19-bis).
 *
 * DUE REGISTRI, E LA DIFFERENZA CONTA.
 *
 * 1. `concernCounts.ts` si **esegue**. E' un modulo puro senza import, nato in questo giro
 *    proprio perche' la formula dei conteggi potesse essere chiamata invece che letta: la
 *    versione precedente di questo file asseriva
 *    `toContain('viewpointCount: syntax.length + validation.length + other.length')`, cioe'
 *    verificava che una stringa fosse scritta da qualche parte. Un refuso dentro quella
 *    somma sarebbe passato verde. P11 chiama questa cosa «un verde indistinguibile dal
 *    rosso che avrebbe dovuto esserci», ed e' il motivo per cui i blocchi qui sotto
 *    chiamano le funzioni.
 *
 * 2. Il resto resta asserito sul SORGENTE, per la ragione misurata che i file
 *    `instanceManager10*` dichiarano: `TreeViewContent.tsx` importa il barrel di
 *    `editor-v2/`, che arriva a monaco, che dereferenzia `window` all'import — il file
 *    muore prima del primo `it`, e `vitest.config.ts` dichiara `environment: 'node'`. Cio'
 *    che si prova li' e' cio' che il sorgente AFFERMA.
 *
 * LA STRUTTURA RESA NON E' PIU' QUI. Profondita' effettiva delle righe, presenza dei tre
 * concern a zero e sopravvivenza del click dopo lo spostamento si misurano sul prodotto
 * vero, dove un rientro sbagliato si vede: `probe_2026-09-09_albero_tre_concern.mts`. Le
 * asserzioni `depth={2}` che stavano qui misuravano una costante scritta a mano, non la
 * riga che ne esce.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e una lettura
 * che non e' avvenuta danno lo stesso silenzio. Il file e' letto INTERO — `readFileSync`
 * senza offset — perche' un conteggio su una finestra e' un conteggio su quella finestra e
 * non sul soggetto (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    concernCounts,
    partitionByConcern,
    type ConcernViewpoint,
} from '../concernCounts';

const TSX = readFileSync(
    resolve(__dirname, '../TreeViewContent.tsx'),
    'utf8',
);
const SCSS = readFileSync(
    resolve(__dirname, '../tree-view-sidebar.scss'),
    'utf8',
);

const DMV_ID = 'Pointer_ViewPointDataManager';
const vp = (id: string, vpType: string): ConcernViewpoint => ({ id, vpType });

describe('R-VAL-19 — lo smistamento nei tre concern, eseguito', () => {
    it('controllo positivo: la funzione gira e smista davvero', () => {
        const b = partitionByConcern(
            [vp('a', 'syntax'), vp('b', 'validation'), vp('c', 'decoration')],
            () => false,
        );
        expect(b.syntax.map(v => v.id)).toEqual(['a']);
        expect(b.validation.map(v => v.id)).toEqual(['b']);
        expect(b.other.map(v => v.id)).toEqual(['c']);
    });

    it('il singleton del Data Manager esce da TUTTI e tre i secchi, non solo da `other`', () => {
        // Il rischio vero e' `other`, che e' un catch-all: se l'esclusione seguisse lo
        // smistamento invece di precederlo, il singleton comparirebbe come viewpoint
        // sciolto sotto «Viewpoints» — esattamente cio' che R-DMV-5 ha tolto, e che
        // R-VAL-19 renderebbe un doppione dentro lo stesso ramo.
        const b = partitionByConcern(
            [vp(DMV_ID, 'dataManager'), vp('a', 'syntax')],
            id => id === DMV_ID,
        );
        expect(b.other).toEqual([]);
        expect(b.syntax.map(v => v.id)).toEqual(['a']);
        expect(b.validation).toEqual([]);
    });

    it('un tipo sconosciuto finisce in `other`, non sparisce', () => {
        const b = partitionByConcern([vp('x', 'qualcosa-di-nuovo')], () => false);
        expect(b.other.map(v => v.id)).toEqual(['x']);
    });
});

describe('R-VAL-19-bis (b) — ogni riga conta VIEWPOINT, e il totale li somma', () => {
    it('controllo positivo: la funzione gira e i quattro numeri escono', () => {
        const c = concernCounts({
            syntaxViewpoints: 2, validationViews: 1, otherViewpoints: 3,
            validationViewpoints: 1, dataManagerViewpoints: 1,
        });
        expect(c).toEqual({ syntax: 2, dataManager: 1, validation: 2, total: 8 });
    });

    it('il concern VALIDATION somma le due specie: `isValidation` e `DValidationViewpoint`', () => {
        expect(concernCounts({
            syntaxViewpoints: 0, validationViews: 2, otherViewpoints: 0,
            validationViewpoints: 3, dataManagerViewpoints: 0,
        }).validation).toBe(5);
    });

    it('il totale comprende i viewpoint sciolti, che non stanno in nessun concern', () => {
        // Se `other` uscisse dalla somma, l'intestazione direbbe un numero piu' piccolo
        // del numero di righe che il ramo mostra.
        const c = concernCounts({
            syntaxViewpoints: 0, validationViews: 0, otherViewpoints: 4,
            validationViewpoints: 0, dataManagerViewpoints: 0,
        });
        expect(c.total).toBe(4);
        expect(c.syntax + c.dataManager + c.validation).toBe(0);
    });

    it('il Data Manager pesa 1, non il numero delle sue classi personalizzate', () => {
        // La differenza che R-VAL-19-bis (b) sana: prima quella riga contava classi.
        // `concernCounts` non ha nemmeno un modo di ricevere quel numero, ed e' voluto.
        expect(concernCounts({
            syntaxViewpoints: 0, validationViews: 0, otherViewpoints: 0,
            validationViewpoints: 0, dataManagerViewpoints: 1,
        })).toEqual({ syntax: 0, dataManager: 1, validation: 0, total: 1 });
    });

    it('tutto a zero da\' zero: i concern si vedono lo stesso, ma non inventano numeri', () => {
        expect(concernCounts({
            syntaxViewpoints: 0, validationViews: 0, otherViewpoints: 0,
            validationViewpoints: 0, dataManagerViewpoints: 0,
        })).toEqual({ syntax: 0, dataManager: 0, validation: 0, total: 0 });
    });
});

describe('R-DMV-5 / R-VAL-19 — le chiavi di sezione e la pulizia degli orfani', () => {
    it('positivo di controllo: il file e\' stato letto per intero e porta le sezioni note', () => {
        expect(TSX.length).toBeGreaterThan(50_000);
        expect(TSX).toContain("VIEWPOINTS: '__section:viewpoints'");
        expect(TSX).toContain("DOCUMENTATION: '__section:documentation'");
    });

    it('la chiave del Data Manager e\' RIMASTA quella, benche\' la sezione abbia cambiato posto', () => {
        // R-VAL-19 sposta il ramo, non la sua identita': la chiave e' cio' che ogni
        // progetto salvato porta in `expandedTreeNodes`, e cambiarla riaprirebbe in
        // silenzio una sezione che l'utente aveva chiuso.
        expect(TSX).toContain("DATA_MANAGER: '__section:dataManager'");
    });

    it('le chiavi dei tre concern sono registrate fra quelle statiche', () => {
        // STATIC_SECTION_KEYS governa la pulizia degli orfani in `expandedTreeNodes`:
        // una chiave non registrata li' verrebbe potata al primo giro e la sezione si
        // richiuderebbe da sola a ogni ricarica.
        const staticBlock = TSX.slice(
            TSX.indexOf('const STATIC_SECTION_KEYS'),
            TSX.indexOf(']);', TSX.indexOf('const STATIC_SECTION_KEYS')),
        );
        expect(staticBlock).toContain('SECTION_KEYS.VIEWPOINTS_SYNTAX');
        expect(staticBlock).toContain('SECTION_KEYS.DATA_MANAGER');
        expect(staticBlock).toContain('SECTION_KEYS.VIEWPOINTS_VALIDATION');
    });

    it('gli id dei viewpoint di validazione entrano fra quelli vivi della pulizia', () => {
        // Stessa trappola, dall'altro capo: un `DValidationViewpoint` collassato scrive
        // `!<id>`, e senza questo giro l'effetto lo toglierebbe subito come orfano.
        expect(TSX).toContain('for (const vvp of validationViewpoints) validIds.add(vvp.id);');
    });
});

describe('R-VAL-19 — i tre concern si vedono anche a zero', () => {
    it('positivo di controllo: la guardia unificata c\'e\' per tutti e tre', () => {
        expect(TSX).toContain('const showSyntaxConcern = !searchActive || syntaxVps.length > 0;');
        expect(TSX).toContain('const showDataManagerConcern = !searchActive || false;');
        expect(TSX).toContain('const showValidationConcern = !searchActive || validationVps.length > 0;');
    });

    it('nessuno dei tre e\' piu\' condizionato alla presenza di contenuto', () => {
        // La forma vecchia, che li faceva sparire a zero. Se tornasse, il concern
        // smetterebbe di insegnare che la funzione esiste — il problema che la
        // decisione risolve.
        expect(TSX).not.toContain('{syntaxVps.length > 0 && (');
        expect(TSX).not.toContain('{validationVps.length > 0 && (');
    });

    it('le tre righe di stato dicono cosa ci andrebbe, alla lettera', () => {
        expect(TSX).toContain('All classes use the type-derived defaults');
        expect(TSX).toContain('No concrete syntax — models render in abstract syntax');
        expect(TSX).toContain('No validation viewpoint — no user-defined rules to check');
    });
});

describe('R-VAL-19 — la voce del Data Manager seleziona il singleton, o il suo stub', () => {
    it('positivo di controllo: il resto dell\'albero seleziona con la stessa scrittura', () => {
        // `_lastSelected` e' il canale unico della selezione nel rail: se questa stringa
        // sparisse, l'asserzione sotto non direbbe piu' niente sul meccanismo.
        expect(TSX).toContain("SetRootFieldAction.new('_lastSelected' as any");
    });

    it('scrive il pointer FISSO, esista o no l\'oggetto: e\' quello che rende lo stub raggiungibile', () => {
        const fnStart = TSX.indexOf('function selectDataManager()');
        expect(fnStart).toBeGreaterThan(-1);
        const fn = TSX.slice(fnStart, TSX.indexOf('\n}', fnStart));
        expect(fn).toContain('view: DATA_MANAGER_VIEWPOINT_ID');
        // R-DMV-6: cliccare non materializza. Se questa funzione creasse il viewpoint,
        // ogni progetto che ha mai aperto l'albero se lo porterebbe dietro.
        expect(fn).not.toContain('ensureDataManagerViewpoint');
        expect(fn).not.toContain('newVP');
    });

    it('l\'etichetta della sezione e\' un bersaglio di click, e lo stato vuoto pure', () => {
        // Lo spostamento di un livello non deve portarseli via: sono scritture che non
        // leggono la posizione nell'albero, e devono restare tali.
        expect(TSX).toContain('onLabelClick={() => { selectDataManager(); onSelect?.(); }}');
        expect(TSX).toContain('onClick={() => { selectDataManager(); onSelect?.(); }}');
    });
});

describe('R-VAL-19 — le regole sotto VALIDATION', () => {
    it('positivo di controllo: il costruttore dei dati c\'e\' e legge il tipo giusto', () => {
        expect(TSX).toContain('function buildValidationViewpointsData(state: DState): TreeValidationViewpointData[]');
        expect(TSX).toContain("vp.className !== 'DValidationViewpoint'");
        expect(TSX).toContain("r.className !== 'DValidationRule'");
    });

    it('scandisce per className invece di leggere il puntatore fisso dello scheletro', () => {
        // R-VAL-2 vuole i viewpoint di validazione multipli, e `validationTypes.ts` dice
        // che quella costante va tolta di mezzo, non aggirata. Un indice che leggesse il
        // puntatore ne mostrerebbe uno solo per sempre.
        //
        // L'asserzione e' sul CORPO della funzione e non sul file: la costante e' nominata
        // nel commento che spiega perche' non si usa, e un `not.toContain` sull'intero
        // sorgente arrossirebbe su quella spiegazione. Misurato in questo giro.
        const fnStart = TSX.indexOf('function buildValidationViewpointsData');
        expect(fnStart).toBeGreaterThan(-1);
        const body = TSX.slice(TSX.indexOf('{', fnStart), TSX.indexOf('\nfunction mapDispatchToProps', fnStart));
        expect(body).toContain("vp.className !== 'DValidationViewpoint'");
        expect(body).not.toContain('VALIDATION_VIEWPOINT_ID');
    });

    it('l\'albero nomina e naviga: la regola apre l\'ambiente, non lo modifica', () => {
        const fnStart = TSX.indexOf('const ValidationRuleRow');
        expect(fnStart).toBeGreaterThan(-1);
        const fn = TSX.slice(fnStart, TSX.indexOf('const ValidationViewpointNode', fnStart));
        expect(fn).toContain('JjodelEvents.VALIDATION_RULES_OPEN');
        // Nessun authoring nell'albero (R-VAL-19): ne' la spunta Active della regola,
        // ne' un rename in riga.
        expect(fn).not.toContain('updateValidationRule');
        expect(fn).not.toContain('type="checkbox"');
        expect(fn).not.toContain('rename');
    });

    it('la classe di contesto viaggia nella colonna dove per le view compare «Vertex»', () => {
        const fnStart = TSX.indexOf('const ValidationRuleRow');
        const fn = TSX.slice(fnStart, TSX.indexOf('const ValidationViewpointNode', fnStart));
        expect(fn).toContain('tree-feature__type');
        expect(fn).toContain('{rule.contextName}');
    });
});

describe('R-DMV-5 — che cosa e\' elencato sotto una classe del Data Manager', () => {
    it('positivo di controllo: il costruttore dei dati c\'e\' e legge le view del singleton', () => {
        expect(TSX).toContain('function buildDataManagerData(state: DState): TreeDataManagerData');
        expect(TSX).toContain("d.viewpoint !== DATA_MANAGER_VIEWPOINT_ID) continue;");
    });

    it('la regola di ammissibilita\' e\' quella del lettore: view di nodo, senza predicato', () => {
        const fnStart = TSX.indexOf('function buildDataManagerData');
        const fn = TSX.slice(fnStart, TSX.indexOf('\n}', TSX.indexOf('return {', fnStart)));
        expect(fn).toContain("if (ir.kind !== 'vertex' && ir.kind !== 'graphVertex') continue;");
        expect(fn).toContain('if (ir.predicate !== undefined) continue;');
    });

    it('le feature toccate vengono da tutte le chiavi per-feature, e «columns» dalla `table`', () => {
        const fnStart = TSX.indexOf('function buildDataManagerData');
        const fn = TSX.slice(fnStart, TSX.indexOf('\n}', TSX.indexOf('return {', fnStart)));
        expect(fn).toContain('form?.widgets');
        expect(fn).toContain('form?.features');
        expect(fn).toContain('form?.labels');
        expect(fn).toContain('form?.hidden');
        expect(fn).toContain('ir.table?.columns');
        // `widgetLabel` e non una seconda tabella di etichette: il vocabolario dei widget
        // ha gia' un solo posto (`FormAuthoringBody.WIDGET_LABEL`).
        expect(fn).toContain('widgetLabel(kind as WidgetKind)');
    });

    it('una classe la cui view non dice NIENTE non e\' elencata (R-DMV-5, la potatura visibile)', () => {
        const fnStart = TSX.indexOf('function buildDataManagerData');
        const fn = TSX.slice(fnStart, TSX.indexOf('\n}', TSX.indexOf('return {', fnStart)));
        expect(fn).toContain('if (byFeature.size === 0 && !columns) continue;');
    });
});

describe('R-DMV-5 / R-VAL-19 — lo stile delle righe di stato', () => {
    it('positivo di controllo: il foglio e\' stato letto e porta le regole note dell\'albero', () => {
        expect(SCSS.length).toBeGreaterThan(20_000);
        expect(SCSS).toContain('.tree-empty-doc');
    });

    it('lo stato vuoto del Data Manager ha una regola PROPRIA, non un riuso di quella della documentazione', () => {
        expect(SCSS).toContain('.tree-empty-dmv');
        // `.tree-empty-doc` e' `space-between` perche' porta anche il bottone Generate:
        // riusarla qui lascerebbe la frase spinta a sinistra e un vuoto a destra.
        expect(SCSS).toContain('.tree-section__label--clickable');
    });

    it('la riga dei concern vuoti e\' un blocco a se\', e NON e\' cliccabile', () => {
        const start = SCSS.indexOf('.tree-empty-concern {');
        expect(start).toBeGreaterThan(-1);
        const block = SCSS.slice(start, SCSS.indexOf('\n}', SCSS.indexOf('&-label', start)));
        // Il Data Manager e' cliccabile perche' dietro ha lo stub del singleton; un
        // concern vuoto non ha niente da selezionare e non deve fingere di averlo.
        expect(block).not.toContain('cursor: pointer');
        expect(block).not.toContain(':hover');
    });

    it('il tema scuro copre tutte e tre le etichette, non due su tre', () => {
        expect(SCSS).toContain('.tree-empty-dmv-label');
        expect(SCSS).toContain('.tree-empty-concern-label');
    });
});
