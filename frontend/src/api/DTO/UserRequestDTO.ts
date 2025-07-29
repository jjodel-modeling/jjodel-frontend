import type {Dictionary, DocString, Json, Pointer, RawObject} from "../../joiner";
import {DProject, DUser, Log} from "../../joiner";
import {Response_DTO} from "./DTO";
import {ProjectPointers, UserPointers} from "../../joiner/classes";
import {JwtClaims} from "./JwtClaims";
import {TokenResponse} from "./TokenResponse";

export class UserResponseDTO extends Response_DTO<UserResponseDTO, DUser>{
    id!: Pointer<DUser>;
    _Id!: DocString<"GUID">;
    name!: string;
    surname!: string;
    nickname!: string;
    affiliation!: string;
    country!: string;
    newsletter!: boolean;
    email!: string;
    phoneNumber!: string;
    // optionals //
    birthDate?: string;

    constructor(data: Json<RawObject>) {
        super();
        this._dto_init(data);
    }

    toJodelClass(raw: TokenResponse, claims?: JwtClaims|null): DUser {
        // Log.eDevv("called projectResponseDTO.toJodel(), this is just a boilerplate, projects need to be loaded")
        let pointers: Partial<UserPointers> = {} as any;
        pointers.id = this.id;

        // let user: DUser = DUser.new(this.name, '', this.nickname, '',  '', false, this.email, raw.token, this._Id, this.id, true);
        let user: DUser = DUser.new2(pointers, (d)=>{
            for (let key in this) {
                if (key in pointers) continue;
                if (key in d) { (d as any)[key] = this[key]; }
            }
            d.token = raw.token as string;
            (d as any).convertedFromDto = true;
        });
       return user;
    }
}
type Missing = Omit<UserResponseDTO, keyof DUser>;
type Excess = Omit<DUser, keyof UserResponseDTO>;

let missing: Missing = null as any;
let excess: Excess = null as any;