import { useEffect, useRef } from "react";
import { useCall } from "../../hooks/useCall";
import { CallControls } from "./CallControls";
import { FaUser } from "react-icons/fa";
import { FiCamera } from "react-icons/fi";
import { CallTimer } from "./CallTimer";

export const CallModal: React.FC = () => {
    const {status, localStream, remoteStream, callType, otherUser, isVideoEnabled, startTime, error} = useCall();
    
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // gắn luồng local vào video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // gắn luồng remote vào video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // không hiển thị modal nếu idle
    if (status === 'idle') return null;

    return  (
        <div className="fixed inset-0 bg-black z-50">
            {/* remote video (full screen) */}
            <div className="relative w-full h-full">
                {status === 'connected' && remoteStream ? (
                    <video 
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
                        <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                            <FaUser className="text-6xl text-gray-500" />
                        </div>
                        <h2 className="text-white text-2xl mb-2">
                            {otherUser?.name || 'Unknown'}
                        </h2>
                        <p className="text-gray-400">
                            {status === 'calling' && 'Calling...'}
                            {status === 'ringing' && 'Ringing...'}
                            {status === 'connected' && 'Connected'}
                            {status === 'failed' && error}
                        </p>
                    </div>
                )}

                {/* local video (picture-in-picture) */}
                {callType === 'video' && localStream && (
                    <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                        {isVideoEnabled ? (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                        ): (
                            <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                <FiCamera className="text-4xl"/>
                            </div>
                        )}
                    </div>
                )}

                {/* call timer */}
                {status === 'connected' && startTime && (
                    <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-lg">
                        <CallTimer startTime={startTime}/>
                    </div>
                )}

                {/* controls */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <CallControls />
                </div>
            </div>  
        </div>
    )
}