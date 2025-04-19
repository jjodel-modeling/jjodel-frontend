import Api, {Response} from "../api";
import Storage from "../../data/storage";
import {DUser, U} from "../../joiner";
import {jwtDecode} from "jwt-decode";
import { RegisterRequest } from "../DTO/RegisterRequest";
import { LoginRequest } from "../DTO/LoginRequest";
import { JwtClaims } from "../DTO/JwtClaims";
import { JwtPayloadKey } from "../memorec/types";
import {ResetPasswordRequest} from "../DTO/ResetPasswordRequest";
import {ConfirmAccountRequest} from "../DTO/ConfirmAccountRequest"; //

class AuthApi {

    static async login(loginRequest: LoginRequest): Promise<Response> {
        Storage.write('offline', false);

        return await Api.post(`${Api.persistance}/account/login`, {...loginRequest}, true);

    }
  
    static async register(request: RegisterRequest): Promise<Response> {
        Storage.write('offline', false);
        return await Api.post(`${Api.persistance}/account/register`, {...request}, true);
    
    }

    static async reset_password(request: ResetPasswordRequest): Promise<Response> {
        return await Api.post(`${Api.persistance}/account/resetPasswordWithEmail`, {...request}, true);
    }


    static async logout(): Promise<void> {
        Api.token = null;

        U.resetState();
        Storage.reset();
    }
    static async confirmAccount(request: ConfirmAccountRequest): Promise<Response> {
        return await Api.post(`${Api.persistance}/account/confirm`, {...request}, true);
    }


    static offline(): void {
        Storage.write('offline', true);
        DUser.current = DUser.offline()?.id||'';
    }

    // decode jwt
    static readJwtToken(token: string): JwtClaims | null {
        try {
            const decoded = jwtDecode<any>(token);
            
            const claims : JwtClaims = new JwtClaims();

            claims.id = decoded[JwtPayloadKey.Id];
            claims.nickname = decoded[JwtPayloadKey.Nickname];
            console.log("readJwtToken per nickname", claims.nickname);
            claims.email = decoded[JwtPayloadKey.Email];
            claims.role = decoded[JwtPayloadKey.Roles];
            claims.exp = decoded[JwtPayloadKey.Exp];
            claims.iss = decoded[JwtPayloadKey.Iss];
            claims.aud = decoded[JwtPayloadKey.Aud];

           return claims;

        } catch (error) {
            
            console.error("Errore durante la decodifica del token:", error);
            return null;
        }
    }

    // write storage
    static storeSessionData(token: string, tokenExp: number, user :DUser): void {
        Storage.write('token', token);
        Storage.write('tokenExp', tokenExp);
        Storage.write('user', user);
        Storage.write('offline', false);
    }
}

export {AuthApi};
