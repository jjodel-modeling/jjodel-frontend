import React, {ReactNode, MouseEventHandler} from "react";
import {
    DClass,
    Dictionary,
    DViewElement,
    GObject,
    LClass,
    LModelElement,
    LNamedElement, LPointerTargetable,
    LViewElement,
    LViewPoint,
    SetRootFieldAction,
    U
} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import './tree.scss';
import {useEffectOnce} from "usehooks-ts";

import { MyTooltip } from "../tooltip/MyTooltip";
import { CommandBar, Btn } from "../commandbar/CommandBar";

/*
type BtnProps = {
    icon: "up" | "down" | "back" | "fwd" | "add" | "delete" | "edit",
    tip?: string,
    action?: MouseEventHandler,
    size?: "small" | "medium" | "large"
}

const Btn = (props: BtnProps) => {
    return (<>
        {props.action ? 
            <div><i onClick={props.action} title={`${props.tip && props.tip}`} className={`bi tab-btn ${props.icon} ${props.size && props.size}`}></i></div>
        :
            <i className={`bi tab-btn ${props.icon} ${props.size && props.size} disabled`}></i>
        }
    </>);
}



type CommandProps = {
    children: any;
}
const CommandBar = (props: CommandProps) => {

    return(<div className={'command-bar'}>
        {props.children}
    </div>);
};*/


interface TreeProps {data?: LModelElement, depth?: string[], children?: GObject}

function Tree(props: TreeProps) {
    const data = (props.data) ? props.data : null;
    const children = props.children;
    const [id, setId] = useStateIfMounted('');
    const depth = (props.depth) ? [...props.depth, id] : [id];
    const [filter, applyFilter] = useStateIfMounted('');
    const hide = depth.includes(filter);

    useEffectOnce(() => {
        setId((data && data.id) ? data.id : U.getRandomString(5));
    })

    const setFilter = (): void => {
        if(filter === id) applyFilter('');
        else applyFilter(id);
    }


    if(data) return(<>
        <CommandBar>
            <Btn icon={'up'} size={'medium'} action={(e) => {alert('up')}} tip={'Click to go up to the anchestor element'} /> {/* todo per damiano: aggiungere hook per salire di livello (up) */}
            <Btn icon={'down'} size={'medium'} /> {/* todo per damiano: non so se oltre ad up serve anche un down, in ogni caso ce lo lascerei disabilitato perché da contesto pure all'up */}
        </CommandBar>
        <DataTree data={data} depth={depth} hide={hide} setFilter={setFilter}  /></>)
    if(children) return(<><HtmlTree data={children} hide={hide} depth={depth} setFilter={setFilter} /></>);
    return(<></>);
}

interface DataTreeProps {data: LModelElement, hide: boolean, depth: string[], setFilter: () => void}
function DataTree(props: DataTreeProps): JSX.Element {
    const hide = props.hide;
    const data: LNamedElement = LNamedElement.fromPointer(props.data.id);
    if(!data) return(<div>Error Data is <b>undefined</b></div>);
    const depth = props.depth;
    const setFilter = props.setFilter;

    const click = () => {
        let node = data.node;
        SetRootFieldAction.new('_lastSelected', {
            node: node?.id,
            view: node?.view.id,
            modelElement: data.id
        }, '', false);
    }

    /*let icon = 'box';
    switch(data.className) {
        case 'DModel': icon = 'diagram-2'; break;
        case 'DPackage': icon = 'boxes'; break;
        case 'DClass': icon = 'folder'; break;
        case 'DAttribute': icon = 'stop'; break;
        case 'DReference': icon = 'stop-fill'; break; //beliezer2 // folder-symlink
        case 'DOperation': icon = 'gear-wide'; break;
        case 'DObject': icon = ''; break;
        case 'DValue': icon = ''; break;
    }*/

    return(<section>
        
        <div className={'d-flex tree'}>
            {data.children?.length >= 1 ? ((data.children?.length && hide) ?
                <i style={{fontSize: '0.7em', color: 'gray'}} className={'bi bi-chevron-right cursor-pointer d-block my-auto'} onClick={setFilter} /> :
                <i style={{fontSize: '0.7em', color: 'gray'}} className={'bi bi-chevron-down cursor-pointer d-block my-auto'} onClick={setFilter} />
            ) :
                <i style={{fontSize: '0.75em', color: 'whitesmoke'}} className={'bi bi-caret-right-fill d-block my-auto'} />
            }

            <div className={'tree-item'}>
                {/* <div className={`type tree-${data.className} ${(data as any).abstract && 'abstract-class'}`}>
                    <div className={'icon'}>{data.className.slice(1, 2)}</div>*/}

                <div className={'type'}>

                    <div className={`icon tree-${data.className} ${(data as any).abstract && 'abstract-class'}`}>
                        {data.className === 'DEnumLiteral' ? 'L' : data.className.slice(1, 2)}
                    </div>
                    <MyTooltip text={`${(data as any).abstract ? 'Abstract ':''}` + data.className} />
                </div>
                <div className={'name'} onClick={click}>
                    <span className={'class-name'}>
                        {(data.name) ? data.name : 'unnamed'} 
                        {(data as LClass).extends && (data as LClass).extends.length > 0 && 
                            <span className={'extends'}> 
                                &nbsp; <i className="bi bi-caret-right"></i> [{(data as LClass).extends.map((s,i) => <><i>{s.name}</i>{i < (data as LClass).extends.length - 1 ? ', ' :''}</>)}]
                            </span>
                        }
                    </span>
                    </div>
            </div>

        </div>
        {!hide && Array.isArray(data.children) && data.children?.map((child: LModelElement) => {
            return(<div style={{marginLeft: '1em'}}>
                <Tree data={child} depth={depth} />
            </div>);
        })}
    </section>);
}

