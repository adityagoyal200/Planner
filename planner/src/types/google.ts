export interface GoogleCredentialResponse {
    credential: string;
}

export interface GoogleTokenResponse {
    access_token?: string;
}

export interface GoogleTokenClient {
    requestAccessToken: (options: { prompt?: string }) => void;
}

export interface GoogleOAuth2 {
    initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
    }) => GoogleTokenClient;
    revoke: (token: string) => void;
}

export interface GoogleIdentity {
    initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
    }) => void;
    renderButton: (
        parent: HTMLElement,
        options: {
            theme: string;
            size: string;
            shape: string;
            text: string;
            width: number;
        }
    ) => void;
}

export interface GoogleApi {
    accounts?: {
        id?: GoogleIdentity;
        oauth2?: GoogleOAuth2;
    };
}

declare global {
    interface Window {
        google?: GoogleApi;
    }
}
