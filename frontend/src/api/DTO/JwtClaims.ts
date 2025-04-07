export class JwtClaims {
  name: string = '';
  nickname: string = '';
  email: string | any = '';
  id: string = '';
  role: string[] = [];
  exp?: number;
  iss?: string;
  aud?: string;
 
   
}
