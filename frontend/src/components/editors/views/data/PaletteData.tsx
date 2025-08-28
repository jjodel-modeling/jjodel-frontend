/* Viewpoints > Style */

import React, {Dispatch, ReactElement, ReactNode, Ref, RefObject, SyntheticEvent, useState, useRef, useEffect} from 'react';
import {connect} from "react-redux";
import {useStateIfMounted} from "use-state-if-mounted";
import tinycolor, {Instance} from "tinycolor2";
import Editor from "@monaco-editor/react";
import type {Dictionary, GObject, Pointer,} from '../../../../joiner';
import {DState, DViewElement, EdgeHead, Input, Keystrokes, Log, LViewElement, U,} from '../../../../joiner';
import type {
    NumberControl,
    PaletteControl,
    PaletteType,
    PathControl,
    StringControl
} from '../../../../view/viewElement/view';
import {CSS_Units} from '../../../../view/viewElement/view';
import {Color} from '../../../forEndUser/Color';

import {Btn, CommandBar} from '../../../commandbar/CommandBar';
import {HRule} from '../../../widgets/Widgets';


function makeNumericInput(prefix: string, number: NumberControl,
                          setNumber: (e: React.FocusEvent<HTMLInputElement>, prefix: string) => void,
                          setText: (e: React.FocusEvent<HTMLInputElement>, prefix: string) => void, readOnly: boolean) {
    let min: number | undefined;
    let max: number | undefined;
    let step: number | undefined = undefined;
    switch (number.unit) {
        case '':
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
        case "%": case "vh": case "vw": case "vmax": case "vmin":
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
               if (e.key === Keystrokes.escape) (e.target as any).value = '' + number.value; }} />
    </>
}



