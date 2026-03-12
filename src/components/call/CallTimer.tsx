import type React from "react";
import { useEffect, useState } from "react";

export const CallTimer: React.FC<{startTime: number}> = ({startTime}) => {
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setDuration(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime])

    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    return (
        <span className="text-white font-mono">
            {minutes.toString().padStart(2, '0')}:
            {seconds.toString().padStart(2, '0')}
        </span>
    )
}