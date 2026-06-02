import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Loader } from 'lucide-react';

interface VideoMessageProps {
    videoUrl: string;
    fileName?: string;
    onClick?: () => void;
}

/**
 * VideoMessage Component
 * Displays video with thumbnail and inline playback capability
 *
 * Features:
 * - Thumbnail with play button overlay
 * - Click to expand to inline video player
 * - Fixed 16:9 aspect ratio
 * - Loading spinner during buffering
 * - Proper message list layout preservation
 * - Video controls, metadata preloading, and inline play support
 */
const VideoMessageComponent: React.FC<VideoMessageProps> = ({
    videoUrl,
    fileName = 'Video',
    onClick,
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [thumbnailError, setThumbnailError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Memoize videoUrl to prevent re-generation on parent re-render
    // Generate thumbnail from video first frame
    useEffect(() => {
        let isMounted = true;
        setThumbnail(null);
        setThumbnailError(false);

        const video = document.createElement('video');
        video.src = videoUrl;
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';

        const handleLoadedMetadata = () => {
            if (!isMounted) return;
            console.log('Video metadata loaded for:', fileName);
            // Set video to first frame
            video.currentTime = 0.1; // Use 0.1 instead of 0 to ensure frame is loaded
        };

        const handleSeeked = () => {
            if (!isMounted) return;
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // 16:9 aspect ratio
                canvas.width = 320;
                canvas.height = 180;

                ctx.drawImage(video, 0, 0, 320, 180);
                const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
                setThumbnail(thumbnailUrl);
                console.log('Thumbnail generated for:', fileName);
            } catch (error) {
                console.error('Error generating video thumbnail:', error);
                setThumbnailError(true);
            }
        };

        const handleError = (e: Event) => {
            if (!isMounted) return;
            console.error('Error loading video for thumbnail:', videoUrl, e);
            setThumbnailError(true);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('seeked', handleSeeked);
        video.addEventListener('error', handleError);

        // Trigger load
        console.log('Loading video thumbnail for:', videoUrl);
        video.load();

        return () => {
            isMounted = false;
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('seeked', handleSeeked);
            video.removeEventListener('error', handleError);
        };
    }, [videoUrl, fileName]);

    const handlePlayClick = useCallback(() => {
        console.log('Play clicked for:', fileName);
        setIsPlaying(true);
        setTimeout(() => {
            if (videoRef.current) {
                // Only play if video is paused
                if (videoRef.current.paused) {
                    const playPromise = videoRef.current.play();

                    // Some browsers don't return a promise
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                console.log('Video playing');
                            })
                            .catch((error: any) => {
                                // Ignore AbortError (interrupted by pause)
                                if (error.name === 'AbortError') {
                                    console.log('Video play interrupted');
                                } else {
                                    console.error('Error playing video:', error);
                                }
                            });
                    }
                }
            }
        }, 100);
        onClick?.();
    }, [onClick, fileName]);

    const handleCloseVideo = useCallback(() => {
        console.log('Close video clicked');
        setIsPlaying(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, []);

    const handleLoadStart = useCallback(() => {
        setIsLoading(true);
    }, []);

    const handleCanPlay = useCallback(() => {
        setIsLoading(false);
    }, []);

    const handlePlaying = useCallback(() => {
        setIsLoading(false);
    }, []);

    const handleWaiting = useCallback(() => {
        setIsLoading(true);
    }, []);

    // Thumbnail View - Before Play
    if (!isPlaying) {
        return (
            <div className="relative inline-block">
                {/* Thumbnail Container with fixed 16:9 aspect ratio */}
                <div className="relative w-64 aspect-video bg-black rounded-lg overflow-hidden group cursor-pointer">
                    {thumbnail ? (
                        <img
                            src={thumbnail}
                            alt={fileName}
                            className="w-full h-full object-cover"
                        />
                    ) : thumbnailError ? (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                            <div className="text-center">
                                <Play
                                    size={32}
                                    className="text-white/30 mx-auto mb-2"
                                />
                                <p className="text-xs text-white/50">
                                    Thumbnail Error
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <div className="animate-pulse">
                                <div className="flex items-center justify-center bg-gray-700 rounded-full p-4">
                                    <Play size={24} className="text-white/50" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Play Button Overlay */}
                    <button
                        onClick={() => {
                            handlePlayClick();
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all duration-200 group-hover:bg-opacity-50"
                        title="Click to play video"
                    >
                        <div className="flex items-center justify-center bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transition-all duration-200 transform group-hover:scale-110">
                            <Play
                                size={28}
                                className="text-gray-900 fill-gray-900 ml-1"
                            />
                        </div>
                    </button>

                    {/* Video Duration or Filename Badge */}
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded pointer-events-none">
                        {fileName}
                    </div>
                </div>
            </div>
        );
    }

    // Video Player View - After Play
    return (
        <div className="relative inline-block">
            {/* Video Container with fixed 16:9 aspect ratio */}
            <div className="relative w-64 aspect-video bg-black rounded-lg overflow-hidden">
                {/* Video Element */}
                <video
                    key={`video-${videoUrl}`}
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    preload="metadata"
                    playsInline
                    autoPlay
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain"
                    onLoadStart={handleLoadStart}
                    onCanPlay={handleCanPlay}
                    onPlaying={handlePlaying}
                    onWaiting={handleWaiting}
                />

                {/* Loading Spinner */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 pointer-events-none">
                        <div className="flex items-center justify-center bg-white bg-opacity-10 rounded-full p-4">
                            <Loader
                                size={32}
                                className="text-white animate-spin"
                            />
                        </div>
                    </div>
                )}

                {/* Close Button */}
                <button
                    onClick={handleCloseVideo}
                    className="absolute top-2 right-2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full p-1 transition-all duration-200 z-10"
                    title="Close video"
                >
                    <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// Memoize component to prevent unnecessary re-renders from parent
export const VideoMessage = React.memo(VideoMessageComponent);

export default VideoMessage;
