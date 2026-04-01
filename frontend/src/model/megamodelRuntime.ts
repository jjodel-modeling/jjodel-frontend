/**
 * Megamodel Runtime Registry
 *
 * Stores the fully-computed runtime Megamodel (derived + user-defined edges)
 * for each open project. This is the source of truth used by export handlers
 * (Navbar, LeftBar, Catalog) when serializing the project to a .jjodel file.
 *
 * Lifecycle:
 *   - SET:   ProjectEditor computes the Megamodel via loadMegamodel() and calls
 *            setRuntimeMegamodel() inside a useEffect whenever artifacts change.
 *   - GET:   Export handlers call getRuntimeMegamodel(projectId) before JSON.stringify.
 *   - CLEAR: ProjectEditor calls clearRuntimeMegamodel() on unmount.
 */

import type { Megamodel } from './megamodel'

const runtimeRegistry = new Map<string, Megamodel>()

export function setRuntimeMegamodel(projectId: string, megamodel: Megamodel): void {
    runtimeRegistry.set(projectId, megamodel)
}

export function getRuntimeMegamodel(projectId: string): Megamodel | undefined {
    return runtimeRegistry.get(projectId)
}

export function clearRuntimeMegamodel(projectId: string): void {
    runtimeRegistry.delete(projectId)
}
