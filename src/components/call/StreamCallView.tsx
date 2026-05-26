import {
  CallControls,
  CallingState,
  SpeakerLayout,
  StreamCall,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOptionalStreamVideoClient, useStreamVideoRuntime } from "../../contexts/StreamVideoContext";

type StreamCallViewProps = {
  conversationId?: string | null;
  mode: "direct" | "group";
  title: string;
  memberIds: string[];
  custom?: Record<string, unknown>;
  onLeave: () => void;
  fallback?: React.ReactNode;
};

const normalizeMemberIds = (memberIds: string[]) => [
  ...new Set(memberIds.map((id) => String(id || "").trim()).filter(Boolean)),
];

function StreamCallBody({ title, onLeave }: { title: string; onLeave: () => void }) {
  const navigate = useNavigate();
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      navigate("/chat");
    }
  }, [callingState, navigate]);

  return (
    <div className="w-screen h-screen bg-slate-950 text-white flex flex-col">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-xs text-white/60">{callingState}</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <SpeakerLayout />
      </div>
      <div className="px-6 py-5 border-t border-white/10 flex justify-center">
        <CallControls
          onLeave={async () => {
            await call?.endCall();
            onLeave();
            navigate("/chat");
          }}
        />
      </div>
    </div>
  );
}

export function StreamCallView({
  conversationId,
  mode,
  title,
  memberIds,
  custom,
  onLeave,
  fallback,
}: StreamCallViewProps) {
  const runtime = useStreamVideoRuntime();
  const client = useOptionalStreamVideoClient();
  const [streamCall, setStreamCall] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const normalizedMemberIds = useMemo(() => normalizeMemberIds(memberIds), [memberIds]);
  const customJson = useMemo(() => JSON.stringify(custom || {}), [custom]);
  const streamCallId = conversationId ? `orion-${mode}-${conversationId}` : null;

  useEffect(() => {
    let cancelled = false;

    if (!runtime.clientReady || !client || !streamCallId) {
      setStreamCall(null);
      return;
    }

    const setup = async () => {
      try {
        setError(null);
        const nextCall = client.call("default", streamCallId);
        await nextCall.getOrCreate({
          ring: true,
          data: {
            members: normalizedMemberIds.map((userId) => ({ user_id: userId })),
            custom: {
              source: "orion-chat",
              mode,
              ...(customJson ? JSON.parse(customJson) : {}),
            },
          },
        });

        if (!cancelled) {
          setStreamCall(nextCall);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Cannot start Stream call");
          setStreamCall(null);
        }
      }
    };

    void setup();

    return () => {
      cancelled = true;
    };
  }, [client, customJson, mode, normalizedMemberIds, runtime.clientReady, streamCallId]);

  if (!runtime.clientReady || !client || !streamCallId) {
    return <>{fallback || null}</>;
  }

  if (error || runtime.error) {
    return (
      <div className="w-screen h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Call unavailable</h1>
          <p className="text-sm text-white/70">{error || runtime.error}</p>
        </div>
      </div>
    );
  }

  if (!streamCall) {
    return (
      <div className="w-screen h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-sm text-white/70">Starting call...</div>
      </div>
    );
  }

  return (
    <StreamCall call={streamCall}>
      <StreamCallBody title={title} onLeave={onLeave} />
    </StreamCall>
  );
}
