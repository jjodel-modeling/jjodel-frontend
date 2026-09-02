/**
 * UX1 — l'hint «Applies when this viewpoint is active.» sotto il select Form theme.
 *
 * Il punto aperto di STYLE2 (`docs/discovery/discovery_2026-09-01_style2_viewpoint_rung.md`
 * §8): il select scrive il viewpoint SELEZIONATO nell'albero, `IRForm` legge il rung dal
 * viewpoint ATTIVO (`state.viewpoint`, `IRForm.tsx:199`). Semantica corretta, ma se i due
 * divergono la scelta e' legittima e non si vede finche' quel viewpoint non viene attivato.
 *
 * Perche' questi test leggono il SORGENTE invece di montare il componente. Misurato:
 * `import * as mod from '../ViewpointProperties'` in questa suite muore in RACCOLTA con
 * `ReferenceError: window is not defined` a `monaco-editor/esm/vs/base/browser/window.js:14`
 * — la riga 3 del componente importa la barrel `joiner`, e la barrel arriva a monaco.
 * L'ambiente di vitest e' `node` (`vitest.config.ts`), e nessun test del repo importa un
 * `.tsx`. Il precedente e' `ir/__tests__/irFormLabelColumn.test.ts`, che asserisce sulla
 * grammatica del foglio per la stessa ragione.
 *
 * Quello che questi test NON possono dire, e che la sonda dice: che l'hint COMPAIA nel caso
 * divergente e SPARISCA in quello attivo, e che il select scriva in entrambi. Quello e'
 * `scripts/smoke/_tmp_ux1_verify.ts`, sull'app vera.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e una lettura
 * che non e' avvenuta danno lo stesso silenzio (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TSX_PATH = resolve(__dirname, '../ViewpointProperties.tsx');
const SCSS_PATH = resolve(__dirname, '../properties.scss');
const IRFORM_PATH = resolve(__dirname, '../../../../editor-v2/viewpoint/ir/IRForm.tsx');

const TSX = readFileSync(TSX_PATH, 'utf8');
const SCSS = readFileSync(SCSS_PATH, 'utf8');
const IRFORM = readFileSync(IRFORM_PATH, 'utf8');

/** Il sorgente senza commenti. La sorgente di «attivo» e la copy sono citate anche in
 *  prosa qui sopra e nel componente: una regex che le trovasse li' misurerebbe il
 *  commento invece del codice. */
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const CODE = strip(TSX);
const IRFORM_CODE = strip(IRFORM);
const RULES = strip(SCSS);

/** La copy, esattamente come il prompt la vuole: sentence case, un punto, niente enfasi. */
const HINT_COPY = 'Applies when this viewpoint is active.';

describe('i tre file si leggono, e cio\' che UX1 tocca esiste', () => {
    it('positivo di controllo: i sorgenti sono leggibili e non sono vuoti', () => {
        expect(TSX.length).toBeGreaterThan(1000);
        expect(SCSS.length).toBeGreaterThan(1000);
        expect(IRFORM.length).toBeGreaterThan(1000);
    });

    it('positivo di controllo: lo strip toglie i commenti e lascia il codice', () => {
        expect(TSX).toContain('slice UX1');           // la prosa c\'e\'
        expect(CODE).not.toContain('slice UX1');      // e lo strip l\'ha tolta
        expect(CODE).toContain('const ViewpointProperties');
        expect(RULES).toContain('.wp-field {');
    });

    it('positivo di controllo: il campo «Form theme» di STYLE2 e\' ancora li\'', () => {
        expect(CODE).toContain('>Form theme<');
        expect(CODE).toContain('className="wp-field__select"');
    });
});

