import React, { useMemo, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { EditorV2 } from '../../editor-v2/EditorV2';
import { EditorV3Shell } from '../../editor-v3';
import { Badge } from '../../common/Badge';
import './EditorSwitch.scss';

const STORAGE_KEY = 'jjodel-editor-preference';

export type EditorMode = 'classic' | 'v2' | 'v3';

interface EditorSwitchProps {
    /** Model ID passed to both editors. */
    modelid: string;
    /** The classic editor content (rendered as children). */
    children: ReactNode;
}

/**
 * Wrapper that auto-switches between the classic editor and Editor v2
 * based on viewpoint state. When a viewpoint is active, uses the classic
 * editor (concrete syntax); otherwise, uses Editor v2 (abstract syntax).
 *
 * V3 editor is accessible via localStorage override (dev only):
 *   localStorage.setItem('jjodel-editor-preference', 'v3')
 */
export function EditorSwitch({ modelid, children }: EditorSwitchProps) {
    const viewpointId = useSelector((state: any) => state.viewpoint);

    const mode: EditorMode = useMemo(() => {
        // Dev override: allow V3 access via localStorage
        const devOverride = localStorage.getItem(STORAGE_KEY);
        if (devOverride === 'v3') return 'v3';

        // Auto-switch: viewpoint selected → classic, otherwise → v2 (Flow)
        return viewpointId ? 'classic' : 'v2';
    }, [viewpointId]);

    const syntaxLabel = viewpointId ? 'Concrete syntax' : 'Abstract syntax';

    return (
        <div className="editor-switch-container">
            {/* Syntax mode indicator */}
            <div className="editor-switch-syntax">
                <Badge category="state">
                    <i className={`bi ${viewpointId ? 'bi-eye' : 'bi-diagram-3'}`} />
                    {syntaxLabel}
                </Badge>
            </div>

            {/* Render the active editor */}
            {mode === 'classic' ? (
                children
            ) : mode === 'v2' ? (
                <div className="editor-switch-v2-wrapper">
                    <EditorV2 modelid={modelid} />
                </div>
            ) : (
                <div className="editor-switch-v2-wrapper">
                    <EditorV3Shell modelid={modelid} />
                </div>
            )}
        </div>
    );
}

export default EditorSwitch;
