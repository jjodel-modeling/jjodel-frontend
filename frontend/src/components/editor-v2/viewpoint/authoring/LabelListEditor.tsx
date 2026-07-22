import React from 'react';
import { ListEditor, type PathBuilderFeatures } from '../../../ui';
import { LabelEntryEditor } from './LabelEntryEditor';
import type { LabelSpec } from '../ir/irTypes';

/** New label default (spec/prompt B2a): a blank literal at the bottom, no visible/editable seed. */
const newLabel = (): LabelSpec => ({ position: 'bottom', source: { from: 'literal', text: '' } });

export interface LabelListEditorProps {
    labels: LabelSpec[];
    /** Feature descriptors for the target metaclass; null = PathBuilder disabled. */
    features: PathBuilderFeatures | null;
    featuresHint?: string;
    onChange: (labels: LabelSpec[]) => void;
}

/**
 * LabelListEditor — the full `shape.labels[]` list (add/remove/reorder), each
 * entry authored via LabelEntryEditor. Replaces the Fase B inline editor that
 * handled only `labels[0]`. Emits immutable arrays; the panel commit cycle
 * (validate + debounced whole-object write) is untouched.
 */
export const LabelListEditor: React.FC<LabelListEditorProps> = ({
    labels,
    features,
    featuresHint,
    onChange,
}) => {
    const replace = (index: number, label: LabelSpec) => {
        const next = [...labels];
        next[index] = label;
        onChange(next);
    };
    const remove = (index: number) => {
        const next = [...labels];
        next.splice(index, 1);
        onChange(next);
    };
    const move = (index: number, delta: number) => {
        const j = index + delta;
        if (j < 0 || j >= labels.length) return;
        const next = [...labels];
        [next[index], next[j]] = [next[j], next[index]];
        onChange(next);
    };

    return (
        <ListEditor<LabelSpec>
            items={labels}
            onRemove={remove}
            onMove={move}
            onAdd={() => onChange([...labels, newLabel()])}
            addLabel="Add label"
            emptyHint="No labels — the node renders without text."
            itemLabel={(_l, i) => `Label #${i + 1}`}
            renderItem={(label, index) => (
                <LabelEntryEditor
                    label={label}
                    features={features}
                    featuresHint={featuresHint}
                    onChange={(l) => replace(index, l)}
                />
            )}
        />
    );
};

export default LabelListEditor;