describe('la sorgente di «attivo» e\' quella che IRForm legge, non una seconda', () => {
    it('positivo di controllo: IRForm legge il rung da `state.viewpoint`', () => {
        expect(IRFORM_CODE).toMatch(/useSelector\(\s*\(state: any\)\s*=>\s*\{[\s\S]*?state\?\.viewpoint/);
    });

    it('il pannello legge la STESSA radice `state.viewpoint`, via useSelector', () => {
        expect(CODE).toContain("import { useSelector } from 'react-redux';");
        expect(CODE).toMatch(/useSelector\(\(state: any\) => state\?\.viewpoint\)/);
    });

    it('e non deriva «attivo» da una seconda sorgente', () => {
        // Le tre che il pannello avrebbe potuto usare e che possono dissentire dalla form.
        expect(CODE).not.toContain('LProject.getProject');
        expect(CODE).not.toContain('viewpoints');
        expect(CODE).not.toContain('_lastSelected');
    });

    it('confronta la radice con l\'id del viewpoint del pannello, e un valore vuoto NON e\' un match', () => {
        expect(CODE).toMatch(/activeViewpointId === viewpoint\.id/);
        // `!!activeViewpointId &&`: senza, `state.viewpoint === ''` con un id vuoto
        // passerebbe per «attivo». La guardia e\' la meta\' portante.
        expect(CODE).toMatch(/!!activeViewpointId && activeViewpointId === viewpoint\.id/);
    });
});

describe('l\'hint: dove sta, cosa dice, e cosa NON fa', () => {
    it('e\' reso solo nel caso divergente — la negazione, non la condizione', () => {
        expect(CODE).toMatch(/\{!isActiveViewpoint && \(/);
        // Il segno opposto: nessun ramo che lo renda quando il viewpoint E\' attivo.
        expect(CODE).not.toMatch(/\{isActiveViewpoint && \([\s\S]{0,200}wp-field__hint/);
    });

    it('la copy e\' quella del prompt: sentence case, un punto, niente enfasi', () => {
        expect(CODE).toContain(`>${HINT_COPY}<`);
        expect(CODE).not.toContain('<strong>');
        expect(CODE).not.toContain('<em>');
        expect(CODE).not.toContain(HINT_COPY.toUpperCase());
    });

    it('sta DENTRO il campo del select, dopo il controllo e non prima', () => {
        const openTheme = CODE.indexOf('>Form theme<');
        const closeSelect = CODE.indexOf('</select>', openTheme);
        const hintAt = CODE.indexOf('wp-field__hint');
        expect(openTheme).toBeGreaterThan(-1);
        expect(closeSelect).toBeGreaterThan(openTheme);
        expect(hintAt).toBeGreaterThan(closeSelect);
        // e prima della chiusura del `.wp-field` che porta il select
        expect(CODE.indexOf('</div>', closeSelect)).toBeGreaterThan(hintAt);
    });

    it('e\' SOLO TESTO: nessun `disabled` nuovo, la scrittura resta legittima', () => {
        // L\'unico gate del select resta `readOnly`, quello committato da STYLE2.
        const selectBlock = CODE.slice(CODE.indexOf('className="wp-field__select"'),
                                       CODE.indexOf('</select>'));
        expect(selectBlock).toContain('disabled={readOnly}');
        expect(selectBlock).not.toContain('isActiveViewpoint');
        // e nessun ramo scavalca la scrittura quando il viewpoint non e\' attivo
        const handler = CODE.slice(CODE.indexOf('handleFormThemeChange = useCallback'),
                                   CODE.indexOf('}, [viewpoint, readOnly]);',
                                                CODE.indexOf('handleFormThemeChange = useCallback')));
        expect(handler).toContain('if (readOnly) return;');
        expect(handler).not.toContain('isActiveViewpoint');
        expect(handler).toContain('(viewpoint as any).formTheme =');
    });

    it('non attiva il viewpoint da sola: fuori scope, e non deve entrarci di straforo', () => {
        expect(CODE).not.toContain('activateViewpoint');
        expect(CODE).not.toContain('lastViewpoint');
    });
});

describe('la regola del foglio esiste, e non riscrive niente di committato', () => {
    it('positivo di controllo: il blocco `.wp-field` si legge intero', () => {
        expect(RULES).toContain('&__select {');
        expect(RULES).toContain('&__label {');
    });

    it('`&__hint` c\'e\', ed e\' un gradino sotto l\'etichetta e piu\' tenue', () => {
        const at = RULES.indexOf('&__hint {');
        expect(at).toBeGreaterThan(-1);
        const body = RULES.slice(at, RULES.indexOf('}', at));
        expect(body).toContain('font-size: 12px');   // l\'etichetta e\' 13px
        expect(body).toContain('color: #64748b');    // il grigio secondario gia\' nel foglio
        expect(body).toContain('margin: 6px 0 0');
    });

    it('sta dentro `.wp-field` e non a livello di foglio', () => {
        const field = RULES.indexOf('.wp-field {');
        const toggle = RULES.indexOf('.wp-toggle {');
        const hint = RULES.indexOf('&__hint {');
        expect(field).toBeGreaterThan(-1);
        expect(toggle).toBeGreaterThan(field);
        expect(hint).toBeGreaterThan(field);
        expect(hint).toBeLessThan(toggle);
    });

    it('e\' additivo: nessuna regola committata perde una dichiarazione', () => {
        // Le quattro che il file gia\' aveva e che l\'aggiunta non deve aver toccato.
        expect(RULES).toContain('font-size: 13px;\n    color: #334155;');   // &__label
        expect(RULES).toContain('@extend .wp-field__input;\n    cursor: pointer;');  // &__select
        expect(RULES).toContain('min-height: 48px;');                        // &__textarea
        expect(RULES).toContain('margin-bottom: 16px;');                     // .wp-field
    });
});
