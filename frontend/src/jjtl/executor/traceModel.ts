/**
 * JjTL Trace Model
 *
 * Records the execution trace of a transformation:
 * - Which source elements were matched by which rules
 * - Which target elements were created
 * - Which attribute values were mapped and how
 *
 * Design principles:
 * - References use element NAMES (not IDs — Jjodel IDs are unreliable)
 * - Fully serializable to JSON (no circular refs, no functions)
 * - Supports resolve() for cross-reference resolution during execution
 * - Annotated with invertibility for future bidirectional support
 *
 * Three-tier storage model:
 * - Runtime: built during execution, used for resolve()
 * - Session: kept in memory while project is open (for bidi + visualization)
 * - Persistent: saved as Jjodel DModel on explicit user action
 */

// ============================================
// TYPES
// ============================================

/**
 * Reference to a model element by name (stable identifier)
 */
export interface TraceElementRef {
    /** Name of the model this element belongs to */
    modelName: string;
    /** Name of the element (stable identifier) */
    elementName: string;
    /** Class/type of the element */
    className: string;
}

/**
 * Trace of a single attribute binding execution
 */
export interface BindingTrace {
    /** Source attribute name (e.g., "name"). Null for derived attributes */
    sourceAttribute: string | null;
    /** Target attribute name (e.g., "label") */
    targetAttribute: string;
    /** The JjTL expression used for conversion, if any (e.g., "name + '_pippa'") */
    expression?: string;
    /** The actual source value at execution time */
    sourceValue: any;
    /** The actual target value produced */
    targetValue: any;
    /** Whether this binding is statically invertible */
    invertible: boolean;
    /** The inverse expression, if invertible (for future reverse execution) */
    inverseExpression?: string;
    /** true if the value was provided by the user via prompt()/input() */
    userProvided?: boolean;
}

/**
 * A single trace link: one source element → one or more target elements
 * Created for each class mapping match
 */
export interface TraceLink {
    /** The rule that created this link (e.g., "A -> B") */
    rule: string;
    /** Source element reference */
    sourceElement: TraceElementRef;
    /** Target element(s) created (usually 1, can be more with multiplicity) */
    targetElements: TraceElementRef[];
    /** Attribute binding traces */
    bindings: BindingTrace[];
    /** Whether this link is fully invertible (all bindings invertible + no guard) */
    invertible: boolean;
}

/**
 * Complete trace model for one transformation execution
 */
export interface TraceModel {
    /** Name of the transformation that produced this trace */
    transformationName: string;
    /** Source model name */
    sourceModelName: string;
    /** Target model name */
    targetModelName: string;
    /** Timestamp of execution */
    executedAt: number;
    /** All trace links */
    links: TraceLink[];
}

// ============================================
// TRACE MODEL BUILDER
// ============================================

/**
 * Builds and queries the trace model during transformation execution.
 *
 * Usage:
 *   const builder = new TraceModelBuilder('MyTransformation', 'sourceModel', 'targetModel');
 *
 *   // During execution, for each matched source instance:
 *   const link = builder.addLink('A -> B', sourceRef, targetRefs);
 *   link.addBinding('name', 'label', null, 'A_0', 'A_0', true);
 *   link.addBinding('name', 'label', "name + '_suffix'", 'A_0', 'A_0_suffix', false);
 *
 *   // For cross-reference resolution during execution:
 *   const target = builder.resolve('A_0');           // find target for source named 'A_0'
 *   const target = builder.resolve('A_0', 'Table');  // find target of type 'Table'
 *   const targets = builder.resolveAll('A_0');        // find all targets
 *
 *   // After execution:
 *   const traceModel = builder.build();               // get serializable TraceModel
 */
export class TraceModelBuilder {
    private transformationName: string;
    private sourceModelName: string;
    private targetModelName: string;
    private links: TraceLink[] = [];

    constructor(transformationName: string, sourceModelName: string, targetModelName: string) {
        this.transformationName = transformationName;
        this.sourceModelName = sourceModelName;
        this.targetModelName = targetModelName;
    }

    /**
     * Add a trace link for a class mapping match.
     * Returns a TraceLinkBuilder for adding bindings.
     */
    addLink(
        rule: string,
        sourceElement: TraceElementRef,
        targetElements: TraceElementRef[],
        hasGuard: boolean = false
    ): TraceLinkBuilder {
        const link: TraceLink = {
            rule,
            sourceElement,
            targetElements,
            bindings: [],
            invertible: !hasGuard, // guards make rules non-invertible; bindings may downgrade this further
        };
        this.links.push(link);
        return new TraceLinkBuilder(link);
    }

