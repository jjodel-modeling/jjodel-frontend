/* Apply to - Uses the jj-* design system classes from Info.tsx baseline */

import React, {Dispatch, useState} from 'react';
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
    LViewElement,
    LViewPoint,
    Pointer,
    Select,
    Vertexes
} from '../../../../joiner';
import {JsEditor, OclEditor} from "../../languages";
import {FakeStateProps} from "../../../../joiner/types";
import {connect} from "react-redux";
import {Toggle} from '../../../ui';
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

function InfoDataComponent(props: AllProps) {
    const view = props.view;
    const viewpoints = props.viewpoints;
    const readOnly = props.readonly;
    const vp = view.viewpoint;
    const vpid = vp?.id;
    const dallVP: DViewPoint[] = viewpoints.map(v => v.__raw);

    const objectTypes = ['', 'DModel', 'DPackage', 'DEnumerator', 'DEnumLiteral', 'DClass', 'DAttribute', 'DReference', 'DOperation', 'DParameter', 'DObject', 'DValue', 'DStructuralFeature'];
    const classesOptions = [{label:'', options: objectTypes.map(o=>({value:o, label:o ? o.substring(1) : 'anything'}))}];

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
        if (!readOnly) (view as any).isEdge = checked;
    };

    const handleEdgeRowClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button[role="switch"]')) return;
        if (!readOnly) (view as any).isEdge = !(view as any).isEdge;
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

            <div className="jj-toggle-row" onClick={handleEdgeRowClick}>
                <span className="jj-toggle-row__label">
                    Is Edge
                    <InfoTooltip text="Marks this view as an edge in the L2 overlay. When enabled, instances of the matched metaclass are drawn as connecting paths between two endpoint nodes resolved from the JjEL expressions below." />
                </span>
                <Toggle
                    checked={(view as any).isEdge}
                    onChange={handleEdgeToggle}
                    size="xs"
                    disabled={readOnly}
                />
            </div>

            {(view as any).isEdge && (
                <>
                    <div className="jj-field">
                        <label className="jj-field-label">
                            Edge Source
                            <InfoTooltip text="JjEL expression resolving to the LObject visualized as the source endpoint of the edge. Typically the name of an EReference of the metaclass (e.g. 'src')." />
                        </label>
                        <Input data={view} field={'edgeSource'} readOnly={readOnly} />
                    </div>
                    <div className="jj-field">
                        <label className="jj-field-label">
                            Edge Target
                            <InfoTooltip text="JjEL expression resolving to the LObject visualized as the target endpoint of the edge. Typically the name of an EReference of the metaclass (e.g. 'tgt')." />
                        </label>
                        <Input data={view} field={'edgeTarget'} readOnly={readOnly} />
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
                        options={
                            <>
                                <option value={'unset'} key={-1}>Select appearance...</option>
                                <optgroup label={'Graph'} key={0}>{
                                    Object.keys(Graphs).map((key: string) => <option value={key} key={key}>{GraphElements[key].cname}</option>)
                                }</optgroup>
                                <optgroup label={'Edge'} key={1}>{
                                    Object.keys(Edges).map((key: string) => <option value={key} key={key}>{GraphElements[key].cname}</option>)
                                }</optgroup>
                                <optgroup label={'Field'} key={3}>{
                                    Object.keys(Fields).map((key: string) => <option value={key} key={key}>{GraphElements[key].cname}</option>)
                                }</optgroup>
                                <optgroup label={'Vertex'} key={2}>{
                                    Object.keys(Vertexes).map((key: string) => <option value={key} key={key}>{GraphElements[key].cname}</option>)
                                }</optgroup>
                            </>
                        }
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
                        options={classesOptions as any}
                    />
                </div>

                {/* Viewpoint */}
                <div className="jj-field">
                    <div className="jj-field-label">
                        Viewpoint
                        <InfoTooltip text="The viewpoint this view belongs to" />
                    </div>
                    <Select
                        readOnly={readOnly}
                        data={view}
                        field={'father'}
                        getter={() => vpid}
                    >
                        <option value="">Select viewpoint...</option>
                        {...dallVP.map((viewpoint) => (
                            <option key={viewpoint.id} value={viewpoint.id}>{viewpoint.name}</option>
                        ))}
                    </Select>
                </div>

                {/* Parent view */}
                <div className="jj-field">
                    <div className="jj-field-label">
                        Parent view
                        <InfoTooltip text="Inherit settings from a parent view" />
                    </div>
                    <Select
                        readOnly={readOnly}
                        data={view}
                        field={'father'}
                    >
                        <option value="">None</option>
                        {...view.allPossibleParentViews.filter(v => v.viewpoint?.id === vpid).map((view) => (
                            <option key={view.id} value={view.id}>{view.name}</option>
                        ))}
                    </Select>
                </div>

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
