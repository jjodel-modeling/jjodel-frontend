import React, {Dispatch, MouseEvent, ReactElement, useEffect} from 'react';
import {
    DState,
    DUser,
    DViewElement,
    LProject,
    LUser,
    LViewElement,
    Pointer, SetFieldAction,
    SetRootFieldAction,
    U
} from '../../../../joiner';
import {connect} from 'react-redux';
import {useStateIfMounted} from 'use-state-if-mounted';
import {FakeStateProps} from '../../../../joiner/types';

function SubViewsDataComponent(props: AllProps) {
    const view = props.view;
    const project = props.project;

    const readOnly = props.readonly;
    const [hoverID, setHoverID] = useStateIfMounted('');
    const [possibleSubViews, setPossibleSubViews] = useStateIfMounted(project.views.filter(v => v.id !== view.id && !view.subViews.map(v => v.id).includes(v.id)));
    const [subViewID, setSubViewID] = useStateIfMounted((possibleSubViews[0]) ? possibleSubViews[0].id : '');

    const add = (e: MouseEvent) => {
        if(!subViewID) return;
        // view.subViews = [...view.subViews, LViewElement.fromPointer(subViewID)];
        SetFieldAction.new(view.id, 'subViews', subViewID, '+=', true);
        const _possibleSubViews = project.views.filter(v => v.id !== subViewID && v.id !== view.id && !view.subViews.map(v => v.id).includes(v.id));
        setPossibleSubViews(_possibleSubViews);
        setSubViewID((_possibleSubViews[0]) ? _possibleSubViews[0].id : '');
    }

    const select = (view: LViewElement) => {
        // SetRootFieldAction.new('stackViews', view.id, '+=', true);
    }

    const remove = (e: MouseEvent, subView: LViewElement) => {
        e.preventDefault(); e.stopPropagation();
        // view.subViews = view.subViews.filter(v => v.id !== subView.id);
        SetFieldAction.new(view.id, 'subViews', subView.id as any, '-=', true);
        setPossibleSubViews([...possibleSubViews, subView]);
    }

    return(<section key={view.id} className={'p-3'}>
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
                        onClick={e => select(subView)}
                        style={{cursor: 'pointer', background: hoverID === subView.id ? '#E0E0E0' : 'transparent'}}>
                <label style={{cursor: 'pointer'}} className={'my-auto'}>{subView.name}</label>
                <button className={'btn btn-danger ms-auto'} disabled={readOnly}
                        onClick={e => remove(e, subView)}>
                    <i className={'p-1 bi bi-trash3-fill'}></i>
                </button>
            </div>
        })}
    </section>);
}

interface OwnProps {
    viewID: Pointer<DViewElement, 1, 1, LViewElement>;
    readonly: boolean;
}
interface StateProps {
    view: LViewElement;
    project: LProject;
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.view = LViewElement.fromPointer(ownProps.viewID);
    const user = LUser.fromPointer(DUser.current);
    ret.project = user.project as LProject;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const SubViewsDataConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(SubViewsDataComponent);

export const SubViewsData = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <SubViewsDataConnected {...{...props, children}} />;
}
export default SubViewsData;
