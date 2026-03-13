import Api, {Response} from "../api";
import Storage from "../../data/storage";
import {DUser, GObject, Log, R, U} from "../../joiner";
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
        return await Api.post(`${U.env('JODEL_PERSISTANCE')}/account/login`, {...loginRequest}, true);
    }
  
    static async register(request: RegisterRequest): Promise<Response> {
        Storage.write('offline', false);
        return await Api.post(`${U.env('JODEL_PERSISTANCE')}/account/register`, {...request}, true);
    }

    static async reset_password(request: ResetPasswordRequest): Promise<Response> {
        return await Api.post(`${U.env('JODEL_PERSISTANCE')}/account/resetPasswordWithEmail`, {...request}, true);
    }


    static async logout(): Promise<void> {
        await Api.revokeToken();
        Storage.resetLogin();
        // U.resetState();
        R.navigate('/auth');
    }
    static async confirmAccount(request: ConfirmAccountRequest): Promise<Response> {
        return await Api.post(`${U.env('JODEL_PERSISTANCE')}/account/confirm`, {...request}, true);
    }


    static offline(): void {
        Storage.write('offline', true);
        DUser.current = DUser.offline()?.id||'';
    }

    // decode jwt
    static readJwtToken(token: string): JwtClaims | null {
        let claims : JwtClaims = undefined as any;
        let decoded: GObject = undefined as any;
        try {
            const decoded = jwtDecode<any>(token);
            claims = new JwtClaims();
            console.log('claims debug', {decoded, JwtPayloadKey, claims})

            claims.id = decoded[JwtPayloadKey.Id];
            claims.nickname = decoded[JwtPayloadKey.Nickname];
            claims.email = decoded[JwtPayloadKey.Email];
            claims.role = decoded[JwtPayloadKey.Roles];
            claims.exp = decoded[JwtPayloadKey.Exp];
            claims.iss = decoded[JwtPayloadKey.Iss];
            claims.aud = decoded[JwtPayloadKey.Aud];
            claims._Id = decoded[JwtPayloadKey._Id];
           //  claims._decoded = decoded;
            return claims;
        } catch (error) {
            console.error("token decode error:", {error, claims, token, decoded});
            return null;
        }
    }
}

export {AuthApi};
