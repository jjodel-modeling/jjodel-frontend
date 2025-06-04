export class CreateProjectRequest {

    _id?: string;
    name? :string;
    description? :string;
    type? :string;
    imported: boolean = false;
    state? : string; // present only if imported.
}