
// da ottimizzare:
/*
get_cumulativezoom get_typestr, get_values, get_model, get_instanceof, get_segments, get_children_idlist, get_typestr

*/

(ret)=> {
// ** preparations and default behaviour here ** //
// ret.data = data
    ret.view = view
// data, edge, view are dependencies by default. delete the line(s) above if you want to remove them.
// add preparation code here (like for loops to count something), then list the dependencies below.

ret = <View className={'root operation operation-row'} style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 10px',
    fontSize: '12px',
    fontFamily: "'IBM Plex Mono', Monaco, Consolas, monospace",
    transition: 'background 0.15s ease'
}}>
    <div className={"return-type w-100"}>
        {/* Left side: Name with arrow */}
        <span style={{
            fontWeight: 500,
            color: '#334155'
        }}>{data.name} =&gt; </span>

        {/* Right side: Return Type Select (smaller) */}
        <div style={{maxWidth: '110px', minWidth: '80px'}}>
            <Select data={data} field={'type'} />
        </div>
    </div>

            {/* Parameters (if level >= 3) */}
            {level >= 3 && data.parameters.length > 0 &&
                <div className={"parameters-section"} style={{
                    marginLeft: '4px',
                    fontSize: '10px',
                    color: '#64748b'
                }}>
                    {data.parameters.map(p => <DefaultNode data={p} key={p.id} />)}
                </div>
            }

            {decorators}
</View>;
    return ret;

}

export class test{

    static debugcompile(){


    }


}