    /**
     * Resolve: find the FIRST target element linked to a source element.
     * Used during execution for cross-reference resolution.
     *
     * @param sourceElementName - Name of the source element
     * @param targetClassName - Optional: filter by target class
     * @param targetModelName - Optional: filter by target model (for N:M)
     */
    resolve(
        sourceElementName: string,
        targetClassName?: string,
        targetModelName?: string
    ): TraceElementRef | null {
        for (const link of this.links) {
            if (link.sourceElement.elementName === sourceElementName) {
                for (const target of link.targetElements) {
                    if (targetClassName && target.className !== targetClassName) continue;
                    if (targetModelName && target.modelName !== targetModelName) continue;
                    return target;
                }
            }
        }
        return null;
    }

    /**
     * ResolveAll: find ALL target elements linked to a source element.
     *
     * @param sourceElementName - Name of the source element
     * @param targetClassName - Optional: filter by target class
     * @param targetModelName - Optional: filter by target model (for N:M)
     */
    resolveAll(
        sourceElementName: string,
        targetClassName?: string,
        targetModelName?: string
    ): TraceElementRef[] {
        const results: TraceElementRef[] = [];
        for (const link of this.links) {
            if (link.sourceElement.elementName === sourceElementName) {
                for (const target of link.targetElements) {
                    if (targetClassName && target.className !== targetClassName) continue;
                    if (targetModelName && target.modelName !== targetModelName) continue;
                    results.push(target);
                }
            }
        }
        return results;
    }

    /**
     * Reverse resolve: find source element(s) linked to a target element.
     * Used for backward/bidirectional transformations.
     *
     * @param targetElementName - Name of the target element
     */
    reverseResolve(targetElementName: string): TraceElementRef | null {
        for (const link of this.links) {
            if (link.targetElements.some(t => t.elementName === targetElementName)) {
                return link.sourceElement;
            }
        }
        return null;
    }

    /**
     * Get the trace link for a specific source element.
     */
    getLinkForSource(sourceElementName: string): TraceLink | null {
        return this.links.find(l => l.sourceElement.elementName === sourceElementName) || null;
    }

    /**
     * Get all trace links for a specific rule.
     */
    getLinksForRule(ruleName: string): TraceLink[] {
        return this.links.filter(l => l.rule === ruleName);
    }

    /**
     * Build the final serializable TraceModel.
     */
    build(): TraceModel {
        return {
            transformationName: this.transformationName,
            sourceModelName: this.sourceModelName,
            targetModelName: this.targetModelName,
            executedAt: Date.now(),
            links: this.links,
        };
    }

    /**
     * Get statistics about the trace.
     */
    getStats(): {
        totalLinks: number;
        invertibleLinks: number;
        totalBindings: number;
        invertibleBindings: number;
        invertiblePercentage: number;
    } {
        const totalLinks = this.links.length;
        const invertibleLinks = this.links.filter(l => l.invertible).length;
        const totalBindings = this.links.reduce((sum, l) => sum + l.bindings.length, 0);
        const invertibleBindings = this.links.reduce(
            (sum, l) => sum + l.bindings.filter(b => b.invertible).length, 0
        );
        return {
            totalLinks,
            invertibleLinks,
            totalBindings,
            invertibleBindings,
            invertiblePercentage: totalBindings > 0
                ? Math.round((invertibleBindings / totalBindings) * 100)
                : 100,
        };
    }
}

/**
 * Builder for adding bindings to a trace link.
 */
export class TraceLinkBuilder {
    private link: TraceLink;

    constructor(link: TraceLink) {
        this.link = link;
    }

    /**
     * Add a binding trace to this link.
     */
    addBinding(
        sourceAttribute: string | null,
        targetAttribute: string,
        expression: string | undefined,
        sourceValue: any,
        targetValue: any,
        invertible: boolean,
        inverseExpression?: string,
        userProvided?: boolean
    ): this {
        this.link.bindings.push({
            sourceAttribute,
            targetAttribute,
            expression,
            sourceValue,
            targetValue,
            invertible,
            inverseExpression,
            userProvided,
        });

        // If any binding is non-invertible, the whole link is non-invertible
        if (!invertible) {
            this.link.invertible = false;
        }

        return this;
    }
}

// ============================================
// SERIALIZATION
// ============================================

/**
 * Serialize trace model to JSON string.
 */
export function serializeTraceModel(trace: TraceModel): string {
    return JSON.stringify(trace, null, 2);
}

/**
 * Deserialize trace model from JSON string.
 */
export function deserializeTraceModel(json: string): TraceModel {
    return JSON.parse(json) as TraceModel;
}
