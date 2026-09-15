import { LPointerTargetable, LModel } from '../../../joiner';
import type { MetamodelInfo } from '../types';

export function extractMetamodelInfo(metamodelId: string): MetamodelInfo | null {
    try {
        const lModel = LPointerTargetable.fromD(metamodelId as any) as LModel;
        if (!lModel) return null;

        const classes = lModel.classes || [];
        const enumerators = lModel.enumerators || [];

        let referenceCount = 0;
        let attributeCount = 0;

        for (const cls of classes) {
            attributeCount += (cls.attributes || []).length;
            referenceCount += (cls.references || []).length;
        }

        return {
            id: metamodelId,
            name: lModel.name || 'Unnamed',
            classCount: classes.length,
            enumCount: enumerators.length,
            referenceCount,
            attributeCount,
        };
    } catch (e) {
        console.error('[EnvGenMetamodelExtractor] Failed to extract metamodel info:', e);
        return null;
    }
}

export function extractMetamodelMarkdown(metamodelId: string): string {
    try {
        const lModel = LPointerTargetable.fromD(metamodelId as any) as LModel;
        if (!lModel) return '> No metamodel data available.';

        const lines: string[] = [];
        lines.push(`## Metamodel: ${lModel.name || 'Unnamed'}`);
        lines.push('');

        const classes = lModel.classes || [];
        const enumerators = lModel.enumerators || [];

        for (const cls of classes) {
            const isAbstract = (cls as any).abstract ? ' (abstract)' : '';
            lines.push(`### Class: ${cls.name}${isAbstract}`);

            const attrs = cls.attributes || [];
            if (attrs.length > 0) {
                const attrDescs = attrs.map(attr => {
                    const typeName = attr.type?.name || 'String';
                    const lower = attr.lowerBound ?? 0;
                    const upper = attr.upperBound ?? 1;
                    const mult = upper === -1 ? `[${lower}..*]` : `[${lower}..${upper}]`;
                    return `${attr.name}: ${typeName} ${mult}`;
                });
                lines.push(`- **Attributes:** ${attrDescs.join(', ')}`);
            }

            const refs = cls.references || [];
            if (refs.length > 0) {
                const refDescs = refs.map(ref => {
                    const targetName = ref.type?.name || 'Unknown';
                    const lower = ref.lowerBound ?? 0;
                    const upper = ref.upperBound ?? 1;
                    const mult = upper === -1 ? `[${lower}..*]` : `[${lower}..${upper}]`;
                    const containment = (ref as any).containment ? ' (containment)' : '';
                    return `${ref.name}: ${targetName} ${mult}${containment}`;
                });
                lines.push(`- **References:** ${refDescs.join(', ')}`);
            }

            const supers = cls.extends || [];
            if (supers.length > 0) {
                lines.push(`- **Extends:** ${supers.map(s => s.name).join(', ')}`);
            }

            lines.push('');
        }

        if (enumerators.length > 0) {
            for (const enm of enumerators) {
                const literals = (enm.literals || []).map(lit => lit.literal || lit.name || '');
                lines.push(`### Enumeration: ${enm.name}`);
                lines.push(`- Literals: ${literals.join(', ')}`);
                lines.push('');
            }
        }

        return lines.join('\n');
    } catch (e) {
        console.error('[EnvGenMetamodelExtractor] Failed to extract metamodel markdown:', e);
        return '> Error extracting metamodel data.';
    }
}

export function getMetamodelClassNames(metamodelId: string): string[] {
    try {
        const lModel = LPointerTargetable.fromD(metamodelId as any) as LModel;
        if (!lModel) return [];
        return (lModel.classes || []).map(cls => cls.name || 'Unnamed');
    } catch {
        return [];
    }
}
