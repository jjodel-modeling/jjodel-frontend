import React, {Dispatch, MouseEvent, ReactElement} from 'react';
import {
    Defaults,
    DState,
    DUser,
    DViewElement,
    LProject,
    LUser,
    LViewElement,
    LViewPoint,
    TRANSACTION,
    U
} from '../../../joiner';
import {FakeStateProps} from "../../../joiner/types";
import {connect} from "react-redux";
import "./Vews.scss"

function ViewsDataComponent(props: AllProps) {
    const project = props.project;
    console.log("pv:", project.views, project.activeViewpoint.id)
    // const views = project.views.filter(v => v && (!v.viewpoint || v.viewpoint.id === project.activeViewpoint.id));
    const vp: LViewPoint = project.activeViewpoint; //
    const views = vp.subViews;

    const add = (e: MouseEvent) => {
        const jsx =`<div className={'root bg-white'}>Hello World!</div>`;
        let name = 'view_' + 0;
        let names: string[] = project.views.map(v => v && v.name);
        name = U.increaseEndingNumber(name, false, false, newName => names.indexOf(newName) >= 0);
        DViewElement.new(name, jsx);
    }


    const clone = (e: MouseEvent, v: LViewElement) => {
        e.preventDefault(); e.stopPropagation();
        TRANSACTION(()=>{ v.duplicate(); })
    }

    return(<div className={'mb-5'}>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>VIEWS</b>
            <button className={'btn btn-primary ms-auto'} onClick={add}>
                <i className={'p-1 bi bi-plus'}></i>
            </button>
        </div>
        {views.map((view, i) => {
            if(!view) return;
            return <div key={view.id} className={'view-list-elem d-flex p-1 mt-1 border round mx-1'} tabIndex={-1}
                        onClick={e => props.setSelectedView(view)}>
                <label style={{cursor: 'pointer'}} className={'my-auto'}>{view.name}</label>
                <button className={'btn btn-success ms-auto'} onClick={e => { clone(e, view); e.stopPropagation(); }}>
                    <i className={'p-1 bi bi-clipboard2-fill'}></i>
                </button>
                <button className={'btn btn-danger ms-1'} disabled={Defaults.check(view.id)}
                        onClick={e => { view.delete(); e.stopPropagation(); }}>
                    <i className={'p-1 bi bi-trash3-fill'}></i>
                </button>
            </div>
        })}
    </div>);
}

interface OwnProps {
    setSelectedView: React.Dispatch<React.SetStateAction<LViewElement | undefined>>;// (val: LViewElement | undefined) => {}
}
interface StateProps {
    project: LProject;
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const user: LUser = LUser.fromPointer(DUser.current);
    ret.project = user.project as LProject;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ViewsDataConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ViewsDataComponent);

export const ViewsData = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ViewsDataConnected {...{...props, children}} />;
}
export default ViewsData;
