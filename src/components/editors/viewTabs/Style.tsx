import {
    CSSUnit, LViewElement,
    NumberControl,
    PaletteControl,
    PaletteType,
    PathControl,
    StringControl
} from "../../../view/viewElement/view";
import {useStateIfMounted} from "use-state-if-mounted";
import {Dictionary, EdgeHead, GObject, Input, Keystrokes, Log, U} from "../../../joiner";
import React, {ReactNode, RefObject} from "react";
import tinycolor, {Instance} from "tinycolor2";
import DropDownButton from "smart-webcomponents-react/dropdownbutton";
import {Color} from "../../forEndUser/Color";
import Editor from "@monaco-editor/react";

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

type Props = {view: LViewElement};
function ViewStyle(props: Props): JSX.Element {
    const {view} = props;
    const readOnly = false;
    let palette: Readonly<PaletteType> = {...view.palette};
    let tmp: PaletteType = undefined as any;
    const [css, setCss] = useStateIfMounted(view.css);
    const change = (value: string|undefined) => { if(value !== undefined) setCss(value); } // save in local state for frequent changes.
    const blur = () => view.css = css; // confirm in redux state for final state

    const addControl = (type: 'palette' | 'number' | 'text' | 'path') => {
        if (readOnly) return;
        let i: number;
        let prefix0: string;//= 'palette_' + i + '-';
        switch (type){
            default: Log.exDevv("unexpected case in addControl:" + type); return;
            case 'path':
                i = Object.values(palette).filter( o => (o as PathControl).type === "path").length + 1;
                prefix0 = 'path_';
                break;
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
            case 'path':
                const agglabel = "◇ Aggregation / Composition";
                const extendlabel = "△ "+EdgeHead.extend;
                const asslabel = "Λ "+EdgeHead.reference;
                let headdict: Dictionary<string, string> = {
                    [asslabel]: 'M 0 0   L x y/2   L 0 y',
                    [extendlabel]: 'M 0 0   L x y/2   L 0 y   Z',
                    [agglabel]: 'M 0 y/2   L x/2 0   L x y/2   L x/2 y   Z',
                };
                let predefinedPaths: {k:string, v:string}[] = Object.entries(headdict).map((e)=>({k:e[0], v:e[1]}));

                tmp = {...palette};
                tmp[prefix] = {type: 'path', value: '', x:'edgeHeadSize.x', y:'edgeHeadSize.y', options: predefinedPaths};
                break;
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
                tmp[prefix] = {type:'color', value:[]};
                break;
        }
        view.palette = palette = tmp;
    }
    const setGeneric = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, prefix: string, key: string) => {
        const val: string = e.target.value;
        if (readOnly || (palette[prefix] as any)[key] === val) return;
        let tmp: Dictionary<string, StringControl> = {...palette} as any;
        (tmp[prefix] as any)[key] = val;
        view.palette = palette = tmp; }
    const setText = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>, prefix: string) => {
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

    const addColor = (prefix: string, colors: Instance[] | Instance, index: number = -1, skipFirst: boolean = true) => {
        if (readOnly) return;
        if (!Array.isArray(colors)) {
            colors = [colors as Instance];
            skipFirst = false;
        }
        let tmp: Dictionary<string, PaletteControl> = {...palette} as GObject;
        let lastAdded: tinycolor.ColorFormats.RGBA = undefined as any;
        for (let i = colors.length-1; i >= (skipFirst ? 1 : 0); i--) {
            let color: Instance = colors[i];
            let rgba = color.toRgb();
            console.log("addingColor:", {rgba, lastAdded, color});
            if (rgba === lastAdded) continue;
            lastAdded = rgba;
            if (!tmp[prefix]) tmp[prefix] = {type:'color', value:[]};
            else tmp[prefix] = {...tmp[prefix]};
            tmp[prefix].value = [...tmp[prefix].value];
            if (index >= 0) tmp[prefix].value.splice(index + 1, 0, rgba);
            else tmp[prefix].value.push(rgba);
        }
        view.palette = palette = tmp;
    }

    const setColor = (prefix: string, index: number, hex?: string, alpha?: number) => {
        let tmp: Dictionary<string, PaletteControl> = {...palette} as any;
        if (readOnly || !tmp[prefix]) tmp[prefix] = {type:'color', value:[]};
        else tmp[prefix] = {...tmp[prefix]};
        let oldColor = tmp[prefix].value[index];
        if (hex) {
            let color = tinycolor(hex);
            if (alpha !== undefined) color.setAlpha(alpha);
            let rgba = color.toRgb();
            if (oldColor && oldColor.a !== undefined) rgba.a = oldColor.a;
            tmp[prefix].value[index] = oldColor = rgba;
            view.palette = palette = tmp;
        }
        if (alpha !== undefined) tmp[prefix].value[index] = {...oldColor, a:alpha};
    }
    const transparencyColor = (prefix: string, index: number, color: tinycolor.Instance, alpha: number) => {
        if (readOnly || !palette[prefix]) return;
        let tmp: Dictionary<string, PaletteControl> = {...palette} as any;
        if (!alpha && alpha !== 0) alpha = 1;
        tmp[prefix] = {...tmp[prefix]};
        tmp[prefix].value = [...tmp[prefix].value];
        tmp[prefix].value[index] = {...tmp[prefix].value[index]};
        tmp[prefix].value[index].a = alpha;
        color.setAlpha(alpha);
        console.log("set transparency", {color, tinycolor, oldcolor: tmp[prefix].value[index]});
        view.palette = palette = tmp;
    }
    const removeColor = (prefix: string, index: number) => {
        if (readOnly || !palette[prefix]) return;
        let tmp: Dictionary<string, PaletteControl> = {...palette} as any;
        tmp[prefix].value = [...tmp[prefix].value];
        tmp[prefix].value = tmp[prefix].value.filter((c, i) => i !== index);
        view.palette = palette = tmp;
    }

    const cssIsGlobal = view.cssIsGlobal;
    let a: DropDownButton;
    let dropDownButton: RefObject<DropDownButton> = {current: null};
    function addcss(color: Instance): GObject {
        let ret: GObject = {};
        ret.background = color.toRgbString();
        // ret.opacity = color.getAlpha();
        return ret;
    }
    function invert(color: Instance, transformGrays: number = 0.2): string {
        transformGrays = transformGrays * 128;
        let {r, g, b, a} = color.toRgb();
        r = Math.abs(r-128) <= transformGrays ? (r >= 128 ? 0 : 255) : 255 - r;
        g = Math.abs(g-128) <= transformGrays ? (g >= 128 ? 0 : 255) : 255 - g;
        b = Math.abs(b-128) <= transformGrays ? (b >= 128 ? 0 : 255) : 255 - b;
        if (a || a === 0) a = 255 - a;
        return (tinycolor({r, g, b, a})).toRgbString();
    }
    function style(c: Instance): GObject{
        return {backgroundColor: c.toRgbString(), color:invert(c)};
    }

    let palettes = U.paletteSplit(palette);
    function palettewrap(prefix: string, node: ReactNode): ReactNode{
        return (
            <div className="palette-row-container">
                <button className="btn btn-danger me-1" onClick={()=>removeControl(prefix)} disabled={readOnly}><i className="p-1 bi bi-trash3-fill"/></button>
                <input className={"prefix"} placeholder={"variable name"} value={prefix} onChange={(e)=> changePrefix(prefix, e.target.value)} disabled={readOnly} />
                {node}
            </div>)
    }

    return(<>
        <div className={"controls"} style={{position:'relative', zIndex:2}}>
            {Object.entries(palettes.color).map((entry, index, entries)=>{
                let prefix = entry[0];
                let paletteobj: PaletteControl = entry[1] as PaletteControl;
                let colors: Instance[] = paletteobj.value.map(v=> tinycolor(v));
                let suggestions = [tinycolor('#ffaaaa')]; // todo: compute according to current row "colors"
                return palettewrap(prefix, <>
                    <div className="palette-row">
                        <div className="color-container">{
                            colors.map((color, i) => <Color key={prefix+i} readonly={readOnly}
                                                            data={view} field={'palette'} canDelete={!readOnly}
                                                            getter={()=>colors[i].toHexString()} setter={(newVal) => { setColor(prefix, i, newVal) }}
                                                            style ={{background: 'white'}}
                                                            inputStyle ={{opacity: color.getAlpha()}}
                                                            childrenn={
                                                                <div className={"content suggestions"} style={{backgroundColor: "inherit"}} onClick={(e) => {e.preventDefault(); e.stopPropagation();}}>
                                                                    {(()=>{ return <>
                                                                        <h6 title={"Alter current color transparency"}>Opacity</h6>
                                                                        <input style={{width: "auto", marginLeft:"1em", marginRight:"1em"}} type={"range"} min={0} max={1} step={"any"} value={color.getAlpha()} onChange={(e)=>{ transparencyColor(prefix, i, color, +e.target.value) }} />
                                                                        <h6 onClick={()=>addColor(prefix, color.analogous(7, 30/1.5), i)} title={"Add all the colors"}>➕Analogous</h6>
                                                                        <div className={"roww"}>
                                                                            {color.analogous(7, 30/1.5).map((c,ii) => ii===0?undefined:
                                                                                <button style={style(c)} onClick={(e)=>{addColor(prefix, c, i)}} className="btn color-suggestion">+</button>
                                                                            )}
                                                                        </div>{/*
                                    <h6 onClick={()=>addColor(prefix, color.monochromatic(7), i)} title={"Add all the colors"}>➕Monochromatic</h6>
                                    <div className={"roww"}>
                                        {color.monochromatic(7).map((c,ii) => ii===0?undefined: <button style={style(c)}
                                                                                                        onClick={(e)=>{addColor(prefix, c, i)}} className="btn color-suggestion">+</button>)}
                                    </div>{/*[6/12, 5/12, 4/12, 3/12, 2/12, 1/12]*/}
                                                                        <h6 onClick={()=>addColor(prefix, [1/12, 2/12, 3/12, 4/12, 5/12, 6/12].map(n=>color.clone().lighten(n*100)), i, false)} title={"Add all the colors"}>➕Lighten</h6>
                                                                        <div className={"roww"}>
                                                                            {[1/12, 2/12, 3/12, 4/12, 5/12, 6/12].map(n=>color.clone().lighten(n*100))
                                                                                .map((c,ii) => <button style={style(c)} className="btn color-suggestion"
                                                                                                       onClick={(e)=>{addColor(prefix, c, i)}}>+</button>)}
                                                                        </div>
                                                                        <h6 onClick={()=>addColor(prefix, [6/12, 5/12, 4/12, 3/12, 2/12, 1/12].map(n=>color.clone().darken(n*100)), i, false)} title={"Add all the colors"}>➕Darken</h6>
                                                                        <div className={"roww"}>
                                                                            {[6/12, 5/12, 4/12, 3/12, 2/12, 1/12].map(n=>color.clone().darken(n*100))
                                                                                .map((c,ii) => <button style={style(c)} className="btn color-suggestion"
                                                                                                       onClick={(e)=>{addColor(prefix, c, i)}}>+</button>)}
                                                                        </div>
                                                                        <h6 onClick={()=>addColor(prefix, [color.complement(), tinycolor(invert(color))], i, false)} title={"Add all the colors"}>➕Complementary / Opposite</h6>
                                                                        <div className={"roww"}>
                                                                            <button style={style(color.complement())} className="btn color-suggestion"
                                                                                    onClick={(e)=>{addColor(prefix, color.complement(), i)}}>+</button>
                                                                            <button style={style(color)} className="btn color-suggestion"
                                                                                    onClick={(e)=>{addColor(prefix, tinycolor(invert(color)), i)}}>+</button>
                                                                        </div>
                                                                        <h6 onClick={()=>addColor(prefix, color.splitcomplement(), i)} title={"Add all the colors"}>➕Split Complementary</h6>
                                                                        <div className={"roww"}>
                                                                            {color.splitcomplement().map((c) => <button style={{...style(c)}} className="btn color-suggestion"
                                                                                                                        onClick={(e)=>{addColor(prefix, c, i)}}>+</button>)}
                                                                        </div>
                                                                        <h6 onClick={()=>addColor(prefix, color.triad(), i)} title={"Add all the colors"}>➕Triadic</h6>
                                                                        <div className={"roww"}>
                                                                            {color.triad().map ( (c) => <button style={{...style(c)}} className="btn color-suggestion"
                                                                                                                onClick={(e)=>{addColor(prefix, c, i)}}>+</button>)}
                                                                        </div>
                                                                        <h6 onClick={()=>addColor(prefix, color.tetrad(), i)} title={"Add all the colors"}>➕Tetradic</h6>
                                                                        <div className={"roww"}>
                                                                            {color.tetrad().map ( (c) => <button style={{...style(c)}} className="btn color-suggestion"
                                                                                                                 onClick={(e)=>{addColor(prefix, c, i)}}>+</button>)}
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
                            suggestions.map((c, i) => <label className="p-1">
                                <button className="btn color-suggestion" style={style(c)} onClick={()=>{addColor(prefix, c)}} disabled={readOnly}>+</button>
                            </label>)
                        }</div>
                    </div>
                </>); })
            }
            {Object.entries(palettes.path).map((entry, index, entries)=>{
                    let prefix = entry[0];
                    let path: PathControl = entry[1] as any;
                    return palettewrap(prefix,
                        <div className="palette-row path" title={"todo: proper tooltip.\nedgeHeadSize is in the \"Options\" tab and determines the position of the head.\nBasic math operators are allowed, but the minus and plus must have spaces around them or they will be traated as unary operators.\nx and y are variables local to this path used to scale his shape."}>
                            <div className={"value hoverable"}>
                                <div className={"d-flex w-100"}>
                                    <input className={"value w-100 my-auto"} placeholder={"svg path [d]"} defaultValue={path.value} key={path.value} onBlur={e => {setText(e as any, prefix)}} disabled={readOnly}
                                           onKeyDown={e => {
                                               if (e.key === Keystrokes.enter) setText(e as any, prefix);
                                               if (e.key === Keystrokes.escape) (e.target as HTMLInputElement).value = path.value; }} />
                                </div>
                                <div className={"content d-flex"} style={{backgroundColor: 'whitesmoke'}}>
                                    <input className={"spacer w-100"}/>
                                    <label className={"mx-auto"}>x:&nbsp;<input className="x" placeholder={"x"} defaultValue={path.x} disabled={readOnly} onChange={(e)=>setGeneric(e, prefix, "x")}/></label>
                                    <label className={"mx-auto"}>y:&nbsp;<input className="y" placeholder={"y"} defaultValue={path.y} disabled={readOnly} onChange={(e)=>setGeneric(e, prefix, "y")}/></label>
                                </div>
                            </div>
                            <select value={path.value} disabled={readOnly} onChange={(e)=>setText(e as any, prefix)}>
                                {[<option style={{fontStyle:'italic', color:'gray'}} value={""}>Custom</option>, path.options.map((e)=>{
                                    let k = e.k;
                                    let v = e.v;
                                    return <option value={v}>{k}</option>
                                })]}</select>
                        </div>)
                }
            )}
            {Object.entries(palettes.number).map((entry, index, entries)=>{
                    let prefix = entry[0];
                    let number: NumberControl = entry[1] as any;
                    return palettewrap(prefix,
                        <div className="palette-row numeric">
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
                        </div>)
                }
            )}
            {Object.entries(palettes.text).map((entry, index, entries)=>{
                    let prefix = entry[0];
                    let string: StringControl = entry[1] as any;
                    return palettewrap(prefix,
                        <div className={"palette-row textual"}>
                            <input className={"value"} placeholder={"value"} defaultValue={string.value} onBlur={e => {setText(e as any, prefix)}} disabled={readOnly}
                                   onKeyDown={e => {
                                       if (e.key === Keystrokes.enter) setText(e as any, prefix);
                                       if (e.key === Keystrokes.escape) (e.target as HTMLInputElement).value = string.value; }} />
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
                    <button className={"w-100 btn btn-outline-success"} style={{height: 'var(--smart-editor-height)'}}
                            onClick={()=>addControl('path')}>+ Path</button>
                </div>
            </DropDownButton>
        </div>

        <hr/>
        <div className={'input-container'}>
            <b className={'me-2'}>Global CSS:</b>
            <Input data={view} field={'cssIsGlobal'} type={'checkbox'}
                   setter={val => view.isExclusiveView = !val}
                   getter={data => !(data as LViewElement).isExclusiveView as any}/>
        </div>
        {/*<label className={'ms-1 mb-1'}>{view.cssIsGlobal ? 'Global' : 'Local'} CSS Editor</label>*/}
        <div className={"monaco-editor-wrapper"} style={{
            minHeight: '20ùpx', height:'200px'/*there is a bug of height 100% on childrens not working if parent have only minHeight*/,
            resize: 'vertical', overflow:'hidden'}} onBlur={blur}>
            <Editor className={'mx-1'}
                    options={{fontSize: 12, scrollbar: {vertical: 'hidden', horizontalScrollbarSize: 5}, minimap: {enabled: false}, readOnly: readOnly}}
                    defaultLanguage={'less'} value={view.css} onChange={change}/>
        </div>
        <div className={"debug"}><div style={{whiteSpace:'pre'}}>{view.compiled_css}</div></div>
    </>);
}

export {ViewStyle};
