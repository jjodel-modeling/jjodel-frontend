import React, {CSSProperties, Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import Editor from '@monaco-editor/react';
import {DState, DViewElement, LViewElement, Pointer, Defaults} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import {FakeStateProps} from '../../../joiner/types';
import { Btn, CommandBar } from '../../commandbar/CommandBar';
import { compactMonacoOptions, withReadOnly } from '../monacoConfig';

function OclEditorComponent(props: AllProps) {
    const view = props.view;
    const [ocl, setOcl] = useStateIfMounted(view.oclCondition);
    const [show, setShow] = useStateIfMounted(true);

    const [expand, setExpand] = useStateIfMounted(false);

    if(!view) return(<></>);
    const readOnly = props.readOnly !== undefined ? props.readOnly : Defaults.check(view.id);
    const change = (value: string|undefined) => { // save in local state for frequent changes.
        if(value !== undefined) setOcl(value);
    }
    const blur = () => { view.oclCondition = ocl } // confirm in redux state for final state

    const lines = (Math.round(view.oclCondition.split(/\r|\r\n|\n/).length*1.8) < 5 ? 10 : Math.round(view.oclCondition.split(/\r|\r\n|\n/).length*1.8));

    return(<>
        <button
            type="button"
            style={{...(props.style || {})}}
            className={'section-header section-header--collapsible'}
            onClick={e => setShow(!show)}
        >
            <div className="section-header__left">
                <i className={'bi bi-chevron-' + (show ? 'down' : 'right')} />
                <h3 className="section-title">OCL EDITOR</h3>
            </div>
        </button>

        {show && <div className={"monaco-editor-wrapper"}
                style={{padding: '5px', height:`${lines+'lvh'}`, transition: 'height 0.3s', resize: 'vertical', overflow:'hidden'}}
                      tabIndex={-1}
                      onFocus={() => setExpand(true)}
                    onBlur={() => {setExpand(false); blur();}}>
            <Editor className={'mx-1'} onChange={change}
                    options={withReadOnly(compactMonacoOptions, readOnly)}
                    defaultLanguage={'js'} value={view.oclCondition||""} 
                    onMount={(editor) => {
                        console.log('[Monaco OCL] Mounted!');
                        console.log('[Monaco OCL] View:', view);
                        console.log('[Monaco OCL] Initial value:', view.oclCondition);
                    }}
                    loading={<div style={{padding: '20px'}}>Loading OCL Editor...</div>}
                />
        </div>}
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
