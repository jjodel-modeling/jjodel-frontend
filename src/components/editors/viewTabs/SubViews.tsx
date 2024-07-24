import {useStateIfMounted} from "use-state-if-mounted";
import React, {MouseEvent} from "react";
import {LViewElement} from "../../../view/viewElement/view";
import {LProject} from "../../../joiner";

type Props = {view: LViewElement, views: LViewElement[]};
function ViewSubViews(props: Props): JSX.Element {
    const {view, views} = props;

    const readOnly = false;
    const [hoverID, setHoverID] = useStateIfMounted('');
    const [possibleSubViews, setPossibleSubViews] = useStateIfMounted(views.filter(v => v && v.id !== view.id && !view.subViews.map(v => v.id).includes(v.id)));
    const [subViewID, setSubViewID] = useStateIfMounted((possibleSubViews[0]) ? possibleSubViews[0].id : '');

    const add = (e: MouseEvent) => {
        if(!subViewID) return;
        view.setSubViewScore(subViewID, 1.5);
        const _possibleSubViews = views.filter(v => v && v.id !== subViewID && v.id !== view.id && !view.subViews.map(v => v.id).includes(v.id));
        setPossibleSubViews(_possibleSubViews);
        setSubViewID((_possibleSubViews[0]) ? _possibleSubViews[0].id : '');
    }


    const remove = (e: MouseEvent, subView: LViewElement) => {
        e.preventDefault(); e.stopPropagation();
        view.setSubViewScore(subViewID, null);
        setPossibleSubViews([...possibleSubViews, subView]);
    }

    return(<>
        <div className={'d-flex w-100 mb-2'}>
            <select className={'my-auto select '} value={subViewID} onChange={e => setSubViewID(e.target.value)}>
                {possibleSubViews.map((v, index) => {
                    return(<option key={index} value={v.id}>{v.name}</option>)
                })}
            </select>
            <button className={'btn btn-primary ms-auto'} onClick={add} disabled={!subViewID || readOnly}>
                <i className={'p-1 bi bi-plus'}></i>
            </button>
        </div>
        {view.subViews.map((subView, index) => {
            return <div key={index} className={'d-flex p-1 mt-1 border round mx-1'} tabIndex={-1}
                        onMouseEnter={e => setHoverID(subView.id)} onMouseLeave={e => setHoverID('')}
                        onClick={e => /*props.setSelectedView(subView)*/ alert('todo')}
                        style={{cursor: 'pointer', background: hoverID === subView.id ? '#E0E0E0' : 'transparent'}}>
                <label style={{cursor: 'pointer'}} className={'my-auto'}>{subView.name}</label>
                <button className={'btn btn-danger ms-auto'} disabled={readOnly}
                        onClick={e => remove(e, subView)}>
                    <i className={'p-1 bi bi-trash3-fill'}></i>
                </button>
            </div>
        })}
    </>);
}

export {ViewSubViews};
