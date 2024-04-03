import React, {Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import Editor from '@monaco-editor/react';
import {DState, DViewElement, LViewElement, Pointer, Defaults} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import {FakeStateProps} from '../../../joiner/types';

function JsEditorComponent(props: AllProps) {
    const view = props.view;
    const [js, setJs] = useStateIfMounted(view.jsCondition);
    if(!view) return(<></>);
    const readOnly = props.readonly !== undefined ? props.readonly : Defaults.check(view.id);
    const change = (value: string|undefined) => { // save in local state for frequent changes.
        if(value !== undefined) setJs(value);
    }
    const blur = () => { view.jsCondition = js } // confirm in redux state for final state

    return <section>
        <label className={'ms-1 mb-1'}>JS Editor</label>
        <div className={'monaco-editor-wrapper'} style={{
            minHeight: '20px', height:'200px'/*there is a bug of height 100% on childrens not working if parent have only minHeight*/,
            resize: 'vertical', overflow:'hidden'}} tabIndex={-1} onBlur={blur}>
            <Editor className={'mx-1'} onChange={change}
                    options={{fontSize: 12, scrollbar: {vertical: 'hidden', horizontalScrollbarSize: 5}, minimap: {enabled: false}, readOnly: readOnly}}
                    defaultLanguage={'js'} value={view.jsCondition} />
        </div>
    </section>;
}
interface OwnProps {
    readonly?: boolean;
    viewid: Pointer<DViewElement, 1, 1, LViewElement>; }
interface StateProps { view: LViewElement }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.view = LViewElement.fromPointer(ownProps.viewid);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const JsEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(JsEditorComponent);

export const JsEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <JsEditorConnected {...{...props, children}} />;
}

JsEditorComponent.cname = 'JsEditorComponent';
JsEditorConnected.cname = 'JsEditorConnected';
JsEditor.cname = 'JsEditor';
export default JsEditor;
