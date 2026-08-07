/* Apply to - Uses the jj-* design system classes from Info.tsx baseline */

import React, {Dispatch, useMemo, useState} from 'react';
import {
    DState,
    DViewElement,
    DViewPoint,
    Edges,
    Fields,
    GraphElements,
    Graphs,
    Input,
    LPointerTargetable,
    LProject,
    LViewElement,
    LViewPoint,
    Pointer,
    Select,
    TRANSACTION,
    Vertexes
} from '../../../../joiner';
import {JsEditor, OclEditor} from "../../languages";
import {FakeStateProps} from "../../../../joiner/types";
import {connect} from "react-redux";
import {Toggle} from '../../../ui';
import {EdgeCandidateResult, findEdgeCandidate} from './edgeCandidate';
import {ViewParentingFields} from '../../../viewParenting/ViewParentingFields';
import "./viewapplyto.scss";
import "./viewoptions.scss"

// Inline info icon with hover tooltip — local copy of the `InfoTooltip`
// helper in `Info.tsx` (not exported). Constrained to not touching Info.tsx.
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

interface EdgeCandidateBannerProps {
    onApply: () => void;
    readOnly?: boolean;
}

function EdgeCandidateBanner(props: EdgeCandidateBannerProps) {
    return (
        <div className="edge-candidate-banner">
            <div className="edge-candidate-banner__header">
                <i className="bi bi-lightbulb" aria-hidden="true" />
                <div className="edge-candidate-banner__text">
                    <p className="edge-candidate-banner__title">Looks like an edge candidate</p>
                    <p className="edge-candidate-banner__body">
                        This metaclass has two references. We can wire them as the edge source and target.
                    </p>
                </div>
            </div>
            <button
                type="button"
                className="edge-candidate-banner__apply"
                onClick={props.onApply}
                disabled={props.readOnly}
                title={props.readOnly ? 'Read-only mode' : undefined}
            >
                Apply suggestions
            </button>
        </div>
    );
}

