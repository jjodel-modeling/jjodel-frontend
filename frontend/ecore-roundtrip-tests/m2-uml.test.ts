/**
 * M2 round-trip stress test on the Eclipse UML2 UML.ecore (the official
 * machine-readable UML2 metamodel, ~1.4 MB, 246 classes).
 *
 * The fixture is NOT committed (see fixtures-local/.gitignore): drop
 * UML.ecore into ecore-roundtrip-tests/fixtures-local/ to enable this test;
 * it auto-skips when the file is missing.
 *
 * Known, accepted losses (excluded from the comparison by design):
 *   - eAnnotations (dropped by decision)
 *   - eGenericType / eTypeParameters (generics not modeled in Jjodel D-layer)
 *
 * Run from frontend/:
 *   npx vitest run --config ecore-roundtrip-tests/vitest.roundtrip.config.ts m2-uml
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { bootstrap, lookup, importEcoreCompensated } from './rt-helpers';
import * as helpers from './rt-helpers';
import { m2Snapshot, deepDiff } from './snapshot';

const UML_FILE = path.resolve(__dirname, 'fixtures-local/UML.ecore');
const REPORT_DIR = '/tmp/rt-reports';

beforeAll(async () => {
    await bootstrap();
    fs.mkdirSync(REPORT_DIR, { recursive: true });
});

describe('M2 round-trip — UML2 (Eclipse UML.ecore)', () => {
    it.skipIf(!fs.existsSync(UML_FILE))('UML.ecore: round-trip is semantically clean (mod annotations + generics)', async () => {
        const xml = fs.readFileSync(UML_FILE, 'utf8');

        const t0 = Date.now();
        const res1 = await importEcoreCompensated(xml, 'rt1_UML');
        const tImport1 = Date.now() - t0;
        expect(res1.success, `import1 failed: ${JSON.stringify(res1.errors)}`).toBe(true);

        const snap1 = m2Snapshot(lookup(), res1.model.id);
        expect(snap1.packages[0].classes.length, 'import produced no classes — vacuous run').toBeGreaterThan(200);

        const t1 = Date.now();
        const exported = helpers.EcoreService.exportToXML(res1.model);
        const tExport = Date.now() - t1;
        fs.writeFileSync(path.join(REPORT_DIR, 'UML.exported.ecore'), exported);

        const t2 = Date.now();
        const res2 = await importEcoreCompensated(exported, 'rt2_UML');
        const tImport2 = Date.now() - t2;
        expect(res2.success, `import2 (re-import of export) failed: ${JSON.stringify(res2.errors)}`).toBe(true);

        const snap2 = m2Snapshot(lookup(), res2.model.id);
        const diff = deepDiff(snap1, snap2, '', [], 5000);
        fs.writeFileSync(path.join(REPORT_DIR, 'UML.report.json'), JSON.stringify({
            tImport1, tExport, tImport2,
            classes1: snap1.packages?.[0]?.classes?.length,
            classes2: snap2.packages?.[0]?.classes?.length,
            enums1: snap1.packages?.[0]?.enumerators?.length,
            enums2: snap2.packages?.[0]?.enumerators?.length,
            datatypes1: snap1.packages?.[0]?.datatypes?.length,
            datatypes2: snap2.packages?.[0]?.datatypes?.length,
            diffCount: diff.length,
            diff: diff.slice(0, 500),
        }, null, 2));
        expect(diff, `semantic diff (${diff.length} entries):\n${diff.slice(0, 40).join('\n')}`).toEqual([]);
    }, 300_000);
});
