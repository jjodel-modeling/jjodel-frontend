import React, {Dispatch, ReactElement} from "react";
import {SetRootFieldAction} from "../../../redux/action/action";
import {IStore} from "../../../redux/store";
import {connect} from "react-redux";
import {U} from "../../../joiner";


function ViewpointEditorComponent(props: AllProps) {

    const viewpoints = props.viewpoints;
    const selected = props.selected;

    const add = (evt: React.MouseEvent<HTMLButtonElement>) => {
        SetRootFieldAction.new('viewpoints', Math.floor(Math.random() * 999), '+=', false);
    }
    const remove = (evt: React.MouseEvent<HTMLButtonElement>, index: number) => {
        SetRootFieldAction.new('viewpoints', index, '-=', false);
    }
    const select = (evt: React.MouseEvent<HTMLButtonElement>, value: number) => {
        SetRootFieldAction.new('viewpoint', value, '', false);
    }

    return <div>
        <div className={'d-flex p-2'}>
            <b className={'ms-1 border border-dark my-auto'}>VIEWPOINTS</b>
            <button className={'ms-auto p-1'} onClick={add}>add</button>
        </div>
        {viewpoints.map((viewpoint, i) => {
            return <div key={i} className={'d-flex p-1 mt-1 border border-dark'}>
                <label className={'border border-dark my-auto'}>
                    {(selected !== viewpoint) && <>Viewpoint {viewpoint}</>}
                    {(selected === viewpoint) && <b>Viewpoint {viewpoint}</b>}
                </label>
                <button className={'ms-auto p-1'} disabled={selected === viewpoint}
                        onClick={(evt) => {select(evt, viewpoint)}}>select</button>
                <button className={'ms-1 p-1'} disabled={i === 0 || selected === viewpoint}
                        onClick={(evt) => {remove(evt, i)}}>delete</button>
            </div>
        })}
    </div>
}
interface OwnProps { }
interface StateProps { viewpoints: number[], selected: number }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.viewpoints = state.viewpoints;
    ret.selected = state.viewpoint;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ViewpointEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ViewpointEditorComponent);

export const ViewpointEditor = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <ViewpointEditorConnected {...{...props, childrens}} />;
}
export default ViewpointEditor;
