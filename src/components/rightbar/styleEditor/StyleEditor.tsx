import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../../redux/store';
import {
    LModelElement,
    LViewElement,
    LGraphElement,
    Input,
    RuntimeAccessibleClass,
    LVoidVertex,
    LVoidEdge, LGraph, GenericInput, TextArea
} from '../../../joiner';

function NodeEditorComponent(props: AllProps) {
    const selected = props.selected;
    const editable = true;
    if (!selected?.node) return(<></>);
    let cname = selected.node.className
    let isGraph = ['DGraph', 'DGraphVertex'].includes(cname); // RuntimeAccessibleClass.extends(cname, 'DGraph');
    let isVertex = ['DVoidVertex', 'DVertex', 'DEdgePoint'].includes(cname); // RuntimeAccessibleClass.extends(cname, 'DVoidVertex');
    let isEdge = ['DVoidEdge', 'DEdge'].includes(cname); // RuntimeAccessibleClass.extends(cname, 'DVoidEdge');
    console.log('Style editor', {cname, isVertex, isGraph, isEdge, selected})
    let asGraph: LGraph | undefined = isGraph && selected.node as any;
    let asVertex: LVoidVertex | undefined  = isVertex && selected.node as any;
    let asEdge: LVoidEdge | undefined = isEdge && selected.node as any;
    return(<div className={'p-3'}>
        {/*<Input obj={selected.node} field={'id'} label={'ID'} type={'text'} readonly={true}/>*/}
        {asGraph && <><h3>Graph</h3>
            <GenericInput data={asGraph} field={'zoom'} />
            <GenericInput data={asGraph} field={'offset'} />
            {/*graphSize readonly on LGraph but not on DGraph, = internal graph size. put it for info.*/}
        </>}
        {asVertex && <><h3>Vertex</h3>
            <Input data={asVertex} field={'x'} label={'X Position'} type={'number'} readonly={!editable} />
            <Input data={asVertex} field={'y'} label={'Y Position'} type={'number'} readonly={!editable} />
            <Input data={asVertex} field={'width'} label={'Width'} type={'number'} readonly={!editable} />
            <Input data={asVertex} field={'height'} label={'Height'} type={'number'} readonly={!editable} />
        </>}
        {asEdge && <><h3>Edge</h3>
            <GenericInput data={asEdge} field={'longestLabel'} />
            <TextArea data={asEdge} field={'labels'} label={'labels'}
                   placeholder={`(edge/*LEdge*/, segment/*EdgeSegment*/, subNodes/*: LGraphElement[]*/, allSegments/*: EdgeSegment[]*/) => {' +
                       '\n\t return (edge.start.model)?.name + ' ~ ' + (e.end.model)?.name + '(' + segment.length.toFixed(1) + ')';' +
                       '\n}`} readonly={!editable} />
        </>}
        <Input data={selected.node} field={'zIndex'} label={'Z Index'} type={'number'} readonly={!editable} />
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

