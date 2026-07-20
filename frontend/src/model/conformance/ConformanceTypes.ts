// ============================================
// Guard types (preventive — block invalid writes)
// ============================================

export type GuardViolationType =
    | 'multiplicity_upper_exceeded'
    | 'class_not_in_metamodel'
    | 'type_mismatch';

export interface GuardError {
    allowed: false;
    violationType: GuardViolationType;
    message: string;
    details: {
        objectId?: string;
        objectName?: string;
        className?: string;
        associationName?: string;
        currentCount?: number;
        maxAllowed?: number;
        expectedType?: string;
        receivedValue?: unknown;
    };
}

export interface GuardSuccess {
    allowed: true;
}

export type GuardResult = GuardSuccess | GuardError;

// ============================================
// Validator types (passive — indicator on tabs)
// ============================================

export type ViolationSeverity = 'error' | 'warning';

export interface ConformanceViolation {
    objectId: string;
    objectName?: string;
    violationType:
        | GuardViolationType
        | 'orphan_object'
        | 'missing_required_attr'
        | 'multiplicity_below_min'
        | 'dangling_reference'
        // Livello 0 structural checks (WP1) — additive; existing values above are unchanged (tooltip API)
        | 'abstract_instantiation'
        | 'reference_target_type_mismatch'
        | 'attr_multiplicity_upper_exceeded'
        | 'attr_multiplicity_below_min'
        | 'invalid_enum_literal'
        | 'duplicate_id_value'
        // Fail-visible meta-check (WP1): a per-check catch fired, so that check could not be
        // evaluated. Emitted as 'warning' so status is never 'conformant' with a skipped check.
        | 'check_failed';
    severity: ViolationSeverity;
    message: string;
    metamodelElementName?: string;
}

export type ConformanceStatus = 'conformant' | 'warnings' | 'errors' | 'unknown';

export interface ConformanceResult {
    modelId: string;
    status: ConformanceStatus;
    violations: ConformanceViolation[];
    checkedAt: number;
}

// ============================================
// Guard options
// ============================================

export interface GuardOptions {
    /** When true, skip the guard and allow the operation. Reserved for internal use (JjTL executor, co-evolution). */
    force?: boolean;
}
