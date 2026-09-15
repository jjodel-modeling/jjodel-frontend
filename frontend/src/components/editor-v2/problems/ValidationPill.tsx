/**
 * Compact conformance summary pill for the editor toolbar. Consumes
 * useConformance(modelId) and projects the same violation stream the per-node
 * badges use.
 *
 * Silence = valid: renders nothing when the result is null (metamodel / no
 * metamodel-with-violations path returns 'unknown', handled below) or when the
 * status is 'conformant'. 'unknown' renders a neutral grey question-mark
 * variant; 'warnings' / 'errors' render the counts.
 */

import { useConformance } from '../../../model/conformance/useConformance';
import './ValidationPill.scss';

interface Props {
    modelId: string;
}

export function ValidationPill({ modelId }: Props) {
    const result = useConformance(modelId);

    if (!result) return null;
    const { status, violations } = result;
    if (status === 'conformant') return null;

    // TODO(WP2-D): open the aggregated Problems panel on click (deferred).

    if (status === 'unknown') {
        return (
            <div
                className="validation-pill validation-pill--unknown"
                title="Conformance unknown"
                aria-label="Conformance unknown"
            >
                <i className="bi bi-question-circle-fill" />
            </div>
        );
    }

    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;

    const tooltipParts: string[] = [];
    if (errorCount > 0) tooltipParts.push(`${errorCount} error${errorCount !== 1 ? 's' : ''}`);
    if (warningCount > 0) tooltipParts.push(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`);
    const tooltip = tooltipParts.join(', ');

    const variant = status === 'errors' ? 'validation-pill--errors' : 'validation-pill--warnings';

    return (
        <div className={`validation-pill ${variant}`} title={tooltip} aria-label={tooltip}>
            {errorCount > 0 && (
                <span className="validation-pill__group">
                    <i className="bi bi-x-circle-fill" />
                    <span className="validation-pill__count">{errorCount}</span>
                </span>
            )}
            {warningCount > 0 && (
                <span className="validation-pill__group">
                    <i className="bi bi-exclamation-triangle-fill" />
                    <span className="validation-pill__count">{warningCount}</span>
                </span>
            )}
        </div>
    );
}
