import type {Pointer} from "../../../joiner";
import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {DState, DUser, LModel, LProject, LUser, Input} from "../../../joiner";
import type {FakeStateProps} from "../../../joiner/types";


function InfoTabComponent(props: AllProps) {
    const user = props.user;
    const project: LProject = user.project as unknown as LProject;
    const metamodels = project.metamodels;
    const models = project.models;

    return(<div className={'p-3'}>
        <h3 className={'text-primary'}>{project.name}</h3>
        <Input data={project.id} field={'name'} jsxLabel={<b className={'text-primary me-2'}>Name</b>} hidden={true} />
        <b><label className={'text-primary'}>Metamodels ({metamodels.length}):</label></b>
        <br />
        {metamodels.map((model, index) => {
            return(<>
                <label className={'ms-3'} key={index}>-{model.name}</label>
                <br />
            </>);
        })}
        <b><label className={'text-primary'}>Models ({models.length}):</label></b><br />
        {models.map((model, index) => {
            return(<>
                <label className={'ms-3'} key={index}>
                    -{model.name} <b className={'text-success'}>{model.instanceof ? "conforms to" : "is shapeless"}</b> {model.instanceof?.name}
                </label>
                <br />
            </>);
        })}
    </div>);
}
interface OwnProps {}
interface StateProps {user: LUser}
interface DispatchProps { }
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


export const InfoTabConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(InfoTabComponent);

export const InfoTab = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <InfoTabConnected {...{...props, children}} />;
}
export default InfoTab;
