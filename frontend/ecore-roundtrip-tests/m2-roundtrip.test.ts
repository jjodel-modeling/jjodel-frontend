/**
 * M2 (metamodel) round-trip: import .ecore → export → re-import → the two
 * semantic snapshots must be identical (modulo eAnnotations, excluded by
 * decision, and Pointer ids, which are regenerated at every import).
 *
 * Exercises the PRODUCTION code paths end-to-end:
 *   EcoreService.importFromXML (DOMParser shim) → EcoreParser.parse
 *   EcoreService.exportToXML   (the active exporter)
 * plus the harness-only F7 compensation (see rt-helpers.ts).
 *
 * Every fixture also dumps a machine-readable report + the exported XML to
 * /tmp/rt-reports/ for offline inspection, PASS or FAIL.
 *
 * Run from frontend/:
 *   npx vitest run --config ecore-roundtrip-tests/vitest.roundtrip.config.ts m2-roundtrip
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { bootstrap, lookup, importEcoreCompensated } from './rt-helpers';
import * as helpers from './rt-helpers';
import { m2Snapshot, deepDiff } from './snapshot';

const FIXTURE_DIR = path.resolve(__dirname, '../src/__tests__/fixtures/xmi-m1');
const REPORT_DIR = '/tmp/rt-reports';

beforeAll(async () => {
    await bootstrap();
    fs.mkdirSync(REPORT_DIR, { recursive: true });
});

async function roundTrip(name: string, xml: string) {
    const res1 = await importEcoreCompensated(xml, `rt1_${name}`);
    if (!res1.success || !res1.model) {
        return { phase: 'import1', errors: res1.errors } as any;
    }
    const snap1 = m2Snapshot(lookup(), res1.model.id);

    let exported = '';
    try {
        exported = helpers.EcoreService.exportToXML(res1.model);
    } catch (e) {
        return { phase: 'export', errors: [String(e)], snap1 } as any;
    }
    fs.writeFileSync(path.join(REPORT_DIR, `${name}.exported.ecore`), exported);

    const res2 = await importEcoreCompensated(exported, `rt2_${name}`);
    if (!res2.success || !res2.model) {
        return { phase: 'import2', errors: res2.errors, snap1, exported } as any;
    }
    const snap2 = m2Snapshot(lookup(), res2.model.id);
    const diff = deepDiff(snap1, snap2);
    return { phase: 'done', snap1, snap2, diff, exported };
}

async function runFixture(name: string, file: string) {
    const xml = fs.readFileSync(file, 'utf8');
    const result = await roundTrip(name, xml);
    fs.writeFileSync(
        path.join(REPORT_DIR, `${name}.report.json`),
        JSON.stringify({ name, phase: result.phase, errors: result.errors, diff: result.diff, snap1: result.snap1, snap2: result.snap2 }, null, 2),
    );
    return result;
}

describe('M2 round-trip — import → export → import (semantic identity mod annotations)', () => {

    const fixtures = [
        'Library.ecore',
        'Graph.ecore',
        'Shapes.ecore',
        'DataType_test.ecore',
        'DataType_collision_test.ecore',
    ];

    for (const f of fixtures) {
        const name = f.replace(/\.ecore$/, '');
        it(`${name}: round-trip is semantically clean`, async () => {
            const result = await runFixture(name, path.join(FIXTURE_DIR, f));
            expect(result.phase, `failed at phase ${result.phase}: ${JSON.stringify(result.errors)}`).toBe('done');
            expect(result.diff, `semantic diff:\n${(result.diff || []).join('\n')}`).toEqual([]);
        });
    }

    it('sanity: import populates classes (guards against vacuous green)', async () => {
        const xml = fs.readFileSync(path.join(FIXTURE_DIR, 'Library.ecore'), 'utf8');
        const checkpoint = helpers.idCheckpoint();
        const res = helpers.EcoreService.importFromXML(xml, 'sanity_Library');
        await helpers.flush();
        const stats = helpers.compensateF7(checkpoint);
        expect(res.success).toBe(true);
        expect(stats.seen['DClass'], 'no DClass created by the import').toBe(5);
        const snap = m2Snapshot(lookup(), res.model.id);
        const names = snap.packages[0].classes.map((c: any) => c.name);
        expect(names).toEqual(['Book', 'Library', 'LibraryItem', 'Magazine', 'Member']);
        const book = snap.packages[0].classes.find((c: any) => c.name === 'Book');
        expect(book.attributes.map((a: any) => a.name)).toEqual(['isbn']);
        expect(book.extends).toEqual(['LibraryItem']);
    });
});
