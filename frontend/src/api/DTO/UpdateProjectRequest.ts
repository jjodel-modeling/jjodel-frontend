import {DProject} from "../../joiner";

export class UpdateProjectRequest {

    id?: string;
    _id?: string;
    name?: string;
    description?: string;
    type?: string;
    state?: string;
    viewpointsNumber?: number;
    metamodelsNumber? :number;
    modelsNumber? :number;
    lastModified? :string;
    isFavorite? :boolean;
    collaborators?: string[];

    public static  convertDprojectToUpdateProject(project: DProject): UpdateProjectRequest{

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

        console.log("***************", project);
        console.log("*************** - updateProjectRequest", updateProjectRequest);

        return updateProjectRequest;
    }

}



