import {Dictionary, DProject, DUser, GObject} from "../../joiner";
import {DTO} from "./DTO";
import {VersionFixer} from "../../redux/VersionFixer";

export class UpdateProjectRequest extends DTO<DProject>{
    id?: string;
    _id!: string;
    name!: string;
    description!: string;
    type!: string;
    state!: string;
    viewpointsNumber!: number;
    metamodelsNumber!: number;
    modelsNumber!: number;
    creation!: string;
    lastModified!: string;
    isFavorite!: boolean;
    collaborators!: string[];
    imported!: boolean;
    version!: string;
    constructor(src: DProject) {
        super();
        this._dto_init(src);
    }
    /*
    public static convertDprojectToUpdateProject(project: DProject): UpdateProjectRequest{

        const updateProjectRequest :UpdateProjectRequest = new UpdateProjectRequest();

        updateProjectRequest.id = project._id;
        updateProjectRequest._id = project.id;

        updateProjectRequest.name = project.name;
        updateProjectRequest.description = project.description;
        updateProjectRequest.type = project.type;
        updateProjectRequest.state = project.state;
        updateProjectRequest.viewpointsNumber = project.viewpointsNumber;
        updateProjectRequest.metamodelsNumber = project.metamodelsNumber;
        // fix bug date
        updateProjectRequest.lastModified = new Date(project.lastModified).toISOString();
        updateProjectRequest.modelsNumber = project.modelsNumber;
        updateProjectRequest.isFavorite = !project.isFavorite;
        updateProjectRequest.collaborators = project.collaborators || [""];

        console.log("*************** - updateProjectRequest", updateProjectRequest);

        return updateProjectRequest;
    }*/
    _dto_convert(src: Partial<DProject>, setFields: Dictionary<string, boolean>): void {
        let missing: Missing = this as any;
        this.version = src.version || 'unknown'; //VersionFixer.get_highestversion()+'';
        // todo: fix bug date (??)
        this._dto_set('lastModified', (src.lastModified ? new Date(src.lastModified) : new Date()).toISOString(), setFields);
        this.creation = (src.creation ? new Date(src.creation) : new Date()).toISOString();
        setFields['creation'] = true;
        this._dto_set('imported', !!src.state, setFields);
        console.log('dto convert: ', {src, thiss:this, setFields});
        /*excess.favorite
        excess.className;
        excess.author;
        excess.layout;*/
    }
    static toProject(dto: GObject<UpdateProjectRequest>): DProject{
        let ret = {...dto} as any as GObject<DProject>;
        ret.className = DProject.cname;
        ret.favorite = {[DUser.current]: ret.isFavorite} as Dictionary;
        return ret;
    }
}
type Missing = Omit<UpdateProjectRequest, keyof DProject>;
type Excess = Omit<DProject, keyof UpdateProjectRequest>;

let missing: Missing = null as any;
let excess: Excess = null as any;
(window as any).UpdateProjectRequest = UpdateProjectRequest;

