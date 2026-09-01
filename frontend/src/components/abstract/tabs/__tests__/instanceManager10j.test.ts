/**
 * 10j — l'empty state della metaclasse vuota.
 *
 * Slice di sola superficie e copy, come 10d/10e/10f/10h. Le asserzioni sono sul
 * SORGENTE per la necessità misurata in 10c: `InstanceManagerTab.tsx` importa il
 * barrel di `editor-v2/`, che arriva a monaco, che dereferenzia `window`
 * all'import, e il file muore prima del primo `it`.
 *
 * Quello che questi test NON possono dire, e che la sonda dice: le ALTEZZE, e
 * che la cascata arrivi davvero al glifo dentro il componente condiviso. La
 * coppia before/after di `scripts/smoke/_tmp_10j_verify.ts` è lì per quello —
 * 29/19 nel giro before, 48/0 nel primo after, con il caso pieno verde in
 * ENTRAMBI i giri. Le due leve di chiusura (gronda 24px, riga di toolbar spenta
 * intera) hanno aggiunto tre asserzioni alla sonda: 59/0, card a 271px contro i
 * 298px del prima e i 347px del primo after. Il before non è stato rigirato:
 * quei numeri sono di una sonda a 48 asserzioni, e sono citati come tali.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e
 * una lettura che non è avvenuta danno lo stesso silenzio (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TSX = readFileSync(resolve(__dirname, '../InstanceManagerTab.tsx'), 'utf8');
const SCSS = readFileSync(resolve(__dirname, '../instanceManagerTab.scss'), 'utf8');
const SHARED = readFileSync(resolve(__dirname, '../../../ui/EmptyState/EmptyState.tsx'), 'utf8');

/** Il sorgente senza i commenti. Serve a ogni asserzione di ASSENZA: i commenti
 *  di questa slice citano per esteso la frase vecchia che la slice toglie, e una
 *  regex che leggesse anche loro non distinguerebbe «rimossa e documentata» da
 *  «ancora lì» (è il rilievo scritto in 10c, e qui morde). */
