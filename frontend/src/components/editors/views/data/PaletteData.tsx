/* Viewpoints > Style */

import React, {Dispatch, ReactElement, ReactNode, Ref, RefObject, SyntheticEvent, useState, useRef, useEffect} from 'react';
import {connect} from "react-redux";
import {useStateIfMounted} from "use-state-if-mounted";
import tinycolor, {Instance} from "tinycolor2";
import Editor from "@monaco-editor/react";
import type {Dictionary, GObject, Pointer,} from '../../../../joiner';
import {DState, DViewElement, EdgeHead, Input, Keystrokes, Log, LViewElement, Select, U,} from '../../../../joiner';
import { cssMonacoOptions, withReadOnly } from '../../monacoConfig';
import EditorToolbar from '../../EditorToolbar';
import EditorFullscreenModal from '../../EditorFullscreenModal';
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
import { EdgeMarkerEditorModal } from '../../EdgeMarkerEditorModal';
import {Info} from "../../../forEndUser/Info";
import './palette-data.scss';


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
        <input  placeholder={"value"} type={"range"} disabled={readOnly}
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
    const [wrap, setWrap] = useStateIfMounted(false);
    const [fullscreen, setFullscreen] = useStateIfMounted(false);
    const [showEditor, setShowEditor] = useStateIfMounted(true);

    // State for marker editor modal
    const [markerEditorOpen, setMarkerEditorOpen] = useStateIfMounted(false);
    const [editingPathPrefix, setEditingPathPrefix] = useStateIfMounted<string | null>(null);

    const change = (value: string|undefined) => { if(value !== undefined) setCss(value); } // save in local state for frequent changes.
    const blur = () => view.css = css; // confirm in redux state for final state

    const closestyle = {height: '1lh'};
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
        const [isOpen, setIsOpen] = useState(false);
        const menuRef = useRef<HTMLDivElement>(null);

        useClickOutside(menuRef, () => {
            setIsOpen(false);
        });

        const handleAdd = (type: 'palette' | 'number' | 'text' | 'path') => {
            addControl(type);
            setIsOpen(false);
        };

        return (
            <div className="add-dropdown" ref={menuRef}>
                <button
                    className={`add-btn ${isOpen ? 'open' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={readOnly}
                >
                    <i className="bi bi-plus" />
                    <span>Add</span>
                    <i className="bi bi-chevron-down" />
                </button>
                <div className={`dropdown-menu ${isOpen ? 'open' : ''}`}>
                    <button className="dropdown-item" onClick={() => handleAdd('palette')}>
                        <span className="item-icon"><i className="bi bi-palette" /></span>
                        <span>Palette</span>
                    </button>
                    <button className="dropdown-item" onClick={() => handleAdd('number')}>
                        <span className="item-icon"><i className="bi bi-123" /></span>
                        <span>Number</span>
                    </button>
                    <button className="dropdown-item" onClick={() => handleAdd('text')}>
                        <span className="item-icon"><i className="bi bi-fonts" /></span>
                        <span>Text</span>
                    </button>
                    <button className="dropdown-item" onClick={() => handleAdd('path')}>
                        <span className="item-icon"><i className="bi bi-bezier2" /></span>
                        <span>Path</span>
                    </button>
                </div>
            </div>
        );
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
                tmp = {...palette};
                tmp[prefix] = {type: 'path', value: '', x:'view.edgeHeadSize.x', y:'view.edgeHeadSize.y', options: EdgeHead.predefinedPaths};
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
            // console.log("addingColor:", {rgba, lastAdded, color});
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
        // console.log("set transparency", {color, tinycolor, oldcolor: tmp[prefix].value[index]});
        view.palette = palette = tmp;
    }
    const removeColor = (prefix: string, index?: number) => {
        if (readOnly || !palette[prefix]) return;

        let tmp: Dictionary<string, PaletteControl> = {...palette} as any;
        tmp[prefix].value = [...tmp[prefix].value];
        if (index === undefined) index = tmp[prefix].value.length -1;
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

    return(<section className={'p-3 style-tab style-tab-redesign' + (readOnly ? " disabled" : "")}>
        {/* EDGE STYLE SECTION — V1: stroke color/width/style for L2 overlay edges. Only when this view drives an edge. */}
        {view.isEdge && (
            <section className="edge-style-section">
                <div className="style-section-header">
                    <span className="section-title">Edge Style</span>
                </div>
                <div className="jj-field">
                    <label className="jj-field-label">
                        Stroke Color
                        <Info className={'jj-field-info'}>Color of the edge stroke. Semantic palette tokens that adapt to light and dark themes.</Info>
                    </label>
                    <Select
                        data={view}
                        field={'edgeStrokeColor'}
                        readOnly={readOnly}
                        getter={(d: LViewElement) => d.edgeStrokeColor || 'default'}
                        setter={(v: string) => { view.edgeStrokeColor = v; }}
                        options={<>
                            <option value={'default'}>Default</option>
                            <option value={'accent'}>Accent</option>
                            <option value={'success'}>Success</option>
                            <option value={'warning'}>Warning</option>
                            <option value={'danger'}>Danger</option>
                            <option value={'muted'}>Muted</option>
                        </>}
                    />
                </div>
                <div className="jj-field">
                    <label className="jj-field-label">
                        Stroke Width
                        <Info className={'jj-field-info'}>Thickness of the edge line in pixels (0.5–10). Default 1.5.</Info>
                    </label>
                    <Input
                        data={view}
                        field={'edgeStrokeWidth'}
                        readOnly={readOnly}
                        type={'number'}
                        {...({min: 0.5, max: 6, step: 0.25} as any)}
                    />
                </div>
                <div className="jj-field">
                    <label className="jj-field-label">
                        Stroke Style
                        <Info className={'jj-field-info'}>Pattern of the edge line: solid, dashed, or dotted.</Info>
                    </label>
                    <Select
                        data={view}
                        field={'edgeStrokeStyle'}
                        readOnly={readOnly}
                        getter={(d: LViewElement) => d.edgeStrokeStyle || 'solid'}
                        setter={(v: string) => { view.edgeStrokeStyle = v as any; }}
                        options={<>
                            <option value={'solid'}>Solid</option>
                            <option value={'dashed'}>Dashed</option>
                            <option value={'dotted'}>Dotted</option>
                        </>}
                    />
                </div>
            </section>
        )}

        {/* STYLE VARIABLES SECTION */}
        <div className="style-variables-section">
            <div className="style-section-header">
                <span className="section-title">Style Variables</span>
                <AddPalette />
            </div>
        </div>

        <div className={"controls"} style={{position:'relative', zIndex:2}}>
            {colors.map((entry, index, entries)=>{
                let prefix = entry;
                let paletteobj: PaletteControl = palettes.color[prefix] as PaletteControl;
                let colors: Instance[] = paletteobj.value.map(v=> tinycolor(v));
                let suggestions = [tinycolor('#ffaaaa')]; // todo: compute according to current row "colors"
                return palettewrap(prefix, <>
                    <div className={"palette-row "}>
                        <div className="color-container" style={{maxHeight: 'var(--input-height)', borderRadius: 'var(--radius)'}}>{
                            colors.map((color, i) => <Color key={prefix+i} readOnly={readOnly}
                                                            data={view} field={'palette'} canDelete={!readOnly}
                                                            getter={()=>colors[i].toHexString()} setter={(newVal) => { setColor(prefix, i, newVal) }}
                                                            inputStyle ={{opacity: color.getAlpha()}}
                                                            childrenn={
                                                                <div className={"content suggestions"} tabIndex={-1} style={{backgroundColor: "inherit"}} onClick={(e) => {e.preventDefault(); e.stopPropagation();}}>
                                                                    {(()=>{ return <section className={"suggestcontent"}>
                                                                        <h6 title={"Alter current color transparency"}>Opacity</h6>

                                                                        <input style={{width: "auto", marginLeft:"1em", marginRight:"1em"}}
                                                                            className={"cpanel__hue"}
                                                                            type={"range"} min={0} max={1} step={"any"}
                                                                            value={color.getAlpha()}
                                                                            onChange={(e: any)=>{ transparencyColor(prefix, i, color, +e.target.value) }} />

                                                                        {/* Add all colors */}
                                                                        <h6 title={"Add all the colors"}>
                                                                            <CommandBar style={{float: 'left', paddingRight: '8px'}}>
                                                                                <Btn icon={'add'} size={'x-small'} action={()=>addColor(prefix, color.analogous(7, 30/1.5), i)} theme={'dark'} tip={'Add all the colors'}/>
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
                                                                    </section>})()}


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
                                    <Btn icon={'delete'} tip={'Remove last color from palette'} action={() => {
                                        if (Array.isArray(palette[prefix].value) && (palette[prefix].value as any).length) {
                                            removeColor(prefix)
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
                        <div className="palette-row path">
                            <div className={"value hoverable"} >
                                <div className={"d-flex w-100"}>
                                    <input className={"value w-100 my-auto"} placeholder={"svg path [d]"} defaultValue={path.value} key={path.value} onBlur={e => {setText(e as any, prefix)}} disabled={readOnly}
                                           onKeyDown={e => {
                                               if (e.key === Keystrokes.enter) setText(e as any, prefix);
                                               if (e.key === Keystrokes.escape) (e.target as any).value = path.value; }}
                                    />
                                </div>
                                <div className={"content d-flex w-100 px-2"} style={{position: 'relative', backgroundColor: 'whitesmoke'}}>
                                    <div className={'d-flex w-100'} style={{flexFlow:'column'}}>
                                        <Info className={'m-auto'}>{'edgeHeadSize determines the position of the head.' +
                                            '\nBasic math operators, expressions and view constants are allowed (no dynamic variables),' +
                                            '\nbut they must be wrapped in parenthesis.' +
                                            '\nEG: (x * Math.sin(view.constants.pi / 3)).' +
                                            '\nx and y are variables local to this path used to scale his shape.' +
                                            '\nThe result of expressions must be a number or a string concatenated to the path.'
                                        }</Info>
                                    </div>
                                    <div className={'d-flex w-100'} style={{position:'relative'}}>
                                        <label className={"mx-auto d-flex"} style={{flexGrow: '1', minWidth:'0'}}>
                                            <span className={'my-auto mx-1'}>X:</span>
                                            <input className="x" placeholder={"x"} defaultValue={path.x}
                                                   disabled={readOnly} onChange={e => setGeneric(e, prefix, "x")}
                                                   style={{flexBasis: '0', flexGrow: '1', minWidth:'0'}}/>
                                        </label>
                                        <label className={"mx-auto d-flex"} style={{flexGrow: '1', minWidth:'0'}}>
                                            <span className={'my-auto mx-1'}>Y:</span>
                                            <input className="y" placeholder={"y"} defaultValue={path.y}
                                                   disabled={readOnly} onChange={e => setGeneric(e, prefix, "y")}
                                                   style={{flexBasis: '0', flexGrow: '1', minWidth:'0'}}/>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            {/* <select className={'d-flex'} style={{width: '100px!important'}} value={path.value} disabled={readOnly} onChange={(e)=>setText(e as any, prefix)}>

                                {[<option style={{fontStyle:'italic', color:'gray'}} value={""}>Custom</option>, path.options.map((e)=>{
                                    
                                    
                                    return <option value={e.v}>{e.k}</option>
                            
                            })]}
                            </select>*/}
                            <select className={'d-flex'} style={{width: '100px!important'}} value={path.value}
                                    disabled={readOnly} onChange={(e) => setText(e as any, prefix)}>
                                <option style={{fontStyle: 'italic', color:'gray'}} value={""}>Custom</option>
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

                            {/* Path Actions */}
                            <div className="path-actions" style={{display: 'flex', gap: '4px', marginLeft: 'auto', flexShrink: 0}}>
                                <button
                                    type="button"
                                    className="marker-edit-btn"
                                    onClick={() => {
                                        setEditingPathPrefix(prefix);
                                        setMarkerEditorOpen(true);
                                    }}
                                    disabled={readOnly}
                                    aria-label={`Edit ${prefix} marker`}
                                >
                                    <i className="bi bi-pencil-square" />
                                    <span>Edit</span>
                                </button>
                                <Btn icon={"delete"} style={closestyle} action={() => removeControl(prefix)} tip={'Remove path'} disabled={readOnly} />
                            </div>

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
                                   spellCheck={false}
                                   list={"__jodel_CSS_units"} onChange={e => {setUnit(e as any, prefix)}} />

                            {/* Numeric */}
                            <Btn icon={"delete"} style={closestyle} action={() => removeControl(prefix)} tip={'Remove number'} disabled={readOnly} />
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
                            <Btn icon={"delete"} style={closestyle} action={() => removeControl(prefix)} tip={'Remove text'} disabled={readOnly} />
                        </div>)
                }
            )}
        </div>

        {/* SEPARATOR */}
        <div className="style-separator" />

        {/* CSS EDITOR SECTION */}
        <div className="css-editor-section">
            <div className="css-scope-toggle">
                <Input data={view} field={'cssIsGlobal'} type={"checkbox"} jsxLabel={
                    <span className={`toggle-label ${cssIsGlobal ? 'active' : ''}`}>
                        {cssIsGlobal ? 'Global' : 'Local'} CSS & LESS
                        {cssIsGlobal && <span className="caution-badge" style={{color: '#e11d48', marginLeft: '6px', fontSize: '11px', fontWeight: 500}}>Use with caution</span>}
                    </span>
                } />
            </div>

            <EditorToolbar
            title={cssIsGlobal ? "Global CSS & LESS Editor" : "Local CSS & LESS Editor"}
            icon="bi-filetype-css"
            content={vcss}
            collapsed={!showEditor}
            onCollapseToggle={() => setShowEditor(!showEditor)}
            onWrapChange={(newWrap) => setWrap(newWrap)}
            onExpandChange={(newExpanded) => setExpand(newExpanded)}
            onFullscreenOpen={() => setFullscreen(true)}
            disableFullscreen={false}
            initialExpanded={expand}
            readOnly={readOnly}
        />
        {showEditor && vcss.indexOf('//') >= 0 && <b><span style={{color:'red'}}>Warning:</span> Inline comments // are not supported by our compiler.<br/>
            Please replace them with /* block comments */</b>}
        {showEditor && (
            <div
                className="monaco-editor-wrapper"
                style={{
                    height: expand ? '60%' : '40%',
                    maxHeight: expand ? '800px' : '500px',
                    transition: 'height 0.3s',
                    resize: 'vertical',
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '1 1 auto'
                }}
                onFocus={() => setExpand(true)}
                onBlur={() => { setExpand(false); blur(); }}
            >
                <Editor className={'mx-1'}
                        options={{
                            ...withReadOnly(cssMonacoOptions, readOnly),
                            wordWrap: wrap ? 'on' : 'off'
                        }}
                        defaultLanguage={'less'} value={vcss} onChange={change}/>
            </div>
        )}

        <EditorFullscreenModal
            isOpen={fullscreen}
            onClose={() => { blur(); setFullscreen(false); }}
            title={cssIsGlobal ? "Global CSS & LESS Editor" : "Local CSS & LESS Editor"}
            icon="bi-filetype-css"
            value={vcss}
            onChange={change}
            onSave={(newValue) => {
                setCss(newValue);
                view.css = newValue;
                setFullscreen(false);
            }}
            language="less"
            readOnly={readOnly}
        />
        {false && <div className={"debug"}><div style={{whiteSpace:'pre'}}>{view.compiled_css}</div></div>}
        </div>
        {/* END CSS EDITOR SECTION */}

        {/* Edge Marker Editor Modal */}
        {editingPathPrefix && (
            <EdgeMarkerEditorModal
                isOpen={markerEditorOpen}
                onClose={() => {
                    setMarkerEditorOpen(false);
                    setEditingPathPrefix(null);
                }}
                onApply={(newPath: string) => {
                    if (editingPathPrefix && !readOnly) {
                        let tmp: Dictionary<string, PathControl> = {...palette} as any;
                        if (tmp[editingPathPrefix]) {
                            tmp[editingPathPrefix] = {...tmp[editingPathPrefix], value: newPath};
                            view.palette = tmp;
                        }
                    }
                }}
                initialPath={(palettes.path[editingPathPrefix] as PathControl)?.value || ''}
                markerPosition={editingPathPrefix === 'head' || editingPathPrefix.includes('head') ? 'head' : 'tail'}
            />
        )}

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