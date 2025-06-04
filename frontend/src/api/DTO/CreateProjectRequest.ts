export class CreateProjectRequest {

    _id?: string;
    name? :string;
    description? :string;
    type? :string;
    imported: boolean = false;
    version: string = ""; // jjodel version
    state? : string; // present only if imported.

}