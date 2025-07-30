import type {Dictionary, DocString, Json, Pointer, RawObject} from "../../joiner";
import {DProject, DUser, Log} from "../../joiner";
import {Response_DTO} from "./DTO";
import {ProjectPointers} from "../../joiner/classes";

export class ProjectResponseDTO extends Response_DTO<ProjectResponseDTO, DProject>{
    id!: Pointer<DProject>;
    _Id!: DocString<"GUID">;
    name!: string;
    description!: string;
    type!: string;
    state!: string;
    viewpointsNumber!: number;
    metamodelsNumber!: number;
    modelsNumber!: number;

// optionals //
    creation?: string;// Date?
    lastModified?: string;// Date?
    isFavorite?: boolean;
    author?: Pointer<DUser>;
    collaborators?: Pointer<DUser>[];
    constructor(data: Json<RawObject>) {
        super();
        this._dto_init(data);
    }
    toJodelClass(): DProject {
        // Log.eDevv("called projectResponseDTO.toJodel(), this is just a boilerplate, projects need to be loaded")
        let pointers: Partial<ProjectPointers> = {} as any;
        pointers.id = this.id;
        pointers.author = this.author;
        // projects.collaborators = [] no need, because reading a project directly from backend without a load/decrypt only
        // happens with new empty projects. which can have only author and id.
        return DProject.new2(pointers, (d)=>{
            for (let key in this) {
                if (key in pointers) continue;
                if (key in d) { (d as any)[key] = this[key]; }
            }
            /*d._Id = this._Id;
            d.description = this.description;
            d.name = this.name;
            d.state = this.state;
            (d.type as string) = this.type;
            // this.metamodelsNumber = this.modelsNumber = this.viewpointsNumber = 0;*/
            d.isFavorite = !!this.isFavorite;
            d.creation = (this.creation ? new Date(this.creation) : new Date()).getTime();
            d.lastModified = (this.lastModified ? new Date(this.lastModified) : new Date()).getTime();
            (d as any).convertedFromDto = true;
        }, [], true);
    }
}
type Missing = Omit<ProjectResponseDTO, keyof DProject>;
type Excess = Omit<DProject, keyof ProjectResponseDTO>;

let missing: Missing = null as any;
let excess: Excess = null as any;