import React, {Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import './style.scss';
import {SetRootFieldAction} from '../../redux/action/action';
import {
    DClass,
    DNamedElement,
    DState,
    DUser,
    DValue,
    DViewElement,
    GObject,
    LClass,
    LGraphElement, LModel,
    LNamedElement,
    LObject,
    LPackage,
    LProject, LReference,
    LUser,
    LValue,
    U,
    windoww,
} from '../../joiner';
import MemoRec from '../../api/memorec';
import {useStateIfMounted} from 'use-state-if-mounted';
import ModellingIcon from "../forEndUser/ModellingIcon";
import {FakeStateProps} from "../../joiner/types";
import {toggleMetrics} from '../metrics/Metrics';
import {icon} from '../../pages/components/icons/Icons';

function ContextMenuComponent(props: AllProps) {
    const user = props.user;
    // const project = user.project as LProject;
    const display = props.display;
    const position = props.position;
    const node = props.node;
    const [memorec, setMemorec] = useStateIfMounted<{data:GObject[], type:'class'|'package'}|null>(null);
    const [suggestedName, setSuggestedName] = useStateIfMounted('');
    const [childrenMenu, setChildrenMenu] = useStateIfMounted(false);
    if (!node || !display) return(<></>);
    const data: LNamedElement | undefined = LNamedElement.fromPointer(node?.model?.id);
    let jsxList: ReactNode[] = [];

    let ldata: LNamedElement = data as LNamedElement;
    let ddata: DNamedElement = ldata?.__raw as DNamedElement;
    let model = ldata?.model;

    const close = () => {
        // if (!windoww.ContextMenuVisible) return;
        windoww.ContextMenuVisible = false;
        setSuggestedName('');
        setMemorec(null);
        SetRootFieldAction.new('contextMenu', {display: false, x: 0, y: 0});
        setChildrenMenu(false);
    }

    const addView = async() => {
        DViewElement.newDefault(ddata as DNamedElement || undefined);
        close();
    }

    const structuralFeature = async () => {
        setMemorec(await MemoRec.structuralFeature(ldata));
    }

    const classifier = async() => {
        setMemorec(await MemoRec.classifier(ldata));
    }

    const suggestOnClass = (isAttribute:boolean) => {
        const lClass: LClass = (ldata as LClass);
        if (isAttribute) lClass.addAttribute(suggestedName);
        else lClass.addReference(suggestedName);
        close();

    }
    const suggestOnPackage = () => { (ldata as LPackage).addClass(suggestedName); close(); }

    /* Handling the add of composition children to specific M1 Object */


    const getAddChildren = (l:LValue, model: LModel, out: LClass[] = []): ReactNode => {
        let d = l.__raw;
        const lref = l.instanceof as LReference;
        if (!lref) return [];
        let dref = lref.__raw;
        if (dref.className !== 'DReference') return [];
        if (!(dref.aggregation || dref.composition)) return [];
        let values: any[] = l.values;
        if (dref.upperBound !== -1 && values.filter(o=>!!o).length >= dref.upperBound) return [];
        let type = lref.type;
        out = [type, ...type.allSubClasses].filter(e=>!!e);
        let jsxret: ReactNode;
        if (out.length === 1) jsxret = <div onClick={() => { close(); l.addObject({}, out[0]); }} className={'col item'}>{icon['add']} Add {out[0].name}</div>
        else jsxret = <div onClick={(e) => { setChildrenMenu(!childrenMenu)}} className={'col item'}>
            {icon['add']} Add {icon['submenu']}
            {childrenMenu && <div className={'context-menu round submenu'} style={{top: position.y - 216, left: position.x - 333}} onContextMenu={(e)=>e.preventDefault()}>
                {out.map(lc =>
                    <div onClick={() => {
                        close();
                        setChildrenMenu(false);
                        const child = l.addObject({}, lc);
                        l.values = [...(l.values as LObject[]), child];
                    }} className={'col item'}>
                        {lc.name}
                    </div>
                )}
            </div>}
        </div>;
        return jsxret;
    }

    if (display) {


        if (ddata?.name) {
            if (ldata && model?.isMetamodel) {
                jsxList.push(<div className={'mt-1 col'} style={{fontSize: '0.9rem', paddingLeft: '12px', fontWeight: '300'}}>{ddata.className}: <i>{ldata.name}</i></div>);
            } else {
                jsxList.push(<div className={'mt-1 col'} style={{fontSize: '0.9rem', paddingLeft: '12px', fontWeight: '300'}}>{ldata.name}</div>);
            }
            jsxList.push(<hr className={'my-1'} />);
        }

        // if (ddata?.className === 'DObject') {
        //     jsxList.push(...(ldata as LObject).features.map(feat=>getAddChildren(feat, model, [])));
        //     jsxList.push(<hr className={'my-1'} />);
        // }

        if (ddata?.className === 'DObject') {
            let children = (ldata as LObject).features.map(feat=>getAddChildren(feat, model, []));
            jsxList.push(...(ldata as LObject).features.map(feat=>getAddChildren(feat, model, []))); 
            /* @ts-ignore */
            if (children[1]['$$typeof'] !== undefined) jsxList.push(<hr className={'my-1'}/>);
        }

        if (ddata?.className === 'DValue') {
            jsxList.push(getAddChildren(ldata as any as LValue, model, []));
            jsxList.push(<hr className={'my-1'}/>);
        }

        


        /* Memorec */
        if(ddata && !U.isOffline()) {
            if(ddata.className === 'DClass') {
                jsxList.push(<div onClick={structuralFeature} className={'col item'}>{icon['ai']} AI Suggest <i
                    className='bi bi-chevron-right' style={{fontSize: '0.75em', float: 'right', paddingTop: '2px', fontWeight: '800'}} /></div>);
                jsxList.push(<hr className={'my-1'} />);
            }
            if(ddata.className === 'DPackage') {
                jsxList.push(<div onClick={classifier} className={'col item'}>{icon['ai']} AI Suggest <i
                    className={'ms-1 bi bi-chevron-right'} style={{fontSize: '0.75em', float: 'right', paddingTop: '2px', fontWeight: '800'}} /></div>);
                jsxList.push(<hr className={'my-1'} />);
            }
        }

        /* Extend */
        switch (ddata.className) {
            default:
            case undefined: break;
            case 'DValue': if ((ldata as any as LValue).instanceof) jsxList.pop(); break;
            case 'DClass':
                jsxList.push(<div onClick={() => {
                    close();
                    SetRootFieldAction.new('isEdgePending', {user: user.id, source: ddata.id});
                }} className={'col item'}>{icon['extend']} Extend<div><i
                    className='bi bi-command'></i> E</div></div>);
                jsxList.push(<hr className={'my-1'} />);
                break;
        }

        /* Deselect */
        jsxList.push(<div onClick={() => {
            close();
            SetRootFieldAction.new(`selected.${DUser.current}`, '', '', false);
        }} className={'col item'}>{icon['deselect']} Deselect</div>);
        //jsxList.push(<hr className={'my-1'} />);

        
        /* Delete */
        jsxList.push(<div onClick={() => {
            close();
            console.log('delete ctxmenu', {data, node});
            if (ldata) ldata.delete();
            else node.delete();// if there is data, then the node is indirectly deleted, no need to call it too.
            //node.delete();
        }} className={'col item'}>{icon['delete']} Delete<i
            className='bi bi-backspace' style={{fontSize: '1em', float: 'right', paddingTop: '2px', fontWeight: '800'}} /></div>);
        jsxList.push(<hr className={'my-1'} />);
        
        /* Refresh */

        // jsxList.push(<div onClick={() => {alert('refresh')}} className={'col item'}>{icon['refresh']} Refresh</div>);
        // jsxList.push(<hr className={'my-1'} />);

        /* Up / Down */
        jsxList.push(<div onClick={() => {close(); node.zIndex += 1;}} className={'col item'}>{icon['up']} Up<div>
            <i className='bi bi-command' /><i className="bi bi-arrow-up" /></div></div>);
        jsxList.push(<div onClick={() => {close(); node.zIndex -= 1;}} className={'col item'}>{icon['down']} Down<div>
            <i className='bi bi-command' /><i className="bi bi-arrow-down" /></div></div>);
        let gn = node as GObject;
        jsxList.push(<hr className={'my-1'} />);
        
        /* AUTO-SIZING */
        if (gn.isResized) jsxList.push(<div onClick={() => {close(); gn.isResized = false; }} className={'col item'}>{icon['contract']} Restore auto-sizing<div> <i
            className='bi bi-command'></i> T</div></div>);
        else jsxList.push(<div onClick={() => {close(); gn.isResized = true; }} className={'col item'}>{icon['expand']} Disable auto-sizing<div> <i
            className='bi bi-command'></i> T</div></div>);
        
        // /* LOCK-UNLOCK */
        // jsxList.push(<div onClick={() => {close(); ldata.delete(); /*node.delete();*/}} className={'col item'}>{icon['lock']} Lock/Unlock<div> <i
        //     className='bi bi-command'></i> L</div></div>);
        // /* UNLOCK ALL ELEMENTS */
        // jsxList.push(<div onClick={() => {close(); ldata.delete(); /* node.delete();*/}} className={'col item'}>{icon['unlock']} Unlock all<div><i className="bi bi-alt"></i> <i
        //     className='bi bi-command'></i> L</div></div>);

        jsxList.push(<hr className={'my-1'} />);
        
        /* METRICS */
        if (ldata && model?.isMetamodel) {
            jsxList.push(<div onClick={() => {close(); toggleMetrics();}} className={'col item'}>{icon['metrics']} Analytics<div>
                <i className='bi bi-command' /> A</div></div>);
            jsxList.push(<hr className={'my-1'} />);
        }


        /* ADD VIEW */
        jsxList.push(<div onClick={async () => {close(); addView();}} className={'col item'}>{icon['view']} Add View<div>
            <i className='bi bi-alt' /> <i className='bi bi-command' /> A</div></div>);
    }

    return(<>
        <div className={'context-menu round'} style={{top: position.y - 100, left: position.x - 10}} onContextMenu={(e)=>e.preventDefault()}>
            {jsxList.map((jsx, index) => {return <div key={index}>{jsx}</div>})}
        </div>


        {(data && memorec?.data) && <div className={'context-menu round'} style={{overflow: 'auto', maxHeight: '12em', top: position.y - 100, left: position.x + 130}}>
            {(memorec.data.map((obj, index) => {
                return (<div key={index}>
                    <div className={'col item d-block'} onClick={e => setSuggestedName(obj.recommendedItem)}>
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




    </>);
}
interface OwnProps {}
interface StateProps {
    user: LUser,
    display: boolean,
    position: {x: number, y: number},
    node: LGraphElement|null
}

interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(DUser.current);
    ret.display = state.contextMenu.display;
    ret.position = {x: state.contextMenu.x, y: state.contextMenu.y};

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

export const ContextMenu = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <ContextMenuConnected {...{...props, childrens}} />;
}
export default ContextMenu;
