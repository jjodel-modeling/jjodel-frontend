import type {DState, LProject} from '../../../joiner';
import {U, Input, DUser, LUser, LModel} from '../../../joiner';
import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import type {Dictionary, FakeStateProps} from '../../../joiner/types';
import DockManager from "../DockManager";

function m2Row(model: LModel) { return mRow(model, false) }
function m1Row(model: LModel) { return mRow(model, true) }
// too small to justify a separate file
function mRow(model: LModel, showInstanceOf: boolean = false) {
    if(!model) return(<></>);
    return (
        <label className={'ms-3 d-block'} key={model.id} onClick={()=>DockManager.open2(model)} style={{cursor: 'pointer'}}>
            - {model.name}{
            showInstanceOf && <><b className={'text-success'}> {model.instanceof ? 'conforms to' : 'is shapeless'}</b> {model.instanceof?.name}</>
            }
            <button className={'ms-1 btn-outline-secondary btn bi bi-arrow-right-short'} style={{border:'none'}} onClick={()=>DockManager.open2(model)} />
        </label>)
}

function InfoTabComponent(props: AllProps) {
    const project = props.project;
    const metamodels = project.metamodels;
    let models = project.models;
    let modelmap: Dictionary<string, LModel[]> = {}
    for (let m of models) {
        let m2 = m.instanceof;
        let m2name = m2?.name as string;
        if (!modelmap[m2name]) modelmap[m2name] = [];
        modelmap[m2name].push(m);
    }
    models = Object.values(modelmap).flat();  // this way they are sorted by metamodel

    return(<div className={'p-3'}>
        <h3 className={'text-primary'}>{project.name}</h3>
        <Input data={project.id} field={'name'} jsxLabel={<b className={'text-primary my-auto me-2'}>Name</b>} hidden={true} />
        {(project.type === 'collaborative') &&
            <b className={'d-block'}><label className={'text-primary '}>Online Users:</label> {project.onlineUsers}</b>
        }
        <b><label className={'text-primary'}>Metamodels ({metamodels.length}):</label></b>
        <section>
            {metamodels.map(m2Row)}
        </section>
        <b><label className={'text-primary'}>Models ({models.length}):</label></b>
        <section>
            {models.map(m1Row)}
        </section>
    </div>);
}

interface OwnProps {}
interface StateProps {project: LProject}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const luser = LUser.fromPointer(DUser.current, state);
    ret.project = luser.project as LProject;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const InfoTabConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(InfoTabComponent);

export const InfoTab = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <InfoTabConnected {...{...props, children}} />;
}
export default InfoTab;
