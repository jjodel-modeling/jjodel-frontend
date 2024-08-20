import React, {Dispatch} from 'react';
import {
    Defaults, DState, DUser,
    DViewElement,
    DViewPoint,
    Input, LPointerTargetable,
    LProject, LUser,
    LViewElement,
    LViewPoint,
    Pointer,
    Select,
    Selectors
} from '../../../../joiner';
import {OclEditor} from '../../oclEditor/OclEditor';
import {Edges, Fields, GraphElements, Graphs, Vertexes} from "../../../../joiner/components";
import JsEditor from "../../jsEditor/JsEditor";
import {FakeStateProps} from "../../../../joiner/types";
import {connect} from "react-redux";

import "./vieweditor.scss";

function InfoDataComponent(props: AllProps) {
    const view = props.view;
    const viewpoints = props.viewpoints;
    let readOnly = props.readonly;
    let vp = view.viewpoint;
    let vpid = vp?.id;
    let dallVP: DViewPoint[] = viewpoints.map(v=>v.__raw); //Selectors.getAll(DViewPoint, undefined, undefined, true, false);
    // readOnly = false;

    const objectTypes = ['', 'DModel', 'DPackage', 'DEnumerator', 'DEnumLiteral', 'DClass', 'DAttribute', 'DReference', 'DOperation', 'DParameter', 'DObject', 'DValue', 'DStructuralFeature'];
    const classesOptions = <optgroup label={'Object type'}>
            {objectTypes.map((o)=><option key={o} value={o}>{o ? o.substring(1) : 'anything'}</option>)}
    </optgroup>;

    return(<section className={'page-root properties-tab'}>
        <h1 className={'view'}>View: {view.name}</h1>
        <Input data={view} field={'name'} label={'Name:'} readonly={readOnly}/>
        <Input data={view} field={'isExclusiveView'} label={'Is Exclusive:'} type={"checkbox"} readonly={readOnly}
               //setter={(val) => { view.isExclusiveView = !val}}
               //getter={(data) => !(data as LViewElement).isExclusiveView as any
        />
        <Input data={view} field={'explicitApplicationPriority'} label={'Priority:'} type={'number'} readonly={readOnly}
               getter={(data: LViewElement)=>{ let v = data.__raw.explicitApplicationPriority; return v === undefined ? v : ''+v; }}
               setter={(v)=>{ view.explicitApplicationPriority = (v ? +v as number : undefined as any); }}
               placeholder={'automatic: ' + view.explicitApplicationPriority}
               key={''+view.explicitApplicationPriority/*just to force reupdate if placeholder changes*/}
        />
        {/* moved in "options"
        <Select data={view} field={'appliableTo'} label={'Appliable to node types'} readonly={readOnly} options={<optgroup label={'Appliable Types'}>
            <option value={'node'}>Node</option>
            <option value={'edge'}>Edge</option>
            <option value={'edgePoint'}>Edge Point</option>
        </optgroup>} />
        */}
        <Select data={view} field={'forceNodeType'} label={'Preferred appearance:'} readonly={readOnly} options={
            <>
                <option value={'unset'} key={-1}>Automatic by model type (package, object, feature...)</option>
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
        } setter={(val, data, key) => { view.forceNodeType = val === 'unset' ? undefined : val; }}
          getter={(data, key) => { return data[key] || 'unset_'; }} />
        <Select data={view} field={'appliableToClasses'} label={'Appliable to:'} readonly={readOnly} options={classesOptions} />

        <Select readonly={readOnly} data={view} field={'father'} label={"Viewpoint:"} getter={()=> vpid}>
            {dallVP.map((viewpoint) => (
                <option key={viewpoint.id} value={viewpoint.id}>{viewpoint.name}</option>
            ))}
        </Select>
        <Select readonly={readOnly} data={view} field={'father'} label={"Parent view:"}>
            {view.allPossibleParentViews.filter(v=>v.viewpoint?.id === vpid).map((view) => (
                <option key={view.id} value={view.id}>{view.name}</option>
            ))}
        </Select>
            {/*        <div className={'d-flex p-1'}>
            <label className={'my-auto'}>Viewpoint</label>
            <select className={'my-auto ms-auto select'} disabled={readOnly}
                    defaultValue={view.viewpoint ? view.viewpoint.id : 'null'} onChange={changeVP}>
                <option value={'null'} key={-1}>-----</option>
                {viewpoints.map((viewpoint, index) => {
                    return(<option key={index} value={viewpoint.id}>{viewpoint.name}</option>);
                })}
            </select>
        </div>
            */}
        <OclEditor viewID={view.id} />
        <JsEditor
            viewID={view.id} field={'jsCondition'}
            placeHolder={'/* Last line must return a boolean */'}
        />
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
