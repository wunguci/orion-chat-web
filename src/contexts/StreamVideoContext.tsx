import {
    StreamVideo,
    StreamVideoClient,
    useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isStreamVideoEnabled } from '../config/webrtcIce';
import { streamVideoApi } from '../services/streamVideoApi';

type StreamVideoRuntime = {
    clientReady: boolean;
    error: string | null;
};

const StreamVideoRuntimeContext = createContext<StreamVideoRuntime>({
    clientReady: false,
    error: null,
});

export const useStreamVideoRuntime = () => useContext(StreamVideoRuntimeContext);
export const useOptionalStreamVideoClient = () => useStreamVideoClient();

type StreamVideoProviderProps = {
    children: React.ReactNode;
    user: {
        userId?: string;
        id?: string;
        name?: string;
        fullName?: string;
        avatarUrl?: string;
    };
};

export function StreamVideoProvider({ children, user }: StreamVideoProviderProps) {
    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [error, setError] = useState<string | null>(null);
    const enabled = isStreamVideoEnabled();

    const userId = user.userId || user.id || '';
    const userName = user.fullName || user.name || 'User';

    useEffect(() => {
        let cancelled = false;

        if (!enabled || !userId) {
            setClient(null);
            setError(null);
            return;
        }

        const setup = async () => {
            try {
                setError(null);
                const tokenResponse = await streamVideoApi.getToken({
                    userId,
                    name: userName,
                    image: user.avatarUrl,
                });

                if (cancelled) return;

                const streamClient = StreamVideoClient.getOrCreateInstance({
                    apiKey: tokenResponse.apiKey,
                    user: {
                        id: tokenResponse.user.id,
                        name: tokenResponse.user.name || userName,
                        image: tokenResponse.user.image || user.avatarUrl,
                    },
                    tokenProvider: async () => {
                        const fresh = await streamVideoApi.getToken({
                            userId,
                            name: userName,
                            image: user.avatarUrl,
                        });
                        return fresh.token;
                    },
                });

                setClient(streamClient);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Cannot initialize Stream video');
                setClient(null);
            }
        };

        void setup();

        return () => {
            cancelled = true;
        };
    }, [enabled, user.avatarUrl, userId, userName]);

    useEffect(() => {
        return () => {
            void client?.disconnectUser();
        };
    }, [client]);

    const runtime = useMemo(
        () => ({
            clientReady: Boolean(client),
            error,
        }),
        [client, error],
    );

    if (!client) {
        return (
            <StreamVideoRuntimeContext.Provider value={runtime}>
                {children}
            </StreamVideoRuntimeContext.Provider>
        );
    }

    return (
        <StreamVideoRuntimeContext.Provider value={runtime}>
            <StreamVideo client={client}>{children}</StreamVideo>
        </StreamVideoRuntimeContext.Provider>
    );
}
