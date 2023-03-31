import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import {DViewElement, LViewElement, Pointer} from "../../../joiner";
import Editor from "@monaco-editor/react";


function JsxEditorComponent(props: AllProps) {
    const view = props.view;
    //const [jsx, setJsx] = useStateIfMounted('');

    const change = (value: string|undefined) => {
        //if(value !== undefined) setJsx(value);
        if(value !== undefined) view.jsxString = value;
    }

    /*
    DELETED ON BLUR
    const blur = (evt: React.FocusEvent<HTMLDivElement>) => { if(jsx) view.jsxString = jsx; }
    from div: tabIndex={-1} onBlur={blur}
    */

    return <div style={{marginTop: '2.5em', height: '10em'}}>
        <label className={'ms-1'}>JSX Editor</label>
        <Editor className={'mx-1'} onChange={change}
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
