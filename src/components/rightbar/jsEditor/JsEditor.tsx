import React, {CSSProperties, Dispatch, ReactElement, ReactNode, useEffect} from 'react';
import {connect} from 'react-redux';
import Editor, {useMonaco} from '@monaco-editor/react';
import {DState, DViewElement, LViewElement, Pointer, Defaults} from '../../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import {FakeStateProps} from '../../../joiner/types';
import { CommandBar, Btn } from '../../commandbar/CommandBar';

function JsEditorComponent(props: AllProps) {
    const {view, field, placeHolder, height, title, getter, setter, jsxLabel} = props;
    const [js, setJs] = useStateIfMounted(view.jsCondition);
    const [show, setShow] = useStateIfMounted(props.initialExpand ? props.initialExpand(view, field) : false);
    
    const [expand, setExpand] = useStateIfMounted(false);
    
    const readOnly = props.readonly !== undefined ? props.readonly : Defaults.check(view.id);
    const change = (value: string|undefined) => {
        /* save in local state for frequent changes */
        if(value !== undefined) setJs(value);
    }
    const blur = () => {
        /* confirm in redux state for final state */
        if(js && setter) setter(js);
        else if(field) (view as any)[field] = js;
    }
    const monaco = useMonaco();
    (window as any).monaco = monaco;

    useEffect(() => {
        if (!monaco) return;
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types']//, 'src/static/'], // doubt those can be accesed at runtime but trying
        });
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
        monaco.languages.typescript.typescriptDefaults.addExtraLib(`declare var data: 'datatype';`);
        }, [monaco]);

    let value = '';
    if(getter) value = getter();
    else if(placeHolder) value = placeHolder;
    else if(field && view[field]) value = (view as any)[field];

    return <>
        <div style={{...(props.style || {})}} className={'cursor-pointer d-flex'} onClick={e => setShow(!show)}>
            <span className={'my-auto'} tabIndex={-1}>
                <i className={'bi bi-chevron-' + (show ? 'down' : 'right')} />
                {/*show ? <i className={'bi bi-eye-fill'} /> : <i className={'bi bi-eye-slash-fill'} /> */}
            </span>
            <label className={'editor-label'}>
                {title || 'JS Editor'}
            </label>
            {jsxLabel && jsxLabel}
            {show && <CommandBar style={{paddingTop: '10px'}}>
                {expand ? 
                    <Btn icon={'shrink'} action={(e) => {setExpand(false); setShow(true)}} tip={'Minimize editor'}/>
                    :
                    <Btn icon={'expand'} action={(e) => {setExpand(true); setShow(true)}} tip={'Enlarge editor'}/>
                }
            </CommandBar>}
        </div>
        {show && <div className={'monaco-editor-wrapper'}
             /* style={{padding: '5px', minHeight: '20px', height: height ? `${height}px` : '100px', resize: 'vertical', overflow:'hidden'}}*/
             style={{padding: '5px', minHeight: '20px', height:`${expand ? '10lvh' : '5lvh'}`, transition: 'height 0.3s', resize: 'vertical', overflow:'hidden'}}

            tabIndex={-1} onBlur={blur}>
            <Editor className={'mx-1'} onChange={change}
                    options={{fontSize: 12, scrollbar: {vertical: 'hidden', horizontalScrollbarSize: 5}, minimap: {enabled: false}, readOnly: readOnly}}
                    defaultLanguage={'typescript'} value={value} />
        </div>}
    </>;
}
interface OwnProps {
    readonly?: boolean;
    viewID: Pointer<DViewElement, 1, 1, LViewElement>;
    field?: keyof LViewElement;
    placeHolder?: string;
    title?: ReactNode;
    height?: number;
    style?: CSSProperties;
    jsxLabel?: ReactNode;
    getter?: () => string;
    setter?: (js: string) => void;
    initialExpand?: (data: LViewElement, field?: string) => boolean;
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
