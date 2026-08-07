/**
 * ViewParentingFields — the parenting block of the "Applies to" body.
 *
 * One implementation, two hosts: the IR `Applies to` body (`irTabs.tsx`, where R-H put
 * the relocated controls) and the legacy Apply-to tab (`InfoData.tsx`, still the host
 * for views without an `ir`). Before this, the two carried the same markup twice by
 * construction; a block with an interactive action and a filtered list could not stay
 * duplicated without the two halves drifting apart.
 *
 * What changed with respect to what R-H relocated (voce 4, 2026-08-07):
 *  - the "Viewpoint" select is gone. The viewpoint is DERIVED, and the model already
 *    said so: `LViewElement.set_viewpoint` logs "call view.setFather(viewpoint) instead"
 *    and writes nothing. It is a read-only row now (D-4-1).
 *  - "Parent view" is the single writer of `father`, through `set_father` (D-4-2). Its
 *    list carries the root of the viewpoint as the first entry and excludes the view's
 *    own subtree (D-4-6); "None" is gone (D-4-7).
 *  - moving a view to another viewpoint is an explicit action with a confirmation that
 *    states the consequence, not a side effect of picking from a select (D-4-3). The
 *    subtree follows: the cascade lives in `set_father` (D-4-4/D-4-8).
 *
 * See docs/discovery/discovery_2026-08-07_father_single_writer.md.
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { LProject, Select, type LViewElement, type LViewPoint } from '../../joiner';
import { readViewParenting } from './viewParentingOptions';
import './viewParenting.scss';

// Inline info icon with hover tooltip — local copy of the `InfoTooltip` helper in
// `Info.tsx`, `InfoData.tsx` and `irTabs.tsx` (none of them exports it). Same
// duplication those files already declare, carried here so the fields render verbatim.
function InfoTooltip(props: { text: string }) {
    const [show, setShow] = useState(false);
    return (
        <span className="jj-info-icon-wrapper"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <span className="jj-info-icon">i</span>
            {show && <span className="jj-info-tooltip">{props.text}</span>}
        </span>
    );
}

export interface ViewParentingFieldsProps {
    view: LViewElement;
    /** The project's viewpoints, as both hosts already receive them. */
    viewpoints: LViewPoint[];
    readOnly: boolean;
}

export const ViewParentingFields: React.FC<ViewParentingFieldsProps> = ({ view, viewpoints, readOnly }) => {
    const [moveOpen, setMoveOpen] = useState(false);
    const [moveTarget, setMoveTarget] = useState('');

    // Subscribed explicitly, not inherited from the host: two of the three panels that
    // mount this block select nothing (`RowAuthoringPanel`, `EdgeAuthoringPanel`) and the
    // third only reads `advanced`. A move writes `viewpoint` on the descendants, so
    // without this the row and the list would keep showing the state before the move.
    const state: any = useSelector((s: any) => s);
    const facts = readViewParenting(state, view.id as any);

    const activeViewpointId = LProject.getProject()?.activeViewpoint?.id;
    const isActive = !!facts.viewpointId && facts.viewpointId === activeViewpointId;

    // A move to the viewpoint it is already in is not a move.
    const moveTargets = (viewpoints || []).filter((vp) => vp && vp.id !== facts.viewpointId);

    const closeMove = () => { setMoveOpen(false); setMoveTarget(''); };
    const confirmMove = () => {
        if (readOnly || !moveTarget) return;
        // The root of the target viewpoint IS the viewpoint: this is the same single
        // write path as the Parent view select, cascade included.
        (view as any).father = moveTarget;
        closeMove();
    };

    const followers = facts.descendantCount;

    return (
        <>
            {/* Viewpoint — derived from the parent chain, never written from here (D-4-1) */}
            <div className="jj-field">
                <div className="jj-field-label">
                    Viewpoint
                    <InfoTooltip text="The viewpoint this view is filed under. It follows the parent — use Move to viewpoint to change it." />
                </div>
                <div className="jj-viewpoint-row">
                    <span className="jj-viewpoint-row__name">{facts.viewpointName || 'none'}</span>
                    <span className={'jj-viewpoint-row__state' + (isActive ? ' is-active' : '')}>
                        {isActive ? 'active' : 'not active'}
                    </span>
                </div>

                {!readOnly && moveTargets.length > 0 && (
                    <div className="jj-move-vp">
                        {!moveOpen ? (
                            <button type="button" className="jj-move-vp__open" onClick={() => setMoveOpen(true)}>
                                <i className="bi bi-box-arrow-right" aria-hidden="true" />
                                Move to viewpoint…
                            </button>
                        ) : (
                            <>
                                <select
                                    className="jj-move-vp__select"
                                    value={moveTarget}
                                    onChange={(e) => setMoveTarget(e.target.value)}
                                >
                                    <option value="">Select viewpoint…</option>
                                    {moveTargets.map((vp) => (
                                        <option key={vp.id} value={vp.id}>{vp.name}</option>
                                    ))}
                                </select>
                                <p className="jj-move-vp__note">
                                    {followers > 0
                                        ? `${followers} sub-view${followers === 1 ? '' : 's'} will follow.`
                                        : 'This view has no sub-views.'}
                                </p>
                                <div className="jj-move-vp__actions">
                                    <button type="button" className="jj-move-vp__cancel" onClick={closeMove}>Cancel</button>
                                    <button type="button" className="jj-move-vp__confirm" onClick={confirmMove} disabled={!moveTarget}>
                                        Move
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Parent view — the single writer of `father` (D-4-2) */}
            <div className="jj-field">
                <div className="jj-field-label">
                    Parent view
                    <InfoTooltip text="Inherit settings from a parent view. The root entry files this view directly under its viewpoint." />
                </div>
                <Select
                    readOnly={readOnly}
                    data={view}
                    field={'father'}
                    jjSelect={true}
                    placeholder={facts.detached ? 'Detached — pick a parent' : 'Select parent view...'}
                    options={facts.parentOptions as any}
                />
                {facts.detached && (
                    <p className="jj-field-detached">
                        This view has no parent, so it is filed under no viewpoint. Pick one to restore it.
                    </p>
                )}
            </div>
        </>
    );
};

export default ViewParentingFields;
