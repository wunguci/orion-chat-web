const parseIceUrls = (value?: string) =>
  (value || "")
    .split(",")
    .map((url) => url.trim())
    .filter(
      (url) =>
        Boolean(url) &&
        (url.startsWith("stun:") ||
          url.startsWith("stuns:") ||
          url.startsWith("turn:") ||
          url.startsWith("turns:")),
    );

export const isStreamVideoEnabled = () =>
  (import.meta.env.VITE_ENABLE_STREAM_VIDEO as string | undefined) === "true";

export const getIceConfiguration = (): RTCConfiguration => {
  const iceUrls =
    (import.meta.env.VITE_ICE_URLS as string | undefined) ||
    (import.meta.env.VITE_TURN_URLS as string | undefined);
  const iceUsername =
    (import.meta.env.VITE_ICE_USERNAME as string | undefined) ||
    (import.meta.env.VITE_TURN_USERNAME as string | undefined);
  const iceCredential =
    (import.meta.env.VITE_ICE_CREDENTIAL as string | undefined) ||
    (import.meta.env.VITE_TURN_CREDENTIAL as string | undefined);
  const forceRelayEnv =
    (import.meta.env.VITE_FORCE_TURN_RELAY as string | undefined) === "true";
  const allowPublicStun =
    (import.meta.env.VITE_ALLOW_PUBLIC_STUN as string | undefined) !== "false";
  const isLocalhost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const forceRelay = forceRelayEnv && !isLocalhost;

  const iceServers: RTCIceServer[] = [];
  const parsedIceUrls = parseIceUrls(iceUrls);

  if (parsedIceUrls.length > 0) {
    const hasTurn = parsedIceUrls.some(
      (url) => url.startsWith("turn:") || url.startsWith("turns:"),
    );

    iceServers.push({
      urls: parsedIceUrls,
      ...(hasTurn && iceUsername && iceCredential
        ? { username: iceUsername, credential: iceCredential }
        : {}),
    });
  }

  if (allowPublicStun) {
    iceServers.push(
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    );
  }

  if (iceServers.length === 0) {
    console.warn(
      "[WebRTC] No ICE servers configured. Calls may only work on the same network.",
    );
  }

  return {
    iceServers,
    iceCandidatePoolSize: 10,
    iceTransportPolicy: forceRelay ? "relay" : "all",
  };
};
