import React, {Dispatch, ReactElement, ReactNode, useRef} from 'react';
import {connect} from 'react-redux';
import {CtxMenuAllProps, CtxMenuPathSeparator} from '../forEndUser/ContextMenu';
import type {
    DGraph,
    DGraphElement,
    Dictionary,
    DNamedElement,
    DState,
    DValue,
    GObject,
    LClass,
    LGraphElement,
    LModel,
    LModelElement,
    LNamedElement,
    LObject,
    LPackage,
    LReference,
    LValue,
    Pointer,
} from '../../joiner';
import {
    SetRootFieldAction,
    TRANSACTION,
    L,
    Log,
    D,
    transientProperties,
    U,
    windoww,
    Keystrokes,
    store,
    DViewElement,
    DUser,
} from '../../joiner';
import {Key} from "../../common/U";
import {toggleMetrics} from '../metrics/Metrics';
import MemoRec from '../../api/memorec';
import {useStateIfMounted} from 'use-state-if-mounted';
import ModellingIcon from "../forEndUser/ModellingIcon";
import {FakeStateProps} from "../../joiner/types";
import {icon} from '../../pages/components/icons/Icons';
import {Tooltip} from "../forEndUser/Tooltip";
import { Info } from '../editors';
import { Btn, CommandBar } from '../commandbar/CommandBar';
import { createPortal } from 'react-dom';
import { Logo } from '../logo';
import { forEach } from 'lodash';
import './ContextMenu.scss';
import { getLastEditedViewpointId, getLastEditedViewpointName, createViewInWorkbench } from '../../utils/lastViewpoint';
import { isAdvancedMode } from '../../hooks/useInterfaceMode';
import { toast } from '../Toast/toastDispatch';
import { JjodelEvents } from '../../events/registry';
import { createVertexForObject, createCompositionEdgeForObjects } from '../editor-v2/sync/canvasToJjom';

function ContextMenuComponent(props: AllProps) {
    return ContextMenuComponentInner(props);

    /* crash handling moved to <Try> component
    try { return ContextMenuComponentInner(props); }
    catch (e) {
        Log.eDevv('context menu crash', {e});
    }

    const position = props.position || {x:0, y:0};
    return <div className={'context-menu round'} style={{top: position.y - 100, left: position.x - 10}}
         onContextMenu={(e) => e.preventDefault()}>
        Contextmenu crashed.
        <br/>The error has been reported.
    </div>*/
}
let oldRef: Element | null = null;

// export let ShowContextMenu: (nodeID: Pointer<DGraphElement>, x: number, y: number)=>void = null as any

export function ShowContextMenu(nodeid: Pointer<DGraphElement>, x: number, y: number): void {
    let html = document.querySelector('#'+nodeid);
    let graph_html: HTMLElement | null = html as HTMLElement;
    let graphid: Pointer<DGraph> | undefined = undefined;
    while (graph_html) {
        if (graph_html.dataset?.nodetype === 'Graph') { graphid = graph_html.dataset.nodeid; break; }
        graph_html = graph_html.parentElement;
    }
    if (!graphid) { Log.eDevv('contextmenu graph not found', {nodeid, graphid}); return; }
    // console.log('showctx', {contextMenuMap, graphid, cg:contextMenuMap[graphid]});
    contextMenuMap[graphid]?.(nodeid, x, y);
}

let contextMenuMap: Dictionary<Pointer<DGraph>, (nodeid: Pointer<DGraphElement>, x: number, y: number)=>void> = {};
windoww.ShowContextMenu = ShowContextMenu;
windoww.contextMenuMap = contextMenuMap;
type RecursiveArray<A> = A[] | RecursiveArray<A>[];
export type NestedDictionary<K extends keyof GObject = any, V = any> =
    | Dictionary<K, V>
    | { [key: string]: NestedDictionary<K, V> };

