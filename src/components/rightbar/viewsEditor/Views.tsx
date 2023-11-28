import {MouseEvent} from 'react';
import {CreateElementAction, SetRootFieldAction} from '../../../redux/action/action';
import type {LProject} from '../../../joiner';
import {DViewElement, LViewElement, U} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';

interface Props {
    project: LProject;
}
function ViewsData(props: Props) {
    const project = props.project;
    const views = project.views;

    const [hoverID, setHoverID] = useStateIfMounted('');

    const add = (e: MouseEvent) => {
        const jsx =`<div className={'root bg-white'}>Hello World!</div>`;
        DViewElement.new('View', jsx);
    }

    const select = (view: LViewElement) => {
        SetRootFieldAction.new('stackViews', view.id, '+=', true);
    }

    const clone = (e: MouseEvent, v: LViewElement) => {
        e.preventDefault(); e.stopPropagation();
        const view: DViewElement = DViewElement.new(`${v.name} Copy`, '');
        for(let key in v.__raw) {
            if(key !== 'id' && key !== 'name') {
                // @ts-ignore
                view[key] = v.__raw[key];
            }
        }
        CreateElementAction.new(view);
        SetRootFieldAction.new('stackViews', view.id, '+=', true);
    }

    return(<div>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>VIEWS</b>
            <button className={'btn btn-primary ms-auto'} onClick={add}>
                <i className={'p-1 bi bi-plus'}></i>
            </button>
        </div>
        {views.map((view, i) => {
            if(!view) return;
            return <div key={view.id} className={'d-flex p-1 mt-1 border round mx-1'} tabIndex={-1}
                        onMouseEnter={e => setHoverID(view.id)} onMouseLeave={e => setHoverID('')}
                        onClick={e => select(view)}
                        style={{cursor: 'pointer', background: hoverID === view.id ? '#E0E0E0' : 'transparent'}}>
                <label style={{cursor: 'pointer'}} className={'my-auto'}>{view.name}</label>
                <button className={'btn btn-success ms-auto'} onClick={e => clone(e, view)}>
                    <i className={'p-1 bi bi-clipboard2-fill'}></i>
                </button>
                <button className={'btn btn-danger ms-1'} disabled={U.getDefaultViewsID().includes(view.id)}
                        onClick={e => view.delete()}>
                    <i className={'p-1 bi bi-trash3-fill'}></i>
                </button>
            </div>
        })}
    </div>);
}

export default ViewsData;
