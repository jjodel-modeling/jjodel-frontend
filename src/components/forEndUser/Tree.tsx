import {LModelElement, LNamedElement} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import './style.scss';

interface TreeProps {data: LModelElement, depth?: string[]}
function Tree(props: TreeProps) {
    const data: LNamedElement = LNamedElement.fromPointer(props.data.id);
    const depth = (props.depth) ? props.depth : [data.id];
    const [filter, applyFilter] = useStateIfMounted('');
    const hide = depth.includes(filter);

    const setFilter = (): void => {
        if(filter === data.id) applyFilter('');
        else applyFilter(data.id);
    }

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
                <Tree data={child} depth={[...depth, child.id]} />
            </div>);
        })}
    </div>);
}

export default Tree;