function addDynamicEntries(jsxList: ReactNode[], nodeid: Pointer<DGraphElement>, data: LModelElement | undefined, node: LGraphElement){
    let tn = transientProperties.node[nodeid];
    let arr: CtxMenuAllProps[] = [];
    for (let vid in tn.viewScores) {
        let tnv = tn.viewScores[vid];
        if (!tnv?.contextMenu?.length) continue;
        U.arrayMergeInPlace(arr, tnv.contextMenu);
    }
    if (!arr?.length) return;
    type RecursiveDictExcept<K extends string | number, V, S extends string> = {
        [S]?: V;
    } & {
        [K in Exclude<string, S>]?: V | RecursiveDictExcept<K, V, S>;
    };
    type RecursiveCtxMap = RecursiveDictExcept<string, CtxMenuAllProps, '__props'>

    // let map: NestedDictionary<string, ({__props: CtxMenuAllProps} & Omit<Dictionary<Exclude<string, '__props'>, CtxMenuAllProps>, '__props'> & {__props: CtxMenuAllProps} )> = {};
    let map: RecursiveCtxMap = {};

    // arr.sort((a, b)=> a.path.localeCompare(b.path));
    for (let c of arr) {
        let patharr = c.path.split(CtxMenuPathSeparator);
        let curr: RecursiveCtxMap = map;
        let prev = map;
        let p: string = '';
        for (p of patharr) {
            if (!curr[p]) curr[p] = {};
            prev = curr;
            curr = curr[p] as any;
        }
        if (!curr.__props) { curr.__props = c; continue; }
        // name conflict case
        p = U.increaseEndingNumber(p+'_1', false, false, (v)=>!!prev[v]);
        prev[p] = {__props: c};
    }

    let i = -1;
    // aad custom user entries
    function HandleMapLevel(map: RecursiveCtxMap, level: number = 0): ReactNode[] {
        let entries: ReactNode[] = [];
        for (let k in map) {
            if (k === '__props') continue;
            let submap = map[k] as RecursiveCtxMap;
            let ctx: CtxMenuAllProps = submap?.__props || {label: k} as any;
            let key = k;
            i++;
            let ico = ctx.ico;
            if (!ico) ico = 'bi bi-person-gear';
            else if (typeof ico === 'string') {
                ico = ' ' + ico + ' '; // to simplify code in next line " bi " so i allow it at string end, but not as beginning of another string like "bisect"
                if ((ico as string).includes(' bi-') && !(ico as string).includes(" bi ")) ico = "bi " + ico;
                else if ((ico as string).includes(' bx-') && !(ico as string).includes(" bx ")) ico = "bx " + ico;
                ico = (ico as string).trim();
            } else {
                if (!React.isValidElement(ico)) ico = 'bi bi-user';
            }
            let label = ctx.label;
            let labelJSX = ctx.labelJSX;
            if (!label || typeof "label" !== "string") { label = k || 'Unnamed user action ' + i; }
            if (!labelJSX || !React.isValidElement(labelJSX)) { labelJSX = null; }

            let action = () => {
                let ret: any = false;
                if (!ctx.action || typeof ctx.action !== 'function') return false;
                try { ret = ctx.action(data || null, node); }
                catch (e) {
                    Log.ee("Error during user-defined contextmenu action", {e, label, ctx});
                    ret = false;
                }
                return ret;
            }

            let entry = ContextEntry(key, typeof (ico as unknown) !== 'string' ? ico : <i className={ico as string} />, labelJSX || label, action, [], false,
                HandleMapLevel(submap, level +1), level > 0
            );
            entries.push(entry);
        }
        return entries;
    }
    HandleMapLevel(map, 0);
    separator();
}

let jsxList: ReactNode[] = [];

function SubEntry(key:string, icon: ReactNode, label: ReactNode, action: null|undefined|(()=>any),
                        keycodes: Key[], disabled: boolean = false, subelements: ReactNode[] = []) {
    return ContextEntry(key, icon, label, action, keycodes, disabled, subelements, true);
}

