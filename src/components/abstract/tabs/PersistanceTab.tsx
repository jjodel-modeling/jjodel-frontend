import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import {Firebase} from "../../../firebase";
import {DModel} from "../../../model/logicWrapper";


function PersistanceTabComponent(props: AllProps) {
    const room = props.room;

    const addAction = async() => {
        const dModel = DModel.new('firebase-test', undefined, true);
        // @ts-ignore
        dModel.pointedBy = []; dModel.father = null; dModel._storePath = null; dModel._subMaps = null;
        const actions : any = [{type: 'CREATE', obj: {...dModel}}];
        await Firebase.edit(room, 'actions', actions);
    }


    return(<div>
        <button disabled={!room} onClick={addAction}>create Metamodel</button>
    </div>);
}
interface OwnProps {}
interface StateProps {room: string}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.room = state.room;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const PersistanceTabConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(PersistanceTabComponent);

export const PersistanceTab = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <PersistanceTabConnected {...{...props, childrens}} />;
}
export default PersistanceTab;
