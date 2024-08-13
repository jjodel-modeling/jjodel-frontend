import React, {Dispatch} from 'react';
import {
    LViewElement,
    Input,
    SetFieldAction,
    TextArea,
    Pointer,
    DViewElement,
    DState,
    LPointerTargetable, GenericInput
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

    return(<section>
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
        <div className={'px-2'}>
            <div className={'input-container'}>
                <b className={'me-2'}>Store Size in View:</b>
                {<Input data={view} field={"storeSize"} readonly={readOnly} tooltip={
                    <div>On - The node position depends from the view currently displayed.<br/>Off - It depends from the graph.</div>} type={"checkbox"} />
                    /* on = EuseSizeFrom.nv,   off = EuseSizeFrom.n */
                }
            </div>
            <div className={'input-container'}>
                <b className={'me-2'}>Lazy Update:</b>
                <Input data={view} field={"lazySizeUpdate"} type={"checkbox"} tooltip={true} readonly={readOnly} />
            </div>

            <div className={'input-container'}>
                <b className={'me-2'}>Adapt Width:</b>
                <Input data={view} field={"adaptWidth"} type={"checkbox"} readonly={readOnly} tooltip={true}/>
            </div>

            <div className={'input-container'}>
                <b className={'me-2'}>Adapt Height:</b>
                <Input data={view} field={"adaptHeight"} type={"checkbox"} readonly={readOnly} />
            </div>

            <div className={'input-container'}>
                <b className={'me-2'}>Draggable:</b>
                <Input data={view} field={"draggable"} type={"checkbox"} readonly={readOnly} />
            </div>

            <div className={'input-container'}>
                <b className={'me-2'}>Resizable:</b>
                <Input data={view} field={"resizable"} type={"checkbox"} readonly={readOnly} />
            </div>

            <div className={'input-container'} hidden={dview.adaptWidth}>
                <b className={'me-2'}>Default Width:</b>
                <Input data={view} type={"number"} readonly={readOnly}
                       getter={() => '' + view.defaultVSize.w} setter={(val) => view.defaultVSize = {w: +val} as any}/>
            </div>

            <div className={'input-container'} hidden={dview.adaptHeight}>
                <b className={'me-2'}>Default Height:</b>
                <Input data={view} type={"number"} readonly={readOnly}
                       getter={() => '' + view.defaultVSize.h} setter={(val) => view.defaultVSize = {h: +val} as any} />
            </div>
        </div>
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
