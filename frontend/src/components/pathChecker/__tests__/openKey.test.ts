/**
 * openKey — the key PathChecker resets the store on (P-2026-09-25-1440).
 *
 * PathChecker itself needs a router and a DOM, which the bench does not have; its decision lives in this
 * pure function. What the reset then does (stateInitializer, the superseded checks, the Project.tsx guard)
 * is verified at runtime (discovery_2026-09-25_hash_change_open.md §6, probes P1-P7).
 */
import { describe, it, expect } from 'vitest';
import { openKey } from '../openKey';

describe('openKey', () => {
    it('K1 two project ids on /project give two keys (the id alone starts an open)', () => {
        expect(openKey('/project', '?id=Pointer_A')).not.toBe(openKey('/project', '?id=Pointer_B'));
    });

    it('K2 another param next to the same id gives the same key (repair does not reopen)', () => {
        expect(openKey('/project', '?id=Pointer_A')).toBe(openKey('/project', '?id=Pointer_A&repair=1'));
    });

    it('K3 search params off /project give the same key (a dashboard filter does not reset)', () => {
        expect(openKey('/allProjects', '')).toBe(openKey('/allProjects', '?filter=public'));
    });

    it('K4 two pages without a project id give two keys (a change of page still resets)', () => {
        expect(openKey('/allProjects', '')).not.toBe(openKey('/account', ''));
    });

    it('K5 /project with an id and without one give two keys', () => {
        expect(openKey('/project', '?id=Pointer_A')).not.toBe(openKey('/project', ''));
    });
});
