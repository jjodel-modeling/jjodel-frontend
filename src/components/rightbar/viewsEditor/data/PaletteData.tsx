import React, {Dispatch, ReactElement, Ref, RefObject, SyntheticEvent} from 'react';
import {connect} from "react-redux";
import {useStateIfMounted} from "use-state-if-mounted";
import tinycolor, {Instance} from "tinycolor2";
import Editor from "@monaco-editor/react";
import DropDownButton from "smart-webcomponents-react/dropdownbutton";
import 'smart-webcomponents-react/source/styles/smart.default.css';
import type {PaletteControl, NumberControl, StringControl, PaletteType, CSSUnit} from '../../../../view/viewElement/view';
import {
    Dictionary,
    DState,
    DViewElement,
    Input,
    KeyDownEvent,
    Keystrokes,
    Log,
    LViewElement,
    Pointer,
    U
} from '../../../../joiner';
import {Function} from "../../../forEndUser/FunctionComponent";
import { Color } from '../../../forEndUser/Color';


function makeNumericInput(prefix: string, number: NumberControl,
                          setNumber: (e: React.FocusEvent<HTMLInputElement>, prefix: string) => void,
                          setText: (e: React.FocusEvent<HTMLInputElement>, prefix: string) => void, readOnly: boolean) {
    let type: string;
    let min: number | undefined;
    let max: number | undefined;
    let step: number | undefined = undefined;
    switch (number.unit) {
        case '': return <input className={"value"} placeholder={"value"} type={"text"}
                               defaultValue={number.value} onBlur={e => setText(e as any, prefix)} disabled={readOnly}
                               onKeyDown={e => {
                                   if (e.key === Keystrokes.enter) setText(e as any, prefix);
                                   if (e.key === Keystrokes.escape) (e.target as HTMLInputElement).value = '' + number.value; }} />
        case 'px': min = 0; max = 300; break;
        case 'pt': break; // 1pt = 1.33 px; 1px = 0.75pt
        case 'cm':
        case 'mm': min = 0; max = 200; break; // 1mm = 3.7px
        case 'ch':
        case 'ex':
        case 'em':
        case 'rem':
        case 'in': // 1in = 96px
        case 'pc': // 2px = 0.125 picas; 18.75pc = 300px
        case 'fr': min=0; max=20; step = 0.5; break;

        default: type = "number"; break;
        case "%": case "vh": case "vw": case "vmax": case "vmin":
            type = "range";
            min = 0;
            max = 100;
            break;
    }
    let roundedValue0 = Math.round(((number.value || 0) - (typeof step === "number" ? number.value % step : number.value % 0.1))*10000)/10000; // % works on decimals right.
    let roundedValue = typeof step === "number" ? Math.round(((number.value || 0)  * (1/step))) * step : Math.round(number.value*100)/100; // % works on decimals right.
    return <>
        <input className={"value"} placeholder={"value"} type={"range"} disabled={readOnly}
            key={"s"+number.value} defaultValue={number.value}
            min={min}
            max={max}
            step={"any"}
            onBlur={e => {setNumber(e as any, prefix)}}
            onMouseUp={e => { setNumber(e as any, prefix); }} />
        <input className={"spinner"} placeholder={"value"} type={"number"} disabled={readOnly}
            key={roundedValue} defaultValue={roundedValue} data-dv={roundedValue} data-dv2={number.value}
            step={step}
            onBlur={e => {setNumber(e as any, prefix)}}
            onKeyDown={e => {
               if (e.key === Keystrokes.enter) setNumber(e as any, prefix);
               if (e.key === Keystrokes.escape) (e.target as HTMLInputElement).value = '' + number.value; }} />
    </>
}

