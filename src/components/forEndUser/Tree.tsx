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
function DataTree(props: DataTreeProps) {
    const hide = props.hide;
    const data: LNamedElement = LNamedElement.fromPointer(props.data.id);
    if(!data) return(<div>Error Data is <b>undefined</b></div>);
    const depth = props.depth;
    const setFilter = props.setFilter;

    const click = () => { {
        let node = data.node;
        SetRootFieldAction.new('_lastSelected', {
            node: node?.id,
            view: node?.view.id,
            modelElement: data.id
        }, '', false);

    }

    return(<div>
        <div className={'d-flex tree'}>
            <button className={'btn'} onClick={setFilter}>
                {(data.children?.length > 0 && hide) ? <i className={'bi bi-chevron-up'} /> : <i className={'bi bi-chevron-down'} />}
            </button>
            <label className={data.className + ' ms-1 text-capitalize my-auto'}>
                <b>{data.className}</b>:
            </label>
            <label tabIndex={-1} role={'button'} onClick={click} className={'name ms-1 my-auto'}>
                {(data.name) ? data.name : 'unnamed'}
            </label>
        </div>
        {!hide && Array.isArray(data.children) && data.children?.map((child: LModelElement) => {
            return(<div className={'ms-2'}>
                <Tree data={child} depth={depth} />
            </div>);
        })}
    </div>);
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
                    <button className={'btn'} onClick={setFilter}>
                        {(children.length > 0 && hide) ? <i className={'bi bi-chevron-up'} /> : <i className={'bi bi-chevron-down'} />}
                    </button>
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
