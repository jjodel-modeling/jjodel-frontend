import type {DState, LProject} from '../../../joiner';
import {U, Input, DUser, LUser} from '../../../joiner';
import {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import type {FakeStateProps} from '../../../joiner/types';
import DockManager from "../DockManager";


function InfoTabComponent(props: AllProps) {
    const user = props.user;
    const project = props.project;
    const metamodels = project.metamodels;
    const models = project.models;


    make buttons for open and background on hover on model list
    return(<div className={'p-3'}>
        <h3 className={'text-primary'}>{project.name}</h3>
        <Input data={project.id} field={'name'} jsxLabel={<b className={'text-primary my-auto me-2'}>Name</b>} hidden={true} />
        {(project.type === 'collaborative') &&
            <b className={'d-block'}><label className={'text-primary '}>Online Users:</label> {project.onlineUsers}</b>
        }
        <b><label className={'text-primary'}>Metamodels ({metamodels.length}):</label></b>
        <section>
        {metamodels.map((model, index) => {
            return(<>
                <label className={'ms-3 d-block'} key={index} onClick={()=>DockManager.open2(model)}>-{model.name}</label>
            </>);
        })}
        </section>
        <b><label className={'text-primary'}>Models ({models.length}):</label></b>
        <section>
            {models.map((model, index) => {
                return(<>
                    <label className={'ms-3 d-block'} key={index} onClick={()=>DockManager.open2(model)}>
                        -{model.name} <b className={'text-success'}>{model.instanceof ? 'conforms to' : 'is shapeless'}</b> {model.instanceof?.name}
                    </label>
                </>);
            })}
        </section>
    </div>);
}
interface OwnProps {}
interface StateProps {user: LUser, project: LProject}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(DUser.current);
    ret.project = ret.user.project as LProject;
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
