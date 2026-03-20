/**
 * In-memory Token Manager
 * Strictly separates sensitive access tokens from local storage.
 */
class TokenManager {
    private accessToken: string | null = null;

    setToken(token: string) {
        this.accessToken = token;
    }

    getToken(): string | null {
        return this.accessToken;
    }

    clearToken() {
        this.accessToken = null;
    }

    hasToken(): boolean {
        return !!this.accessToken;
    }
}

export const tokenManager = new TokenManager();
