import type * as monaco from "monaco-editor";
import {DState, Input, LPointerTargetable, Overlap, Pointer} from "../../joiner";
import {FakeStateProps} from "../../joiner/types";
import React, {Dispatch, useState} from "react";
import {connect} from "react-redux";
import {DModelElement, LModelElement} from "../../model/logicWrapper";
import './mtm.scss';
import {JsEditor} from "./languages";
import Editor from "@monaco-editor/react";

const monacooptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    fontSize: 12,
    scrollbar: {vertical: 'hidden', horizontalScrollbarSize: 5},
    minimap: {enabled: false},
    readOnly: false
};

export function MTMComponent(props: AllProps): JSX.Element{
    let groups={'Metamodelers':{}, 'Modelers':{}, 'Language designer':{}, 'Concrete Syntax designer':{}};
    let groupsarr = Object.keys(groups);
    let [editor, setEditor] = useState(false);

    if (editor) return M2T(props, setEditor);
    let m2t: string = 'Dog:// ID is either here after class name (optional) or in [*] if it coincides with an attribute pointers are *\n' +
        '\tname: kirk[*]\n' +
        '\towner: damiano*\n' +
        '\tage: 15\n' +
        '\tweight: 13\n' +
        '\tnode.initialX: 200\n' +
        '\tnode.x: 200\n';

    return <section className={'w-100 h-100 p-2 MTM-tab'}>
        <h1 className={"rightbar-title"}>Model → Text → Model</h1>
        <label className={'d-flex'}>
            <span className={'my-auto'}>Language&nbsp;</span>
            <select className={'my-auto'}>
                <option>MyCustomLanguage</option>
                <option>eCore/JSON</option>
                <option>eCore/XMI</option>
            </select>
            <label onClick={() => setEditor(true)} className='my-auto d-flex ms-1' style={{cursor: 'pointer'}}>
                <i className="bi bi-pencil-square my-auto"/><span className={'my-auto'}>Edit</span>
            </label>
        </label>
        <Editor className={'mx-1'} options={monacooptions} defaultLanguage={'typescript'} value={m2t}
                onChange={() => {}}/>
        <div className={'d-flex'} style={{flexFlow: 'column'}}>
            <button>Export</button>
            <button>Import</button>
        </div>
    </section>
        ;
}

export function M2T(props: AllProps, setEditor: (v:boolean)=>void): JSX.Element{
    let m2t = 'm2t';
    let t2m = 't2m';
    return <section className={'M2T-tab'}>
        <h2>Language</h2>
        <div className={'d-flex'} style={{flexFlow: 'column'}}>
            <h2 style={{flexGrow: 1, margin: 'auto'}}>
                <Input hidden={true} getter={() => 'MyLanguage'} setter={() => {
                }}/>
            </h2>
            <button onClick={() => setEditor(false)} style={{margin: '0 auto'}}>X</button>
        </div>
        <div className={'d-flex'} style={{flexFlow: 'row'}}>
            <div className={'d-flex'} style={{flexGrow: 1, border:'1px solid red', flexWrap:'wrap'}}>
                <h3 className={'w-100'}>M2R</h3>
                <Editor className={'mx-1'} options={monacooptions} defaultLanguage={'typescript'} value={m2t}
                        onChange={() => {}} />
            </div>
            <div className={'d-flex'} style={{flexGrow: 1, border:'1px solid red', flexWrap:'wrap'}}>
                <h3 className={'w-100'}>T2M</h3>
                <Editor className={'mx-1'} options={monacooptions} defaultLanguage={'typescript'} value={t2m}
                        onChange={() => {}} />
            </div>
        </div>
    </section>;
}
/*
export function T2M(props: AllProps): JSX.Element{

    return <section className={'T2M-tab'}>
        <h2>T2M</h2>
    </section>;
}*/

interface OwnProps {
}

interface StateProps {
    data?: LModelElement;
}

interface DispatchProps {}
type AllProps = Overlap<Overlap<OwnProps, StateProps>, DispatchProps>;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as StateProps;
    const dataid = state._lastSelected?.modelElement;
    if (dataid) ret.data = LModelElement.fromPointer(dataid);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps { const ret: DispatchProps = {}; return ret; }

export const MTM = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(MTMComponent);

(MTM as any).cname = 'MTM';
MTMComponent.cname = 'MTMComponent';
