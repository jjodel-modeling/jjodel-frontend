export default class TextView {
    static zero = `<div className={'root bg-white p-2 mb-5'}>
        <h5 className={'p-1'}>Model to Text</h5>
        <hr className={'mt-2'} />
        {data.$events.map(event => {
            return(<div>event: {event.$name.value}, "{event.$code.value}"</div>);
        })}
        <hr className={'my-2'} />
        {data.$commands.map(command => {
            return(<div>command: {command.$name.value}, "{command.$code.value}"</div>);
        })}
        <hr className={'my-2'} />
        {data.otherObjects(['Transition']).map(event => {
            if(!event.instanceof) return(<div></div>);
            return(<div>
                state: {event.$name.value} DO <br />
                <div className={'ms-4 d-flex'}>
                    actions: {event.$actions.values.map(action => {
                        return(<div className={'ms-2'}>{action.$name.value},</div>)
                    })}
                </div>
                END
            </div>);
        })}
    </div>`;
    static one = `<div className={'root bg-white p-2 mb-5'}>
        <h5 className={'p-1'}>Model to Text</h5>
        <hr className={'mt-2'} />
        {data.$events.map(event => {
            return(<div>event: {event.$name.value}, "{event.$code.value}"</div>);
        })}
        <hr className={'my-2'} />
        {data.$commands.map(command => {
            return(<div>command: {command.$name.value}, "{command.$code.value}"</div>);
        })}
        <hr className={'my-2'} />
        {data.$resets && data.$resets.map((reset, index) => {
            if(index > 0) return(<div></div>);
            return(<div>
                reset: DO <br />
                <div className={'ms-4 d-flex'}>
                    events: {reset.$triggers.values.map(event => {
                        return(<div className={'ms-2'}>{event.$name.value},</div>)
                    })}
                </div>
                END
            </div>);
        })}
        <hr className={'my-2'} />
        {data.otherObjects(['Transition']).map(event => {
            if(!event.instanceof) return(<div></div>);
            return(<div>
                state: {event.$name.value} DO <br />
                <div className={'ms-4 d-flex'}>
                    actions: {event.$actions.values.map(action => {
                        return(<div className={'ms-2'}>{action.$name.value},</div>)
                    })}
                </div>
                END
            </div>);
        })}
    </div>`;
    static two = `<div className={'root bg-white p-2 mb-5'}>
        <h5 className={'p-1'}>Model to Text</h5>
        <hr className={'mt-2'} />
        {data.$events.map(event => {
            return(<div>event: {event.$name.value}, "{event.$code.value}"</div>);
        })}
        <hr className={'my-2'} />
        {data.$commands.map(command => {
            return(<div>command: {command.$name.value}, "{command.$code.value}"</div>);
        })}
        <hr className={'my-2'} />
        {data.otherObjects(['Transition']).map(event => {
            if(!event.instanceof) return(<div></div>);
            return(<div>
                state: {event.$name.value} DO <br />
                <div className={'ms-4 d-flex'}>
                    actions: {event.$actions.values.map(action => {
                        return(<div className={'ms-2'}>{action.$name.value},</div>)
                    })}
                </div>
                END
            </div>);
        })}
    </div>`;
}