// delete button <button className="btn btn-danger ms-1"><i className="p-1 bi bi-trash3-fill"/></button>
function PaletteDataComponent(props: AllProps) {
    const view = props.view;
    const readOnly = props.readonly;
    let palette: Readonly<PaletteType> = {...view.palette};
    let tmp: PaletteType = undefined as any;
    const [css, setCss] = useStateIfMounted(view.css);

    const change = (value: string|undefined) => { if(value !== undefined) setCss(value); } // save in local state for frequent changes.
    const blur = () => view.css = css; // confirm in redux state for final state

    const addControl = (type: 'palette' | 'number' | 'text') => {
        if (readOnly) return;
        let i: number;
        let prefix0: string;//= 'palette_' + i + '-';
        switch (type){
            default: Log.exDevv("unexpected case in addControl:" + type); return;
            case 'text':
                i = Object.values(palette).filter( o => (o as StringControl).type === "text").length + 1;
                prefix0 = 'text_';
                break;
            case 'number':
                i = Object.values(palette).filter( o => (o as NumberControl).type === "number").length + 1;
                prefix0 = 'numeric_';
                break;
            case 'palette':
                i = Object.values(palette).filter( o => Array.isArray(o as any)).length + 1;
                prefix0 = 'palette_';
                break;
        }
        let prefix: string;
        while (true){
            prefix = prefix0 + i++;
            if (prefix in palette) continue;
            break;
        }
        switch (type){
            default: Log.exDevv("unexpected case in addControl:" + type); return;
            case 'text':
                tmp = {...palette};
                tmp[prefix] = {type: 'text', value: ''};
                break;
            case 'number':
                tmp = {...palette};
                tmp[prefix] = {type: 'number', value: 0, unit: 'px'};
                break;
            case 'palette':
                tmp = {...palette};
                tmp[prefix] = [];
                break;
        }
        view.palette = palette = tmp;
    }
    const setText = (e: React.FocusEvent<HTMLInputElement>, prefix: string) => {
        const val: string = e.target.value;
        if (readOnly || (palette[prefix] as StringControl).value === val) return;
        let tmp: Dictionary<string, StringControl> = {...palette} as any;
        tmp[prefix].value = val;
        view.palette = palette = tmp; }
    const setNumber = (e: React.FocusEvent<HTMLInputElement>, prefix: string) => {
        const val: number = +e.target.value || 0;
        if (readOnly || (palette[prefix] as NumberControl).value === val) return;
        let tmp: Dictionary<string, NumberControl> = {...palette} as any;
        tmp[prefix].value = val;
        view.palette = palette = tmp; }
    const setUnit = (e: React.FocusEvent<HTMLInputElement>, prefix: string) => {
        const val: string = e.target.value === undefined ? 'px' : e.target.value;
        if (readOnly || val === (palette[prefix] as NumberControl).unit) return;
        let tmp: Dictionary<string, NumberControl> = {...palette} as any;
        tmp[prefix].unit = val as CSSUnit;
        view.palette = palette = tmp; }
    const changePrefix = (oldPrefix: string, newPrefix: string) => {
        newPrefix = newPrefix.replaceAll(/[^\w\-]/g,'-'); // /^[^a-zA-Z0-9_\-]*$/, '-');
        if (readOnly || palette[newPrefix]) return; // refuse to overwrite existing palette name (2 different palettes with same name)
        tmp = {...palette};
        tmp[newPrefix] = palette[oldPrefix];
        delete tmp[oldPrefix];
        view.palette = palette = tmp;
    }
    const removeControl = (prefix: string) => {
        if (readOnly || !palette[prefix]) return;
        tmp = {...palette};
        delete tmp[prefix];
        view.palette = palette = tmp;
    }

    const addColor = (prefix: string, hexs: Instance[] | Instance | string | React.MouseEvent<HTMLElement>, index: number = -1, skipFirst: boolean = true) => {
        if (!Array.isArray(hexs)) {
            hexs = [hexs as any];
            skipFirst = false;
        }
        let tmp: Dictionary<string, PaletteControl> = {...palette} as any;
        for (let i = hexs.length-1; i >= (skipFirst ? 1 : 0); i--) {
            let hex: string = hexs[i] as any;
            if (typeof hex !== "string") {
                if ((hex as Instance).toHexString) hex = (hex as Instance).toHexString();
                else hex = ((hex as any).target as HTMLElement)?.style.background || '';
            }
            if (readOnly || !tmp[prefix]) tmp[prefix] = [];
            else tmp[prefix] = [...tmp[prefix]];
            if (index >= 0) tmp[prefix].splice(index+1, 0, hex);
            else tmp[prefix].push(hex);
        }
        view.palette = palette = tmp;
    }

    const setColor = (prefix: string, index: number, hex: string) => {
        let tmp: Dictionary<string, PaletteControl> = {...palette} as any;
        if (readOnly || !tmp[prefix]) tmp[prefix] = [];
        else tmp[prefix] = [...tmp[prefix]];
        tmp[prefix][index] = hex;
        view.palette = palette = tmp;
    }
    const removeColor = (prefix: string, index: number) => {
        if (readOnly || !palette[prefix]) return;
        let tmp: Dictionary<string, PaletteControl> = {...palette} as any;
        tmp[prefix] = tmp[prefix].filter((c, i) => i !== index);
        view.palette = palette = tmp;
    }

    const cssIsGlobal = view.cssIsGlobal;
    let a: DropDownButton;
    let dropDownButton: RefObject<DropDownButton> = {current: null};
    return(<section className={'p-3'}>
        <div className={"controls"} style={{position:'relative', zIndex:2}}>
        {Object.entries(palette).map((entry, index, entries)=>{
            let prefix = entry[0];
            let colors: PaletteControl = entry[1] as PaletteControl;
            if (!Array.isArray(colors)) return undefined;
            let suggestions = ['#ffaaaa']; // todo: compute according to current row "colors"
            return (<>
                <div className="palette-row">
                    <button className="btn btn-danger me-1" onClick={()=>removeControl(prefix)}  disabled={readOnly}><i className="p-1 bi bi-trash3-fill"/></button>
                    <input className={"prefix"} placeholder={"variable name"} value={prefix} onChange={(e)=> changePrefix(prefix, e.target.value)}  disabled={readOnly}/>
                    <div className="color-container">{
                        colors.map((val, i) => <Color key={prefix+i} readonly={readOnly}
                                                      data={view} field={'palette'} canDelete={!readOnly}
                                                      getter={()=>colors[i]} setter={(newVal) => { setColor(prefix, i, newVal) }}
                                                      style ={{background: 'white'}}
                                                      childrenn={
                            <div className={"content suggestions"} style={{backgroundColor: "inherit"}} onClick={(e) => {e.preventDefault(); e.stopPropagation();}}>
                                {(()=>{ let color = tinycolor(val); return <>
                                    <h6 onClick={()=>addColor(prefix, color.analogous(7, 30/1.5), i)} title={"Add all the colors"}>➕Analogous</h6>
                                    <div className={"roww"}>
                                        {color.analogous(7, 30/1.5).map((c,ii) => ii===0?undefined: <button style={{background: c.toHexString(), color: U.invertHex(c.toHex())}}
                                                                                onClick={(e)=>{addColor(prefix, c, i)}} className="btn color-suggestion">+</button>)}
                                    </div>
                                    <h6 onClick={()=>addColor(prefix, color.monochromatic(7), i)} title={"Add all the colors"}>➕Monochromatic</h6>
                                    <div className={"roww"}>
                                        {color.monochromatic(7).map((c,ii) => ii===0?undefined: <button style={{background: c.toHexString(), color: U.invertHex(c.toHex())}}
                                                                                    onClick={(e)=>{addColor(prefix, c, i)}} className="btn color-suggestion">+</button>)}
                                    </div>
                                    <h6 onClick={()=>addColor(prefix, color.complement(), i)} title={"Add all the colors"}>➕Complementary / Opposite</h6>
                                    <div className={"roww"}>
                                        <button style={{background: color.complement().toHexString(), color: U.invertHex(color.complement().toHex())}}
                                                onClick={(e)=>{addColor(prefix, color.complement(), i)}}  className="btn color-suggestion" >+</button>
                                        <button style={{background: U.invertHex(color.toHex()), color: color.toHexString()}}
                                                onClick={(e)=>{addColor(prefix, U.invertHex(color.toHex()), i)}}  className="btn color-suggestion" >+</button>
                                    </div>
                                    <h6 onClick={()=>addColor(prefix, color.splitcomplement(), i)} title={"Add all the colors"}>➕Split Complementary</h6>
                                    <div className={"roww"}>
                                        {color.splitcomplement().map((c) => <button style={{background: c.toHexString(), color: U.invertHex(c.toHex())}}
                                                                                      onClick={(e)=>{addColor(prefix, c, i)}}  className="btn color-suggestion" >+</button>)}
                                    </div>
                                    <h6 onClick={()=>addColor(prefix, color.triad(), i)} title={"Add all the colors"}>➕Triadic</h6>
                                    <div className={"roww"}>
                                        {color.triad().map ( (c) => <button style={{background: c.toHexString(), color: U.invertHex(c.toHex())}}
                                                                            onClick={(e)=>{addColor(prefix, c, i)}} className="btn color-suggestion">+</button>)}
                                    </div>
                                    <h6 onClick={()=>addColor(prefix, color.tetrad(), i)} title={"Add all the colors"}>➕Tetradic</h6>
                                    <div className={"roww"}>
                                        {color.tetrad().map ( (c) => <button style={{background: c.toHexString(), color: U.invertHex(c.toHex())}}
                                                                             onClick={(e)=>{addColor(prefix, c, i)}} className="btn color-suggestion" >+</button>)}
                                    </div>
                                </>})()}
                                <button className={'btn btn-danger content delete-color mt-2'} onClick={()=>removeColor(prefix, i)} disabled={readOnly}>
                                    <i className="bi p-1 bi-trash3-fill"/>
                                </button>
                            </div>
                        }
                                                          />)
                    }
                    </div>
                    <div className="suggestion-container">{
                        suggestions.map((hex, i) => <label className="p-1">
                            <button className="btn color-suggestion" style={{backgroundColor: hex}} onClick={()=>{addColor(prefix, hex)}} disabled={readOnly}>+</button>
                        </label>)
                    }</div>
                </div>
            </>); })
        }
        {Object.entries(palette).map((entry, index, entries)=>{
                let prefix = entry[0];
                let string: StringControl = entry[1] as any;
                if (string.type !== 'text') return undefined;
                return (
                    <div className="palette-row textual">
                        <button className="btn btn-danger me-1" onClick={()=>removeControl(prefix)} disabled={readOnly}><i className="p-1 bi bi-trash3-fill"/></button>
                        <input className={"prefix"} placeholder={"variable name"} value={prefix} onChange={(e)=> changePrefix(prefix, e.target.value)} disabled={readOnly} />
                        <input className={"value"} placeholder={"value"} defaultValue={string.value} onBlur={e => {setText(e as any, prefix)}} disabled={readOnly}
                               onKeyDown={e => {
                                   if (e.key === Keystrokes.enter) setText(e as any, prefix);
                                   if (e.key === Keystrokes.escape) (e.target as HTMLInputElement).value = string.value; }} />
                    </div>)
            }
        )}
        {Object.entries(palette).map((entry, index, entries)=>{
                let prefix = entry[0];
                let number: NumberControl = entry[1] as any;
                if (number.type !== 'number') return undefined;
                return (
                    <div className="palette-row numeric">
                        <button className="btn btn-danger me-1" onClick={()=>removeControl(prefix)}><i className="p-1 bi bi-trash3-fill"/></button>
                        <input className={"prefix"} placeholder={"variable name"} value={prefix} onChange={(e)=> changePrefix(prefix, e.target.value)} disabled={readOnly} />
                        <div className={"value"}>
                            {makeNumericInput(prefix, number, setNumber, setText, readOnly)}
                            <select className={"unit"} placeholder={"unit"} value={number.unit} onChange={e => {setUnit(e as any, prefix)}} disabled={readOnly}>
                            <optgroup label={"Recommended units"}>
                                <option value={"px"}>px - pixels</option>
                                <option value={"%"}>% - Relative to parent</option>
                                <option value={"em"}>em - font height</option>
                                <option value={"vw"}>vw - viewport width</option>
                                <option value={"vh"}>vh - viewport height</option>
                                <option value={""}>Unit-less</option>
                            </optgroup>
                            <optgroup label={"Absolute units"}>
                                <option value={"px"}>px - pixels</option>
                                <option value={"cm"}>cm - centimeters</option>
                                <option value={"mm"}>mm - millimiters</option>
                                <option value={"pt"}>pt - points</option>
                                <option value={"pc"}>pc - picas</option>
                                <option value={"in"}>in - inches</option>
                            </optgroup>
                            <optgroup label={"Relative (DOM) units"}>
                                <option value={"%"}>% - Relative to parent</option>
                                <option value={"fr"}>fr - grid fraction</option>
                                <option value={"vw"}>vw - viewport width</option>
                                <option value={"vh"}>vh - viewport height</option>
                                <option value={"vmin"}>vmin - x% of viewport min axis</option>
                                <option value={"vmax"}>vmax - x% of viewport max axis</option>
                            </optgroup>
                            <optgroup label={"Relative (font) units"}>
                                <option value={"em"}>em - font height</option>
                                <option value={"rem"}>rem - &lt;body&gt; font height</option>
                                <option value={"ex"}>ex - height of the "x" char</option>
                                <option value={"ch"}>ch - width of the "0" char</option>
                            </optgroup>
                        </select>
                        </div>
                    </div>)
            }
        )}
        </div>

        <div className={"w-100"} style={{display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', position: 'relative', zIndex:1}}
             onMouseEnter={(e)=>{ dropDownButton.current?.open()}}
             onMouseLeave={(e)=>{ dropDownButton.current?.close()}}
        >
            <button className="btn btn-success" style={{flexBasis:0, flexGrow:9, gridArea: '1 / 1 / 1 / 1', zIndex: 2, minWidth: 'calc(1000% - var(--smart-editor-addon-width))'}} onClick={()=>addControl('palette')}>+ Palette</button>
            <DropDownButton ref={dropDownButton} style={{flexBasis:0, flexGrow:1, minWidth:0, gridArea: '1 / 1 / 1 / 11', zIndex:1, transform: 'scaleX(-1)'}}>
                <div onClick={(e)=> dropDownButton.current?.close()} style={{transform: 'scaleX(-1)'}}>
                    <button className={"w-100 btn btn-outline-success"} style={{height: 'var(--smart-editor-height)'}}
                            onClick={()=>addControl('number')}>+ Number</button>
                    <button className={"w-100 btn btn-outline-success"} style={{height: 'var(--smart-editor-height)'}}
                            onClick={()=>addControl('text')}>+ Text</button>
                </div>
            </DropDownButton>
        </div>

        <hr/>
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
