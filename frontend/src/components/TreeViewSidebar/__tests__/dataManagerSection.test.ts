/**
 * dataManagerSection — la sezione «Data Manager» dell'albero (R-DMV-5), asserita sul
 * SORGENTE, sul modello dei `instanceManager10*`.
 *
 * Sorgente e non comportamento, e per la stessa ragione misurata che quei file
 * dichiarano: `TreeViewContent.tsx` importa il barrel di `editor-v2/`, che arriva a
 * monaco, che dereferenzia `window` all'import — il file muore prima del primo `it`,
 * e `vitest.config.ts` dichiara `environment: 'node'`. Cio' che si prova qui e' cio'
 * che il sorgente AFFERMA. Il comportamento e' misurato dalla sonda
 * `docs/discovery/harness/probe_2026-09-04_rdmv_sliceE_sidebar.mts`, che gira sul
 * prodotto vero: le due misure sono complementari, non alternative.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e una
 * lettura che non e' avvenuta danno lo stesso silenzio. Il file e' letto INTERO —
 * `readFileSync` senza offset — perche' un conteggio su una finestra e' un conteggio
 * su quella finestra e non sul soggetto (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TSX = readFileSync(
    resolve(__dirname, '../TreeViewContent.tsx'),
    'utf8',
);
const SCSS = readFileSync(
    resolve(__dirname, '../tree-view-sidebar.scss'),
    'utf8',
);

describe('R-DMV-5 — la sezione esiste, ed e\' una sezione a se\'', () => {
    it('positivo di controllo: il file e\' stato letto per intero e porta le sezioni note', () => {
        expect(TSX.length).toBeGreaterThan(50_000);
        expect(TSX).toContain("VIEWPOINTS: '__section:viewpoints'");
        expect(TSX).toContain("DOCUMENTATION: '__section:documentation'");
    });

    it('la chiave di sezione c\'e\', ed e\' registrata fra quelle statiche', () => {
        expect(TSX).toContain("DATA_MANAGER: '__section:dataManager'");
        // STATIC_SECTION_KEYS governa la pulizia degli orfani in `expandedTreeNodes`:
        // una chiave non registrata li' verrebbe potata al primo giro e la sezione si
        // richiuderebbe da sola a ogni ricarica.
        const staticBlock = TSX.slice(
            TSX.indexOf('const STATIC_SECTION_KEYS'),
            TSX.indexOf(']);', TSX.indexOf('const STATIC_SECTION_KEYS')),
        );
        expect(staticBlock).toContain('SECTION_KEYS.DATA_MANAGER');
    });

    it('la sezione si rende SEMPRE, non solo quando ci sono classi personalizzate (Q4)', () => {
        expect(TSX).toContain('sectionKey={SECTION_KEYS.DATA_MANAGER}');
        expect(TSX).toContain('label="Data Manager"');
        // Lo stato vuoto e' il ramo `else` del ternario sul conteggio: se la sezione
        // fosse condizionata sulla presenza di classi, questo ramo non esisterebbe.
        expect(TSX).toContain('dataManager.classes.length === 0 ? (');
        expect(TSX).toContain('<DataManagerEmptyState depth={2}');
    });

    it('lo stato vuoto e\' quello ratificato, alla lettera', () => {
        expect(TSX).toContain('All classes use the type-derived defaults');
    });
});

describe('R-DMV-5 — il singleton esce dalle tre liste dei viewpoint', () => {
    it('positivo di controllo: il partizionamento in syntax / validation / other c\'e\' ancora', () => {
        expect(TSX).toContain("if (vp.vpType === 'syntax') syntax.push(vp);");
        expect(TSX).toContain("else if (vp.vpType === 'validation') validation.push(vp);");
        expect(TSX).toContain('else other.push(vp);');
    });

    it('il `continue` sul singleton precede i tre rami: esce da TUTTI, non solo da `other`', () => {
        const memoStart = TSX.indexOf('const { syntaxVps, validationVps, otherVps, viewpointCount }');
        expect(memoStart).toBeGreaterThan(-1);
        const memoEnd = TSX.indexOf('}, [displayViewpoints]);', memoStart);
        expect(memoEnd).toBeGreaterThan(memoStart);
        const memo = TSX.slice(memoStart, memoEnd);
        const guard = memo.indexOf('if (isDataManagerViewpointId(vp.id)) continue;');
        const firstBranch = memo.indexOf("if (vp.vpType === 'syntax')");
        expect(guard).toBeGreaterThan(-1);
        expect(firstBranch).toBeGreaterThan(-1);
        expect(guard).toBeLessThan(firstBranch);
    });

    it('il contatore di «Viewpoints» conta le tre liste, non la lista non filtrata', () => {
        // `displayViewpoints.length` includerebbe il singleton e la sezione direbbe
        // «2» mostrando una riga sola.
        expect(TSX).toContain('viewpointCount: syntax.length + validation.length + other.length');
        expect(TSX).toContain('counter={viewpointCount}');
        expect(TSX).not.toContain('counter={displayViewpoints.length}');
    });
});

describe('R-DMV-5 / Q6 — la voce seleziona il singleton, o il suo stub', () => {
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
        expect(TSX).toContain('onLabelClick={() => { selectDataManager(); onSelect?.(); }}');
        expect(TSX).toContain('onClick={() => { selectDataManager(); onSelect?.(); }}');
    });
});

describe('R-DMV-5 — che cosa e\' elencato sotto una classe', () => {
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

describe('R-DMV-5 — lo stile della sezione', () => {
    it('positivo di controllo: il foglio e\' stato letto e porta le regole note dell\'albero', () => {
        expect(SCSS.length).toBeGreaterThan(20_000);
        expect(SCSS).toContain('.tree-empty-doc');
    });

    it('lo stato vuoto ha una regola PROPRIA, non un riuso di quella della documentazione', () => {
        expect(SCSS).toContain('.tree-empty-dmv');
        // `.tree-empty-doc` e' `space-between` perche' porta anche il bottone Generate:
        // riusarla qui lascerebbe la frase spinta a sinistra e un vuoto a destra.
        expect(SCSS).toContain('.tree-section__label--clickable');
    });

    it('il tema scuro copre l\'etichetta nuova insieme a quelle che le stanno accanto', () => {
        expect(SCSS).toContain('.tree-empty-dmv-label');
    });
});
