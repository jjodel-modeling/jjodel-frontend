export interface MemoRecObject {
    context: string;
    model: MemoRecModel;

}

export interface MemoRecModel {
    name: string;
    methodDeclarations: MemoRecNamed[];

}

export interface MemoRecNamed {
    name: string;
    methodInvocations: string[];
}


export enum JwtPayloadKey {
    Email = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    Roles = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
    Name  = "name",
    Nickname = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
    Id = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
    Exp = "exp",
    Iss = "iss",
    Aud = "aud"
}

