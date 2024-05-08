import {DefaultNode, LModelElement} from '../../joiner';

type Props = {data: LModelElement, includes?: string[], excludes?: string}
function Children(props: Props) {
    const {data, includes, excludes} = props;
    let children: LModelElement[] = data.children;
    if(includes) children = children.filter(c => c.name && includes.includes(c.name));
    if(excludes) children = children.filter(c => c.name && !excludes.includes(c.name));
    console.log('Children Component', children);

    return(<div className={'children'}>
        {children.map(c => <DefaultNode key={c.id} data={c} />)}
    </div>);
}

export {Children};
