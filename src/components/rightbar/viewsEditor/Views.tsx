import React from "react";
import type {LViewElement} from "../../../view/viewElement/view";
import {DViewElement} from "../../../view/viewElement/view";
import {CreateElementAction, DeleteElementAction, SetRootFieldAction} from "../../../redux/action/action";
import {U} from "../../../joiner";

interface Props { views: LViewElement[]; }
function ViewsData(props: Props) {
    const views = props.views;

    const add = (evt: React.MouseEvent<HTMLButtonElement>) => {
        const jsx =`<div className={'root bg-white'}>Hello World!</div>`;
        const view: DViewElement = DViewElement.new('View', jsx);
        CreateElementAction.new(view);
        SetRootFieldAction.new('stackViews', view.id, '+=', true);
    }
    const remove = (evt: React.MouseEvent<HTMLButtonElement>, index:number, view: LViewElement) => {
        SetRootFieldAction.new('viewelements', view.id, '-=', true);
        DeleteElementAction.new(view.id);
    }
    const select = (evt: React.MouseEvent<HTMLButtonElement>, view: LViewElement) => {
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
            return <div key={i} className={'d-flex p-1 mt-1 border round'}>
                <label className={'my-auto'}>{view?.name}</label>
                <button className={'btn btn-success ms-auto'} onClick={(evt) => {select(evt, view)}}>
                    <i className={'p-1 bi bi-info-lg'}></i>
                </button>
                <button className={'btn btn-danger ms-1'} disabled={U.getDefaultViewsID().includes(view.id)}
                        onClick={(evt) => {remove(evt, i, view)}}>
                    <i className={'p-1 bi bi-trash3-fill'}></i>
                </button>
            </div>
        })}
    </div>);
}

export default ViewsData;
