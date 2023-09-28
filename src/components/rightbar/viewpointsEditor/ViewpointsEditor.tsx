import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {CreateElementAction, SetFieldAction, SetRootFieldAction, DState, DViewPoint, Input, LViewElement, LViewPoint, Pointer, U} from "../../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";


function ViewpointsEditorComponent(props: AllProps) {
    const views = props.views;
    const viewpoints = props.viewpoints;
    const selected = props.selected;

    const [hoverID, setHoverID] = useStateIfMounted('');

    const editName = (evt: React.ChangeEvent<HTMLInputElement>, viewpoint: LViewPoint) => {
        viewpoint.name = evt.target.value;
        SetRootFieldAction.new('stackViews', [], '', false);
    }
    const add = (evt: React.MouseEvent<HTMLButtonElement>) => {
        const dViewPoint = DViewPoint.new('ViewPoint', '');
        CreateElementAction.new(dViewPoint);
        SetRootFieldAction.new('stackViews', [], '', false);
    }
    const remove = (index: number, viewpoint: LViewPoint) => {
        const filteredViews = views.filter(view => view.viewpoint?.id === viewpoint.id);
        for(let view of filteredViews) SetFieldAction.new(view.id, 'viewpoint', null);
        SetRootFieldAction.new('viewpoints', index, '-=', true);
        SetRootFieldAction.new('stackViews', [], '', false);
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
            return <div key={viewpoint.id} className={'d-flex p-1 mt-1 border round mx-1'}
                        onMouseEnter={(e) => setHoverID(viewpoint.id)}
                        onMouseLeave={(e) => setHoverID('')}
                        style={{backgroundColor: (selected.id === viewpoint.id) ? 'white' :
                                (hoverID === viewpoint.id ? '#E0E0E0' : 'transparent')}}>
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


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
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


export const ViewpointsEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ViewpointsEditorComponent);

export const ViewpointsEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ViewpointsEditorConnected {...{...props, children}} />;
}
export default ViewpointsEditor;
