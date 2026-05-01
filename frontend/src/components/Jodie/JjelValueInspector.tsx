import { useState, useMemo } from 'react';

interface JjelValueInspectorProps {
    value: Record<string, unknown>;
    kind: 'class' | 'instance' | 'other';
}

const CLASS_HEADLINE = ['name', 'isAbstract', 'instances', 'attributes'] as const;
const CLASS_PROPS_ORDER = [
    'isInterface', 'isFinal', 'isSingleton', 'isRootable',
    'isPartial', 'allowCrossExtend', 'allInstances',
    'references', 'className',
];

// Keys reserved by the runtime on M1 instances. For the instance branch:
// `instanceOf` and `instanceof` are surfaced in the headline (as the class
// name string); the rest are non-user fields and go to the Properties section.
const RESERVED_INSTANCE = new Set([
    'instanceOf', 'instanceof', 'className', 'allInstances', 'instances',
]);

// Internal/technical fields hidden from every section. They are runtime
// proxy/marker fields with no inspection value.
const TECHNICAL_HIDDEN = new Set(['__jjelFunction', '__raw', '__proxy']);

/**
 * Categorise an arbitrary value for the inspector. Returns `null` if the value
 * is not a navigable plain object (primitive, array, function, jjelFunction).
 * Drives both the chevron visibility in `CodeReplEntry` and the layout choice
 * inside the inspector.
 */
export function detectKind(v: unknown): 'class' | 'instance' | 'other' | null {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return null;
    const obj = v as Record<string, unknown>;
    if (obj.__jjelFunction) return null;
    if (obj.className === 'DClass') return 'class';
    if ('instanceOf' in obj || 'instanceof' in obj) return 'instance';
    return 'other';
}

function safeGet(obj: Record<string, unknown>, key: string): unknown {
    try { return obj[key]; } catch { return undefined; }
}

function safeKeys(obj: Record<string, unknown>): string[] {
    try { return Object.keys(obj); } catch { return []; }
}

function isInternalKey(k: string): boolean {
    return k.startsWith('_');
}

function isTechnicalKey(k: string): boolean {
    return TECHNICAL_HIDDEN.has(k);
}

function isJjelFunction(v: unknown): boolean {
    return (
        v !== null &&
        typeof v === 'object' &&
        (v as { __jjelFunction?: unknown }).__jjelFunction === true
    );
}

function renderValue(val: unknown): JSX.Element {
    if (val === null || val === undefined)
        return <span className="jodie-inspector__null">null</span>;
    if (typeof val === 'boolean')
        return <span className={`jodie-inspector__bool jodie-inspector__bool--${val}`}>{String(val)}</span>;
    if (typeof val === 'number')
        return <span className="jodie-inspector__number">{val}</span>;
    if (typeof val === 'string')
        return <span className="jodie-inspector__string">"{val}"</span>;
    if (typeof val === 'function' || isJjelFunction(val))
        return <span className="jodie-inspector__meta">&lt;function&gt;</span>;
    if (Array.isArray(val)) {
        if (val.length === 0) return <span className="jodie-inspector__meta">[]</span>;
        const names = val.slice(0, 3).map((item: unknown) => {
            try {
                const n = (item as { name?: unknown } | null | undefined)?.name;
                return typeof n === 'string' ? n : '?';
            } catch { return '?'; }
        }).join(', ');
        const suffix = val.length > 3 ? `, … (${val.length})` : ` (${val.length})`;
        return <span className="jodie-inspector__array">[{names}{suffix}]</span>;
    }
    if (typeof val === 'object') {
        let name: unknown = undefined;
        try { name = (val as { name?: unknown }).name; } catch { /* skip */ }
        return (
            <span className="jodie-inspector__object">
                {typeof name === 'string' && name ? `{${name}}` : '{…}'}
            </span>
        );
    }
    return <span>{String(val)}</span>;
}

interface GroupedProperties {
    headline: [string, unknown][];
    properties: [string, unknown][];
    internal: [string, unknown][];
}

