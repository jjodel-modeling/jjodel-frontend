import React, {Dispatch} from 'react';
import {
    LViewElement,
    Input,
    SetFieldAction,
    TextArea,
    Pointer,
    DViewElement,
    DState,
    LPointerTargetable
} from '../../../../joiner';
import {FakeStateProps} from "../../../../joiner/types";
import {connect} from "react-redux";

function NodeDataComponent(props: AllProps) {
    const view = props.view;
    let dview = (view.__raw || view) as DViewElement;
    const readOnly = props.readonly;
/*
    const objectTypes = ["", "DModel", "DPackage", "DEnumerator", "DEnumLiteral", "DClass", "DAttribute", "DReference", "DOperation", "DParameter", "DObject", "DValue", "DStructuralFeature"];

    const classesOptions = <optgroup label={"Object type"}>
        {objectTypes.map((o)=><option key={o} value={o}>{o.length ? o.substring(1) : "anything"}</option>)}
    </optgroup>;*/

    return(<section className={'p-3'}>
        {/*<Select obj={view} field={"useSizeFrom"} readonly={readOnly} options={
            <optgroup label="Node position depends from what?">
                <option value={EuseSizeFrom.nv}>Node & View: Will change his position when the view or graph changes</option>
                <option value={EuseSizeFrom.n}>Node only: Will keep his position when view changes, but not when the graph is changed</option>
                <option value={EuseSizeFrom.m}>Model: Will keep his position regardless of view or graph applied, but cannot represent the same model fragment with two different nodes</option>
            </optgroup>
        } tooltip={ "Node & View: Will change his position when the view or graph changes.\n" +
                    "Node only: Will keep his position when view changes, but not when the graph is changed.\n"+
                    "Model: Will keep his position regardless of view or graph applied, but cannot represent the same model fragment with two different nodes."
        }></Select>*/}

        {/*[<Input data={view} field={"scalezoomx"} label={"Zoom X"} type={"number"}/>,                <Input data={view} field={"scalezoomy"} label={"Zoom Y"} type={"number"}/>]*/}

        <h5>Vertex</h5>
        {<Input data={view} field={"storeSize"} label={"Store Size in view"} readonly={readOnly}  tooltip={
            <div>On - The node position depends from the view currently displayed.<br/>Off - It depends from the graph.</div>} type={"checkbox"} />
            /* on = EuseSizeFrom.nv,   off = EuseSizeFrom.n */
        }
        <Input data={view} field={"lazySizeUpdate"} label={"Lazy Update"} type={"checkbox"} tooltip={true} readonly={readOnly} />

        <Input data={view} field={"adaptWidth"} label={"Adapt Width"} type={"checkbox"} readonly={readOnly} />
        <Input data={view} field={"adaptHeight"} label={"Adapt Height"} type={"checkbox"} readonly={readOnly} />
        <Input data={view} field={"draggable"} label={"Draggable"} type={"checkbox"} readonly={readOnly} />
        <Input data={view} field={"resizable"} label={"Resizable"} type={"checkbox"} readonly={readOnly} />
        <div className={"w-100"}>{[
            !dview.adaptWidth && <Input data={view} label={"Default Width"} type={"number"} readonly={readOnly}
                                        getter={()=>''+view.defaultVSize.w} setter={(val) => view.defaultVSize = {w:+val} as any}/>,
            !dview.adaptHeight && <Input data={view} label={"Default Height"} type={"number"} readonly={readOnly}
                                         getter={()=>''+view.defaultVSize.h} setter={(val) => view.defaultVSize = {h:+val} as any} />
        ]}</div>


    </section>);
}

interface OwnProps {
    viewID: Pointer<DViewElement>;
    readonly : boolean;
}

interface StateProps {
    view: LViewElement;
}

interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.view = LPointerTargetable.fromPointer(ownProps.viewID);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const NodeData = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(NodeDataComponent);

export default NodeData;
