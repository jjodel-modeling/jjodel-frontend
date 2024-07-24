import React, {CSSProperties, Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import Editor from '@monaco-editor/react';
import {DState, DViewElement, LViewElement, Pointer, Defaults} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import {FakeStateProps} from '../../../joiner/types';

function OclEditorComponent(props: AllProps) {
    const view = props.view;
    const [ocl, setOcl] = useStateIfMounted(view.oclCondition);
    const [show, setShow] = useStateIfMounted(true);
    if(!view) return(<></>);
    const readOnly = props.readonly !== undefined ? props.readonly : Defaults.check(view.id);
    const change = (value: string|undefined) => { // save in local state for frequent changes.
        if(value !== undefined) setOcl(value);
    }
    const blur = () => { view.oclCondition = ocl } // confirm in redux state for final state

    return(<>
        <div style={{...(props.style || {})}} className={'d-flex'}>
            <span className={'cursor-pointer my-auto'} tabIndex={-1} onClick={e => setShow(!show)}>
                {show ? <i className={'bi bi-eye-fill'} /> : <i className={'bi bi-eye-slash-fill'} /> }
            </span>
            <label className={'ms-2 mb-1 my-auto'}>
                OCL Editor {/*(OCL engine by Stephan Köninger,
                <a className={'ms-1'} target={'_blank'} href={'https://ocl.stekoe.de/#examples'}>Supported instructions</a>)*/}
            </label>
        </div>

        {show && <div className={"monaco-editor-wrapper"}
                style={{padding: '5px', minHeight: '20px', height:'100px', resize: 'vertical', overflow:'hidden'}}
                      tabIndex={-1} onBlur={blur}>
            <Editor className={'mx-1'} onChange={change}
                    options={{fontSize: 12, scrollbar: {vertical: 'hidden', horizontalScrollbarSize: 5}, minimap: {enabled: false}, readOnly: readOnly}}
                    defaultLanguage={'js'} value={view.oclCondition} />
        </div>}
    </>);
}
interface OwnProps {
    readonly?: boolean;
    viewID: Pointer<DViewElement, 1, 1, LViewElement>;
    style?: CSSProperties;
}
interface StateProps { view: LViewElement }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.view = LViewElement.fromPointer(ownProps.viewID);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const OclEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(OclEditorComponent);

export const OclEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <OclEditorConnected {...{...props, children}} />;
}

OclEditorComponent.cname = 'OclEditorComponent';
OclEditorConnected.cname = 'OclEditorConnected';
OclEditor.cname = 'OclEditor';
export default OclEditor;
