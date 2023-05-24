import React, {Dispatch, ReactElement} from "react";
import {CreateElementAction, SetFieldAction, SetRootFieldAction} from "../../../redux/action/action";
import {IStore} from "../../../redux/store";
import {connect} from "react-redux";
import {DViewPoint, LViewPoint} from "../../../view/viewPoint/viewpoint";
import {LViewElement} from "../../../view/viewElement/view";


function ViewpointsEditorComponent(props: AllProps) {
    const views = props.views;
    const viewpoints = props.viewpoints;
    const selected = props.selected;

    const editName = (evt: React.ChangeEvent<HTMLInputElement>, viewpoint: LViewPoint) => {
        viewpoint.name = evt.target.value;
    }
    const add = (evt: React.MouseEvent<HTMLButtonElement>) => {
        const dViewPoint = DViewPoint.new('ViewPoint');
        CreateElementAction.new(dViewPoint);
    }
    const remove = (index: number, viewpoint: LViewPoint) => {
        const filteredViews = views.filter(view => view.viewpoint.id === viewpoint.id);
        for(let view of filteredViews) SetFieldAction.new(view.id, 'viewpoint', null);
        SetRootFieldAction.new('viewpoints', index, '-=', true);
    }
    const select = (viewpoint: LViewPoint) => {
        SetRootFieldAction.new('viewpoint', viewpoint.id, '', true);
    }

    return(<div>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>VIEWPOINTS</b>
            <button className={'btn btn-primary ms-auto'} onClick={add}>
                <i className={'p-1 bi bi-plus'}></i>
            </button>
        </div>
        {viewpoints.map((viewpoint, index) => {
            return <div key={index} className={'d-flex p-1 mt-1 border round'}
                        style={{ backgroundColor: (selected.id === viewpoint.id) ? 'white' : 'transparent'}}>
                <input className={'p-0 input hidden-input'} value={viewpoint.name} type={'text'}
                       onChange={(evt) => {editName(evt, viewpoint)}} disabled={index === 0} />
                <button className={'btn btn-success ms-auto'} disabled={selected.id === viewpoint.id}
                        onClick={(evt) => {select(viewpoint)}}>
                    <i className={'p-1 bi bi-check2'}></i>
                </button>
                <button className={'btn btn-danger ms-1'} disabled={index === 0 || selected.id === viewpoint.id}
                        onClick={(evt) => {remove(index, viewpoint)}}>
                    <i className={'p-1 bi bi-trash3-fill'}></i>
                </button>
            </div>
        })}
    </div>);
}
interface OwnProps { }
interface StateProps {
    viewpoints: LViewPoint[],
    selected: LViewPoint,
    views: LViewElement[]
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.viewpoints = LViewPoint.fromPointer(state.viewpoints);
    ret.selected = LViewPoint.fromPointer(state.viewpoint);
    ret.views = LViewElement.fromPointer(state.viewelements.slice(10))
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ViewpointsEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ViewpointsEditorComponent);

export const ViewpointsEditor = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <ViewpointsEditorConnected {...{...props, childrens}} />;
}
export default ViewpointsEditor;