function ContextEntry(key: string, icon: ReactNode, label: ReactNode, action: null|undefined|(()=>any),
                        keycodes: Key[], disabled: boolean = false, subelements: ReactNode[] = [], isSubElement: boolean = false,
                        opts: { tooltip?: string; danger?: boolean } = {}) {
    subelements = subelements?.filter(e=>!!e) || [];
    if (!keycodes) keycodes = [];
    const { tooltip, danger } = opts;

    let className = 'col item';
    if (subelements.length) className += ' hoverable';
    if (disabled) className += ' disabled';
    if (danger) className += ' danger';

    // @ts-ignore
    let ret = <div key={key} disabled={disabled} className={className} tabIndex={disabled ? -1 : 0}
                   aria-disabled={disabled || undefined} title={tooltip}
                   onClick={(e) => {
        e.stopPropagation();
        if (disabled) return false;

        let ret: any = undefined;
        if (action) try { ret = action(); } catch (e) { Log.eDevv('Error in ctxmenu default action', {label, action, e}); }
        else ret = false;
        // console.log('ctx action', {action, ret});
        if (U.isPromise(ret)) (ret as Promise<any>).then(
            ret => { if (ret !== false) closefunc(); },
            reason=>{  Log.ee('Error in Contextmenu user action', {reason, label}); }
        );
        else if (ret !== false) closefunc();
        return false;
    }}>
        {typeof icon === "string" ? <span className={'my-auto'} style={{alignContent: 'center'}}>{icon}</span> : icon}
        <span className={'my-auto ms-2'}>{label}</span>
        <div className={'mx-auto'}/>
        {subelements.length>0&& <div className={'my-auto ms-2'}><i className={'bi bi-chevron-right'}
                                     style={{fontSize: '0.75em', float: 'right', paddingTop: '2px', fontWeight: '800'}}/></div>}
        {subelements.length>0 && <section className={'round content right'} onContextMenu={(e) => e.preventDefault()}>
            <section className={'right context-menu'}>{
                subelements//.map(e => e)
            }
            </section>
        </section>}
    </div>;
    if (!isSubElement) jsxList.push(ret);
    return ret;
}

let hri = 0;

function separator() {
    jsxList.push(<hr key={'sep' + hri++} className={'my-1'}/>);
}
let closefunc: (panelClick?: boolean)=>void = null as any;

function test(){
    /*let data: any = null, View: any = null, Input: any = null as any, view: any, decorators: any;
    L.from(s().viewelements).filter(v=>v.name === "View for Product")[0].onDataUpdate = (
`let oldQt = data.state.oldQuantity, qt= +data.$quantity;
// console.log("check qt", {n: data.name, qt, oldQt, cc:data.clonedCounter});
if (oldQt === undefined) { data.state = {oldQuantity: qt, editN:data.clonedCounter}; return; }
if (oldQt / qt > 2 || oldQt / qt <= 0.5) {
    if (data.state.editN !== data.clonedCounter) { data.state = {requiresValidation: false, oldQuantity: qt, editN: data.clonedCounter}; }
    else { data.state = {requiresValidation: true, editN: data.clonedNumber}; }
}`)*/
}

