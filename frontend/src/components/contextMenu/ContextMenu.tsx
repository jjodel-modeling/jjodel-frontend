import React, {Dispatch, ReactElement, ReactNode, useRef} from 'react';
import {connect} from 'react-redux';
import './style.scss';
import {SetRootFieldAction, TRANSACTION} from '../../redux/action/action';
import {
    DClass, DGraph, DGraphElement, Dictionary,
    DNamedElement,
    DState,
    DUser, DV,
    DValue,
    DViewElement,
    GObject, GraphElementComponent, L,
    LClass,
    LGraphElement, LModel, LModelElement,
    LNamedElement,
    LObject, Log,
    LPackage,
    LProject, LReference, LStructuralFeature,
    LUser,
    LValue,
    Pointer, transientProperties,
    U,
    windoww,
} from '../../joiner';
import MemoRec from '../../api/memorec';
import {useStateIfMounted} from 'use-state-if-mounted';
import ModellingIcon from "../forEndUser/ModellingIcon";
import {FakeStateProps} from "../../joiner/types";
import {toggleMetrics} from '../metrics/Metrics';
import {icon} from '../../pages/components/icons/Icons';
import {Tooltip} from "../forEndUser/Tooltip";
import { Info } from '../editors';
import { Btn, CommandBar } from '../commandbar/CommandBar';
import { createPortal } from 'react-dom';
import { Logo } from '../logo';
import { forEach } from 'lodash';

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
    // console.log('ShowContextMenu', {nodeid, x, y, html, graphid} );
    if (!graphid) { Log.eDevv('contextmenu graph not found', {nodeid, graphid}); return; }
    contextMenuMap[graphid]?.(nodeid, x, y);
}

