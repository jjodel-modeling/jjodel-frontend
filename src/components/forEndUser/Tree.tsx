import React, {ReactNode, useEffect} from "react";
import {GObject, LModelElement, LNamedElement, U} from '../../joiner';
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

    useEffect(() => {

    }, [filter])

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
    const depth = props.depth;
    const setFilter = props.setFilter;

    return(<div>
        <div className={'d-flex tree'}>
            <button className={'btn'} onClick={setFilter}>
                {(hide) ? <i className={'bi bi-eye-slash'}></i> : <i className={'bi bi-eye'}></i>}
            </button>
            <label className={data.className + ' ms-1 text-capitalize my-auto'}>
                <b>{data.className}</b>:
            </label>
            <label className={'ms-1 my-auto'}>{(data.name) ? data.name : 'unnamed'}</label>
        </div>
        {!hide && data.children.map((child: LModelElement) => {
            return(<div className={'ms-2'}>
                <Tree data={child} depth={[...depth]} />
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
            if(!React.isValidElement(element)) return(<div className={'d-flex'}>
                <button className={'btn'} onClick={setFilter}>
                    {(hide) ? <i className={'bi bi-eye-slash'}></i> : <i className={'bi bi-eye'}></i>}
                </button>
                <label className={'ms-1 my-auto'}>
                    <b>{element}</b>
                </label>
            </div>);
            const children: (string|ReactNode)[] = (Array.isArray(element.props.children)) ? element.props.children: [element.props.children];
            if(!hide) {
                return(<div className={'ms-2'}>
                    <Tree depth={[...depth]}>{children}</Tree>
                </div>);
            }
        })}
    </div>);
}

export default Tree;