// delete button <button className="btn btn-danger ms-1"><i className="p-1 bi bi-trash3-fill"/></button>
function PaletteDataComponent(props: AllProps) {
    const view = props.view;
    const readOnly = props.readonly;
    let palette: Readonly<PaletteType> = {...view.palette};
    let tmp: PaletteType = undefined as any;
    const [css, setCss] = useStateIfMounted(view.css);

    const [expand, setExpand] = useStateIfMounted(false);

    const change = (value: string|undefined) => { if(value !== undefined) setCss(value); } // save in local state for frequent changes.
    const blur = () => view.css = css; // confirm in redux state for final state

    /* *** alfonso *** */


    function useClickOutside(ref: any, onClickOutside: any) {
        useEffect(() => {
            function handleClickOutside(event: Event) {
                if (ref.current && !ref.current.contains(event.target)) {
                    onClickOutside();
                }
            }

          // Bind

          // @ts-ignore
            document.addEventListener("mousedown", handleClickOutside);
          return () => {
            // dispose
            // @ts-ignore
            document.removeEventListener("mousedown", handleClickOutside);
          };
        }, [ref, onClickOutside]);
    }

    const AddPalette = () => {
        const [open,setOpen] = useState(false);
        const menuRef = useRef(null);

        useClickOutside(menuRef, () => {
            setOpen(false);
        });


        return (<>
            {/* open ?
                <div className='palette-buttons'>
                    <button onClick={()=>addControl('palette')} className='add-palette-item btn btn-success my-btn btn-color'>Add palette</button>
                    <button onClick={()=> addControl('number')} className='btn btn-success my-btn btn-number'>Add number</button>
                    <button onClick={()=>addControl('text')} className='btn btn-success my-btn btn-textual'>Add text</button>
                    <button onClick={()=>addControl('path')}className='btn btn-success my-btn btn-path'>Add path</button>
                </div>
            :
                <button onClick={() => setOpen(!open)} className='btn btn-success my-btn'>Add new</button>
            */}

            <div className={'add-palette-item active hoverable'} tabIndex={-1}>
                <button onClick={() => addControl('palette')} className='btn btn-success my-btn btn-plus'>
                    <i style={{color: 'white'}} className="bi bi-plus"/>
                    <span className={'preview'}>Add new</span>
                </button>
                <button onClick={() => addControl('palette')} className='btn btn-success my-btn btn-color content inline'>
                    <i className="bi bi-palette"></i>
                    <span>Palette</span>
                </button>
                <button onClick={() => addControl('number')} className='btn btn-success my-btn btn-number content inline'>
                    <i className="bi bi-123"></i>
                    <span>Number</span>
                </button>
                <button onClick={() => addControl('text')} className='btn btn-success my-btn btn-textual content inline'>
                    <i className="bi bi-type"></i>
                    <span>Text</span>
                </button>
                <button onClick={() => addControl('path')} className='btn btn-success my-btn btn-path content inline'>
                <i className="bi bi-bezier"></i>                    
                <span>Path</span>
                </button>
            </div>

        </>);
    };

    /* *** */


    const addControl = (type: 'palette' | 'number' | 'text' | 'path') => {
        if (readOnly) return;
        let i: number;
        let prefix0: string;//= 'palette_' + i + '-';
        switch (type) {
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
                const uml = "-- UML relationships";
                    const agglabel = "◇ Aggregation / Composition";
                    const extendlabel = "△ "+EdgeHead.extend;
                    const asslabel = "Λ "+EdgeHead.reference;
                const e1 = "--- 1";
                const cardinality       = "-- Multiplicity";
                    const zerolabel         = "[0]    exactly zero / not present";
                    const onelabel          = "[1]    exactly one, required";
                    const manylabel         = "[0..*] zero or many, optional, unbounded";
                    const zeroOrOneLabel    = "[0..1] zero or one, optional";
                    const zeroOrManyLabel   = "[0..*] zero or many, optional, unbounded "; // was "[0..*] "
                    const oneOrManyLabel    = "[1..*] one or many, at least one";
                const e2 = "--- 2";


                let headdict: Dictionary<string, string> = {
                    [uml]: 'UML Relationships',
                        [asslabel]: 'M11.354 5.646a.5.5 90 010 .708l-6.035 6.089a.5.5 90 01-.156-.116L11.375 5.999l-6.406-6.211a.5.5 90 01.208-.115z',
                        [extendlabel]: 'M 0 0   L x y/2   L 0 y   Z',
                        [agglabel]: 'M8.5776-.9085c.6316-.522 1.6553-.522 2.2869 0l7.0948 5.8644c.6316.522.6316 1.3671 0 1.8882L10.8645 12.7085c-.6316.522-1.6542.522-2.2847 0L1.4827 6.845a1.6117 1.332 0 010-1.8882z',
                    [e1]: '--- 1',
                    [cardinality]: 'Multiplicity',
                        [zerolabel]: 'M-11.985 5.981A1 1 0 000 6 1 1 0 00-12 6',
                        [onelabel]: 'M0 0V12',
                        [manylabel]: 'M12 1 0 6 12 11H12M12 6H0',
                        [zeroOrOneLabel]: 'M-11.985 5.981A1 1 0 000 6 1 1 0 00-12 6M6 0V12',
                        [zeroOrManyLabel]: 'M-11.985 5.981A1 1 0 000 6 1 1 0 00-12 6M6 0M12 1 0 6 12 11H12M12 6H0',
                        [oneOrManyLabel]: 'M0 0V12M12 1 0 6 12 11H12M12 6H0',
                    [e2]: '--- 2'
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




    const setGeneric = (e: any, prefix: string, key: string) => {
        const val: string = e.target.value;
        if (readOnly || (palette[prefix] as any)[key] === val) return;
        let tmp: Dictionary<string, StringControl> = {...palette} as any;
        (tmp[prefix] as any)[key] = val;
        view.palette = palette = tmp; }
    const setText = (e: any, prefix: string) => {
        const val: string = e.target.value;
        if (readOnly || (palette[prefix] as StringControl).value === val) return;
        let tmp: Dictionary<string, StringControl> = {...palette} as any;
        tmp[prefix].value = val;
        view.palette = palette = tmp; }
    const setNumber = (e: any, prefix: string) => {
        const val: number = +e.target.value || 0;
        if (readOnly || (palette[prefix] as NumberControl).value === val) return;
        let tmp: Dictionary<string, NumberControl> = {...palette} as any;
        tmp[prefix].value = val;
        view.palette = palette = tmp; }
    const setUnit = (e: any, prefix: string) => {
        const val: string = e.target.value === undefined ? 'px' : e.target.value;
        if (readOnly || val === (palette[prefix] as NumberControl).unit) return;
        let tmp: Dictionary<string, NumberControl> = {...palette} as any;
        tmp[prefix].unit = val;
        view.palette = palette = tmp; }
    const changePrefix = (oldPrefix: string, newPrefix: string) => {
        // @ts-ignore
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
                {/* <button className="btn btn-danger me-1" onClick={()=>removeControl(prefix)} disabled={readOnly}><i className="p-1 bi bi-trash3-fill"/></button>*/}

                <input className={"prefix"}
                    style={{maxHeight: 'var(--input-height)', borderRadius: 'var(--radius)'}}
                    placeholder={"variable name"}
                    defaultValue={prefix}
                    onBlur={(e: any)=> changePrefix(prefix, e.target.value)}
                    disabled={readOnly} />
                {node}
            </div>)
    }
    const vcss = view.css;

    let colors = Object.keys(palettes.color).sort();
    const lines = (Math.round(vcss.split(/\r|\r\n|\n/).length*1.8) < 5 ? 10 : Math.round(vcss.split(/\r|\r\n|\n/).length*1.8));

    return(<section className={'p-3 style-tab'}>
        <h1 className={'view'}>View: {props.view.name}</h1>
        <div className={"controls"} style={{position:'relative', zIndex:2}}>

            {colors.map((entry, index, entries)=>{
                let prefix = entry;
                let paletteobj: PaletteControl = palettes.color[prefix] as PaletteControl;
                let colors: Instance[] = paletteobj.value.map(v=> tinycolor(v));
                let suggestions = [tinycolor('#ffaaaa')]; // todo: compute according to current row "colors"
                return palettewrap(prefix, <>
                    <div className="palette-row">

                        <div className="color-container" style={{maxHeight: 'var(--input-height)', borderRadius: 'var(--radius)'}}>{
                            colors.map((color, i) => <Color key={prefix+i} readOnly={readOnly}
                                                            data={view} field={'palette'} canDelete={!readOnly}
                                                            getter={()=>colors[i].toHexString()} setter={(newVal) => { setColor(prefix, i, newVal) }}
                                                            style ={{background: 'white'}}
                                                            inputStyle ={{opacity: color.getAlpha()}}
                                                            childrenn={
                                                                <div className={"content suggestions"} tabIndex={-1} style={{backgroundColor: "inherit"}} onClick={(e) => {e.preventDefault(); e.stopPropagation();}}>
                                                                    {(()=>{ return <>
                                                                        <h6 title={"Alter current color transparency"}>Opacity</h6>

                                                                        <input style={{width: "auto", marginLeft:"1em", marginRight:"1em"}}
                                                                            type={"range"} min={0} max={1} step={"any"}
                                                                            value={color.getAlpha()}
                                                                            onChange={(e: any)=>{ transparencyColor(prefix, i, color, +e.target.value) }} />

                                                                        {/* Add all colors */}
                                                                        <h6 title={"Add all the colors"}>
                                                                            <CommandBar style={{float: 'left', paddingRight: '8px'}}>
                                                                                <Btn icon={'add'} size={'x-small'}  action={()=>addColor(prefix, color.analogous(7, 30/1.5), i)} theme={'dark'} tip={'Add all the colors'}/>
                                                                            </CommandBar>
                                                                            <span>Analogous</span>
                                                                        </h6>

                                                                        <div className={"roww"}>
                                                                            {color.analogous(7, 30/1.5).map((c,ii) => ii===0?undefined:
                                                                                <button style={style(c)}
                                                                                    onClick={(e)=>{addColor(prefix, c, i)}}
                                                                                    className="btn color-suggestion">
                                                                                        <i style={style(c)} className="bi bi-plus-lg"></i>
                                                                                </button>
                                                                            )}
                                                                        </div>{/*
                                    <h6 onClick={()=>addColor(prefix, color.monochromatic(7), i)} title={"Add all the colors"}>Monochromatic</h6>
                                    <div className={"roww"}>
                                        {color.monochromatic(7).map((c,ii) => ii===0?undefined: <button style={style(c)}
                                                                                                        onClick={(e)=>{addColor(prefix, c, i)}} className="btn color-suggestion">+</button>)}
                                    </div>{/*[6/12, 5/12, 4/12, 3/12, 2/12, 1/12]*/}

                                                                        {/* Add all colors */}
                                                                        <h6 title={"Add all the colors"}>
                                                                            <CommandBar style={{
                                                                                float: 'left',
                                                                                paddingRight: '8px'
                                                                            }}>
                                                                                <Btn icon={'add'} size={'x-small'}
                                                                                     tip={'Add all the colors'}
                                                                                     theme={'dark'}
                                                                                     action={() => addColor(prefix, [1 / 12, 2 / 12, 3 / 12, 4 / 12, 5 / 12, 6 / 12].map(n => color.clone().lighten(n * 100)), i, false)}/>
                                                                            </CommandBar>
                                                                            <span>Lighten</span>

                                                                        </h6>

                                                                        <div className={"roww"}>
                                                                            {[1/12, 2/12, 3/12, 4/12, 5/12, 6/12].map(n=>color.clone().lighten(n*100))
                                                                                .map((c,ii) => <button style={style(c)} className="btn color-suggestion"
                                                                                                       onClick={(e)=>{addColor(prefix, c, i)}}><i style={style(c)} className="bi bi-plus-lg"></i></button>)}
                                                                        </div>

                                                                        {/* Add all colors */}
                                                                        <h6 title={"Add all the colors"}>
                                                                            <CommandBar style={{
                                                                                float: 'left',
                                                                                paddingRight: '8px'
                                                                            }}>
                                                                                <Btn icon={'add'} theme={'dark'}
                                                                                     tip={'Add all the colors'}
                                                                                     size={'x-small'}
                                                                                     action={() => addColor(prefix, [6 / 12, 5 / 12, 4 / 12, 3 / 12, 2 / 12, 1 / 12].map(n => color.clone().darken(n * 100)), i, false)}/>
                                                                            </CommandBar>
                                                                            <span>Darken</span>
                                                                        </h6>

                                                                        <div className={"roww"}>
                                                                            {[6/12, 5/12, 4/12, 3/12, 2/12, 1/12].reverse().map(n=>color.clone().darken(n*100))
                                                                                .map((c,ii) => <button style={style(c)} className="btn color-suggestion"
                                                                                                       onClick={(e)=>{addColor(prefix, c, i)}}><i style={style(c)} className="bi bi-plus-lg"></i></button>)}
                                                                        </div>

                                                                        {/* Add all colors */}
                                                                        <h6 title={"Add all the colors"}>
                                                                            <CommandBar style={{
                                                                                float: 'left',
                                                                                paddingRight: '8px'
                                                                            }}>
                                                                                <Btn icon={'add'}
                                                                                     tip={'Add all the colors'}
                                                                                     theme={'dark'} size={'x-small'}
                                                                                     action={() => addColor(prefix, [color.complement(), tinycolor(invert(color))], i, false)}/>
                                                                            </CommandBar>
                                                                            <span>Complementary / Opposite</span>
                                                                        </h6>

                                                                        <div className={"roww"}>
                                                                            <button style={style(color.complement())} className="btn color-suggestion"
                                                                                    onClick={(e)=>{addColor(prefix, color.complement(), i)}}><i style={style(color.complement())} className="bi bi-plus-lg"></i></button>
                                                                            <button style={style(color)} className="btn color-suggestion"
                                                                                    onClick={(e)=>{addColor(prefix, tinycolor(invert(color)), i)}}><i style={style(color)} className="bi bi-plus-lg"></i></button>
                                                                        </div>

                                                                        {/* Add all colors */}
                                                                        <h6 title={"Add all the colors"}>
                                                                            <CommandBar style={{
                                                                                float: 'left',
                                                                                paddingRight: '8px'
                                                                            }}>
                                                                                <Btn icon={'add'}
                                                                                     tip={'Add all the colors'}
                                                                                     theme={'dark'} size={'x-small'}
                                                                                     action={() => addColor(prefix, color.splitcomplement(), i)}/>
                                                                            </CommandBar>
                                                                            <span>Split Complementary</span>
                                                                        </h6>

                                                                        <div className={"roww"}>
                                                                            {color.splitcomplement().map((c) => <button style={{...style(c)}} className="btn color-suggestion"
                                                                                                                        onClick={(e)=>{addColor(prefix, c, i)}}><i style={style(c)} className="bi bi-plus-lg"></i></button>)}
                                                                        </div>

                                                                        <h6 title={"Add all the colors"}>
                                                                            <CommandBar style={{
                                                                                float: 'left',
                                                                                paddingRight: '8px'
                                                                            }}>
                                                                                <Btn icon={'add'}
                                                                                     tip={'Add all the colors'}
                                                                                     theme={'dark'} size={'x-small'}
                                                                                     action={() => addColor(prefix, color.triad(), i)}/>
                                                                            </CommandBar>
                                                                            <span>Triadic</span>
                                                                        </h6>

                                                                        <div className={"roww"}>
                                                                            {color.triad().map ( (c) => <button style={{...style(c)}} className="btn color-suggestion"
                                                                                                                onClick={(e)=>{addColor(prefix, c, i)}}><i style={style(c)} className="bi bi-plus-lg"></i></button>)}
                                                                        </div>

                                                                        {/* Add all colors */}
                                                                        <h6 title={"Add all the colors"}>
                                                                            <CommandBar style={{
                                                                                float: 'left',
                                                                                paddingRight: '8px'
                                                                            }}>
                                                                                <Btn icon={'add'}
                                                                                     tip={'Add all the colors'}
                                                                                     theme={'dark'} size={'x-small'}
                                                                                     action={() => addColor(prefix, color.tetrad(), i)}/>
                                                                            </CommandBar>
                                                                            <span>Tetradic</span>
                                                                        </h6>
                                                                        <div className={"roww"}>
                                                                            {color.tetrad().map ( (c) => <button style={{...style(c)}} className="btn color-suggestion"
                                                                                                                 onClick={(e)=>{addColor(prefix, c, i)}}><i style={style(c)} className="bi bi-plus-lg"></i></button>)}
                                                                        </div>
                                                                    </>})()}


                                                                    <button
                                                                        className={'btn btn-danger content delete-color mt-2 jj-delete'}
                                                                        onClick={()=>removeColor(prefix, i)}
                                                                        disabled={readOnly}
                                                                    >
                                                                        <i className="bi p-1 bi-trash-fill"/> Delete
                                                                    </button>
                                                                </div>
                                                            }
                            />)
                        }
                        </div>
                        <div className="suggestion-container">{
                            suggestions.map((c, i) => <label className="p-1">

                                {/* Palette */}
                                <CommandBar style={{float: 'right'}}>
                                    <Btn icon={'add'} tip={'Add color to palette'} action={() => addColor(prefix, c)} />
                                    <Btn icon={'delete'} tip={'Remove color from palette'} action={() => {
                                        if (Array.isArray(palette[prefix].value) && (palette[prefix].value as any).length) {
                                            removeColor(prefix, i)
                                        } else {
                                            removeControl(prefix);
                                        }
                                    }}
                                    />
                                </CommandBar>

                                {/* <button className="btn color-suggestion" style={style(c)} onClick={()=>{addColor(prefix, c)}} disabled={readOnly}>+</button>*/}
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
                            <div className={"value hoverable"} >
                                <div className={"d-flex w-100"}>
                                    <input className={"value w-100 my-auto"} placeholder={"svg path [d]"} defaultValue={path.value} key={path.value} onBlur={e => {setText(e as any, prefix)}} disabled={readOnly}
                                           onKeyDown={e => {
                                               if (e.key === Keystrokes.enter) setText(e as any, prefix);
                                               if (e.key === Keystrokes.escape) (e.target as any).value = path.value; }}
                                    />
                                </div>
                                <div className={"content d-flex w-100"} style={{position: 'relative', backgroundColor: 'whitesmoke'}}>
                                    <input className={"spacer w-100"}/>
                                    <label className={"mx-auto"}>x:&nbsp;<input className="x" placeholder={"x"} defaultValue={path.x} disabled={readOnly} onChange={(e)=>setGeneric(e, prefix, "x")}/></label>
                                    <label className={"mx-auto"}>y:&nbsp;<input className="y" placeholder={"y"} defaultValue={path.y} disabled={readOnly} onChange={(e)=>setGeneric(e, prefix, "y")}/></label>
                                </div>
                            </div>
                            {/* <select className={'d-flex'} style={{width: '100px!important'}} value={path.value} disabled={readOnly} onChange={(e)=>setText(e as any, prefix)}>

                                {[<option style={{fontStyle:'italic', color:'gray'}} value={""}>Custom</option>, path.options.map((e)=>{
                                    
                                    
                                    return <option value={e.v}>{e.k}</option>
                            
                            })]}
                            </select>*/}
                            <select className={'d-flex'} style={{width: '100px!important'}} value={path.value} disabled={readOnly} onChange={(e)=>setText(e as any, prefix)}>
                                <option style={{fontStyle:'italic', color:'gray'}} value={""}>Custom</option>
                                {(() => {
                                    const groups: {label: string, options: {k: string, v: string}[]}[] = [];
                                    let currentGroup: {label: string, options: {k: string, v: string}[]} | null = null;
                                    path.options.forEach(e => {
                                        if (e.k.startsWith('-- ')) {
                                            if (currentGroup) groups.push(currentGroup);
                                            currentGroup = {label: e.k.replace('-- ', ''), options: []};
                                        } else if (e.k.startsWith('--- ')) {
                                            // End current group
                                            if (currentGroup) {
                                                groups.push(currentGroup);
                                                currentGroup = null;
                                            }
                                        } else {
                                            if (currentGroup) {
                                                currentGroup.options.push(e);
                                            } else {
                                                groups.push({label: '', options: [e]});
                                            }
                                        }
                                    });
                                    if (currentGroup) groups.push(currentGroup);

                                    return groups.map((group, idx) =>
                                        group.label ?
                                            <optgroup key={group.label + idx} label={group.label}>
                                                {group.options.map(opt =>
                                                    <option key={opt.k} value={opt.v}>{opt.k}</option>
                                                )}
                                            </optgroup>
                                            :
                                            group.options.map(opt =>
                                                <option key={opt.k} value={opt.v}>{opt.k}</option>
                                            )
                                    );
                                })()}
                            </select>

                            {/* Path */}
                            <CommandBar  style={{paddingRight: '4px', marginLeft: 'auto'}}>
                                <Btn icon={'space'} />
                                <Btn icon={"delete"} action={(e) => {removeControl(prefix)}} tip={'Remove path'}/>
                            </CommandBar>

                        </div>)
                }
            )}
            {Object.entries(palettes.number).map((entry, index, entries)=>{
                    let prefix = entry[0];
                    let number: NumberControl = entry[1] as any;
                    return palettewrap(prefix,
                        <div className="palette-row numeric">
                            {makeNumericInput(prefix, number, setNumber, setText, readOnly)}
                            <input className={"unit"} placeholder={"unit"} value={number.unit} pattern={CSS_Units.pattern} disabled={readOnly}
                                   list={"__jodel_CSS_units"} onChange={e => {setUnit(e as any, prefix)}} />

                            {/* Numeric */}
                            <CommandBar  style={{paddingRight: '4px', marginLeft: 'auto'}}>
                                <Btn icon={'space'} />
                                <Btn icon={"delete"} action={(e) => {removeControl(prefix)}} tip={'Remove number'}/>
                            </CommandBar>
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
                                       if (e.key === Keystrokes.escape) (e.target as any).value = string.value; }} />

                            {/* Text */}
                            <CommandBar  style={{paddingRight: '4px', marginLeft: 'auto'}}>
                                <Btn icon={'space'} />
                                <Btn icon={"delete"} action={(e) => {removeControl(prefix)}} tip={'Remove text'}/>
                            </CommandBar>
                        </div>)
                }
            )}
        </div>


        <AddPalette />


        {/* <div className={"w-100"} style={{display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', position: 'relative', zIndex:1}}
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
            </div>*/}

        <HRule theme={'light'} style={{display: 'block', padding: '30px 0px!important'}}/>

        <Input data={view} field={'cssIsGlobal'} type={"checkbox"}  jsxLabel={
            <div style={{width:'100%', display:'block', float: 'left'}}>
                {cssIsGlobal ? <b style={{color: 'inherit'}}>Global</b> : <b style={{color: 'inherit'}}>Local</b>}
                {' CSS & LESS Editor '}
                {cssIsGlobal ? '(Use with caution)' : ''}
            </div>
        } />

        {/* <CommandBar style={{paddingTop: '10px', float: 'right'}}>
            {expand ?
                <Btn icon={'shrink'} action={(e) => {setExpand(false)}} tip={'Minimize editor'}/>
                :
                <Btn icon={'expand'} action={(e) => {setExpand(true)}} tip={'Enlarge editor'}/>
            }
        </CommandBar>*/}

        {/* ****** */}

        {/*<label className={'ms-1 mb-1'}>{view.cssIsGlobal ? 'Global' : 'Local'} CSS Editor</label>*/}
        {vcss.indexOf('//') >= 0 && <b><span style={{color:'red'}}>Warning:</span> Inline comments // are not supported by our compiler.<br/>
            Please replace them with /* block comments */</b>}

            {/* <div className={"monaco-editor-wrapper"} style={{
                minHeight: '20px',
                height:`${expand ? '30lvh' : '10lvh'}`,
                transition: 'height 0.3s',
                resize: 'vertical', overflow:'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}
            onFocus={() => setExpand(true)}
            onBlur={() => {setExpand(false);blur()}}> */}
                
            <div
                className="monaco-editor-wrapper"
                style={{
                    height: '40%',   // use dvh for dynamic viewport on mobile, better than lvh
                    maxHeight: '40%',                   // cannot exceed the section’s height
                    transition: 'height 0.3s',
                    resize: 'vertical',
                    overflow: 'auto',                     // scroll instead of overflowing past bottom
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '1 1 auto'
                }}
                onFocus={() => setExpand(true)}
                onBlur={() => { setExpand(false); blur(); }}
            >



            <Editor className={'mx-1'}
                    options={{
                        theme: 'vs',
                        fontSize: 12, 
                        scrollbar: {
                            vertical: 'hidden', 
                            horizontalScrollbarSize: 5
                        }, 
                        minimap: {enabled: false}, 
                        readOnly: readOnly
                    }}
                    defaultLanguage={'less'} value={vcss} onChange={change}/>
        </div>
        {false && <div className={"debug"}><div style={{whiteSpace:'pre'}}>{view.compiled_css}</div></div>}
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
    const view = LViewElement.fromPointer(ownProps.viewID) as LViewElement;
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

export const PaletteData = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <PaletteDataConnected {...{...props, children}} />;
}
export default PaletteData;
