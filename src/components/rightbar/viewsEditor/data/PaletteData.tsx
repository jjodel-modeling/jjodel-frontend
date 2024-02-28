import React, {Dispatch, ReactElement} from 'react';
import {Dictionary, DState, DViewElement, Input, LViewElement, Pointer, U} from '../../../../joiner';
import {connect} from "react-redux";
import {Function} from "../../../forEndUser/FunctionComponent";
import { Color } from '../../../forEndUser/Color';
import Editor from "@monaco-editor/react";
import {useStateIfMounted} from "use-state-if-mounted";

 // delete button <button className="btn btn-danger ms-1"><i className="p-1 bi bi-trash3-fill"/></button>
function PaletteDataComponent(props: AllProps) {
    const view = props.view;
    const readOnly = props.readonly;
    let palette: Dictionary<string, string[]> = {...view.palette};
    const [css, setCss] = useStateIfMounted(view.css);

    const change = (value: string|undefined) => { if(value !== undefined) setCss(value); } // save in local state for frequent changes.
    const blur = () => view.css = css; // confirm in redux state for final state

    const addPalette = (prefix: string) => {
        if (palette[prefix]) return;
        palette[prefix] = [];
        view.palette = palette;
    }
    const changePrefix = (oldPrefix: string, newPrefix: string) => {
        newPrefix = newPrefix.replaceAll(/[^\w\-]/g,'-'); // /^[^a-zA-Z0-9_\-]*$/, '-');
        if (palette[newPrefix]) return; // refuse to overwrite existing palette name (2 different palettes with same name)
        palette[newPrefix] = palette[oldPrefix] || [];
        delete palette[oldPrefix];
        view.palette = palette;
    }
    const removePalette = (prefix: string) => {
        if (!palette[prefix]) return;
        delete palette[prefix];
        view.palette = palette;
    }

    const addColor = (prefix: string, hex: string) => {
        if (!palette[prefix]) palette[prefix] = [];
        else palette[prefix] = [...palette[prefix]];
        palette[prefix].push(hex);
        view.palette = palette;
    }
    const setColor = (prefix: string, index: number, hex: string) => {
        if (!palette[prefix]) palette[prefix] = [];
        else palette[prefix] = [...palette[prefix]];
        palette[prefix][index] = hex;
        view.palette = palette;
    }
    const removeColor = (prefix: string, index: number) => {
        if (!palette[prefix]) return;
        palette[prefix] = palette[prefix].filter((c, i) => i !== index);
        view.palette = palette;
    }
    const cssIsGlobal = view.cssIsGlobal;
    return(<section className={'p-3'}>
        <Input data={view} field={'isExclusiveView'} type={"checkbox"} />
        {Object.entries(palette).map((entry, index, entries)=>{
            let prefix = entry[0];
            let colors = entry[1];
            let suggestions = ['#ffaaaa']; // todo: compute according to current row "colors"
            return (<>
                <div className="palette-row">
                    <button className="btn btn-danger me-1" onClick={()=>removePalette(prefix)}><i className="p-1 bi bi-trash3-fill"/></button>
                    <input className={"prefix"} value={prefix} onChange={(e)=> changePrefix(prefix, e.target.value)}/>
                    <div className="color-container hoverable">{
                        colors.map((val, i) => <Color key={prefix+i}
                                                      childrenn={
                            <button className={'btn btn-danger content delete-color mt-2'} onClick={()=>removeColor(prefix, i)}><i className="bi p-1 bi-trash3-fill"/></button>
                        }
                                                      data={view} field={'palette'} canDelete={!readOnly}
                                                      getter={()=>colors[i]} setter={(newVal) => { setColor(prefix, i, newVal) }}/>)
                    }
                    </div>
                    <div className="suggestion-container">{
                        suggestions.map((hex, i) => <label className="p-1">
                            <button className="btn color-suggestion" style={{backgroundColor: hex}} onClick={()=>{addColor(prefix, hex)}}>+</button>
                        </label>)
                    }</div>
                </div>
            </>); })
        }

        <button className="btn w-100 btn-success" onClick={()=> {
            let i = Object.keys(palette).length + 1;
            while(true){
                let tentativename = 'palette_' + i++ + '-';
                if (tentativename in palette) continue;
                addPalette(tentativename)
                break;
            }
        }}>+</button>
        <Input data={view} field={'cssIsGlobal'} type={"checkbox"} jsxLabel={
            <span style={{width:'80%', display:'inline-block'}}>
                {cssIsGlobal ? <b style={{color: 'inherit', fontWeight:'bold'}}>Global</b> : <b style={{color: 'inherit'}}>Local</b>}
                {' CSS & LESS Editor '}
                {cssIsGlobal ? <b style={{color: 'red', fontSize:'0.7em', fontWeight:'bold'}}>Use with caution</b> : ''}
            </span>
        } />
        {/*<label className={'ms-1 mb-1'}>{view.cssIsGlobal ? 'Global' : 'Local'} CSS Editor</label>*/}
        <div className={"monaco-editor-wrapper"} style={{
                    minHeight: '20ùpx', height:'200px'/*there is a bug of height 100% on childrens not working if parent have only minHeight*/,
                    resize: 'vertical', overflow:'hidden'}} onBlur={blur}>
            <Editor className={'mx-1'}
                    options={{fontSize: 12, scrollbar: {vertical: 'hidden', horizontalScrollbarSize: 5}, minimap: {enabled: false}, readOnly: readOnly}}
                    defaultLanguage={'less'} value={view.css} onChange={change}/>
        </div>
        <div className={"debug"}><div style={{whiteSpace:'pre'}}>{view.compiled_css}</div></div>
        {/*<textarea>
            '[data-viewid="'+view.id+'"]{\n' +
            Object.entries(palette).flatMap((entry, index, entries)=>{
                let prefix = entry[0];
                let colors = entry[1];
                return colors.map((color, i)=> "\t--" + prefix + i + ": " + color + ";\n");
            }).join('')+'\n' + (cssISGlobal ? '}\n' : '\n') +
            '/ *** custom css area *** /\n' + view.css + (!cssISGlobal ? '}\n' : '\n')
            view.css
        </textarea>*/}
                {
                    // todo: if row have only 1 color can be accessed both as palette prefix-1 or as palett prefix without number, so i can name colors.
                }

    </section>);
}

interface OwnProps {viewID: Pointer<DViewElement, 1, 1, LViewElement>, readonly: boolean}
interface StateProps {view: LViewElement}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const view = LViewElement.fromPointer(ownProps.viewID);
    return {view};
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const PaletteDataConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(PaletteDataComponent);

export const PaletteData = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <PaletteDataConnected {...{...props, children}} />;
}
export default PaletteData;
