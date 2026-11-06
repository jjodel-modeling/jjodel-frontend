/**
 * Ecore import: nsURI collision check (P-2026-10-31-1711).
 *
 * Importing an Ecore whose EPackage nsURI is already declared by a loaded metamodel would add a
 * second metamodel on the same namespace, after which an XMI on that namespace is refused as
 * ambiguous (XMIService getMetamodelByNsURI). The importer refuses instead, before the parser
 * writes anything. Pure: no joiner import, so the test bench can load it.
 */

/** A package nsURI declared by a metamodel already in the project. */
export interface LoadedMetamodelNs {
    metamodel: string;
    nsURI: string;
}

export interface EcoreNsCollision {
    metamodel: string;
    nsURI: string;
}

const NS_URI = '-nsURI';            // EcoreParser.XMLinlineMarker + 'nsURI'
const WRAPPED_EPACKAGE = 'ecore:EPackage';

function nsURIOf(pkg: any): string | null {
    const uri = pkg && typeof pkg === 'object' ? pkg[NS_URI] : undefined;
    return typeof uri === 'string' && uri.trim() !== '' ? uri : null;
}

/**
 * nsURIs of the top-level packages of an Ecore document, as produced by EcoreService.xmlToJson:
 * the root EPackage, or each EPackage under an <xmi:XMI> wrapper. Packages without an nsURI
 * contribute nothing.
 */
export function readEcoreNsURIs(json: any): string[] {
    if (!json || typeof json !== 'object') return [];
    const wrapped = json[WRAPPED_EPACKAGE];
    const pkgs: any[] = wrapped === undefined || wrapped === null
        ? [json]
        : (Array.isArray(wrapped) ? wrapped : [wrapped]);
    const out: string[] = [];
    for (const pkg of pkgs) {
        const uri = nsURIOf(pkg);
        if (uri !== null && !out.includes(uri)) out.push(uri);
    }
    return out;
}

/** The loaded metamodels declaring `nsURI`, in load order. */
export function findMetamodelsByNsURI(nsURI: string, loaded: LoadedMetamodelNs[]): LoadedMetamodelNs[] {
    return loaded.filter(l => l.nsURI === nsURI);
}

/** First nsURI of the document already declared by a loaded metamodel, or null. */
export function ecoreCollision(json: any, loaded: LoadedMetamodelNs[]): EcoreNsCollision | null {
    for (const nsURI of readEcoreNsURIs(json)) {
        const hit = findMetamodelsByNsURI(nsURI, loaded)[0];
        if (hit) return { metamodel: hit.metamodel, nsURI };
    }
    return null;
}

export function ecoreCollisionMessage(c: EcoreNsCollision): string {
    return `The metamodel "${c.metamodel}" already uses the nsURI "${c.nsURI}". `
        + 'Delete the loaded metamodel first, then import again.';
}
