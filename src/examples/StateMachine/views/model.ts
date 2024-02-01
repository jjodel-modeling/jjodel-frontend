export default class ModelViews {
    static zero = `<div className={'root'}>
        {!data && 'Model data missing.'}
        <div className='edges' style={{zIndex: 101, position: 'absolute', height: 0, width: 0, overflow: 'visible'}}>
            {data.$transitions
                .map((t, i) => {
                    if(t.$source.value && t.$target.value && t.$trigger.value)
                        return(<Edge key={i} label={() => t.$trigger.value.$name.value} 
                                    data={t.id}
                                    view={'Pointer_ViewEdgeAssociation'} 
                                    start={t.$source.value.node} 
                                    end={t.$target.value.node} 
                           />)
                    return(<DefaultNode key={t.id} data={t} />)
                })
            }
        </div>
        {data.otherObjects(['Event', 'Command'])
            .map(object => <DefaultNode key={object.id} data={object} />)
        }
        <button style={{position: 'absolute', right: 10, top: 10}} className={'p-1 btn btn-danger'} onClick={e => {
            const objects = [];
            if(data.$state) objects.push(...data.$state.instances);
            if(data.$situation) objects.push(...data.$situation.instances);
            if(objects.length < 5) return;
            objects.sort((a, b) => a.name.localeCompare(b.name))
            objects[0].node.x = 670; objects[0].node.y = 60; // active
            objects[1].node.x = 670; objects[1].node.y = 400; // idle
            objects[2].node.x = 250; objects[2].node.y = 400; // unlockPanel 
            objects[3].node.x = 350; objects[3].node.y = 220; // waitingForDrawer
            objects[4].node.x = 50; objects[4].node.y = 220; // waitingForLight
        }}>
            Arrange
        </button>
    </div>`;
    static one = `<div className={'root'}>
        {!data && 'Model data missing.'}
        <div className='edges' style={{zIndex: 101, position: 'absolute', height: 0, width: 0, overflow: 'visible'}}>
            {data.$transitions
                .map((t, i) => {
                    if(t.$source.value && t.$target.value && t.$trigger.value)
                        return(<Edge key={i} label={() => t.$trigger.value.$name.value} 
                                    data={t.id}
                                    view={'Pointer_ViewEdgeAssociation'} 
                                    start={t.$source.value.node} 
                                    end={t.$target.value.node} 
                           />)
                    return(<DefaultNode key={t.id} data={t} />)
                })
            }
            {data.$resets
                .map((reset) => {
                    if(!reset.node || !reset.$transition.value) 
                         return(<DefaultNode key={reset.id} data={reset} />)
                    return(<Edge key={i}
                        view={'Pointer_ViewEdgeAssociation'} 
                        start={r.node} 
                        end={r.$transition.value.node} 
                    />)
            })}
        </div>
        {data.otherObjects(['Event', 'Command', 'Reset'])
            .map(object => <DefaultNode key={object.id} data={object} />)
        }
        <button style={{position: 'absolute', right: 10, top: 10}} className={'p-1 btn btn-danger'} onClick={e => {
            const objects = [];
            if(data.$state) objects.push(...data.$state.instances);
            if(data.$situation) objects.push(...data.$situation.instances);
            if(objects.length < 5) return;
            objects.sort((a, b) => a.name.localeCompare(b.name))
            objects[0].node.x = 670; objects[0].node.y = 60; // active
            objects[1].node.x = 670; objects[1].node.y = 400; // idle
            objects[2].node.x = 250; objects[2].node.y = 400; // unlockPanel 
            objects[3].node.x = 350; objects[3].node.y = 220; // waitingForDrawer
            objects[4].node.x = 50; objects[4].node.y = 220; // waitingForLight
        }}>
            Arrange
        </button>
    </div>`;
}
