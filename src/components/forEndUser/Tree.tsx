import React, {ReactNode} from "react";
import {GObject, LModelElement, LNamedElement, SetRootFieldAction, U} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import './style.scss';
import {useEffectOnce} from "usehooks-ts";

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

    if(data) return(<DataTree data={data} depth={depth} hide={hide} setFilter={setFilter}  />)
    if(children) return(<HtmlTree data={children} hide={hide} depth={depth} setFilter={setFilter} />);
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

    let icon = 'box';
    switch(data.className) {
        case 'DModel': icon = 'diagram-2'; break;
        case 'DPackage': icon = 'boxes'; break;
        case 'DClass': icon = 'folder'; break;
        case 'DAttribute': icon = 'stop'; break;
        case 'DReference': icon = 'stop-fill'; break; //beliezer2 // folder-symlink
        case 'DOperation': icon = 'gear-wide'; break;
        case 'DObject': icon = ''; break;
        case 'DValue': icon = ''; break;
    }

    return(<section>
        <div className={'d-flex tree'}>
            {data.children?.length >= 1 ? ((data.children?.length && hide) ?
                <i style={{fontSize: '0.7em', color: 'gray'}} className={'bi bi-chevron-right cursor-pointer d-block my-auto'} onClick={setFilter} /> :
                <i style={{fontSize: '0.7em', color: 'gray'}} className={'bi bi-chevron-down cursor-pointer d-block my-auto'} onClick={setFilter} />
            ) :
                <i style={{fontSize: '0.75em', color: 'whitesmoke'}} className={'bi bi-caret-right-fill d-block my-auto'} />
            }

            <div className={'tree-icon'}>
                <div className={`type tree-${data.className}`}>{data.className.slice(1, 2)}</div>
                <div className={'name'} onClick={click}>{(data.name) ? data.name : 'unnamed'}</div>
            </div>
            {/*<label className={data.className + ' ms-1 text-capitalize'}>
                {data.className}:
            </label>*/}
            {/*<label tabIndex={-1} role={'button'} onClick={click} className={'name ms-1 d-block my-auto'} style={{fontSize: '0.75em'}}>
                {(data.name) ? data.name : 'unnamed'}
            </label>*/}
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

Tree.cname = "Tree";
DataTree.cname = "DataTree";
HtmlTree.cname = "HtmlTree";
export default Tree;
