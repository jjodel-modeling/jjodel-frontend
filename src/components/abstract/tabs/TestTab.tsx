import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import Tree from "../../forEndUser/Tree";
import {LModelElement} from "../../../model/logicWrapper";

function TestTabComponent(props: AllProps) {


    return(<div>
        <Tree>
            {//@ts-ignore
                <div label={'Root'}>
                    {//@ts-ignore
                <div label={<b className={'text-primary'}>Sub Root</b>}>
                    {//@ts-ignore
                    <div label={<b className={'text-warning'}>Leaf #1</b>}></div>}
                    {//@ts-ignore
                    <div label={<b className={'text-warning'}>Leaf #2</b>}></div>}
                </div>}
            </div>}
        </Tree>
        <hr className={'my-2'} />
        <Tree data={props.selected as any} />
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


const TestTabConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TestTabComponent);

const TestTab = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <TestTabConnected {...{...props, children}} />;
}
export default TestTab;
