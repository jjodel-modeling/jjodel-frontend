export class JwtClaims {
  name: string = '';
  nickname: string = '';
  email: string | any = '';
  id: string = '';
  _Id!: string;
  role: string[] = [];
  exp?: number;
  iss?: string;
  aud?: string;
  _decoded: any;
  /*refreshToken?: number;
  refreshTokenExpiryTime?: number;*/

   
}
