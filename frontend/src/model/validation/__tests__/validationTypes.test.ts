/**
 * validationTypes — le invarianti dello scheletro della validazione (R-VAL).
 *
 * SUL SORGENTE, e non sul modulo importato, per una ragione misurata e non per pigrizia:
 * `validationTypes.ts` importa `../../joiner`, che alla prima riga fa
 * `var windoww = (window as any); windoww.windoww = windoww;`, e la suite gira con
 * `environment: 'node'` (`vitest.config.ts`). Importarlo qui produrrebbe
 * «window is not defined» — e' la stessa ragione per cui sette file della suite sono
 * gia' rossi cosi'. Quello che questo file difende non e' comunque un comportamento a
 * runtime: sono **decisioni di forma** (R-VAL-6-bis, §6 della spec, §3.3 di CLAUDE.md)
 * che un refactoring puo' disfare senza che niente diventi rosso.
 *
 * Ogni gruppo porta il proprio CONTROLLO POSITIVO: un'asserzione `not.toContain` su un
 * file che non e' stato letto passa esattamente come una su un file corretto, e senza
 * il controllo non si distingue il caso in cui il percorso e' sbagliato.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const RAW = readFileSync(resolve(__dirname, '../validationTypes.ts'), 'utf8');

/** Il sorgente senza commenti. Obbligatorio, non igiene: l'intestazione del modulo
 *  CITA per esteso quello che il modulo non fa — `DViewElement`, `severity`,
 *  `childKeys`, `VersionFixer` — e una regex che leggesse anche i commenti non
 *  distinguerebbe «dichiarato assente» da «presente». */
const strip = (src: string) => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '');
const SRC = strip(RAW);

const JOINER = readFileSync(resolve(__dirname, '../../../joiner/index.ts'), 'utf8');
const FIXER = readFileSync(resolve(__dirname, '../../../redux/VersionFixer.tsx'), 'utf8');

// ── §A Tipi paralleli, nessun supertipo comune (R-VAL-6-bis) ────────────────

describe('§A i due tipi sono paralleli e non discendono dalle view', () => {
    it('entrambe le classi D estendono DPointerTargetable', () => {
        expect(SRC).toContain('class DValidationViewpoint extends DPointerTargetable');
        expect(SRC).toContain('class DValidationRule extends DPointerTargetable');
    });

    it('entrambe le classi L estendono LPointerTargetable', () => {
        expect(SRC).toContain('> extends LPointerTargetable');
        expect(SRC.match(/> extends LPointerTargetable/g)?.length).toBe(2);
    });

    /**
     * Il conteggio, e non un `not.toContain` su ogni supertipo indesiderato: le due
     * classi L sono generiche, e i loro parametri contengono `D extends
     * DValidationViewpoint` — un VINCOLO di tipo, non un'ereditarieta'. Una regex che
     * cercasse la sola parola `extends` non distingue le due cose (misurato: la prima
     * stesura di questo test falliva proprio li'). Quattro classi, quattro clausole di
     * estensione, tutte e quattro verso una radice: e' l'enunciato completo, e non
     * lascia posto a un supertipo comune ne' a una view.
     */
    it('le quattro classi hanno in tutto quattro supertipi, e sono le due radici', () => {
        expect(SRC.match(/^export class /gm)?.length).toBe(4);
        expect(SRC.match(/\bextends DPointerTargetable\b/g)?.length).toBe(2);
        expect(SRC.match(/\bextends LPointerTargetable\b/g)?.length).toBe(2);
    });
});

// ── §B I campi della regola, quelli che ci sono e quelli che non ci sono ─────

describe('§B i campi', () => {
    it('la regola porta i cinque campi dello scheletro', () => {
        for (const field of ['name!: string', 'context!:', 'body!: string', 'message!: string', 'enabled!: boolean'])
            expect(SRC).toContain(field);
    });

    it('nessuna severita\': nello scheletro ogni violazione e\' un error', () => {
        expect(SRC).toContain('enabled!: boolean');                // controllo positivo
        expect(SRC).not.toContain('severity');
    });

    it('`enabled` sta sulla regola e NON sul viewpoint: l\'attivazione del viewpoint e\' una scelta del progetto (spec §6)', () => {
        const vpStart = SRC.indexOf('class DValidationViewpoint');
        const vpEnd = SRC.indexOf('class LValidationViewpoint');
        expect(vpStart).toBeGreaterThan(-1);                       // controllo positivo
        expect(vpEnd).toBeGreaterThan(vpStart);
        expect(SRC.slice(vpStart, vpEnd)).not.toContain('enabled');
    });

    it('il viewpoint contiene le regole, e la regola porta il legame all\'indietro', () => {
        expect(SRC).toContain('rules: Pointer<DValidationRule, 0, \'N\', LValidationRule> = []');
        expect(SRC).toContain('father: Pointer<DValidationViewpoint, 1, 1, LValidationViewpoint>');
    });

    it('le due collezioni sono INIZIALIZZATE, non solo dichiarate: Constructors legge le proprieta\' proprie', () => {
        expect(SRC).toMatch(/rules: Pointer<[^>]*> = \[\]/);
        expect(SRC).toMatch(/father: Pointer<[^>]*> = undefined as any/);
    });
});

// ── §C La registrazione D<->L, che avviene per convenzione di nome ───────────

describe('§C la registrazione automatica non ha buchi', () => {
    it('i quattro nomi di @RuntimeAccessible coincidono con i nomi delle classi', () => {
        for (const n of ['DValidationViewpoint', 'LValidationViewpoint', 'DValidationRule', 'LValidationRule'])
            expect(SRC).toContain(`@RuntimeAccessible('${n}')`);
    });

    it('tutte e quattro ridefiniscono `subclasses` e `_extends`', () => {
        expect(SRC.match(/static subclasses:/g)?.length).toBe(4);
        expect(SRC.match(/static _extends:/g)?.length).toBe(4);
    });

    it('tutte e quattro sono innestate sotto la radice con set_extend', () => {
        expect(SRC.match(/RuntimeAccessibleClass\.set_extend\(/g)?.length).toBe(4);
    });

    it('il modulo e\' esportato da joiner/index.ts, altrimenti il decoratore non gira mai', () => {
        expect(JOINER).toContain('../model/validation/validationTypes');
        expect(JOINER).toContain('DValidationViewpoint');
        expect(JOINER).toContain('DValidationRule');
    });
});

// ── §D Le due regole di CLAUDE.md che questo modulo poteva violare ───────────

describe('§D i vincoli del cuore', () => {
    it('nessuna TRANSACTION esterna attorno ai creatori (CLAUDE.md §3.3)', () => {
        expect(SRC).toContain('.end(');                            // controllo positivo
        expect(SRC).not.toContain('TRANSACTION(');
    });

    it('l\'aggancio alla collezione e\' una SetFieldAction FUORI dalla creazione', () => {
        const i = SRC.indexOf('SetFieldAction.new(');
        const j = SRC.indexOf('.end((d) => {', SRC.indexOf('class DValidationRule'));
        expect(i).toBeGreaterThan(-1);
        expect(j).toBeGreaterThan(-1);
        expect(i).toBeGreaterThan(j);
    });

    it('nessuna migrazione: VersionFixer non sa niente della validazione', () => {
        expect(FIXER).toContain('highestVersion');                 // controllo positivo
        expect(FIXER).not.toContain('DValidationViewpoint');
        expect(FIXER).not.toContain('DValidationRule');
    });
});