function ContextMenuComponentInner(props: AllProps) {
    // const project = user.project as LProject;
    // const display = props.display;
    // const position = props.position;
    const [memorec, setMemorec] = useStateIfMounted<{ data: GObject[], type: 'class' | 'package' } | null>(null);
    const [display, setDisplay] = useStateIfMounted<null | {
        nodeid: Pointer<DGraphElement>,
        x: number,
        y: number
    }>(null);
    const [suggestedName, setSuggestedName] = useStateIfMounted('');
    const [childrenMenu, setChildrenMenu] = useStateIfMounted(false);
    const [editPanel, setEditPanel] = useStateIfMounted(false);
    //if (!contextMenuMap[props.graph]) {// NB: do not cache/initialize only once, otherwise closure will not update nodeid, x and y
    contextMenuMap[props.graph] = (nodeid: Pointer<DGraphElement>, x: number, y: number)=> {
        // console.log('ShowContextMenu', {graph:props.graph, nodeid, x, y, display} );
        if (display && (nodeid === display.nodeid && x === display.x && y === display.y)) return;
        setDisplay({nodeid, x, y});
    };


    if (!display) return <div className=" context-menu" id={"ctxhidden"} style={{display: "none"}}/>;
    jsxList = [];

    const nodeid = display.nodeid;
    const node: LGraphElement = L.fromPointer(nodeid);
    if (!node) return null;
    const data: LNamedElement | undefined = node.model as LNamedElement;
    // let ldata: LNamedElement = data as LNamedElement;
    // let ddata: DNamedElement = ldata?.__raw as DNamedElement;
    let ldata = data
    let ddata = ldata?.__raw;
    let model = ldata?.model;
    let isM2: boolean = model?.isMetamodel;
    let cname = ddata?.className;

    const close = (panelClick?: boolean) => {
        console.error('close ctx');
        if (!display) return;
        setSuggestedName('');
        setMemorec(null);
        // SetRootFieldAction.new('contextMenu', {display: false, x: 0, y: 0});
        setDisplay(null);
        setChildrenMenu(false);
        if (!panelClick) setEditPanel(false);
        // TRANSACTION('close context menu', ()=>{ })
    }
    closefunc = close;

    function updateRef(ref: Element | null) {
        if (!ref || oldRef === ref) return;
        if (oldRef) U.clickedOutside(oldRef, undefined); // remove old callback
        U.clickedOutside(ref, ()=>close()); // register new
        oldRef = ref;
    }

    const structuralFeature = async () => {
        ldata && setMemorec(await MemoRec.structuralFeature(ldata));
    }

    const classifier = async() => {
        ldata && setMemorec(await MemoRec.classifier(ldata));
    }

    const suggestOnClass = (isAttribute:boolean) => {
        if (!ldata) close();
        const lClass: LClass = (ldata as LClass);
        if (isAttribute) lClass.addAttribute(suggestedName);
        else lClass.addReference(suggestedName);
        close();
    }

    const suggestOnPackage = () => { ldata && (ldata as LPackage).addClass(suggestedName); close(); }

    /* Handling the add of composition children to specific M1 Object */
    const getAddChildren = (l:LValue | undefined, model: LModel, out: LClass[] = []): ReactNode => {
        if (!l) return [];
        const lref = l.instanceof as LReference;
        if (!lref) return [];
        let dref = lref.__raw;
        if (dref.className !== 'DReference') return [];
        if (!(dref.aggregation || dref.composition)) return [];
        let values: any[] = l.values;
        if (dref.upperBound !== -1 && values.filter(o=>!!o).length >= dref.upperBound) return [];
        let type = lref.type;
        out = [type, ...type.allSubClasses].filter(e=>!!e);
        out = U.proxyDeduplicator(out);

        // After LValue.addObject creates a containment child, the v2-flow graph
        // has no DVertex/DEdge for it (LValue.addObject sets father=LValue, the
        // child is NOT in model.objects, no graph artifacts are created). The
        // classic editor reads from parent.$ref.values directly and is unaffected;
        // the flow editor (useJjomSync) keys off graph.subElements and so does
        // not see the new child without explicit help. Bridge that gap here.
        const syncChildToFlow = (child: LObject | undefined): void => {
            if (!child || !model?.id || !lref?.name) return;
            const parent = (l as any).father as LObject | undefined;
            if (!parent?.id) return;
            const state = store.getState();
            const graphIds: string[] = (state as any).graphs ?? [];
            let graphId: string | null = null;
            for (const id of graphIds) {
                const g = state.idlookup?.[id] as any;
                if (g?.model === model.id && g.graphStyle === 'v2-flow') { graphId = id; break; }
            }
            if (!graphId) return; // no v2-flow graph yet; useJjomSync will create later
            // Best-effort layout: cascade from parent vertex if found
            let x = 0, y = 0;
            const dGraph = state.idlookup?.[graphId] as any;
            const subEls: string[] = dGraph?.subElements ?? [];
            for (const id of subEls) {
                const ge = state.idlookup?.[id] as any;
                if (ge?.className === 'DVertex' && ge.model === parent.id) {
                    x = (ge.x ?? 0) + (ge.w ?? 200) + 80;
                    y = (ge.y ?? 0);
                    break;
                }
            }
            createVertexForObject(graphId, child.id, x, y);
            createCompositionEdgeForObjects(graphId, parent.id, child.id, lref.name);
        };

        let jsxret: ReactNode;
        // console.log('contextmenu add options', {out, sc: type.allSubClasses, type});
        if (out.length === 1) {
            let name = out[0].name;
            jsxret = <Tooltip tooltip={'add to "' + lref.name + '" reference'}><div key={'single_' + l.id} onClick={() => {
                close();
                const child = l.addObject({}, out[0]) as LObject;
                syncChildToFlow(child);
            }}
                         className={'col item'} tabIndex={0}>{icon['add']} Add {name}</div></Tooltip>
        } else jsxret = <div key={'multi' + l.id} onClick={() => setChildrenMenu(!childrenMenu) }
                             tabIndex={0} className={'col item submenu-holder hoverable'}>
            {icon['add']} Add <div style={{position: 'absolute', right: '0'}}>{icon['submenu']}</div>
            {childrenMenu && <section className={'round content right'} style={{/*top: position.y - 216, left: position.x - 333*/}} onContextMenu={(e)=>e.preventDefault()}>
                <ul className={'right context-menu'}>
                    {out.map(lc => { let lcname = lc.name;  return (
                        lc.instantiable && <li key={lcname} onClick={() => {
                            close();
                            setChildrenMenu(false);
                            const child = l.addObject({}, lc);
                            l.values = [...(l.values as LObject[]), child];
                            syncChildToFlow(child as LObject);
                        }} className={'col item'} tabIndex={0}>
                            <Tooltip tooltip={'add to "'+ lref.name+'" reference'}><span>{lcname}</span></Tooltip>
                        </li>)}
                    )}
                </ul>
            </section>}
        </div>;
        return jsxret;
    }


    if (display) {
        // ─── (1) Add Child (M1: DObject/DValue) ───
        if (cname === 'DObject') {
            let out: any[] = [];
            let children = (ldata as LObject).features.map(feat=>getAddChildren(feat, model as any, out)).filter(e => !(Array.isArray(e) && e.length === 0));
            if (!Array.isArray(children) || children.length > 0) {
                jsxList.push(...children);
                separator();
            }
        }
        if (cname === 'DValue') {
            let out: any[] = [];
            let children = getAddChildren(ldata as any as LValue, model as any, out);
            if (!Array.isArray(children) || children.length > 0) {
                jsxList.push(children);
                separator();
            }
        }

        // ─── (2) Edit · Duplicate · Delete ───
        ContextEntry('edit', icon['edit'], 'Edit', () => setEditPanel(true) as undefined, []);
        ContextEntry('duplicate', <i className="bi bi-copy" />, 'Duplicate', null, [], true,
            [], false, { tooltip: 'Coming soon' });
        let cannotDelete = !!(ddata?.className === 'DValue' && (ddata as any as DValue).instanceof);
        ContextEntry('delete', <i className="bi bi-trash" />, 'Delete', key_bindings.delete.function,
            [], cannotDelete, [], false, { danger: true });
        separator();

        // ─── (3) Up · Down ───
        ContextEntry('up', icon['up'], 'Up', key_bindings.up.function, []);
        ContextEntry('down', icon['down'], 'Down', key_bindings.down.function, []);
        separator();

        // ─── (4) Disable / Restore auto-sizing ───
        let gn = node as GObject;
        // keep function {wrapped}, cannot return false or it disables triggering close event.
        if (gn.isResized) ContextEntry('asize', icon['contract'], 'Restore auto-sizing', () => {gn.isResized = false; /*read above*/}, []);
        else ContextEntry('nasize', icon['expand'], 'Disable auto-sizing', () => {gn.isResized = true}, []);
        separator();

        // ─── (5) Help · Explain this · Create View ───
        ContextEntry('help', <i className='bi bi-question-circle' />, 'Help', () => {
            let cn = ddata?.className;
            let helpKey: string = '';
            if (!cn) helpKey = 'properties-panel';
            if (cn) {
                cn = cn.toLowerCase();
                if (cn.includes('enum')) helpKey = 'element-enum';
                else helpKey = 'element-' + cn.substring(1);
            }
            window.dispatchEvent(new CustomEvent(JjodelEvents.HELP_OPEN, { detail: { helpKey } }));
            close();
        }, []);

        ContextEntry('explain', <i className='bi bi-stars' />, 'Explain this', () => {
            const elementName = (ldata as any)?.name ?? 'Unknown';
            const cn = ddata?.className;
            const elementType =
                cn === 'DClass'       ? 'Class'
              : cn === 'DEnumerator'  ? 'Enum'
              : cn === 'DPackage'     ? 'Package'
              : cn === 'DObject'      ? 'Object'
              : cn === 'DAttribute'   ? 'Attribute'
              : cn === 'DReference'   ? 'Reference'
              : cn === 'DOperation'   ? 'Operation'
              : 'Element';
            const metamodelName = (model as any)?.name ?? 'Unknown';
            const properties: Record<string, any> = {};
            const dany = ddata as any;
            if (dany?.isAbstract) properties.isAbstract = true;
            if (dany?.isSingleton) properties.isSingleton = true;
            window.dispatchEvent(new CustomEvent(JjodelEvents.EXPLAIN_OPEN, {
                detail: { elementName, elementType, metamodelName, properties },
            }));
            close();
        }, []);

        // Create View — only for M2 classifiers (classNode/enumNode equivalents). Advanced mode only.
        if (isAdvancedMode() && isM2 && (cname === 'DModel' || cname === 'DClass' || cname === 'DPackage')) {
            const hasWorkbenchVP = !!getLastEditedViewpointId();
            ContextEntry('createview', <i className="bi bi-eye" />,
                hasWorkbenchVP ? 'Create View' : 'Create View — open a viewpoint first',
                hasWorkbenchVP ? addViewToWorkbench : null,
                [], !hasWorkbenchVP);
        }

        // ─── Classic-only section ───
        // Features specific to the classic editor: dynamic entries (view-script-defined),
        // AI Suggest (M2 ML recommendations), Extend (M2 inheritance drag), Analytics
        // (metamodel metrics), Add view (M2 view creation).
        let preClassicOnlyLen = jsxList.length;
        addDynamicEntries(jsxList, nodeid, data, node);

        if (isAdvancedMode() && ddata && !U.isOffline()) {
            if (ddata.className === 'DClass') {
                jsxList.push(<div key='ai-c' onClick={structuralFeature} className={'col item'} tabIndex={0}>
                    {icon['ai']}
                    <span className={'my-auto ms-2'}>AI Suggest</span>
                    <div className='d-flex ms-auto'>
                        <i className='ms-1 bi bi-chevron-right my-auto' style={{fontSize: '0.75em', float: 'right', paddingTop: '2px', fontWeight: '800'}} />
                    </div>
                </div>);
            }
            if (ddata.className === 'DPackage') {
                jsxList.push(<div key='ai-p' onClick={classifier} className={'col item'} tabIndex={0}>
                    {icon['ai']}
                    <span className={'my-auto ms-2'}>AI Suggest</span>
                    <div className='d-flex'>
                        <i className='ms-1 bi bi-chevron-right my-auto' style={{fontSize: '0.75em', float: 'right', paddingTop: '2px', fontWeight: '800'}} />
                    </div>
                </div>);
            }
        }

        if (ddata?.className === 'DClass') {
            ContextEntry('ext', icon['extend'], 'Extend', key_bindings.extend.function, []);
        }

        if (isAdvancedMode() && ldata && model?.isMetamodel) {
            ContextEntry('analytic', icon['metrics'], 'Analytics', key_bindings.metrics.function, []);
        }

        if (isAdvancedMode() && isM2 && (cname === 'DModel' || cname === 'DClass' || cname === 'DPackage' || cname === 'DAttribute' || cname === 'DReference')) {
            const hasWorkbenchVP = !!getLastEditedViewpointId();
            ContextEntry('view+m2', icon['add'],
                hasWorkbenchVP ? 'Add view' : 'Add view — open a viewpoint first',
                hasWorkbenchVP ? addViewInstances : null,
                [], !hasWorkbenchVP);
        } else if (isAdvancedMode() && !isM2) {
            ContextEntry('view+', icon['add'], 'Add view', addViewSelf, []);
        }

        // Insert a divider before the classic-only section if any item was added,
        // separating it from the unified group above.
        if (jsxList.length > preClassicOnlyLen) {
            jsxList.splice(preClassicOnlyLen, 0, <hr key={'sep' + hri++} className={'my-1'}/>);
        }
    }

    /*const edit_x = data.node?.x || 0;
    const edit_y = data.node?.y || 0;
    const edit_w = data.node?.w || 0;*/

    let rootStyle: GObject = {top: display.y - 100, left: display.x - 10};
    // let rootStyle = {top: editPanel? edit_y - 2: display.y - 100, left: editPanel? edit_x + edit_w + 10 : display.x - 10};

    return (
        <div className={'round' + (editPanel ? ' edit-panel-container' : ' context-menu')}
             style={rootStyle}
             onContextMenu={(e) => e.preventDefault()} ref={updateRef}>
            {editPanel ? <>
                    <div className={'edit-panel'}>
                        <Info mode={'popup'}/>
                    </div>
                    <div className={'dialog-footer'}>
                        <button onClick={() => close()}>Close</button>
                    </div>
                </>
                :

                <>
               {jsxList/*.map((jsx, index) => {return <li key={index}>{jsx}</li>})*/}
                {/* Memorec */}

                {(data && memorec?.data) && <div className={'context-menu round'} style={{overflow: 'auto', maxHeight: '12em', top: display.y - 100, left: display.x + 130}}>
                    {(memorec.data.map((obj, index) => {
                        return (<div key={index}>
                            <div className={'col item d-block'} onClick={e => setSuggestedName(obj.recommendedItem)} tabIndex={0}>
                                {obj.recommendedItem} :
                                <span className={'ms-1 text-primary'}>{Math.round(obj.score * 100) / 100}</span>
                            </div>
                        </div>)
                    }))}
                </div>}

                {(memorec && suggestedName) && <div className={'memorec-overlay'}>
                    <div tabIndex={-1} onBlur={e => close()} className={'memorec-popup'}>
                        <div className={'d-block text-center mb-1'}>Add <b>{suggestedName}</b> as:</div>
                        {(memorec.type === 'class') ? <>
                                <div tabIndex={-1} onClick={e =>suggestOnClass(true)} className={'d-flex memorec-button'}>
                                    <ModellingIcon className={'my-auto'} name={'attribute'} /> Attribute
                                </div>
                                <div tabIndex={-1} onClick={e =>suggestOnClass(false)} className={'d-flex memorec-button mt-1'}>
                                    <ModellingIcon className={'my-auto'} name={'reference'} /> Reference
                                </div>
                            </> :
                            <div tabIndex={-1} onClick={e =>suggestOnPackage()} className={'d-flex memorec-button mt-1'}>
                                <ModellingIcon className={'my-auto'} name={'class'} /> Class
                            </div>
                        }
                        <div className={'d-flex memorec-button mt-3'} tabIndex={-1} onClick={e => close()}>
                            <span className={'mx-auto text-danger'}>Close</span>
                        </div>
                    </div>
                </div>}
            </>}
        </div>);
}

