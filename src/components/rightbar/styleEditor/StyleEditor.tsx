import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {DState} from "../../../redux/store";
import {
    LModelElement,
    LViewElement,
    LGraphElement,
    Input,
    RuntimeAccessibleClass,
    LVoidVertex,
    LVoidEdge, LGraph, GenericInput, TextArea, Pointer, DGraphElement, SetRootFieldAction, DNamedElement, LNamedElement
} from "../../../joiner";

function NodeEditorComponent(props: AllProps) {
    const selected = props.selected;
    const editable = true;
    if (!selected || !selected.node) return(<></>);
    const node = selected.node;
    const dnode = (node.__raw || node) as DGraphElement
    let cname = dnode.className;
    let isGraph = ["DGraph", "DGraphVertex"].includes(cname); // RuntimeAccessibleClass.extends(cname, "DGraph");
    let isVertex = ["DVoidVertex", "DVertex", "DEdgePoint"].includes(cname); // RuntimeAccessibleClass.extends(cname, "DVoidVertex");
    let isEdge = ["DVoidEdge", "DEdge"].includes(cname); // RuntimeAccessibleClass.extends(cname, "DVoidEdge");
    console.log("Style editor", {cname, isVertex, isGraph, isEdge, selected})
    let asGraph: LGraph | undefined = isGraph && node as any;
    let asVertex: LVoidVertex | undefined  = isVertex && node as any;
    let asEdge: LVoidEdge | undefined = isEdge && node as any;
    function openNode(id: Pointer<DGraphElement>) {
        SetRootFieldAction.new('_lastSelected.node', id, '', false);
    }

    function getNodeLabel(node: LGraphElement){
        if (!node) return 'error';
        let model: DNamedElement | undefined = node.model?.__raw as any;
        if (!model) return node.className;
        return node.className + ' - ' +(model.name || model.className)
    }
    function getEdgeLabel(edge: LVoidEdge){
        let s: DNamedElement | undefined = edge?.start?.model?.__raw as any;
        let e: DNamedElement | undefined = edge?.end?.model?.__raw as any;
        return [
            (s ? s.name || s.className : <i style={{color: "orange"}}>empty</i>),
            <i className={"bi bi-arrow-right ms-1 me-1"} />,
            (e ? e.name || e.className : <i style={{color: "orange"}}>empty</i>)
        ];

    }
    const clickableStyle = {cursor:'pointer', color: 'gray'};
    const headerStyle = {marginBottom:0, marginTop: '0.5em'};
    const edgeStart: LGraphElement | undefined = asEdge && asEdge.start;
    const edgeEnd: LGraphElement | undefined = asEdge && asEdge.end;
    const notFoundStyle = {color: 'orange', cursor:'not-allowed'};
    return(<div className={'p-3'}>
        {/*<Input obj={selected.node} field={"id"} label={"ID"} type={"text"} readonly={true}/>*/}
        {asGraph && <><h3>Graph</h3>
            <GenericInput data={asGraph} field={"zoom"} />
            <GenericInput data={asGraph} field={"offset"} />
            {/*graphSize readonly on LGraph but not on DGraph, = internal graph size. put it for info.*/ }
        </>}
        {asVertex && <><h3>Vertex</h3>
            <Input data={node} field={"zIndex"} label={"Stacking order"} type={"number"} readonly={!editable} />
            <Input data={asVertex} field={"x"} label={"X Position"} type={"number"} readonly={!editable} />
            <Input data={asVertex} field={"y"} label={"Y Position"} type={"number"} readonly={!editable} />
            <Input data={asVertex} field={"width"} label={"Width"} type={"number"} readonly={!editable} />
            <Input data={asVertex} field={"height"} label={"Height"} type={"number"} readonly={!editable} />
        </>}
        {asEdge && <><h3>Edge</h3>
            <GenericInput data={asEdge} field={"longestLabel"} />
            <TextArea data={asEdge} field={"labels"} label={"labels"}
                   placeholder={'(edge/*LEdge*/, segment/*EdgeSegment*/, subNodes/*: LGraphElement[]*/, allSegments/*: EdgeSegment[]*/) => {' +
                       '\n\t return (edge.start.model)?.name + " ~ " + (e.end.model)?.name + "(" + segment.length.toFixed(1) + ")";' +
                       '\n}'} readonly={!editable} />
        </>}
        {!asGraph && !asVertex && !asEdge &&<><h3>Field</h3>
            <Input data={node} field={"zIndex"} label={"Stacking order"} type={"number"} readonly={!editable} />
        </>}

        <div style={{marginTop:"1em", marginBottom:"1em", borderBottom:"1px solid gray"}}/>
        <div><h6>Super element: {
            node.father?.className ?
                <span onClick={(e)=> dnode.father && openNode(dnode.father)} style={clickableStyle}>
                    {[node.father?.className, <i className={"ms-1 bi bi-arrow-up"}/>]}
                </span>
                :
                <span style={notFoundStyle}>Not contained</span>
        }
        </h6></div>

        {asEdge && [
            <div><h6 style={headerStyle}>Edge start:{
                edgeStart ?
                    <span className={"ms-2"} onClick={(e)=> openNode(edgeStart.id)} style={clickableStyle}>
                        {getNodeLabel(edgeStart)}<i className={"ms-1 bi bi-arrow-right"}/>
                    </span>
                    : <span style={{...clickableStyle, cursor:'not-allowed'}}>Missing</span>
            }</h6></div>,
            <div><h6 style={headerStyle}>Edge End:{
                edgeEnd ?
                    <span className={"ms-2"} onClick={(e)=> openNode(edgeEnd.id)} style={clickableStyle}>
                        {getNodeLabel(edgeEnd)}<i className={"ms-1 bi bi-arrow-left"}/>
                    </span>
                    : <span style={{...clickableStyle, cursor:'not-allowed'}}>Missing</span>
            }</h6></div>
        ]}
        <div><h6 style={headerStyle}>Sub elements <i className={"ms-1 bi bi-arrow-down"}/></h6>{node.subElements.map(
            n => <div className={"w-100 ms-2"} onClick={(e)=> openNode(n.id)} style={clickableStyle}>{getNodeLabel(n)}</div>
        )}</div>
        <div><h6  style={headerStyle}>Outgoing Edges</h6>{node.edgesOut.map(
            n => <div className={"w-100 ms-2"} onClick={(e)=> openNode(n.id)} style={clickableStyle}>{getEdgeLabel(n)}</div>
        )}</div>
        <div><h6  style={headerStyle}>Incoming Edges</h6>{node.edgesIn.map(
            n => <div className={"w-100 ms-2"} onClick={(e)=> openNode(n.id)} style={clickableStyle}>{getEdgeLabel(n)}</div>
        )}</div>

        <h6  style={headerStyle}>Node state:</h6>
        <pre>{JSON.stringify(dnode._state, null, "\t")}</pre>

    </div>);

}
interface OwnProps {}
interface StateProps {
    selected?: {
        node: LGraphElement;
        view: LViewElement;
        modelElement?: LModelElement
    };
}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    let ret: StateProps = {};
    const selected = state._lastSelected;
    if(selected) {
        const modelElement = state._lastSelected?.modelElement;
        const node = state._lastSelected?.node;
        const view = state._lastSelected?.view;
        if(node && view) {
            ret.selected = {
                node: LGraphElement.fromPointer(node),
                view: LViewElement.fromPointer(node),
                modelElement: (modelElement) ? LModelElement.fromPointer(modelElement) : undefined
            }
        }
    }
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const NodeEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(NodeEditorComponent);

export const NodeEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <NodeEditorConnected {...{...props, children}} />;
}
export default NodeEditor;

