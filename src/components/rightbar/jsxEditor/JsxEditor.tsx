import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import {DPointerTargetable, DViewElement, GObject, LPointerTargetable, LViewElement, Pointer} from "../../../joiner";
import Editor from "@monaco-editor/react";
import {useStateIfMounted} from "use-state-if-mounted";


function JsxEditorComponent(props: AllProps) {
    const view = props.view;
    const [jsx, setJsx] = useStateIfMounted('');

    const change = (value: string|undefined) => {
        if(value !== undefined) setJsx(value);
    }
    const blur = (evt: React.FocusEvent<HTMLDivElement>) => {
        if(jsx) view.jsxString = jsx;
    }

    return <div className={'mt-5'} style={{height: '200px'}} tabIndex={-1} onBlur={blur}>
        <h5>JSX Editor</h5>
        <Editor className={'h-auto'} onChange={change}
                defaultLanguage={'html'} defaultValue={view.jsxString} />
    </div>;
}
interface OwnProps { viewid: Pointer<DViewElement, 1, 1, LViewElement>; }
interface StateProps { view: LViewElement }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.view = LViewElement.fromPointer(ownProps.viewid);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const JsxEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(JsxEditorComponent);

export const JsxEditor = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <JsxEditorConnected {...{...props, childrens}} />;
}
export default JsxEditor;