const CODE = TSX.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const RULES = SCSS.replace(/\/\*[\s\S]*?\*\//g, '');

describe('10j — la condizione', () => {
    it('positivo di controllo: la condizione del modello vuoto esiste ancora', () => {
        expect(CODE).toContain('const modelIsEmpty = useMemo(');
    });

    it('`collectionIsEmpty` è metaclasse-scelta AND zero righe', () => {
        expect(CODE).toMatch(
            /const collectionIsEmpty = !!selectedClass && rows\.length === 0;/,
        );
    });

    it('NON è `visible.length`: un filtro che non trova nulla non è una collezione vuota', () => {
        // Il filtro deve restare montato, o non c'è modo di disfarlo. Questa è
        // la riga che lo garantisce, ed è per questo che va pinnata.
        expect(CODE).not.toMatch(/const collectionIsEmpty[^;]*visible\.length/);
    });
});

describe('10j — il copy nomina la metaclasse', () => {
    it('positivo di controllo: i due EmptyState del manager sono montati', () => {
        expect(TSX.match(/<EmptyState/g) ?? []).toHaveLength(2);
    });

    it('il titolo della collezione vuota nomina la metaclasse', () => {
        expect(CODE).toContain('title={`No ${selectedClass.name} instances yet`}');
    });

    it('la sottoriga rootable invita a creare QUI', () => {
        expect(CODE).toContain("'Create the first one to see it here.'");
    });

    it('la sottoriga NON rootable rimanda al contenitore', () => {
        expect(CODE).toContain("'Add one from its container in the outline.'");
    });

    it('il ramo del modello resta, per il caso senza metaclasse scelta', () => {
        expect(CODE).toContain('title="This model has no instances yet"');
        expect(CODE).toMatch(/\) : modelIsEmpty \|\| !selectedClass \? \(/);
    });

    it('la collezione vuota è testata PRIMA del modello vuoto', () => {
        // L'ordine È la correzione: col modello vuoto davanti, una metaclasse
        // scelta su un modello senza istanze ricadeva sul cartello del modello.
        const coll = CODE.indexOf('{collectionIsEmpty && selectedClass ? (');
        const model = CODE.indexOf(') : modelIsEmpty || !selectedClass ? (');
        expect(coll).toBeGreaterThan(-1);
        expect(model).toBeGreaterThan(coll);
    });

    it('la riga «No instance of X in this model.» è sparita: la sostituisce il cartello', () => {
        expect(CODE).not.toContain('in this model.');
        // ma quella del FILTRO resta: è l'altra frase, e dice un'altra cosa
        expect(CODE).toContain('matches the current filters.');
    });
});

describe('10j — la CTA è lo stesso evento della testata', () => {
    it('positivo di controllo: la create della testata è `openCreate(cls, null, null)`', () => {
        expect(CODE).toMatch(/onClick=\{\(\) => openCreate\(classShape\.key, null, null\)\}/);
    });

    it('la CTA del cartello chiama la STESSA funzione con gli STESSI argomenti', () => {
        expect(CODE).toContain('onClick: () => openCreate(classShape.key, null, null),');
        // due sole superfici nel manager, e nessun secondo percorso di create
        expect(CODE.match(/openCreate\(classShape\.key, null, null\)/g) ?? []).toHaveLength(2);
    });

    it('la CTA porta il nome della metaclasse', () => {
        expect(CODE).toContain('label: `+ New ${classShape.key}`,');
    });

    it('senza scorciatoia non c\'è bottone: `action` è `undefined`, non un bottone spento', () => {
        expect(CODE).toMatch(/action=\{classShape && !newReason\s*\?\s*\{[\s\S]*?\}\s*:\s*undefined\}/);
        expect(CODE).not.toMatch(/action=\{[^}]*disabled/);
    });
});

describe('10j — il chrome tace a collezione vuota', () => {
    it('positivo di controllo: le quattro riduzioni esistono', () => {
        expect(CODE).toContain('className="instance-manager__search"');
        expect(CODE).toContain('className="instance-manager__segmented"');
        expect(CODE).toContain('className="instance-manager__hidden-cols"');
        expect(CODE).toContain('className="instance-manager__columns"');
    });

    it('la RIGA intera è condizionata a `!collectionIsEmpty`, non i singoli figli', () => {
        // La condizione sta sul contenitore perché spegnere i quattro figli
        // dentro una riga che resta libera spazio ORIZZONTALE e zero spazio
        // verticale: misurato, la card saliva a 347px con la barra ancora lì e
        // dentro il solo «New». §1 del referto.
        expect(CODE).toMatch(
            /\{!collectionIsEmpty && \(\s*\n\s*<div className="instance-manager__toolbar">/,
        );
    });

    it('e i figli NON la ridicono: una condizione sola, in un posto solo', () => {
        // Due dichiarazioni dello stesso vincolo sono il posto in cui un domani
        // le due divergono. Dentro il contenitore `!collectionIsEmpty` è vero
        // per costruzione.
        expect(CODE).toContain('{selectedClass && (');
        expect(CODE).toContain('{discriminant && (');
        expect(CODE).toContain('{autoHiddenKeys.length > 0 && (');
        expect(CODE).toContain('{classShape && columns.length > 0 && (');
        expect(CODE).not.toContain('&& !collectionIsEmpty && (');
    });

    it('il pannello della form non si rende affatto: la barra sparisce col contenitore', () => {
        expect(CODE).toContain('{(isMulti || subjectId || !collectionIsEmpty) && (');
        // la frase resta in codice, per il caso in cui c'è una riga da scegliere
        expect(CODE).toContain('Select an instance to edit it');
    });

    it('la TESTATA resta: titolo e sottotitolo non sono condizionati alla collezione', () => {
        expect(CODE).toMatch(/\{selectedClass && \(\s*<header className="instance-manager__head">/);
    });

    it('il New scende con la riga, e la CTA ne ha la STESSA condizione', () => {
        // `classShape && !newReason` è la condizione del bottone in barra ED è
        // quella dell'`action` del cartello: dove la riga sparisce il bottone è
        // già a schermo dentro il cartello, e dove la CTA non c'è non c'era
        // nemmeno il bottone. Nessun caso perde la create.
        expect(CODE).toContain('{classShape && !newReason && (');
        expect(CODE).toMatch(/action=\{classShape && !newReason\s*\?/);
    });

    it('Export resta com\'era: già assente a zero righe, per la sua condizione', () => {
        // La scelta dichiarata è ASSENTE, non disabilitato — e non serviva un
        // ramo nuovo: `rows.length > 0` lo copre già.
        expect(CODE).toContain('{classShape && rows.length > 0 && (');
    });
});

describe('10j — la misura, e il componente condiviso che resta intatto', () => {
    it('positivo di controllo: il blocco del cartello esiste nel foglio', () => {
        expect(RULES).toContain('&__empty.jj-empty-state {');
    });

    it('la gronda verticale è 24px, e il numero è misurato', () => {
        // 48px erano +32 sui 32 del componente condiviso e portavano la card da
        // 298px a 347px, cioè 49px più ALTA del prima. A 24 il cartello sta sui
        // 185px e la card sui 261px. §1 del referto.
        const m = RULES.match(/&__empty\.jj-empty-state \{([\s\S]*?)\n    \}/);
        expect(m, 'il blocco non esiste').not.toBeNull();
        expect(m![1]).toContain('padding-block: 24px;');
        expect(m![1]).not.toContain('padding-block: 48px;');
    });

    it('il glifo è 32px e il cerchio è spento', () => {
        expect(RULES).toMatch(/font-size:\s*32px;\s*\n\s*color:\s*var\(--color-form-border-strong\);/);
        expect(RULES).toMatch(/&__empty\.jj-empty-state \{[\s\S]*?background:\s*none;/);
    });

    it('titolo 600 e sottoriga 13px, e i due grigi sono TOKEN, non letterali', () => {
        const m = RULES.match(/&__empty\.jj-empty-state \{([\s\S]*?)\n    \}/)!;
        expect(m[1]).toContain('font-weight: 600;');
        expect(m[1]).toContain('font-size: var(--text-sm);');
        expect(m[1]).toContain('color: var(--color-form-muted);');
        expect(m[1]).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    });

    it('il selettore raddoppia la classe: è ciò che lo tiene sopra le regole scure del componente', () => {
        // A classe singola pareggerebbe `[data-theme="dark"] .jj-empty-state__…`
        // e perderebbe per ordine di cascata. La riga sotto è la ragione del
        // raddoppio, ed è la riga che una semplificazione romperebbe.
        expect(SHARED).toBeTruthy();
        expect(RULES).not.toMatch(/&__empty \{/);
        expect(RULES).toContain('&__empty.jj-empty-state {');
    });

    it('il componente condiviso NON è toccato: la misura è del manager', () => {
        // Otto punti dell'app lo montano; questa slice non ne cambia nessuno.
        expect(SHARED).toContain('export const EmptyState');
        expect(SHARED).toContain('className={`jj-empty-state${className ? \' \' + className : \'\'}`}');
        expect(SHARED).not.toContain('instance-manager');
    });

    it('nessun `flex-grow` nel blocco: il non-riempimento è già di `__pane--table`', () => {
        const m = RULES.match(/&__empty\.jj-empty-state \{([\s\S]*?)\n    \}/)!;
        expect(m[1]).not.toContain('flex');
        expect(RULES).toContain('&__pane--table { flex: 0 1 auto;');
    });
});
