/* Apply to - Redesigned to match Properties tab */

import React, {Dispatch} from 'react';
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
    LViewPoint, MultiSelect,
    Pointer,
    Select,
    Vertexes
} from '../../../../joiner';
import {JsEditor, OclEditor} from "../../languages";
import {FakeStateProps} from "../../../../joiner/types";
import {connect} from "react-redux";
import "./viewapplyto.scss";
import "./viewoptions.scss"


function InfoDataComponent(props: AllProps) {
    const view = props.view;
    const viewpoints = props.viewpoints;
    let readOnly = props.readonly;
    let vp = view.viewpoint;
    let vpid = vp?.id;
    let dallVP: DViewPoint[] = viewpoints.map(v=>v.__raw);

    const objectTypes = ['', 'DModel', 'DPackage', 'DEnumerator', 'DEnumLiteral', 'DClass', 'DAttribute', 'DReference', 'DOperation', 'DParameter', 'DObject', 'DValue', 'DStructuralFeature'];
    const classesOptionsJSX = <optgroup label={'Object type'}>
            {objectTypes.map((o)=><option key={o} value={o}>{o ? o.substring(1) : 'anything'}</option>)}
    </optgroup>;
    const classesOptions = [{label:'apply to', options: objectTypes.map(o=>({value:o, label:o ? o.substring(1) : 'anything'}))}];

    let isVP: boolean = view.className === DViewPoint.cname;
    let isV: boolean = !isVP;

    return(<section className={'apply-to-tab'}>
        {/* Name field - vertical layout */}
        <div className="form-field">
            <label className="form-label">Name</label>
            <Input data={view} field={'name'} readOnly={readOnly} className="form-input" />
        </div>

        {/* Is Exclusive - Toggle switch */}
        <div className="form-field form-field--toggle">
            <div className="toggle-content">
                <span className="toggle-label">Is Exclusive</span>
                <span className="toggle-description">This view is exclusive to its viewpoint</span>
            </div>
            <button
                type="button"
                className={`apply-to-toggle ${view.isExclusiveView ? 'active' : ''}`}
                onClick={() => { if (!readOnly) view.isExclusiveView = !view.isExclusiveView; }}
                disabled={readOnly}
            >
                <span className="apply-to-toggle-thumb" />
            </button>
        </div>

        {isV && <>
            {/* Priority - vertical layout */}
            <div className="form-field">
                <label className="form-label">Priority</label>
                <Input
                    data={view}
                    field={'explicitApplicationPriority'}
                    type={'number'}
                    readOnly={readOnly}
                    className="form-input"
                    getter={(data: LViewElement)=>{ let v = data.__raw.explicitApplicationPriority; return v === undefined ? v : ''+v; }}
                    setter={(v)=>{ view.explicitApplicationPriority = (v ? +v as number : undefined as any); }}
                    placeholder={'automatic: ' + view.explicitApplicationPriority}
                    key={''+view.explicitApplicationPriority}
                />
            </div>

            {/* Preferred appearance - vertical layout */}
            <div className="form-field">
                <label className="form-label">Preferred appearance</label>
                <Select
                    data={view}
                    field={'forceNodeType'}
                    readOnly={readOnly}
                    className="form-select"
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

            {/* Applicable to - vertical layout */}
            <div className="form-field">
                <label className="form-label">Applicable to</label>
                <Select
                    data={view}
                    field={'appliableToClasses'}
                    readOnly={readOnly}
                    isMultiSelect={true}
                    options={classesOptions as any}
                    className="form-select"
                />
            </div>

            {/* Viewpoint - vertical layout */}
            <div className="form-field">
                <label className="form-label">Viewpoint</label>
                <Select
                    readOnly={readOnly}
                    data={view}
                    field={'father'}
                    getter={()=> vpid}
                    className="form-select"
                >
                    <option value="">Select viewpoint...</option>
                    {dallVP.map((viewpoint) => (
                        <option key={viewpoint.id} value={viewpoint.id}>{viewpoint.name}</option>
                    ))}
                </Select>
            </div>

            {/* Parent view - vertical layout */}
            <div className="form-field">
                <label className="form-label">Parent view</label>
                <Select
                    readOnly={readOnly}
                    data={view}
                    field={'father'}
                    className="form-select"
                >
                    <option value="">None</option>
                    {view.allPossibleParentViews.filter(v=>v.viewpoint?.id === vpid).map((view) => (
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
    </section>);
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
