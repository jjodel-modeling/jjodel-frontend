import type * as monaco from "monaco-editor";
import {DState, Input, LPointerTargetable, Overlap, Pointer} from "../../joiner";
import {FakeStateProps} from "../../joiner/types";
import React, {Dispatch, JSX, useState} from "react";
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
    let [language, setLanguage] = useState('MyCustomLanguage');

    let m2t: string = 'not implemented, this is a placeholder';
    switch (language){
        case 'MyCustomLanguage':
            m2t = 'Dog: kirk // ID is either here after class name (optional) or in [*] if it coincides with an attribute pointers are *\n' +
                '\tname: kirk\n' + // '\tname: kirk[*]\n' +
                '\towner: Damiano\n' + // '\towner: Damiano*\n' +
                '\tage: 15\n' +
                '\tweight: 13\n' +
                '\tnode.initialX: 200\n' +
                '\tnode.x: 200\n';
            break;
        case 'JSON':
            m2t = `{
    id: 'kirk',
    name: 'kirk',
    owner: 'Damiano',
    age: 15,
    weight: 13,
    node: {
        initialX: 200,
        x: 200
    }
}`;
            break;
        case 'Emfatic (m2 only)':
            m2t = `@namespace(uri="psl", prefix="")
package psl;
class Dog{
    attr String id;
    attr String name;
    attr Integer age;
}
`; break;
        case 'flexmi/YAML':
            m2t = `?nsuri: psl
dog:
- id: kirk
- name: kirk
- owner: Damiano
- age: 15
- weight: 13
- node:
  - initialX: 200
  - x: 20
`; break;
        case 'flexmi/XMI':
            m2t = `<?nsuri psl?>
<dog name="kirk" id="kirk">
    <owner>Damiano</owner>
    <age>15</age>
    <weight>13</weight>
    <node>
        <initialX>200</initialX>
        <x>200</x>
    </node>
<dog>
    `; break;
        case 'eCore/JSON': break;
        case 'eCore/XMI': break;
        default: break;
    }
    if (editor) return M2T({...props, language} as any, setEditor);

    return <section className={'w-100 h-100 p-2 MTM-tab'}>
        <h1 className={"rightbar-title"}>Model → Text → Model</h1>
        <label className={'d-flex'}>
            <span className={'my-auto'}>Language&nbsp;</span>
            <select className={'my-auto'} onChange={(e) => setLanguage(e.target.value)}>
                <option value={'JSON'}>JSON</option>
                <option value={'MyCustomLanguage'}>MyCustomLanguage</option>
                <option value={'Emfatic (m2 only)'}>Emfatic (m2 only)</option>
                <option value={'flexmi/YAML'}>flexmi/YAML</option>
                <option value={'flexmi/XMI'}>flexmi/YAML</option>
                <option value={'eCore/XMI'}>flexmi/YAML</option>
                <option value={'eCore/JSON'}>eCore/JSON</option>
                <option value={'eCore/XMI'}>eCore/XMI</option>
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
    let m2t_func: string = 'not implemented, this is a placeholder';
    let t2m_func: string = 'not implemented, the m2t result will be read-only';
    switch((props as any).language){
        case 'MyCustomLanguage':
            m2t_func = `
            function (model, node){
                let text: string = '' model.className + ':' + model.id;
                for (let child of model.attributes) text += '\\n\\t'+child.name+':'+JSON.stringify(child.values);
                for (let child of model.references) text += '\\n\\t'+child.name+':'+JSON.stringify(child.values.map(v=>v.id));
                text+='\\n\\tnode.x' = node.initialX;
                text+='\\n\\tnode.initialX' = node.x;
                return text;
            }
            `
            t2m_func = `
    function (text) {
        let lines = text.split('\\n');
        lines = lines.map(line=>{ // uncomment
            let comment_index = line.indexOf('//'); return (comment_index==-1) ? line : line.substr(0,comment_index);
        }
        let parsed = {};
        for (let line of lines) {
            let split = Indexline.indexOf(':');
            let key = parsed.className = line.substring(0,splitIndex).trim();
            let val = line.substring(splitIndex+1).trim();
            if (line[0] !== ' ') { // first line contains the type and identifier
                parsed.className = key;
                parsed.id = val;
            }
            else {
                splitIndex = key.indexOf('.');
                if (splitIndex === -1) parsed.id = parsed[key] = val; // set simple value
                else { // set nested value
                    let current = parsed;
                    let paths = key.split('.');
                    for (let i = 0; i < paths.length; i++) {
                        let k = paths[i];
                        if (i === paths.length -1) current[k] = val; // perform assignment at the final index
                        else { // else navigate inside the sub-object
                            if (!current[k]) current[k] = {};
                            current = current[k];
                        }
                    }
                }
            }
            
        }
        return parsed;
        
    }
    `;
            break;
        case 'JSON':
            m2t_func = 'function(model) { return JSON.stringify(data); }';
            t2m_func = 'function(text) { return JSON.parse(text); }';
            break;
        case 'eCore/JSON': break;
        case 'Emfatic (m2 only)':break;
        case 'flexmi/YAML': break;
        case 'flexmi/XMI': break;
        case 'eCore/XMI': break;
    }

    return <section className={'M2T-tab'}>
        <h2>Language</h2>
        <div className={'d-flex'} style={{flexFlow: 'column'}}>
            <h2 style={{flexGrow: 1, margin: 'auto'}}>
                <label>Editing:</label>
                <Input hidden={true} getter={() => 'MyLanguage'} setter={() => {
                }} style={{overflow: 'visible'}}/>
            </h2>
            <button onClick={() => setEditor(false)} style={{margin: '0 auto'}}>X</button>
        </div>
        <div className={'d-flex'} style={{flexFlow: 'row'}}>
            <div className={'d-flex'} style={{flexGrow: 1, border:'1px solid red', flexWrap:'wrap'}}>
                <h3 className={'w-100'}>M2T</h3>
                <Editor className={'mx-1'} options={monacooptions} defaultLanguage={'typescript'} value={m2t_func}
                        onChange={() => {}} />
            </div>
            <div className={'d-flex'} style={{flexGrow: 1, border:'1px solid red', flexWrap:'wrap'}}>
                <h3 className={'w-100'}>T2M</h3>
                <Editor className={'mx-1'} options={monacooptions} defaultLanguage={'typescript'} value={t2m_func}
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
