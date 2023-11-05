import React, {MouseEvent, Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import {DProject, DState, DUser, Input, LProject, LUser, U} from '../joiner';
import {FakeStateProps} from '../joiner/types';

function DashboardComponent(props: AllProps) {
    const user = props.user;

    const createProject = (e: MouseEvent) => {
        let name = 'project_' + 0;
        let projectNames: string[] = user.projects.map(p => p.name);
        name = U.increaseEndingNumber(name, false, false, newName => projectNames.indexOf(newName) >= 0);
        const project = DProject.new(name, user.id);
        user.projects = [...user.projects, LProject.fromD(project)];
    }

    return (<div className={'w-25'}>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 my-auto'}>MY PROJECTS</b>
            <button className={'btn btn-primary ms-auto'} onClick={createProject}>
                <i className={'p-1 bi bi-plus'}></i>
            </button>
        </div>
        {user.projects.map((project, index) => {
            return(<div className={'p-3 border border-dark bg-white m-1'} key={index}>
                <Input data={project} field={'name'} label={'name'} />
                <button className={'btn btn-primary mx-auto'} onClick={e => user.project = project}>
                    <i className={'p-1 bi bi-info'}></i>
                </button>
            </div>)
        })}
    </div>);
}
interface OwnProps {}
interface StateProps {user: LUser}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(DUser.current);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const DashboardConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(DashboardComponent);

const Dashboard = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <DashboardConnected {...{...props, children}} />;
}

export default Dashboard;

