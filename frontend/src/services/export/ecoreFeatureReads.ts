/**
 * Ecore import: the default of an EAttribute and the value of an EEnumLiteral, read off the JSON
 * that EcoreService.xmlToJson hands to EcoreParser (P-2026-11-01-2300, ticket #395).
 *
 * xmlToJson keys every XML attribute as '-' + its name (EcoreService.ts:703). EcoreParser read the
 * literal's value under `ECoreLiteral.value`, which is 'value' with no prefix (api/data.ts), and read
 * no defaultValueLiteral at all, so both were lost on every import. `ECoreLiteral.value` itself stays
 * as it is: the legacy JSON form of LEnumLiteral writes and reads it (LModelElement.tsx).
 *
 * Pure: no joiner import, so the test bench can load it.
 */

/** The prefix xmlToJson puts before an XML attribute name (EcoreService.ts:703). */
const INLINE = '-';

/** An EAttribute's `defaultValueLiteral`; '' when the .ecore declares none (the D-layer default). */
export function ecoreDefaultValueLiteral(json: Record<string, unknown> | null | undefined): string {
    const raw = json?.[INLINE + 'defaultValueLiteral'];
    return raw === undefined || raw === null ? '' : String(raw);
}

/**
 * An EEnumLiteral's `value`; -Infinity when the .ecore declares none, the sentinel the exporter
 * skips (EcoreService.ts:498-503).
 */
export function ecoreLiteralValue(json: Record<string, unknown> | null | undefined): number {
    const raw = json?.[INLINE + 'value'];
    return raw === undefined || raw === null ? Number.NEGATIVE_INFINITY : +raw;
}
