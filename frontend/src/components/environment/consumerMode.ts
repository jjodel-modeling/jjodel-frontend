/**
 * consumerMode — #157 Fase 3. The stand-alone "consumer" shell is active when the URL carries a
 * `?profile=` parameter (D2: a (project, profile) pair IS an environment). In that mode the
 * developer surfaces — metamodels, viewpoints, transformations, authoring, creation — are hidden,
 * leaving models + concrete syntax + the Configurator.
 *
 * Soft frontend gate (D1): this hides UI paths, it is NOT access control — the project state still
 * reaches the client. Read live from the hash, so it reflects the current URL at call time.
 */
import { U } from '../../joiner';

/** The `profile` id in the URL, or null. */
export function activeProfileId(): string | null {
    try {
        return U.getHashParam('profile');
    } catch {
        return null;
    }
}

/** True when a profile is active in the URL — the app runs as a restricted consumer environment. */
export function isConsumerMode(): boolean {
    return !!activeProfileId();
}