/*************** keybindings events *****************/
function getSelected(): {s: DState} & Partial<DState['_lastSelected']> {
    let s: DState = store.getState();
    return {s, ...(s._lastSelected || {})};
}

function addViewSelf() {
    let {modelElement: dataid, node: nodeid} = getSelected();
    let ddata = dataid && D.fromPointer(dataid);
    if (ddata) DViewElement.newDefault(ddata as DNamedElement || undefined, true);
    else {
        let dnode = nodeid && D.fromPointer(nodeid);
        if (dnode) DViewElement.newDefault(dnode, true);
    }
    key_bindings.close.function();
}
const addViewInstances = () => {
    let {modelElement: dataid, node: nodeid} = getSelected();
    let ddata = dataid && D.fromPointer(dataid);
    if (ddata) DViewElement.newDefault(ddata, false);
    else {
        let dnode = nodeid && D.fromPointer(nodeid);
        if (dnode) DViewElement.newDefault(dnode, false);
    }
    key_bindings.close.function();
}

function addViewToWorkbench() {
    let {modelElement: dataid} = getSelected();
    let ddata = dataid && D.fromPointer(dataid);
    if (!ddata) return;

    const cn = ddata.className;
    const elementName = (ddata as any).name || 'unnamed';
    createViewInWorkbench(ddata.id, elementName, cn);
    key_bindings.close.function();
}

