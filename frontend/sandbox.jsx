export class test{

    static debugcompile(){

        let a  =<section className={"overlap"}>
            <div className={"naming-list"}>{selection.map( u => (
                <div className={"hoverable color-"+(u.index % maxColors)}>
                    <span className={"content top collab-name"}>{u.name}</span>
                    {u.avatar}
                </div>
            )}
            </div>
            <svg className={"borders"}>
                {selection.map( u => (
                    <rect className={"color-"+(u.index % maxColors)}
                          style={{"--gaps": project.onlineUsers, "--offset": i, "--border-color": u.color}}
                    />))}
            </svg>
        </section>

    }


}