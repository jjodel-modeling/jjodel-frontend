export class TokenResponse {
    token?: string; // per andrea: questi sono davvero opzionali? mi pare un errore.
    expires?: string; // as date
    refreshToken?: string;
    refreshTokenExpiryTime?: number;
}