let contextMenuMap: Dictionary<Pointer<DGraph>, (nodeid: Pointer<DGraphElement>, x: number, y: number)=>void> = {};
windoww.ShowContextMenu = ShowContextMenu;
windoww.contextMenuMap = contextMenuMap;
function addDynamicEntries(jsxList: ReactNode[], nodeid: Pointer<DGraphElement>, data: LModelElement | undefined, node: LGraphElement){
    let tn = transientProperties.node[nodeid];
    if (!tn.contextMenu?.length) return;
    let i = -1;
    let labelsMap: Dictionary<string, true> = {}
    // aad custom user entries
    for (let ctx of tn.contextMenu) {
        i++;
        let ico = ctx.ico;
        if (!ico) ico = 'bi bi-person-gear';
        else if (typeof ico === 'string') {
            ico = ' ' + ico + ' '; // to simplify code in next line " bi " so i allow it at string end, but not as beginning of another string like "bisect"
            if ((ico as string).includes(' bi-') && !(ico as string).includes(" bi ")) ico = "bi " + ico;
            ico = (ico as string).trim();
        } else {
            if (!React.isValidElement(ico)) ico = 'bi bi-user';
        }
        let label = ctx.label;
        let labelJSX = ctx.labelJSX;
        if (!label || typeof "label" !== "string") { label = ctx.path || 'Unnamed user action' + (tn.contextMenu.length > 1 ? ' '+i : ''); }
        if (!labelJSX || !React.isValidElement(labelJSX)) { labelJSX = null; }

        let action = () => {
            if (!ctx.action || typeof ctx.action !== 'function') return null;
            try { ctx.action(data || null, node); }
            catch (e) {
                Log.ee("Error during user-defined contextmenu action", {e, label, ctx})
            }
        }
        let hasSubTree = true;
        jsxList.push(
            <div key={label} onClick={action} className={'col item'} tabIndex={0}>
                {typeof (ico as unknown) !== 'string' ? ico : <i className={ico as string} />}
                {labelJSX || label}
                {hasSubTree && <div>
                    <i className={'bi bi-chevron-right'} style={{fontSize: '0.75em', float: 'right', paddingTop: '2px', fontWeight: '800'}}/>
                </div>}
            </div>
        );
    }
    separator();
}
let jsxList: ReactNode[] = [];
function ContextEntry(key:string, icon: ReactNode, label: ReactNode, action: null|undefined|(()=>boolean|undefined|Promise<any>),
                        keycodes: ReactNode, disabled: boolean = false) {
    // @ts-ignore
    jsxList.push(<div key={key} disabled={disabled} className={'col item'} tabIndex={0} onClick={async() => {
        let ret = action ? action() : false;
        if (U.isPromise(ret)) ret = await ret;
        if (ret !== false) close(); }}>
        <span className={'my-auto'}>{icon}</span>
        <span className={'my-auto'}>{label}</span>
        <div>{keycodes}</div>
    </div>);
}
let hri = 0;
function separator(){
    jsxList.push(<hr key={'sep'+hri++} className={'my-1'} />);
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


    if (!display) return null;
    jsxList = [];

    const nodeid = display.nodeid;
    const node: LGraphElement = L.fromPointer(nodeid);
    if (!node) return null;
    const data: LNamedElement | undefined = node.model as LNamedElement;
    let hri: number = 0;
    // let ldata: LNamedElement = data as LNamedElement;
    // let ddata: DNamedElement = ldata?.__raw as DNamedElement;
    let ldata = data
    let ddata = ldata?.__raw;
    let model = ldata?.model;
    let isM2: boolean = model?.isMetamodel;
    let cname = ddata?.className;

    const close = (panelClick?: boolean) => {
        if (!display) return;
        setSuggestedName('');
        setMemorec(null);
        // SetRootFieldAction.new('contextMenu', {display: false, x: 0, y: 0});
        setDisplay(null);
        setChildrenMenu(false);
        if (!panelClick) setEditPanel(false);
        // TRANSACTION('close context menu', ()=>{ })
    }

    function updateRef(ref: Element | null) {
        if (!ref || oldRef === ref) return;
        if (oldRef) U.clickedOutside(oldRef, undefined); // remove old callback
        U.clickedOutside(ref, ()=>close()); // register new
        oldRef = ref;
    }

    const addViewSelf = () => {
        if (ddata) DViewElement.newDefault(ddata as DNamedElement || undefined);
        close();
    }
    const addViewInstances = () => {
        if (ddata) DViewElement.newDefault(ddata as DNamedElement || undefined);
        close();
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
        let jsxret: ReactNode;
        console.log('contextmenu add options', {out, sc: type.allSubClasses, type});
        if (out.length === 1) {
            let name = out[0].name;
            jsxret = <Tooltip tooltip={'add to "' + lref.name + '" reference'}><div key={'single_' + l.id} onClick={() => { close(); l.addObject({}, out[0]); }}
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
        if (ddata?.name) {
            let lname = (ldata as LNamedElement).name;
            {/* if (ldata && model?.isMetamodel) {
                jsxList.push(<div key={lname} className={'col name'} style={{fontSize: '0.9rem', paddingLeft: '12px', fontWeight: '300'}}>
                    {ddata.className.substring(1)}: <i>{lname}</i></div>);
            } else {
                jsxList.push(<div key={lname} className={'col name'} style={{fontSize: '0.9rem', paddingLeft: '12px', fontWeight: '300'}}>
                    <i>{[ldata?.father?.name, lname].join('.')}</i></div>);
            }*/}

            if (ldata) {
                let meta = (ldata as LObject|LValue).instanceof;
                // header is different, keep it isolated
                jsxList.push(<div key={lname} className={'col name '+(isM2 ? 'meta' : '')+'model'}>
                    {((isM2 ? cname.substring(1) : (meta?.name || 'Shapeless')) + ': ') + lname}</div>);
            }
            separator();
        }
        addDynamicEntries(jsxList, nodeid, data, node);

        /* Edit button: only on models */

        if (true as any || !isM2 && cname !== 'DModel') {
            ContextEntry('edit', icon['edit'], 'Edit', () => setEditPanel(true) as undefined, null)
            separator();
        }

        /* Add children for Object */

        if (cname === 'DObject') {
            let out: any[] = [];
            let children = (ldata as LObject).features.map(feat=>getAddChildren(feat, model as any, out)).filter(e => !(Array.isArray(e) && e.length === 0));

            if (!Array.isArray(children) || children.length > 0) {
                jsxList.push(...children);
                separator();
            }
            /* @ts-ignore */
            // if (children[1]['$$typeof'] !== undefined) jsxList.push(<hr key={hri++} className={'my-1'}/>);
        }

        if (cname === 'DValue') {
            let out: any[] = [];
            let children = getAddChildren(ldata as any as LValue, model as any, out);
            if (!Array.isArray(children) || children.length > 0) {
                jsxList.push(children);
                separator();
            }
        }

        /* Memorec */

        if(ddata && !U.isOffline()) {
            if(ddata.className === 'DClass') {
                // ContextEntry('ai-c', icon['ai'], 'AI suggest', structuralFeature)
                jsxList.push(<div key='ai-c' onClick={structuralFeature} className={'col item'} tabIndex={0}>
                    <span className={'my-auto'}>{icon['ai']}</span>
                    <span className={'my-auto'}>AI Suggest</span>
                    <div className='d-flex'>
                        <i className='ms-1 bi bi-chevron-right my-auto' style={{fontSize: '0.75em', float: 'right', paddingTop: '2px', fontWeight: '800'}} />
                    </div>
                </div>);
                separator();
            }
            if(ddata.className === 'DPackage') {
                jsxList.push(<div key='ai-p' onClick={classifier} className={'col item'} tabIndex={0}>
                    <span className={'my-auto'}>{icon['ai']}</span>
                    <span className={'my-auto'}>AI Suggest</span>
                    <div className='d-flex'>
                        <i className='ms-1 bi bi-chevron-right my-auto' style={{fontSize: '0.75em', float: 'right', paddingTop: '2px', fontWeight: '800'}} />
                    </div>
                </div>);
                separator();
            }
        }

            /* Extend */

            switch (ddata?.className) {
                default:
                case undefined:
                    break;
                //case 'DValue': if ((ldata as any as LValue).instanceof) jsxList.pop(); ???? break;
            case 'DClass':

                ContextEntry('ext', icon['extend'], 'Extend',
                    () => TRANSACTION('Extend class', () => SetRootFieldAction.new('isEdgePending', {
                        user: DUser.current,
                        source: (ddata as any).id
                    })),
                    <div><i className='bi bi-command'/> E</div>);
                separator();
                break;
        }


        /* View-specific menu entry */

        if (node.view.state.contextualEntries) {
            for (const key in node.view.state.contextualEntries) {
                ContextEntry(key,
                    node.view.state.contextualEntries[key].icon ? <i className={'bi '+node.view.state.contextualEntries[key].icon} /> : <span className={'empty'}/>,
                    key, () => node.view.state.contextualEntries[key].action(data, node), null)
            }
            separator();
        }


        /* Deselect */
        /*
        jsxList.push(<div key='-select' onClick={() => {
            close();
            SetRootFieldAction.new(`selected.${DUser.current}`, '', '', false);
        }} className={'col item'} tabIndex={0}>{icon['deselect']} Deselect</div>);*/
        //jsxList.push(<hr key={hri++} className={'my-1'} />);




        /* Delete */
        let cannotDelete = !!(ddata?.className === 'DValue' && (ddata as any as DValue).instanceof);
        ContextEntry('delete', icon['delete'], 'Delete', () => {
                    if (cannotDelete) return false;
                    close();
                    if (ldata) ldata.delete();
                    else node.delete();
                    // if there is data, then the node is indirectly deleted, no need to call it too.
                },
            <div>
                <i className='bi bi-backspace' style={{fontSize: '1em', float: 'right', paddingTop: '2px', fontWeight: '800'}}/>
            </div>, cannotDelete
            );
        separator();
        
        /* Refresh */

        // jsxList.push(<div onClick={() => {alert('refresh')}} className={'col item'} tabIndex={0}>{icon['refresh']} Refresh</div>);
        // jsxList.push(<hr key={hri++} className={'my-1'} />);

        /* Up / Down */
        ContextEntry('up', icon['up'], 'Up',
            ()=> TRANSACTION('move node up (z-axis)', () => node.zIndex += 1),
                <div><i className='bi bi-command'/><i className="bi bi-arrow-up"/></div>);
        ContextEntry('down', icon['down'], 'Down',
            ()=> TRANSACTION('move node down (z-axis)', () => node.zIndex -= 1),
                <div><i className='bi bi-command'/><i className="bi bi-arrow-down"/></div>);
        separator();
        
        /* AUTO-SIZING */
        let gn = node as GObject;
        if (gn.isResized) ContextEntry('asize', icon['contract'], 'Restore auto-sizing',
            () => gn.isResized = false,
            <div><i className='bi bi-command'></i> T</div>)
        else ContextEntry('nasize', icon['expand'], 'Disable auto-sizing',
            () => gn.isResized = true,
            <div><i className='bi bi-command'></i> T</div>)
        
        // /* LOCK-UNLOCK */
        // jsxList.push(<div onClick={() => {close(); ldata.delete(); /*node.delete();*/}} className={'col item'} tabIndex={0}>{icon['lock']} Lock/Unlock<div> <i
        //     className='bi bi-command'></i> L</div></div>);
        // /* UNLOCK ALL ELEMENTS */
        // jsxList.push(<div onClick={() => {close(); ldata.delete(); /* node.delete();*/}} className={'col item'} tabIndex={0}>
        //     {icon['unlock']} Unlock all<div><i className="bi bi-alt"></i> <i className='bi bi-command'></i> L</div>
        // </div>);

        separator();
        
        /* Analytics */
        if (ldata && model?.isMetamodel) {
            ContextEntry('analytic', icon['metrics'], 'Analytics', toggleMetrics as any, <div><i className='bi bi-command' /> A</div>);
            separator();
        }


        /* ADD VIEW */
        if (isM2 && cname !== 'DEnumerator' && cname !== 'DEnumLiteral' && cname !== 'DOperation' && cname !== 'DParameter' && cname !== 'DAnnotation') {
            ContextEntry('view+m2', icon['add'], 'Add view', null, null, false, [
                SubEntry('own', 'For this '+(data?.className || 'DElement').substring(1), addViewSelf),
                SubEntry('instance', 'For his instances', addViewInstances, )]
            )
            jsxList.push(<div key={'view+ m2'} tabIndex={0} className={'col item submenu-holder hoverable'}>
                {icon['add']} Add view <div style={{position: 'absolute', right: '0'}}>{icon['submenu']}</div>
                <section className={'round content right'} onContextMenu={(e) => e.preventDefault()}>
                    <ul className={'right context-menu'}>
                        <li onClick={() => { close(); addViewSelf(); }} className={'col item'} tabIndex={0}>
                            <span>For this {(data?.className || 'DElement').substring(1)}</span>
                        </li>
                        <li onClick={() => { close(); addViewInstances(); }} className={'col item'} tabIndex={0}>
                            <span>For his instances</span>
                        </li>
                    </ul>
                </section>
            </div>);
        } else jsxList.push(
            <div key='view+' onClick={async () => {
                close();
                addViewInstances();
            }} className={'col item'} tabIndex={0}>{icon['view']} Add View
                <div><i className='bi bi-alt'/> <i className='bi bi-command'/> A</div>
            </div>);
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
