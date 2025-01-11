import type {DState, LProject} from '../../../joiner';
import {DUser, LModel, LUser} from '../../../joiner';
import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import type {Dictionary, FakeStateProps} from '../../../joiner/types';
import DockManager from "../DockManager";
import {LeftBar} from '../../../pages/components';
import {ProjectCatalog, Title} from '../../../pages/components/Dashboard';


type Props = {
    key: string;
    name: string;
    data: any;
    metamodels: any;
    models: any;
};

const Project = (props: Props) => {
    const {name, metamodels, models} = props;
    const project = props.data;

    return (
        <React.Fragment>
            <div className={"dashboard-container"} tabIndex={-1}>
                <LeftBar active={'Project'} project={project} />
                <div className={'user'}>
                    <div className={'name'}>
                        <Title projectID={project.id} active={'Project'} title={project.name} icon={<i className="bi bi-p-square"></i>} description={project.description} type={project.type}/>
                        <ProjectCatalog project={project} />
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

function m2Row(model: LModel) { return mRow(model, false) }
function m1Row(model: LModel) { return mRow(model, true) }
// too small to justify a separate file

function mRow(model: LModel, showInstanceOf: boolean = false) {
    if(!model) return(<></>);
    return (
        <p className={'d-block'} key={model.id} onClick={()=>DockManager.open2(model)} style={{cursor: 'pointer'}}>
            <i className="bi bi-folder"></i> {model.name}{
                showInstanceOf && <><span className={'text-success'}> {model.instanceof ? 'conforming to' : 'is shapeless'}</span> {model.instanceof?.name}</>
            }
            <i className="bi bi-chevron-down hoverable">
                <div className="content context-menu">
                    <div className={'col item'}>Open</div>
                    <div className={'col item'}>Duplicate</div>
                    <div className={'col item'}>Close</div>
                    <hr className={'my-1'} />
                    <div className={'col item'}>Delete</div>
                </div>
            </i>
        </p>)
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
    return(<Project key={project.id} name={project.name} data={project} metamodels={metamodels} models={models}/>);
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
