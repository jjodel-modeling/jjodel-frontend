export class Views {
    static model = `<div className={'root'}>
        {!data && 'Model data missing.'}
        <div className='edges' style={{zIndex:101, position: 'absolute', height: 0, width: 0, overflow: 'visible'}}>
            {data.objects.filter(o => o.instanceof.name === 'Transition').map((t, i) => {
                return(t.$source.value && t.$target.value && t.$trigger.value && 
                    <Edge key={i} label={t.$trigger.value.$name.value} 
                        view={'Pointer_ViewEdgeAssociation'} 
                        start={t.$source.value.node} 
                        end={t.$target.value.node} 
                    />)
            })}
        </div>
        {data.objects.filter(o => o.instanceof.name !== 'Transition' && o.instanceof.name !== 'Command').map(
            object => <DefaultNode key={object.id} data={object}></DefaultNode>)
        }
    </div>`;

    static state = `<div className={'root bg-white'} style={{'border-radius':'8px', 'border':'black solid 1px'}}>
        <div style={{'text-align':'center','border-bottom':'black solid 1px','padding':'4px 2px 4px 2px'}}>
            {data.$name.value}
        </div>
        <div style={{'padding':'4px 2px 4px 2px'}}>
            {data.$actions.values.map(
                (action, index) => {
                    return <div style={{'text-align': 'center'}} key={index}>{action.$name.value}</div>}
            )}
        </div>
    </div>`;
}
