import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DState, Input} from '../../../joiner';
import {DUser, DViewPoint, LProject, LUser, LViewPoint, U, SetFieldAction} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import {FakeStateProps} from '../../../joiner/types';


function ViewpointsEditorComponent(props: AllProps) {
    const project = props.project;
    const viewpoints = props.viewpoints;
    const active = props.active;

    const [hoverID, setHoverID] = useStateIfMounted('');

    const editName = (evt: React.ChangeEvent<HTMLInputElement>, vp: LViewPoint) => {
        vp.name = evt.target.value;
    }
    const add = () => {
        let name = 'viewpoint_' + 0;
        let viewpointNames: string[] = viewpoints.map(vp => vp && vp.name);
        name = U.increaseEndingNumber(name, false, false, newName => viewpointNames.indexOf(newName) >= 0);
        DViewPoint.new2(name, '', (d) => { d.isExclusiveView = !(d.isValidation = props.validation); } );
    }
    const destroy = (e: React.MouseEvent, viewPoint: LViewPoint) => {
        e.stopPropagation();
        SetFieldAction.new(project.id, 'viewpoints', viewPoint.id as any, '-=', false);
        viewPoint.subViews.map(v => v.delete());
        viewPoint.delete();
    }
    const select = (viewPoint: LViewPoint) => {
        project.activeViewpoint = viewPoint;
    }
    const clone = (viewPoint: LViewPoint) => {
        viewPoint.duplicate(true);
    }

    return(<div>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>Perspectives</b>
            <button className={'btn btn-primary ms-auto'} onClick={add}>
                <i className={'p-1 bi bi-plus'}></i>
            </button>
        </div>
        {viewpoints.map((viewpoint, index) => {
            return <div key={index} className={'d-flex p-1 mt-1 border round mx-1'}
                        onMouseEnter={(e) => setHoverID(viewpoint.id)}
                        onMouseLeave={(e) => setHoverID('')}
                        style={{backgroundColor: (active.id === viewpoint.id) ? 'white' :
                                (hoverID === viewpoint.id ? '#E0E0E0' : 'transparent')}}>
                <input className={'p-0 input hidden-input'} value={viewpoint.name} type={'text'}
                       onChange={(evt) => {editName(evt, viewpoint)}} disabled={index <= 0} />
                <Input className={"ms-auto"} data={viewpoint} field={"isExclusiveView"} type={"checkbox"}
                       label={"Is exclusive"} readonly={props.validation || index <= 0} />
                {(!props.validation || true) && <button className={'btn btn-success ms-1'} disabled={active.id === viewpoint.id}
                        onClick={(evt) => {select(viewpoint)}}>
                    <i className={'p-1 bi bi-check2'}></i>
                </button>
                // todo: validation views should not be "activable" but so far it is the only way to see the subviews in it.
                }
                <button className={'btn btn-success ms-1'}
                        onClick={(evt) => {clone(viewpoint)}}>
                    <i className={'p-1 bi bi-clipboard2-fill'}></i>
                </button>
                <button className={'btn btn-danger ms-1'} disabled={index <= 0 || active.id === viewpoint.id}
                        onClick={(e) => destroy(e, viewpoint)}>
                    <i className={'p-1 bi bi-trash3-fill'}></i>
                </button>
            </div>
        })}
        <label className={'p-1'}>
            *To apply a custom viewpoint, first activate the default one, and then proceed to activate the custom one.
        </label>
    </div>);
}
interface OwnProps {
    validation: boolean;
}
interface StateProps {
    project: LProject;
    viewpoints: LViewPoint[];
    active: LViewPoint;
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const user: LUser = LUser.fromPointer(DUser.current);
    const project = U.wrapper<LProject>(user.project);
    ret.project = project;
    ret.viewpoints = project.viewpoints.filter( (vp) => !!vp && vp.isValidation === ownProps.validation);
    ret.active = project.activeViewpoint;
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
