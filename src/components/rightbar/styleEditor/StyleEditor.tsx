import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../../redux/store';
import type {
    LModelElement,
    LViewElement,
    LGraphElement,
    LVoidVertex,
    LVoidEdge, LGraph,Pointer, DGraphElement,
    DNamedElement, LNamedElement} from '../../../joiner';
import {
    LPointerTargetable,
    L,
    Input,
    GenericInput,
    TextArea,
    RuntimeAccessibleClass,
    SetRootFieldAction,
} from '../../../joiner';

function NodeEditorComponent(props: AllProps) {
    const selected = props.selected;
    const editable = true;
    if (!selected?.node) return(<></>);
    const node = selected.node;
    const dnode = (node.__raw || node) as DGraphElement
    let cname = dnode.className;
    let isGraph = ['DGraph', 'DGraphVertex'].includes(cname); // RuntimeAccessibleClass.extends(cname, 'DGraph');
    let isVertex = ['DVoidVertex', 'DVertex', 'DEdgePoint'].includes(cname); // RuntimeAccessibleClass.extends(cname, 'DVoidVertex');
    let isEdge = ['DVoidEdge', 'DEdge'].includes(cname); // RuntimeAccessibleClass.extends(cname, 'DVoidEdge');
    let isField = (!isGraph && !isVertex && !isEdge);
    console.log('Style editor', {cname, isVertex, isGraph, isEdge, selected});
    let asGraph: LGraph | undefined = isGraph && node as any;
    let asVertex: LVoidVertex | undefined  = isVertex && node as any;
    let asEdge: LVoidEdge | undefined = isEdge && node as any;
    let asField: LVoidEdge | undefined = isField && node as any;
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
            (s ? s.name || s.className : <i style={{color: 'orange'}}>empty</i>),
            <i className={'bi bi-arrow-right ms-1 me-1'} />,
            (e ? e.name || e.className : <i style={{color: 'orange'}}>empty</i>)
        ];

    }
    const clickableStyle = {cursor:'pointer', color: 'gray'};
    const headerStyle = {marginBottom:0, marginTop: '0.5em'};
    const edgeStart: LGraphElement | undefined = asEdge && asEdge.start;
    const edgeEnd: LGraphElement | undefined = asEdge && asEdge.end;
    const notFoundStyle = {color: 'orange', cursor:'not-allowed'};
    const subElements = node.subElements;
    let edgesIn = !isEdge && node.edgesIn || [];
    let edgesOut = !isEdge && node.edgesOut || [];
    let stackingOrder = <Input data={node} field={'zIndex'} label={'Stacking order'} type={'number'} readonly={!editable} />;
    return(<div className={'p-3'}>
        {/*<Input obj={selected.node} field={'id'} label={'ID'} type={'text'} readonly={true}/>*/}
        {asGraph && <><h3>Graph</h3>
            <GenericInput data={asGraph} field={'zoom'} />
            <GenericInput data={asGraph} field={'offset'} />
            {/*graphSize readonly on LGraph but not on DGraph, = internal graph size. put it for info.*/ }
        </>}
        {asVertex && <><h3>Vertex</h3>
            {stackingOrder}
            <Input data={asVertex} field={'x'} label={'X Position'} type={'number'} readonly={!editable} />
            <Input data={asVertex} field={'y'} label={'Y Position'} type={'number'} readonly={!editable} />
            <Input data={asVertex} field={'width'} label={'Width'} type={'number'} readonly={!editable} />
            <Input data={asVertex} field={'height'} label={'Height'} type={'number'} readonly={!editable} />
        </>}
        {asEdge && <><h3>Edge</h3>
            {stackingOrder}
            <GenericInput data={asEdge} field={'longestLabel'}
                          placeholder={'(edge/*LEdge*/, segment/*EdgeSegment*/, subNodes/*LGraphElement[]*/, allSegments/*EdgeSegment[]*/) => {' +
                              '\n\t// a complex example. The label can be either a function like this or a simple string.' +
                              '\n\t return (edge.start.model)?.name + \' ~ \' + (e.end.model)?.name + \'(\' + segment.length.toFixed(1) + \')\';' +
                              '\n}'}/>
            <GenericInput data={asEdge} field={'labels'}
                          placeholder={'(edge/*LEdge*/, segment/*EdgeSegment*/, subNodes/*LGraphElement[]*/, allSegments/*EdgeSegment[]*/) => {' +
                            '\n\t// a complex example. The label can be either a function like this or a simple string.' +
                            '\n\t return (edge.start.model)?.name + \' ~ \' + (e.end.model)?.name + \'(\' + segment.length.toFixed(1) + \')\';' +
                            '\n}'}/>
            <GenericInput data={asEdge} field={"anchorStart"}/>
            <GenericInput data={asEdge} field={"anchorEnd"}/>
        </>}
        {asField && <><h3>Field</h3>
            {stackingOrder}
        </>}

        <div style={{marginTop:'1em', marginBottom:'1em', borderBottom:'1px solid gray'}}/>
        <div><h6>Super element: {
            node.father?.className ?
                <span onClick={(e)=> dnode.father && openNode(dnode.father)} style={clickableStyle}>
                    {[node.father?.className, <i className={'ms-1 bi bi-arrow-up'}/>]}
                </span>
                :
                <span style={notFoundStyle}>Not contained</span>
        }
        </h6></div>

        {asEdge && [
            <div><h6 style={headerStyle}>Edge start:{
                edgeStart ?
                    <span className={'ms-2'} onClick={(e)=> openNode(edgeStart.id)} style={clickableStyle}>
                        {getNodeLabel(edgeStart)}<i className={'ms-1 bi bi-arrow-right'}/>
                    </span>
                    : <span style={notFoundStyle}>Missing</span>
            }</h6></div>,
            <div><h6 style={headerStyle}>Edge End:{
                edgeEnd ?
                    <span className={'ms-2'} onClick={(e)=> openNode(edgeEnd.id)} style={clickableStyle}>
                        {getNodeLabel(edgeEnd)}<i className={'ms-1 bi bi-arrow-left'}/>
                    </span>
                    : <span style={notFoundStyle}>Missing</span>
            }</h6></div>
        ]}
        <div><h6 style={headerStyle}>
            Sub elements{subElements.length ? <i className={'ms-1 bi bi-arrow-down'}/> : [': ', <span style={notFoundStyle}>None</span>]}
        </h6>{subElements.map(
            n => <div className={'w-100 ms-2'} onClick={(e)=> openNode(n.id)} style={clickableStyle}>{getNodeLabel(n)}</div>
        )}</div>
        {!asEdge && <>
            <div><h6 style={headerStyle}>Outgoing Edges{edgesOut.length === 0 && <>: <span style={notFoundStyle}>None</span></>}</h6>{edgesOut.length && edgesOut.map(
                n => <div className={'w-100 ms-2'} onClick={(e)=> openNode(n.id)} style={clickableStyle}>{getEdgeLabel(n)}</div>
            )}</div>
            <div><h6 style={headerStyle}>Incoming Edges{edgesIn.length === 0 && <>: <span style={notFoundStyle}>None</span></>}</h6>{edgesIn.map(
                n => <div className={'w-100 ms-2'} onClick={(e)=> openNode(n.id)} style={clickableStyle}>{getEdgeLabel(n)}</div>
            )}</div>
        </>}


        <h6 style={headerStyle}>Node state:{Object.keys(dnode._state).length === 0 && <span style={notFoundStyle}> Empty</span>}</h6>
        <pre>{Object.keys(dnode._state).length ? JSON.stringify(dnode._state, null, '\t') : undefined}</pre>

    </div>);

}
interface OwnProps {}
interface StateProps {
    selected?: {
        node: LGraphElement;
        view: LViewElement;
        modelElement?: LModelElement;
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
                node: L.fromPointer(node),
                view: L.fromPointer(node),
                modelElement: (modelElement) ? L.fromPointer(modelElement) : undefined
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

