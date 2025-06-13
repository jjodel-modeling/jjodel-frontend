/*
******************************* this is for pbar/node. instead GenericNodeData is for view->node. *******************************
*/

import React, {Dispatch, ReactElement, ReactNode} from 'react';
import ReactJson from 'react-json-view' // npm i react-json-view --force
import {connect} from 'react-redux';
import {DState} from '../../redux/store';
import {
    LModelElement,
    LViewElement,
    LGraphElement,
    LVoidVertex,
    LVoidEdge, LGraph, Pointer, DGraphElement,
    DNamedElement, LNamedElement, SetFieldAction
} from '../../joiner';
import {
    LPointerTargetable,
    L,
    Input,
    GenericInput,
    TextArea,
    RuntimeAccessibleClass,
    SetRootFieldAction, DEdge,
} from '../../joiner';
import './editors.scss';
import './node-editor.scss';
import {Empty} from "./Empty";
import { CommandBar, Btn } from '../commandbar/CommandBar';
import {SizeInput} from "../forEndUser/SizeInput";


function NodeEditorComponent(props: AllProps) {
    const selected = props.selected;
    const editable = true;
    if (!selected?.node) return <Empty msg={'Select a node.'} />;
    const node = selected.node;
    const dnode = (node.__raw || node) as DGraphElement
    let cname = dnode.className;
    let isGraph = ['DGraph', 'DGraphVertex'].includes(cname); // RuntimeAccessibleClass.extends(cname, 'DGraph');
    let isVertex = ['DVoidVertex', 'DVertex', 'DEdgePoint', 'DGraphVertex'].includes(cname); // RuntimeAccessibleClass.extends(cname, 'DVoidVertex');
    let isEdge = ['DVoidEdge', 'DEdge'].includes(cname); // RuntimeAccessibleClass.extends(cname, 'DVoidEdge');
    let isField = (!isGraph && !isVertex && !isEdge);
    let isGraphVertex = isVertex && isGraph;
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





    type InputRowProps = {
        label: string,
        as: any,
        field: string,
        type: string
    }
    const InputRow = (props: any) => {
        return (
            <div className='input-container'>
                <b className={'me-2'}>{props.label}</b>
                <Input data={props.as} field={props.field} type={props.type} readOnly={!editable} />
            </div>
        );
    };
// todo: zoom entry not working
    let commonEntries: JSX.Element[] = [];
    if (!isGraph || isGraphVertex) commonEntries.push(<InputRow label={'Stacking order'} as={node} field={'zIndex'} type={'number'} />);
    /*
    let commonEntries: JSX.Element[] = [];
    if (!isGraph || isGraphVertex) commonEntries.push(<InputRow label={'Stacking order'} as={node} field={'zIndex'} type={'number'} />);
    function setZoom(val, key){
        if (!dnode.zoom) {
            let newzoom = {x:1, y:1};
            newzoom[key] = val;
            if (!dnode.zoom) SetFieldAction.new(dnode.id, 'zoom', newzoom, '', false);
        }
        else {
            SetFieldAction.new(dnode.id, 'zoom.'+key, val, '', false);
        }
    }
    commonEntries.push(<SizeInput data={node} field={'ownZoom'} xsetter={(val)=>{
        if (!dnode.zoom) SetFieldAction(dnode.id, 'zoom', {x: val, y: val});
    }}/>); // <GenericInput */
    commonEntries.push(<GenericInput data={node} field={'zoom'} />);

    return(<div className={'p-3 node-editor'}>
        {/*<Input obj={selected.node} field={'id'} label={'ID'} type={'text'} readonly={true}/>*/}

        {asGraph && <><h3>{isGraphVertex ? 'GraphVertex' : 'Graph'}</h3>
            {commonEntries}
            <GenericInput data={asGraph} field={'offset'} />
            <SizeInput data={asGraph} field={'size'} label={'size'}
                       xsetter={(x)=> asGraph.x = +x}
                       ysetter={(y)=> asGraph.y = +y}
                       wsetter={(w)=> asGraph.w = +w}
                       hsetter={(h)=> asGraph.h = +h}
            />

            {/*graphSize readonly on LGraph but not on DGraph, = internal graph size. put it for info.*/ }
        </>}

        {asVertex && <>
            {!isGraphVertex && <>
                <h3>Vertex</h3>
                {commonEntries}
                <InputRow label={'X Position'} as={asVertex} field={'x'} type={'number'}/>
                <InputRow label={'Y Position'} as={asVertex} field={'y'} type={'number'}/>
                <InputRow label={'Width'} as={asVertex} field={'width'} type={'number'}/>
                <InputRow label={'Height'} as={asVertex} field={'height'} type={'number'}/>
            </>}
            <InputRow label={'isResized'} as={asVertex} field={'isResized'} type={'checkbox'} />
        </>}

        {asEdge && <><h3>Edge</h3>
            {commonEntries}

            {
            //  <>
            //     moved to props & transient properties
            //     <GenericInput data={asEdge} field={'longestLabel'}
            //         placeholder={'(edge/*LEdge*/, segment/*EdgeSegment*/, subNodes/*LGraphElement[]*/, allSegments/*EdgeSegment[]*/) => {' +
            //         '\n\t// a complex example. The label can be either a function like this or a simple string.' +
            //         '\n\t return (edge.start.model)?.name + \' ~ \' + (e.end.model)?.name + \'(\' + segment.length.toFixed(1) + \')\';' +
            //         '\n}'}/>
            //     <GenericInput data={asEdge} field={'labels'}
            //         placeholder={'(edge/*LEdge*/, segment/*EdgeSegment*/, subNodes/*LGraphElement[]*/, allSegments/*EdgeSegment[]*/) => {' +
            //         '\n\t// a complex example. The label can be either a function like this or a simple string.' +
            //         '\n\t return (edge.start.model)?.name + \' ~ \' + (e.end.model)?.name + \'(\' + segment.length.toFixed(1) + \')\';' +
            //         '\n}'}/>
            // </>
            }

            <label>{asEdge.anchorStart && typeof asEdge.anchorStart == 'object' ?
                <SizeInput data={asEdge} field={'anchorStart'}/> :
                <GenericInput className='input-container' data={asEdge} field={"anchorStart"}/>}
                <CommandBar style={{}}><Btn icon={'delete'} tip={'Delete'} action={()=>asEdge.anchorStart = undefined as any} /></CommandBar>
            </label>
            <label>{asEdge.anchorEnd && typeof asEdge.anchorEnd == 'object' ?
                <SizeInput data={asEdge} field={'anchorEnd'}/> :
                <GenericInput className='input-container' data={asEdge} field={"anchorEnd"}/>}
                <CommandBar style={{}}><Btn icon={'delete'} tip={'Delete'} action={()=>asEdge.anchorEnd = undefined as any} /></CommandBar>
            </label>
        </>}

        {asField && <><h3>Field</h3>
            {commonEntries}
        </>}

        <div style={{marginTop:'1em', marginBottom:'1em', borderBottom:'1px solid gray'}}/>

        {node.father?.className && <div>
            <h6 style={{display: 'flex'}}>
                Super element
                    {/*<span onClick={(e)=> dnode.father && openNode(dnode.father)} style={clickableStyle}>
                        {[node.father?.className, <i style={{paddingLeft: '8px'}} className="bi bi-chevron-up"></i>]}
                    </span>*/}
                    <CommandBar style={{paddingLeft: 'var(--tab-sep)', bottom: '3px'}}>
                        <Btn icon={'up'} action={(e)=> dnode.father && openNode(dnode.father)} tip={'Go up'}/>
                    </CommandBar>
            </h6>
        </div>}

        {asEdge && [
            <div key={'es'}><h6 style={headerStyle}>Edge start:{
                edgeStart ?
                    <span className={'ms-2'} onClick={(e)=> openNode(edgeStart.id)} style={clickableStyle}>
                        {getNodeLabel(edgeStart)}<i className={'ms-1 bi bi-arrow-right'}/>
                    </span>
                    : <span style={notFoundStyle}>Missing</span>
            }</h6></div>,
            <div key={'ee'}><h6 style={headerStyle}>Edge End:{
                edgeEnd ?
                    <span className={'ms-2'} onClick={(e)=> openNode(edgeEnd.id)} style={clickableStyle}>
                        {getNodeLabel(edgeEnd)}<i className={'ms-1 bi bi-arrow-left'}/>
                    </span>
                    : <span style={notFoundStyle}>Missing</span>
            }</h6></div>
        ]}

        {subElements.length > 0 && <div>
            <h6 style={{display: 'flex'}}>
                Sub elements
                <CommandBar style={{paddingLeft: 'var(--tab-sep)', bottom: '3px'}}>
                    <Btn icon={'down'} action={(e)=> {}} tip={'Go down'}/>
                </CommandBar>
            </h6>
            {subElements.map(
                n => <div key={n.id} className={'w-100 ms-2 sub-element'} onClick={(e)=> openNode(n.id)} style={clickableStyle}>{getNodeLabel(n)}</div>
            )}
        </div>}

        {!asEdge && <>
            {edgesOut.length > 0 && <div>
                <h6 style={{display: 'flex'}}>
                    Outgoing Edges
                </h6>
                {edgesOut.map(n => <div key={n.id} className={'w-100 ms-2 sub-element'} onClick={(e)=> openNode(n.id)} style={clickableStyle}>{getEdgeLabel(n)}</div>)}
            </div>}

            {edgesIn.length > 0 && <div>
                <h6 style={{display: 'flex'}}>
                    Incoming Edges
                </h6>
                {edgesIn.map(n => <div key={n.id} className={'w-100 ms-2 sub-element'} onClick={(e)=> openNode(n.id)} style={clickableStyle}>{getEdgeLabel(n)}</div>)}
            </div>}

            {/*<div>
                <h6 style={headerStyle}>
                    Outgoing Edges {edgesOut.length === 0 && <>: <span style={notFoundStyle}>None</span></>}
                </h6>
                {edgesOut.length && edgesOut.map(n => <div className={'w-100 ms-2'} onClick={(e)=> openNode(n.id)} style={clickableStyle}>{getEdgeLabel(n)}</div>)}
            </div>

            <div>
                <h6 style={headerStyle}>Incoming Edges{edgesIn.length === 0 && <>:
                    <span style={notFoundStyle}>None</span></>}
                </h6>
                {edgesIn.map(n => <div className={'w-100 ms-2'} onClick={(e)=> openNode(n.id)} style={clickableStyle}>{getEdgeLabel(n)}</div>)}
            </div>*/}
        </>}


        <h6>Node state</h6>
        <div className={'object-state'}>
            {Object.keys(dnode._state).length === 0 ? <pre> Empty</pre> :
                <ReactJson src={dnode._state}
                           collapsed={1}
                           collapseStringsAfterLength={20}
                           displayDataTypes={true}
                           displayObjectSize={true}
                           enableClipboard={true}
                           groupArraysAfterLength={100}
                           indentWidth={4}
                           name={"state"}
                           iconStyle={"triangle"}
                           quotesOnKeys={true} shouldCollapse={ false /*((field: CollapsedFieldProps) => { return Object.keys(field.src).length > 3;*/ }
                           sortKeys={false}
                           theme={"rjv-default"}
                />}
            {/*<pre>{Object.keys(dnode._state).length ? JSON.stringify(dnode._state, null, '\t') : undefined}</pre>*/}
        </div>

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

export const NodeEditor = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <NodeEditorConnected {...{...props, children}} />;
}
export default NodeEditor;

