import {MouseEvent} from 'react';
import {CreateElementAction, SetRootFieldAction, TRANSACTION} from '../../../redux/action/action';
import type {Dictionary, Pointer} from '../../../joiner';
import {LProject, Pointers} from '../../../joiner';
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
        const dView = DViewElement.new('View', jsx);
        project.views = [...project.views, dView as any]; // setter does fine with a D-class too, no need to wrap it, it consumes cpu
    }

    const select = (view: LViewElement) => {
        SetRootFieldAction.new('stackViews', view.id, '+=', true);
    }

    const clone = (e: MouseEvent, v: LViewElement) => {
        e.preventDefault(); e.stopPropagation();
        TRANSACTION(()=>{
            let clone = v.duplicate();
            let defaultViews: Dictionary<Pointer, boolean> = U.objectFromArrayValues(U.getDefaultViewsID());
            let oldViews: Pointer<DViewElement>[] = Pointers.from(project.views).filter( vid => !defaultViews[vid]);
            let i: number = oldViews.indexOf(v.id);
            if (i === -1) oldViews.push(clone.id);
            else oldViews.splice(i+1, 0, clone.id); // insert in-place right after the cloned view
            project.views = oldViews as any;
        })
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