function InfoDataComponent(props: AllProps) {
    const view = props.view;
    const viewpoints = props.viewpoints;
    const readOnly = props.readonly;

    const objectTypes = ['', 'DModel', 'DPackage', 'DEnumerator', 'DEnumLiteral', 'DClass', 'DAttribute', 'DReference', 'DOperation', 'DParameter', 'DObject', 'DValue', 'DStructuralFeature'];
    // Reactive at render: connect() re-runs mapStateToProps on every dispatch,
    // so a metamodel adding/removing classes triggers a fresh proxy read here.
    const metamodels = LProject.getProject()?.metamodels || [];
    const classesOptions = [
        {label: '', options: objectTypes.map(o => ({value: o, label: o ? o.substring(1) : 'anything'}))},
        ...metamodels.map(mm => ({
            label: `Classes from ${mm.name}`,
            options: (mm.classes || [])
                .filter(c => c && c.id)
                .map(c => ({value: c.id, label: `${mm.name}.${c.name || 'unnamed'}`})),
        })).filter(g => g.options.length > 0),
    ];

    const isVP: boolean = view.className === DViewPoint.cname;
    const isV: boolean = !isVP;

    const handleExclusiveToggle = (checked: boolean) => {
        if (!readOnly) view.isExclusiveView = checked;
    };

    const handleExclusiveRowClick = (e: React.MouseEvent) => {
        // Avoid double-trigger when the click lands on the toggle button itself
        if ((e.target as HTMLElement).closest('button[role="switch"]')) return;
        if (!readOnly) view.isExclusiveView = !view.isExclusiveView;
    };

    const handleEdgeToggle = (checked: boolean) => {
        if (!readOnly) view.isEdge = checked;
    };

    const handleEdgeRowClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button[role="switch"]')) return;
        if (!readOnly) view.isEdge = !view.isEdge;
    };

    // L2.x.1 polish v2 — Edge-candidate heuristic. Pipeline (see edgeCandidate.ts):
    // appliableToClasses → oclCondition → jsCondition. Banner appears only when one
    // source produces a unique DClass with exactly two declared references.
    const project = LProject.getProject();
    const edgeCandidate: EdgeCandidateResult | null = useMemo(() => {
        if (view.isEdge === true) return null;
        if (!project) return null;
        return findEdgeCandidate(view, project);
    }, [view.isEdge, view.appliableToClasses, view.oclCondition, view.jsCondition, project?.id]);

    // L2.x.2 — Apply suggestions: wire the first two declared references as
    // source/target via the $<refName>.value pattern. The fourth write populates
    // appliableToClasses only when empty (path-from-predicate, length === 0); when
    // path-from-appliableToClasses (length === 1, valid classifier) the guard skips
    // it to preserve the explicit user choice. All wrapped in a single TRANSACTION
    // so writes commit as one composite action / one undo entry.
    const handleApplyEdgeSuggestions = () => {
        if (!edgeCandidate) return;
        const {classifier, refNames} = edgeCandidate;
        const [ref0Name, ref1Name] = refNames;
        TRANSACTION('Apply edge suggestions', () => {
            view.isEdge = true;
            view.edgeSource = `$${ref0Name}.value`;
            view.edgeTarget = `$${ref1Name}.value`;
            if (!view.appliableToClasses || view.appliableToClasses.length === 0) {
                view.appliableToClasses = [classifier.id];
            }
        });
    };

    return (
        <section className={'properties-tab properties-panel'}>
            {/* Name */}
            <div className="jj-field">
                <label className="jj-field-label">
                    Name <span className="jj-field-required">*</span>
                    <InfoTooltip text="Display name of this view" />
                </label>
                <Input data={view} field={'name'} readOnly={readOnly} />
            </div>

            {/* Is Exclusive — inline toggle row matching PropertiesToggle pattern */}
            <div className="jj-toggle-row" onClick={handleExclusiveRowClick}>
                <span className="jj-toggle-row__label">
                    Is Exclusive
                    <InfoTooltip text="This view is exclusive to its viewpoint" />
                </span>
                <Toggle
                    checked={view.isExclusiveView}
                    onChange={handleExclusiveToggle}
                    size="xs"
                    disabled={readOnly}
                />
            </div>

            {edgeCandidate && (
                <EdgeCandidateBanner
                    onApply={handleApplyEdgeSuggestions}
                    readOnly={readOnly}
                />
            )}

            <div className="jj-toggle-row" onClick={handleEdgeRowClick}>
                <span className="jj-toggle-row__label">
                    Is Edge
                    <InfoTooltip text="Marks this view as an edge in the L2 overlay. When enabled, instances of the matched metaclass are drawn as connecting paths between two endpoint nodes resolved from the JjEL expressions below." />
                </span>
                <Toggle
                    checked={view.isEdge}
                    onChange={handleEdgeToggle}
                    size="xs"
                    disabled={readOnly}
                />
            </div>

            {view.isEdge && (
                <>
                    <div className="jj-field">
                        <label className="jj-field-label">
                            Edge Source
                            <InfoTooltip text="JjEL expression evaluating to the LObject that anchors the source endpoint of the edge. To dereference a reference feature, use $<refName>.value (e.g. $source.value). The bare reference name (source) returns a DValue, which silently fails to render." />
                        </label>
                        <Input data={view} field={'edgeSource'} readOnly={readOnly} />
                    </div>
                    <div className="jj-field">
                        <label className="jj-field-label">
                            Edge Target
                            <InfoTooltip text="JjEL expression evaluating to the LObject that anchors the target endpoint of the edge. To dereference a reference feature, use $<refName>.value (e.g. $target.value). The bare reference name (target) returns a DValue, which silently fails to render." />
                        </label>
                        <Input data={view} field={'edgeTarget'} readOnly={readOnly} />
                    </div>
                    <div className="jj-field">
                        <label className="jj-field-label">
                            Edge Routing
                            <InfoTooltip text="Path style used by the L2 overlay to draw this edge. Manhattan (rounded) is the default — orthogonal segments with rounded corners. Straight is a single line between source and target side midpoints. Bezier is a cubic curve with tangents normal to the chosen exit/entry sides." />
                        </label>
                        <Select
                            data={view}
                            field={'edgeRouting'}
                            readOnly={readOnly}
                            jjSelect={true}
                            options={[
                                { value: 'manhattan-rounded', label: 'Manhattan (rounded)' },
                                { value: 'straight', label: 'Straight' },
                                { value: 'bezier', label: 'Bezier curve' },
                            ] as any}
                            getter={(d: LViewElement) => d.edgeRouting || 'manhattan-rounded'}
                            setter={(v: string) => { view.edgeRouting = v as any; }}
                        />
                    </div>
                    <div className="jj-field">
                        <label className="jj-field-label">
                            Edge Label
                            <InfoTooltip text="JjEL expression evaluated as the edge label text. Leave empty for no label. Example: $instance.name" />
                        </label>
                        <Input data={view} field={'edgeLabel'} readOnly={readOnly} />
                    </div>
                </>
            )}

            {isV && <>
                {/* Priority */}
                <div className="jj-field">
                    <div className="jj-field-label">
                        Priority
                        <InfoTooltip text="Higher priority views are evaluated first; automatic if unset" />
                    </div>
                    <Input
                        data={view}
                        field={'explicitApplicationPriority'}
                        type={'number'}
                        readOnly={readOnly}
                        getter={(data: LViewElement) => { let v = data.__raw.explicitApplicationPriority; return v === undefined ? v : ''+v; }}
                        setter={(v) => { view.explicitApplicationPriority = (v ? +v as number : undefined as any); }}
                        placeholder={'automatic: ' + view.explicitApplicationPriority}
                        key={''+view.explicitApplicationPriority}
                    />
                </div>

                {/* Preferred appearance */}
                <div className="jj-field">
                    <div className="jj-field-label">
                        Preferred appearance
                        <InfoTooltip text="Force rendering as a specific graph element type" />
                    </div>
                    <Select
                        data={view}
                        field={'forceNodeType'}
                        readOnly={readOnly}
                        jjSelect={true}
                        options={[
                            { value: 'unset', label: 'Select appearance...' },
                            { label: 'Graph', options: Object.keys(Graphs).map((key: string) => ({ value: key, label: GraphElements[key].cname })) },
                            { label: 'Edge', options: Object.keys(Edges).map((key: string) => ({ value: key, label: GraphElements[key].cname })) },
                            { label: 'Field', options: Object.keys(Fields).map((key: string) => ({ value: key, label: GraphElements[key].cname })) },
                            { label: 'Vertex', options: Object.keys(Vertexes).map((key: string) => ({ value: key, label: GraphElements[key].cname })) },
                        ] as any}
                        setter={(val, data, key) => { view.forceNodeType = val === 'unset' ? undefined : val; }}
                        getter={(data, key) => { return data[key] || 'unset'; }}
                    />
                </div>

                {/* Applicable to */}
                <div className="jj-field">
                    <div className="jj-field-label">
                        Applicable to
                        <InfoTooltip text="Restrict this view to specific metamodel element types" />
                    </div>
                    <Select
                        data={view}
                        field={'appliableToClasses'}
                        readOnly={readOnly}
                        isMultiSelect={true}
                        jjSelect={true}
                        options={classesOptions as any}
                    />
                </div>

                {/* Viewpoint (derived) + Parent view + Move to viewpoint — voce 4, 2026-08-07.
                    The two selects here both wrote `father`: picking a viewpoint reparented
                    the view to the root and dropped the parent without saying so. One block,
                    one writer now, shared with the IR `Applies to` body (irTabs.tsx). */}
                <ViewParentingFields view={view} viewpoints={viewpoints} readOnly={readOnly} />

                {/* OCL Editor */}
                <OclEditor viewID={view.id} readOnly={readOnly} />

                {/* JS Editor */}
                <JsEditor
                    data={view} field={'jsCondition'}
                    placeHolder={'/* Last line must return a score (number) or boolean*/'}
                />
            </>}
        </section>
    );
}

interface OwnProps {
    viewID: Pointer<DViewElement>;
    viewpointsID: Pointer<DViewPoint>[];
    readonly: boolean;
}

interface StateProps {
    view: LViewElement;
    viewpoints: LViewPoint[];
}

interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.view = LPointerTargetable.fromPointer(ownProps.viewID);
    ret.viewpoints = LPointerTargetable.fromPointer(ownProps.viewpointsID);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const InfoData = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(InfoDataComponent);

export default InfoData;
