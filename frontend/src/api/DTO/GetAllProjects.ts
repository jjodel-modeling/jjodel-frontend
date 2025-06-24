import {DProject} from "../../joiner";

export class DTOProjectGetAll{
    id!: string;
    _Id?: string;
    name!: string;
    type!: string;
    state!: string;
    creation!: number;
    lastModified!: number;
    description!: string;
    viewpointsNumber!: number;
    metamodelsNumber!: number;
    modelsNumber!: number;
    isFavorite!: boolean;
}