function groupProperties(
    value: Record<string, unknown>,
    kind: 'class' | 'instance' | 'other',
): GroupedProperties {
    const allKeys = safeKeys(value);

    if (kind === 'class') {
        const headlineKeys = new Set<string>(CLASS_HEADLINE);

        const headline: [string, unknown][] = [];
        for (const k of CLASS_HEADLINE) {
            if (k in value) headline.push([k, safeGet(value, k)]);
        }

        const propsOrdered = CLASS_PROPS_ORDER.filter(
            k => k in value && !headlineKeys.has(k),
        );
        const propsRest = allKeys
            .filter(k =>
                !isInternalKey(k) &&
                !isTechnicalKey(k) &&
                !headlineKeys.has(k) &&
                !CLASS_PROPS_ORDER.includes(k))
            .sort();
        const properties: [string, unknown][] = [...propsOrdered, ...propsRest]
            .map(k => [k, safeGet(value, k)] as [string, unknown]);

        const internal: [string, unknown][] = allKeys
            .filter(k => isInternalKey(k) && !isTechnicalKey(k))
            .sort()
            .map(k => [k, safeGet(value, k)] as [string, unknown]);

        return { headline, properties, internal };
    }

    if (kind === 'instance') {
        const headline: [string, unknown][] = [];

        let instanceOfName: string | null = null;
        try {
            const fromCanonical = (value.instanceOf as { name?: unknown } | null | undefined)?.name;
            const fromAlias = (value.instanceof as { name?: unknown } | null | undefined)?.name;
            const picked = fromCanonical ?? fromAlias;
            instanceOfName = typeof picked === 'string' ? picked : null;
        } catch { /* skip */ }
        if (instanceOfName !== null) headline.push(['instanceOf', instanceOfName]);
        if ('name' in value) headline.push(['name', safeGet(value, 'name')]);

        const userInHeadline = allKeys
            .filter(k =>
                !RESERVED_INSTANCE.has(k) &&
                !isInternalKey(k) &&
                !isTechnicalKey(k) &&
                k !== 'name')
            .sort();
        for (const k of userInHeadline) headline.push([k, safeGet(value, k)]);

        const properties: [string, unknown][] = [...RESERVED_INSTANCE]
            .filter(k => k in value && k !== 'instanceOf' && k !== 'instanceof')
            .map(k => [k, safeGet(value, k)] as [string, unknown]);

        const internal: [string, unknown][] = allKeys
            .filter(k => isInternalKey(k) && !isTechnicalKey(k))
            .sort()
            .map(k => [k, safeGet(value, k)] as [string, unknown]);

        return { headline, properties, internal };
    }

    // 'other'
    const visible = allKeys.filter(k => !isTechnicalKey(k)).sort();
    const pubKeys = visible.filter(k => !isInternalKey(k));
    const intKeys = visible.filter(k => isInternalKey(k));
    const headline: [string, unknown][] = pubKeys.slice(0, 4)
        .map(k => [k, safeGet(value, k)] as [string, unknown]);
    const properties: [string, unknown][] = pubKeys.slice(4)
        .map(k => [k, safeGet(value, k)] as [string, unknown]);
    const internal: [string, unknown][] = intKeys
        .map(k => [k, safeGet(value, k)] as [string, unknown]);
    return { headline, properties, internal };
}

export function JjelValueInspector({ value, kind }: JjelValueInspectorProps): JSX.Element {
    const [propsOpen, setPropsOpen] = useState(false);
    const [internalOpen, setInternalOpen] = useState(false);

    const { headline, properties, internal } = useMemo(
        () => groupProperties(value, kind),
        [value, kind]
    );

    return (
        <div className="jodie-inspector" role="region" aria-label="Inspector">

            <div className="jodie-inspector__rows">
                {headline.map(([key, val]) => (
                    <div key={key} className="jodie-inspector__row">
                        <span className="jodie-inspector__key">{key}</span>
                        <span className="jodie-inspector__value">{renderValue(val)}</span>
                    </div>
                ))}
            </div>

            {properties.length > 0 && (
                <div className="jodie-inspector__section">
                    <button
                        type="button"
                        className="jodie-inspector__section-toggle"
                        onClick={() => setPropsOpen(p => !p)}
                        aria-expanded={propsOpen}
                    >
                        <i className={`bi bi-chevron-${propsOpen ? 'up' : 'down'}`} aria-hidden="true" />
                        {propsOpen ? 'less' : `+${properties.length} more`}
                    </button>
                    {propsOpen && (
                        <div className="jodie-inspector__grid">
                            {properties.map(([key, val]) => (
                                <div key={key} className="jodie-inspector__row">
                                    <span className="jodie-inspector__key">{key}</span>
                                    <span className="jodie-inspector__value">{renderValue(val)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {internal.length > 0 && (
                <div className="jodie-inspector__section jodie-inspector__section--internal">
                    <button
                        type="button"
                        className="jodie-inspector__section-toggle jodie-inspector__section-toggle--dim"
                        onClick={() => setInternalOpen(p => !p)}
                        aria-expanded={internalOpen}
                    >
                        <i className={`bi bi-chevron-${internalOpen ? 'up' : 'down'}`} aria-hidden="true" />
                        {internalOpen ? 'hide internal' : `+${internal.length} internal`}
                    </button>
                    {internalOpen && (
                        <div className="jodie-inspector__rows jodie-inspector__rows--internal">
                            {internal.map(([key, val]) => (
                                <div key={key} className="jodie-inspector__row">
                                    <span className="jodie-inspector__key jodie-inspector__key--dim">{key}</span>
                                    <span className="jodie-inspector__value jodie-inspector__value--dim">{renderValue(val)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
