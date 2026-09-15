import type {DocString, Pointer } from "../../joiner";

export class JwtClaims{
  aud!: string; // "https://"
  iss!: string; // "https://"
  exp!: string; // 1763346786,
  id!: DocString<'guid not swapped'>;
  _Id!: Pointer<any>; // "-"
  name!: string; // ""
  email!: string; // "damiano.divincenzo@student.univaq.it"
  nickname!: string; // "ddvu"
  role!: string | string[]; // "User"
  _decoded!: string; // undefined
}
