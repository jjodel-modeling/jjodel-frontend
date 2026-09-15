import React from 'react';
import { Select, Input, PathBuilder, type PathBuilderFeatures } from '../../../ui';
import type { TextSource } from '../ir/irTypes';

export interface TextSourceEditorProps {
    source: TextSource;
    onChange: (source: TextSource) => void;
    /** Feature descriptors for the target metaclass; null = disabled PathBuilder (wildcard/none). */
    features: PathBuilderFeatures | null;
    disabled?: boolean;
    disabledHint?: string;
}

const FROM_OPTIONS = [
    { value: 'intrinsic', label: 'Intrinsic property' },
    { value: 'path', label: 'Feature path' },
    { value: 'literal', label: 'Literal text' },
];

const INTRINSIC_OPTIONS = [
    { value: 'name', label: 'name' },
    { value: 'metaclassName', label: 'metaclass name' },
    { value: 'qualifiedName', label: 'name : Metaclass' },
];

/**
 * Editor for a TextSource: intrinsic property | feature path | literal text.
 * The `path` mode is where the PathBuilder (Fase A) enters — the only place a
 * PathExpr is authored for a label.
 */
export const TextSourceEditor: React.FC<TextSourceEditorProps> = ({
    source,
    onChange,
    features,
    disabled,
    disabledHint,
}) => {
    const changeFrom = (from: string) => {
        if (from === 'path') {
            onChange({ from: 'path', expr: source.from === 'path' ? source.expr : '' });
        } else if (from === 'literal') {
            onChange({ from: 'literal', text: source.from === 'literal' ? source.text : '' });
        } else {
            onChange({ from: 'intrinsic', prop: source.from === 'intrinsic' ? source.prop : 'name' });
        }
    };

    return (
        <div className="jj-field">
            <Select
                options={FROM_OPTIONS}
                value={source.from}
                disabled={disabled}
                onChange={(e) => changeFrom(e.target.value)}
            />

            {source.from === 'intrinsic' && (
                <Select
                    options={INTRINSIC_OPTIONS}
                    value={source.prop}
                    disabled={disabled}
                    onChange={(e) => onChange({ from: 'intrinsic', prop: e.target.value as 'name' | 'metaclassName' | 'qualifiedName' })}
                />
            )}

            {source.from === 'literal' && (
                <Input
                    value={source.text}
                    disabled={disabled}
                    onChange={(e) => onChange({ from: 'literal', text: e.target.value })}
                />
            )}

            {source.from === 'path' && (
                <PathBuilder
                    features={features}
                    value={source.expr}
                    disabled={disabled}
                    disabledHint={disabledHint}
                    onChange={(expr) => onChange({ from: 'path', expr })}
                />
            )}
        </div>
    );
};

export default TextSourceEditor;
