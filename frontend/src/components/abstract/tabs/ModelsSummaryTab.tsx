import type {FakeStateProps} from '../../../joiner';
import {DUser, LUser, DState, LProject, windoww} from '../../../joiner';
import React, {Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import ProjectEditor from '../../project/ProjectEditor';

function InfoTabComponent(props: AllProps) {
    const project = props.project;
    if (!project) return null;
    windoww.project = project;

    return (
        <div className="project-editor-container" tabIndex={-1}>
            <ProjectEditor project={project} />
        </div>
    );
}

interface OwnProps {}
interface StateProps {project: LProject}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    //const luser = LUser.fromPointer(DUser.current, state) as any as LUser;
    ret.project = LProject.getProject() as LProject;
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

export const InfoTab = (props: OwnProps, children: ReactNode[] = []): ReactElement => {
    // @ts-ignore children
    return <InfoTabConnected {...{...props, children}} />;
}
export default InfoTab;
