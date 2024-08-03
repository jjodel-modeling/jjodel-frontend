// import {
//     DState,
//     DUser,
//     DViewPoint,
//     LProject,
//     LUser,
//     LViewElement,
//     LViewPoint,
//     Pointer,
//     SetFieldAction,
//     U
// } from '../../joiner';
// import {FakeStateProps} from '../../joiner/types';
// import React, {Component, Dispatch, ReactElement, useState} from 'react';
// import {connect} from 'react-redux';
// import './style.scss';
//
//
// function ViewpointsComponent(props: AllProps) {
//     const {viewpoints, project} = props;
//     const [clicked, setClicked] = useState({viewpointID: '', x: 0, y: 0});
//
//     const create = () => {
//         setClicked({viewpointID: '', x: 0, y: 0})
//         let name = 'viewpoint_' + 0;
//         let viewpointNames: string[] = viewpoints.map(vp => vp && vp.name);
//         name = U.increaseEndingNumber(name, false, false, newName => viewpointNames.indexOf(newName) >= 0);
//         DViewPoint.new2(name, '', (d) => { d.isExclusiveView = !(d.isValidation = /*props.validation*/ false); } );
//     }
//     const remove = (pointer: Pointer<LViewPoint>) => {
//         setClicked({viewpointID: '', x: 0, y: 0})
//         const vp: LViewPoint = LViewPoint.fromPointer(pointer);
//         SetFieldAction.new(project.id, 'viewpoints', vp.id as any, '-=', false);
//         vp.subViews.map(v => v.delete());
//         vp.delete();
//     }
//     const select = (pointer: Pointer<LViewPoint>) => {
//         setClicked({viewpointID: '', x: 0, y: 0})
//         const vp: LViewPoint = LViewPoint.fromPointer(pointer);
//         project.activeViewpoint = vp;
//     }
//     const duplicate = (pointer: Pointer<LViewPoint>) => {
//         setClicked({viewpointID: '', x: 0, y: 0})
//         const vp: LViewPoint = LViewPoint.fromPointer(pointer);
//         vp.duplicate(true);
//     }
//     const exclusive = (pointer: Pointer<LViewPoint>) => {
//         setClicked({viewpointID: '', x: 0, y: 0})
//         const vp: LViewPoint = LViewPoint.fromPointer(pointer);
//         vp.isExclusiveView = !vp.isExclusiveView;
//     }
//
//     return(<section className={'p-2'}>
//         <div className={'v-container'}>
//             <label className={'text-primary'} onClick={e => create()}>
//                 Create new...
//             </label>
//         </div>
//         {viewpoints.map(v => <div className={'v-container'}>
//             <label className={v.id === clicked.viewpointID ? 'clicked' : ''}
//                    onClick={e => setClicked({viewpointID: v.id, x: e.clientX, y: e.clientY})}
//                    onContextMenu={e => setClicked({viewpointID: v.id, x: e.clientX, y: e.clientY})} >
//                 {v.name}
//                 {project.activeViewpoint.id === v.id && <i className={'bi bi-check-lg text-success ms-2'} />}
//                 {v.isExclusiveView && <i className={'bi bi-exclamation-lg text-danger ms-1'} />}
//             </label>
//             {clicked.viewpointID === v.id && <div className={'v-panel rounded border p-2 v-menu'}>
//                 <label className={'v-link'} onClick={e => select(clicked.viewpointID)}>Activate</label>
//                 <label className={'v-link'} onClick={e => exclusive(clicked.viewpointID)}>Exclusive</label>
//                 <label className={'v-link'} onClick={e => duplicate(clicked.viewpointID)}>Duplicate</label>
//                 <label className={'v-link'} onClick={e => remove(clicked.viewpointID)}>Delete</label>
//                 <label className={'v-link text-danger'} onClick={e => setClicked({viewpointID: '', x: 0, y: 0})}>Close</label>
//             </div>}
//         </div>)}
//     </section>);
// }
//
// interface OwnProps {}
// interface StateProps {
//     viewpoints: LViewPoint[]
//     project: LProject
// }
// interface DispatchProps {}
//
// type AllProps = OwnProps & StateProps & DispatchProps;
//
// function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
//     const ret: StateProps = {} as FakeStateProps;
//     ret.viewpoints = LViewPoint.fromArr(state.viewpoints);
//     const user = LUser.fromPointer(DUser.current);
//     ret.project = U.wrapper<LProject>(user.project);
//     return ret;
// }
//
// function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
//     const ret: DispatchProps = {} as any;
//     return ret;
// }
//
//
// export const ViewpointsConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
//     mapStateToProps,
//     mapDispatchToProps
// )(ViewpointsComponent);
//
// export const Viewpoints = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
//     return <ViewpointsConnected {...{...props, children}} />;
// }
// export default Viewpoints;
export const deleted = true;
