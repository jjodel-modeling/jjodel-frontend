import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import Tree from "../../forEndUser/Tree";
import {LModelElement} from "../../../joiner";

function TestTabComponent(props: AllProps) {
    const selected = props.selected;

    return(<div>
        {selected ? <Tree data={selected} /> : <label>NULL</label>}
        <hr />
        <Tree>
            Root
            <div>
                Sub Root
                <div>Leaf</div>
                <div>Leaf</div>
            </div>
        </Tree>
    </div>);
}
interface OwnProps {}
interface StateProps {selected: null|LModelElement}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer = state._lastSelected?.modelElement;
    if(pointer) ret.selected = LModelElement.fromPointer(pointer);
    else ret.selected = null;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const TestTabConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TestTabComponent);

export const TestTab = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <TestTabConnected {...{...props, children}} />;
}
export default TestTab;
