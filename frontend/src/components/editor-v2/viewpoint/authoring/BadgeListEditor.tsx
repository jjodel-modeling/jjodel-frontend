import React from 'react';
import { ListEditor, Input, Select, HelpText } from '../../../ui';
import type { BadgeSpec, BadgePosition } from '../ir/irTypes';

const POSITION_OPTIONS = [
    { value: 'tl', label: 'Top-left' },
    { value: 'tr', label: 'Top-right' },
    { value: 'bl', label: 'Bottom-left' },
    { value: 'br', label: 'Bottom-right' },
];

/** Read-only chip for values not editable in Basic (preserved verbatim). */
const CHIP: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-tertiary)',
    fontStyle: 'italic',
    padding: '2px 6px',
    border: '1px dashed var(--color-border-primary)',
    borderRadius: 'var(--radius-sm)',
};

function isConditional(x: unknown): boolean {
    return x !== null && typeof x === 'object' && ('when' in (x as any) || 'rules' in (x as any));
}

/** `visible` is required on a badge (never absent); describe it as a chip label. */
function describeVisible(visible: BadgeSpec['visible']): string {
    if (isConditional(visible)) return 'conditional (Advanced, phase B2b)';
    return visible ? 'always visible' : 'never visible';
}

/** New badge default (prompt B2a): a flag icon, top-right, always visible. */
const newBadge = (): BadgeSpec => ({ icon: 'bi-flag', position: 'tr', visible: true });

export interface BadgeListEditorProps {
    badges: BadgeSpec[];
    onChange: (badges: BadgeSpec[]) => void;
}

/**
 * BadgeListEditor — the `shape.badges[]` list. Each badge carries icon
 * (Bootstrap Icons class), position (tl/tr/bl/br), a required `visible` flag and
 * an optional tooltip. When `icon` or `visible` is a Conditional it is read-only
 * and round-trips verbatim (phase B2b); the required `visible` is preserved as-is
 * (literal or Conditional) since the whole draft is cloned.
 */
export const BadgeListEditor: React.FC<BadgeListEditorProps> = ({ badges, onChange }) => {
    const replace = (index: number, badge: BadgeSpec) => {
        const next = [...badges];
        next[index] = badge;
        onChange(next);
    };
    const remove = (index: number) => {
        const next = [...badges];
        next.splice(index, 1);
        onChange(next);
    };
    const move = (index: number, delta: number) => {
        const j = index + delta;
        if (j < 0 || j >= badges.length) return;
        const next = [...badges];
        [next[index], next[j]] = [next[j], next[index]];
        onChange(next);
    };

    return (
        <ListEditor<BadgeSpec>
            items={badges}
            onRemove={remove}
            onMove={move}
            onAdd={() => onChange([...badges, newBadge()])}
            addLabel="Add badge"
            emptyHint="No badges."
            itemLabel={(_b, i) => `Badge #${i + 1}`}
            renderItem={(badge, index) => {
                const iconConditional = isConditional(badge.icon);
                return (
                    <>
                        <div className="jj-field">
                            <label className="jj-field-label">Icon</label>
                            {iconConditional
                                ? <span style={CHIP}>conditional (Advanced, phase B2b)</span>
                                : <>
                                    <Input
                                        value={badge.icon as string}
                                        onChange={(e) => replace(index, { ...badge, icon: e.target.value })}
                                    />
                                    <HelpText>Bootstrap Icons class, e.g. bi-star-fill</HelpText>
                                </>}
                        </div>

                        <div className="jj-field">
                            <label className="jj-field-label">Position</label>
                            <Select
                                options={POSITION_OPTIONS}
                                value={badge.position}
                                onChange={(e) => replace(index, { ...badge, position: e.target.value as BadgePosition })}
                            />
                        </div>

                        <div className="jj-field">
                            <label className="jj-field-label">Visible</label>
                            <span style={CHIP}>{describeVisible(badge.visible)}</span>
                        </div>

                        <div className="jj-field">
                            <label className="jj-field-label">Tooltip</label>
                            <Input
                                value={badge.tooltip ?? ''}
                                onChange={(e) => replace(index, { ...badge, tooltip: e.target.value })}
                            />
                        </div>
                    </>
                );
            }}
        />
    );
};

export default BadgeListEditor;
