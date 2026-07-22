import React from 'react';
import { ListEditor, Input, Select, Checkbox, HelpText, ConditionalEditor, type PathBuilderFeatures } from '../../../ui';
import type { BadgeSpec, BadgePosition } from '../ir/irTypes';

const POSITION_OPTIONS = [
    { value: 'tl', label: 'Top-left' },
    { value: 'tr', label: 'Top-right' },
    { value: 'bl', label: 'Bottom-left' },
    { value: 'br', label: 'Bottom-right' },
];

/** New badge default (prompt B2a): a flag icon, top-right, always visible. */
const newBadge = (): BadgeSpec => ({ icon: 'bi-flag', position: 'tr', visible: true });

export interface BadgeListEditorProps {
    badges: BadgeSpec[];
    /** Feature descriptors for the target metaclass; null = PathBuilder disabled. */
    features: PathBuilderFeatures | null;
    featuresHint?: string;
    /** All project class names — for the `isKind` selector in conditional editors. */
    classNames: string[];
    onChange: (badges: BadgeSpec[]) => void;
}

/**
 * BadgeListEditor — the `shape.badges[]` list. Each badge carries icon
 * (Bootstrap Icons class), position (tl/tr/bl/br), a required `visible` flag and
 * an optional tooltip. When `icon` or `visible` is a Conditional it is read-only
 * and round-trips verbatim (phase B2b); the required `visible` is preserved as-is
 * (literal or Conditional) since the whole draft is cloned.
 */
export const BadgeListEditor: React.FC<BadgeListEditorProps> = ({ badges, features, featuresHint, classNames, onChange }) => {
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
                return (
                    <>
                        <div className="jj-field">
                            <label className="jj-field-label">Icon</label>
                            <ConditionalEditor
                                value={badge.icon}
                                onChange={(next) => replace(index, { ...badge, icon: next ?? '' })}
                                renderValue={(v, onCh) => (
                                    <>
                                        <Input value={v} onChange={(e) => onCh(e.target.value)} />
                                        <HelpText>Bootstrap Icons class, e.g. bi-star-fill</HelpText>
                                    </>
                                )}
                                defaultValue={''}
                                features={features}
                                featuresHint={featuresHint}
                                classNames={classNames}
                            />
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
                            <ConditionalEditor
                                value={badge.visible}
                                onChange={(next) => replace(index, { ...badge, visible: next ?? true })}
                                renderValue={(v, onCh) => <Checkbox checked={v} onChange={onCh} label="visible" />}
                                defaultValue={true}
                                features={features}
                                featuresHint={featuresHint}
                                classNames={classNames}
                            />
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