function addViewKeybind() {
    let {modelElement: dataid, node: nodeid} = getSelected();
    let ddata = dataid && D.fromPointer(dataid);
    let cname = ddata?.className;
    if (cname === 'DModel' || cname === 'DClass' || cname === 'DPackage' || cname === 'DAttribute' || cname === 'DReference') addViewInstances();
    else addViewSelf();
}


/*************** keybindings registration *****************/

let key_bindings: Dictionary<string, KeyBind> = {};
// todo: populate key_bindings statically, because ctxmenu content is dynamicKeystrokes

class KeyBind {
    public function: ()=>any;
    public keystroke: Key[];
    constructor(f: KeyBind['function'], k: KeyBind['keystroke']) {
        this.function = f;
        this.keystroke = k;
    }
}
key_bindings.addView = new KeyBind(addViewKeybind, [Keystrokes.ctrl, Keystrokes.alt, 'V']);
key_bindings.metrics = new KeyBind(toggleMetrics as any, [Keystrokes.ctrl, Keystrokes.alt, 'B']);
key_bindings.close = new KeyBind(()=>closefunc(), [Keystrokes.escape]);

key_bindings.asize = new KeyBind(
    () => {
        let {node} = getSelected();
        let lnode = node && L.from(node) as GObject;
        if (lnode && 'isResized' in lnode) lnode.isResized = !lnode.isResized;
    }, [Keystrokes.ctrl, 'T']);
