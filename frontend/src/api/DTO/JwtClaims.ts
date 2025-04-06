export class JwtClaims {
  name: string = '';
  nickname: string = '';
  email: string | any = '';
  id: string = '';
  role: string[] = []; // può contenere uno o più ruoli
  exp?: number;
  iss?: string;
  aud?: string;
 
   
}
