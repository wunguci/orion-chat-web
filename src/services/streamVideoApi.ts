const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_SOCKET_URL ||
    'http://localhost:3000';

export type StreamVideoTokenResponse = {
    apiKey: string;
    token: string;
    user: {
        id: string;
        name?: string;
        image?: string;
    };
};

export const streamVideoApi = {
    async getToken(payload?: {
        userId?: string;
        name?: string;
        image?: string;
    }): Promise<StreamVideoTokenResponse> {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/stream-video/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload || {}),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Stream video token failed: ${response.status}`);
        }

        return (await response.json()) as StreamVideoTokenResponse;
    },
};
