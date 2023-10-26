import {MouseEvent} from 'react';
import type {LViewElement, LViewPoint} from '../../../joiner';
import {U} from '../../../joiner';
import {SetRootFieldAction} from '../../../redux/action/action';
import InfoData from './data/InfoData';
import NodeData from './data/NodeData';
import TemplateData from './data/TemplateData';
import EdgeData from './data/EdgeData';
import EdgePointData from './data/EdgePointData';
import {DockLayout} from 'rc-dock';
import {LayoutData} from 'rc-dock/lib/DockData';
import CustomData from './data/CustomData';
import SubViewsData from './data/SubViewsData';

interface Props {
    view: LViewElement;
    viewpoints: LViewPoint[];
    debug: boolean;
}
function ViewData(props: Props) {
    const view = props.view;
    if(!view) {
        SetRootFieldAction.new('stackViews', undefined, '-=', false);
        return(<></>);
    }
    const viewpoints = props.viewpoints;
    const debug = props.debug;
    const readOnly = U.getDefaultViewsID().includes(view.id) && !debug;

    const layout: LayoutData = {dockbox: {mode: 'horizontal', children: []}};
    const tabs = [
        {id: '1', title: 'Info', group: '1', closable: false, content: <InfoData view={view} viewpoints={viewpoints} readonly={readOnly} />},
        {id: '2', title: 'Node', group: '1', closable: false, content: <NodeData view={view} readonly={readOnly} />},
        {id: '3', title: 'Template', group: '1', closable: false, content: <TemplateData view={view} readonly={readOnly} />},
        {id: '4', title: 'Custom Data', group: '1', closable: false, content: <CustomData viewID={view.id} readonly={readOnly} />},
        {id: '5', title: 'Sub Views', group: '1', closable: false, content: <SubViewsData viewID={view.id} readonly={readOnly} />}
    ];
    if(view.appliableTo === 'edge') tabs.push(
        {id: '5', title: 'Edge', group: '1', closable: false, content: <EdgeData view={view} readonly={readOnly} />}
    );
    if(view.appliableTo === 'edgePoint') tabs.push(
        {id: '6', title: 'EdgePoint', group: '1', closable: false, content: <EdgePointData view={view} readonly={readOnly} />}
    );
    layout.dockbox.children.push({tabs});

    const back = (e: MouseEvent) => {
        SetRootFieldAction.new('stackViews', undefined, '-=', true);
    }

    return(<div>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>{view.name}</b>
            <button className={'btn btn-danger ms-auto'} onClick={back}>
                <i className={'p-1 bi bi-arrow-left'}></i>
            </button>
        </div>
        <DockLayout defaultLayout={layout} style={{position: 'absolute', left: 10, top: 40, right: 10, bottom: 10}} />
    </div>);
}

export default ViewData;
