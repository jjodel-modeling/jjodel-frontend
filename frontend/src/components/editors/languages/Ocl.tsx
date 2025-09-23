import React, {CSSProperties, Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import Editor from '@monaco-editor/react';
import {DState, DViewElement, LViewElement, Pointer, Defaults} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import {FakeStateProps} from '../../../joiner/types';
import { Btn, CommandBar } from '../../commandbar/CommandBar';

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
        <div style={{...(props.style || {})}} className={'cursor-pointer d-flex'} onClick={e => setShow(!show)}>
            <span className={'chevron-holder'} tabIndex={-1} >
                <i className={'bi bi-chevron-' + (show ? 'down' : 'right')} />
                {/*show ? <i className={'bi bi-eye-fill'} /> : <i className={'bi bi-eye-slash-fill'} /> */}
            </span>
            <label className={'editor-label'}>
                OCL Editor {/*(OCL engine by Stephan Köninger,
                <a className={'ms-1'} target={'_blank'} href={'https://ocl.stekoe.de/#examples'}>Supported instructions</a>)*/}
            </label>
            {/* show && <CommandBar style={{paddingTop: '10px'}}>
                {expand ?
                    <Btn icon={'shrink'} action={(e) => {setExpand(false); setShow(true)}} tip={'Minimize editor'}/>
                    :
                    <Btn icon={'expand'} action={(e) => {setExpand(true); setShow(true)}} tip={'Enlarge editor'}/>
                }
            </CommandBar>*/}
        </div>

        {show && <div className={"monaco-editor-wrapper"}
                style={{padding: '5px', height:`${lines+'lvh'}`, transition: 'height 0.3s', resize: 'vertical', overflow:'hidden'}}
                      tabIndex={-1}
                      onFocus={() => setExpand(true)}
                    onBlur={() => {setExpand(false); blur();}}>
            <Editor className={'mx-1'} onChange={change}
                    options={{
                        fontSize: 12, 
                        scrollbar: {
                            vertical: 'hidden', 
                            horizontalScrollbarSize: 5
                        }, 
                        minimap: {enabled: false}, 
                        readOnly: readOnly,
                }}
                    defaultLanguage={'js'} value={view.oclCondition} />
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
