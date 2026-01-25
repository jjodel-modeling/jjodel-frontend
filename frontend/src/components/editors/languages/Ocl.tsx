import React, {CSSProperties, Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import Editor from '@monaco-editor/react';
import {DState, DViewElement, LViewElement, Pointer, Defaults} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import {FakeStateProps} from '../../../joiner/types';
import { compactMonacoOptions, withReadOnly } from '../monacoConfig';
import EditorToolbar from '../EditorToolbar';
import EditorFullscreenModal from '../EditorFullscreenModal';

function OclEditorComponent(props: AllProps) {
    const view = props.view;
    const [ocl, setOcl] = useStateIfMounted(view.oclCondition);
    const [show, setShow] = useStateIfMounted(true);
    const [expand, setExpand] = useStateIfMounted(false);
    const [wrap, setWrap] = useStateIfMounted(false);
    const [fullscreen, setFullscreen] = useStateIfMounted(false);

    if(!view) return(<></>);
    const readOnly = props.readOnly !== undefined ? props.readOnly : Defaults.check(view.id);
    const change = (value: string|undefined) => { // save in local state for frequent changes.
        if(value !== undefined) setOcl(value);
    }
    const blur = () => { view.oclCondition = ocl } // confirm in redux state for final state

    const lines = (Math.round(view.oclCondition.split(/\r|\r\n|\n/).length*1.8) < 5 ? 10 : Math.round(view.oclCondition.split(/\r|\r\n|\n/).length*1.8));

    return(<>
        <EditorToolbar
            title="OCL Editor"
            icon="bi-braces"
            content={ocl || ''}
            collapsed={!show}
            onCollapseToggle={() => setShow(!show)}
            onWrapChange={(newWrap) => setWrap(newWrap)}
            onExpandChange={(newExpanded) => setExpand(newExpanded)}
            onFullscreenOpen={() => setFullscreen(true)}
            disableFullscreen={true}
            initialExpanded={expand}
            readOnly={readOnly}
        />

        {show && <div className={"monaco-editor-wrapper"}
                style={{padding: '5px', height:`${lines+'lvh'}`, transition: 'height 0.3s', resize: 'vertical', overflow:'hidden'}}
                      tabIndex={-1}
                      onFocus={() => setExpand(true)}
                    onBlur={() => {setExpand(false); blur();}}>
            <Editor className={'mx-1'} onChange={change}
                    options={{
                        ...withReadOnly(compactMonacoOptions, readOnly),
                        wordWrap: wrap ? 'on' : 'off'
                    }}
                    defaultLanguage={'js'} value={view.oclCondition || ""}
                    onMount={(editor) => {
                        console.log('[Monaco OCL] Mounted!');
                    }}
                    loading={<div style={{padding: '20px'}}>Loading OCL Editor...</div>}
                />
        </div>}

        <EditorFullscreenModal
            isOpen={fullscreen}
            onClose={() => { blur(); setFullscreen(false); }}
            title="OCL Editor"
            icon="bi-braces"
            value={ocl || ''}
            onChange={change}
            onSave={(newValue) => {
                view.oclCondition = newValue;
                setFullscreen(false);
            }}
            language="javascript"
            readOnly={readOnly}
        />
    </>);
}
interface OwnProps {
    readOnly?: boolean;
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

export const OclEditor = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <OclEditorConnected {...{...props, children}} />;
}

OclEditorComponent.cname = 'OclEditorComponent';
OclEditorConnected.cname = 'OclEditorConnected';
OclEditor.cname = 'OclEditor';
export default OclEditor;
