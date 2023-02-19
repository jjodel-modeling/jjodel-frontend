import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import {
    DPointerTargetable,
    DViewElement,
    GObject, Input,
    LModelElement,
    LPointerTargetable,
    LViewElement,
    Pointer, Select
} from "../../../joiner";
import Editor from "@monaco-editor/react";
import {useStateIfMounted} from "use-state-if-mounted";
import Structure from "../structureEditor/Structure";

interface Props {data: LModelElement, index: number}
function Child(props: Props) {
    const data = props.data;
    const index = props.index;
    return <div style={{marginLeft: (index === 1) ? '0' : '1rem'}}>
        {Structure.Editor(data)}
        {data.childrens.map((child, i) => {
            return <Child key={i} index={index + (i + 1)} data={child} />
        })}
    </div>
}

function TreeEditorComponent(props: AllProps) {
    const data = props.data;
    if(data) {
        return <div>
            {data.childrens.map((child, i) => {
                return <Child key={i} index={1} data={child} />
            })}
        </div>
    } else return <></>
}
interface OwnProps { }
interface StateProps { data: LModelElement|undefined }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer = state._lastSelected?.modelElement;
    if(pointer) ret.data = LModelElement.fromPointer(pointer);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const TreeEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TreeEditorComponent);

export const TreeEditor = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <TreeEditorConnected {...{...props, childrens}} />;
}
export default TreeEditor;
