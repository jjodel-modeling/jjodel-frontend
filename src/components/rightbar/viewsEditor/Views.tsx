import React, {Dispatch, MouseEvent, ReactElement} from 'react';
import {
    LProject,
    Dictionary,
    Pointer,
    TRANSACTION,
    Pointers,
    LViewPoint,
    SetFieldAction,
    DPointerTargetable,
    store,
    LPointerTargetable
} from '../../../joiner';
import {CreateElementAction, Defaults, DState, DUser, DViewElement, LUser, LViewElement, U} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import {FakeStateProps} from "../../../joiner/types";
import {connect} from "react-redux";
import "./Vews.scss"

function ViewsDataComponent(props: AllProps) {
    const project = props.project;
    console.log("pv:", project.views, project.activeViewpoint.id)
    // const views = project.views.filter(v => v && (!v.viewpoint || v.viewpoint.id === project.activeViewpoint.id));
    let vp: LViewPoint = project.activeViewpoint; //
    const subViewScores = vp.__raw.subViews;

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

    (window as any).views = subViewScores;
    (window as any).vp = vp;
    const state: DState = store.getState();
    return(<div>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>VIEWS</b>
            <button className={'btn btn-primary ms-auto'} onClick={add}>
                <i className={'p-1 bi bi-plus'}></i>
            </button>
        </div>
        {Object.keys(subViewScores).map((subviewid, i) => {
            let scoreBoost: number = subViewScores[subviewid];
            let subview: LViewElement = LPointerTargetable.fromPointer(subviewid, state);
            // todo: add a "header" here with subview | subview piority boost or and turn the "subview" section of a vp/view into this stuff instead of separate tab
            if (!subview) return;
            // @ts-ignore
            return <div key={subviewid} tabIndex={i} onClick={e => props.setSelectedView(subview)} className={'view-list-elem d-flex p-1 mt-1 border round mx-1 hoverable'}>
                <label style={{cursor: 'pointer'}} className={'my-auto'}>{subview.name}</label>
                <label className='preview ms-auto' style={{position:'unset'}} />
                {false ? <label className='content ms-auto' style={{position:'unset'}} onClick={e => {e.stopPropagation();}} >
                    <span>Sub-view matching boost</span>
                    {/* @ts-ignore: digit={"2"} */}
                    <input onBlur={(e) => subview.setSubViewScore(subviewid, +e.target.value)} type={"number"} digit={"4"}
                           value={scoreBoost} className={"ms-1 me-1"} style={{maxHeight:'21px', width:"50px"}} />
                </label>
                    :
                <label className='content ms-auto' style={{position:'unset'}} />
                }
                <button className={'btn btn-success ms-1'} onClick={e => { clone(e, subview); e.stopPropagation(); }}>
                    <i className={'p-1 bi bi-clipboard2-fill'} />
                </button>
                <button onClick={e => { subview.delete(); e.stopPropagation(); }} className={'btn btn-danger ms-1'} disabled={Defaults.check(subview.id)}>
                    <i className={'p-1 bi bi-trash3-fill'} />
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
    const user = LUser.fromPointer(DUser.current);
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