key_bindings.extend = new KeyBind(
    () => {
        let {modelElement} = getSelected();
        let source = modelElement && L.from(modelElement);
        if (!source || source.className !== 'DClass') return;
        TRANSACTION('Extend class', () => SetRootFieldAction.new('isEdgePending', {user: DUser.current, source: modelElement}));
    }, [Keystrokes.ctrl, 'E']);
key_bindings.delete = new KeyBind(
    () => {
        let {modelElement, node} = getSelected();
        let ldata = modelElement && L.from(modelElement);
        let lnode = node && L.from(node);
        if (ldata) ldata.delete();
        else lnode?.delete();
    }, [Keystrokes.ctrl, Keystrokes.backspace]);
key_bindings.up = new KeyBind(
    () => {
        let {node} = getSelected();
        let lnode = node && L.from(node) as LGraphElement;
        if (lnode) lnode.zIndex += 1;
    }, [Keystrokes.ctrl, Keystrokes.up]);
key_bindings.down = new KeyBind(
    () => {
        let {node} = getSelected();
        let lnode = node && L.from(node) as LGraphElement;
        if (lnode) lnode.zIndex -= 1;
    }, [Keystrokes.ctrl, Keystrokes.down]);

// let hasRegistered: boolean = false;
function registerKeystrokes() {
    if (!windoww.$) {
        setTimeout(registerKeystrokes, 100);
        return;
    }
    Keystrokes.register('#root', 'ctxmenu', Object.values(key_bindings));
    // hasRegistered = true;
}
setTimeout(registerKeystrokes, 1);




/*************** component registration *****************/

interface OwnProps {
    graph: Pointer<DGraph>
}
interface StateProps {
    /*user: LUser,
    display: boolean,
    position: {x: number, y: number},
    node: LGraphElement|null*/
}

interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


/*
function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(DUser.current);
    // ret.display = state.contextMenu.display;
    // ret.position = {x: state.contextMenu.x, y: state.contextMenu.y};

    const nodeid = state.contextMenu.nodeid; //state._lastSelected?.node;
    if (nodeid) ret.node = LGraphElement.fromPointer(nodeid);
    else ret.node = null;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const ContextMenuConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ContextMenuComponent);

export const ContextMenu = (props: OwnProps, childrens: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <ContextMenuConnected {...{...props, childrens}} />;
}*/
export const ContextMenu = ContextMenuComponent;
export default ContextMenu;
