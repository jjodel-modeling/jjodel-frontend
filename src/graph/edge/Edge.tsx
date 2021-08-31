/*

example:
<EdgeContainer graph={this.props.graphid}> <--genera un svg allineato con la griglia del grafo che lo contiene
    this.props.model.edges.map( e =>
        <Edge vertex_start={ e.start } vertex_end={ e.end } edgeid={ e.id } edge = {e} />
    )
</EdgeContainer>



about "model.edges", every time you create a reference an edge is created inside redux state
if the reference is deleted, the edge is deleted
if the edge is deleted, the user will choose to delete the reference or only the edge
the user can create edges unrelated to modelelements (detached)
a detached edge, can be attached later on to a reference


*/

export const fakeexport = {};