interface HtmlTreeProps {data: GObject, hide: boolean, depth: string[], setFilter: () => void}
function HtmlTree(props: HtmlTreeProps) {
    const data: (string|ReactNode)[] = (Array.isArray(props.data)) ? props.data : [props.data];
    const hide = props.hide;
    const depth = props.depth;
    const setFilter = props.setFilter;

    return(<div>
        {data.map((element: string|ReactNode) => {
            if(!React.isValidElement(element)) return(<></>);
            const children: (string|ReactNode)[] = (Array.isArray(element.props.children)) ? element.props.children: [element.props.children];
            return(<>
                <div className={'d-flex'}>
                    {(children.length > 0 && hide) ?
                        <i className={'bi bi-chevron-up cursor-pointer d-block my-auto'} onClick={setFilter} /> :
                        <i className={'bi bi-chevron-down cursor-pointer d-block my-auto'} onClick={setFilter} />
                    }
                    <label className={'ms-1 my-auto'}>
                        {element.props['label'] ? element.props['label'] : 'unnamed'}
                    </label>
                </div>
                {!hide && children.map((child) => {
                    if(!React.isValidElement(child)) return(<></>);
                    return(<div className={'ms-2'}>
                        <Tree depth={depth}>
                            {child}
                        </Tree>
                    </div>);
                })}
            </>);
        })}
    </div>);
}

interface GenericTreeProps<T extends any = any> {
    data: any,
    getSubElements: (o: any)=>(GObject[] | Dictionary<any, any>),
    //getKey: (o:any) => string,
    renderEntry: (e: any, childrens: any, isExpanded: boolean, toggleExpansion: () => any, depth: number, path: number[], metadata?:any)=>JSX.Element,
    initialHidingState?: boolean,
    depth?: number,
    path?: number[],
    metadata?: any,
}

export function GenericTree(props: GenericTreeProps): JSX.Element {
    let [isExpanded, setExpanded] = useStateIfMounted(props.initialHidingState || false);
    const data: GObject = props.data;
    const childrens = props.getSubElements(data) || [];
    // if (typeof childrens === "object" && (Array.isArray(childrens) && childrens.length === 0) || Object.keys(childrens)) isExpanded = false;
    return props.renderEntry(data, childrens, isExpanded, ()=>setExpanded(!isExpanded), props.depth || 0, props.path || [], props.metadata);
    /*
    if (!data) return(<div>Error Data is <b>undefined</b></div>);
    const depth = props.depth;
    const setFilter = props.setFilter;

    const click = () => {
        let node = data.node;
        SetRootFieldAction.new('_lastSelected', {
            node: node?.id,
            view: node?.view.id,
            modelElement: data.id
        }, '', false);
    }

    let className: string = data.className;
    let name: string = data.name;
    let vp: LViewPoint | undefined = className === LViewPoint.cname ? (data as any) : undefined;
    let view: LViewElement | undefined = vp || (className === DViewElement.cname ? (data as any) : undefined);
    let subType: string = '';
    if (view) {
        let appliableTo = view.appliableToClasses;
        subType = appliableTo.length > 1 ? "multi" : appliableTo[0];
    }
    let subelements: GObject[] = props.getSubElements ? props.getSubElements(data) : (view ? view.subViews : data.children);
    return(<section>
        <div className={'d-flex tree ' + className + ' ' + subType}>
            {subelements?.length >= 1 ? ((subelements?.length && hide) ?
                        <i style={{fontSize: '0.7em', color: 'gray'}} className={'bi bi-chevron-right cursor-pointer d-block my-auto'} onClick={setFilter} /> :
                        <i style={{fontSize: '0.7em', color: 'gray'}} className={'bi bi-chevron-down cursor-pointer d-block my-auto'} onClick={setFilter} />
                ) :
                <i style={{fontSize: '0.75em', color: 'whitesmoke'}} className={'bi bi-caret-right-fill d-block my-auto'} />
            }

            <div className={'tree-icon'}>
                <div className={`type tree-${className}`}>{className.slice(1, 2)}</div>
                <div className={'name'} onClick={click}>{(data.name) ? data.name : 'unnamed'}</div>
            </div>
        </div>
        {!hide && Array.isArray(subelements) && subelements?.map((child: LPointerTargetable) => {
            return(<div style={{marginLeft: '1em'}}>
                <Tree data={child} depth={depth} />
            </div>);
        })}
    </section>);*/
}

Tree.cname = "Tree";
DataTree.cname = "DataTree";
HtmlTree.cname = "HtmlTree";
GenericTree.cname = "GenericTree";
export default Tree;
