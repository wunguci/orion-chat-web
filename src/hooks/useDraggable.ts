import { useState, useCallback, useEffect, useRef } from 'react';

interface Position {
    x: number;
    y: number;
}

interface UseDraggableProps {
    initialPosition?: Position;
    handleRef?: React.RefObject<HTMLElement | null>; // Ref to the element that triggers dragging (e.g. header)
}

export const useDraggable = ({ initialPosition = { x: 0, y: 0 }, handleRef }: UseDraggableProps = {}) => {
    const [position, setPosition] = useState<Position>(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    
    // Store exact start coordinates
    const dragStartPos = useRef<Position>({ x: 0, y: 0 });
    const initialElementPos = useRef<Position>(initialPosition);

    const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement> | PointerEvent) => {
        // Only allow left click
        if ('button' in e && e.button !== 0) return;
        
        // Prevent dragging if interacting with inputs/buttons inside the handle
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON' || target.closest('button')) {
            return;
        }

        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        initialElementPos.current = position;

        // Prevent text selection while dragging
        document.body.style.userSelect = 'none';
        
        // Use setPointerCapture if we have a react event to track mouse even if it leaves the window
        if ('target' in e && 'setPointerCapture' in e.target && 'pointerId' in e) {
            try {
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
            } catch (err) {
                // Ignore capture errors
            }
        }
    }, [position]);

    const onPointerMove = useCallback((e: PointerEvent) => {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;

        setPosition({
            x: initialElementPos.current.x + deltaX,
            y: initialElementPos.current.y + deltaY,
        });
    }, [isDragging]);

    const onPointerUp = useCallback(() => {
        setIsDragging(false);
        document.body.style.userSelect = '';
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        } else {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        }

        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, [isDragging, onPointerMove, onPointerUp]);

    // If a handleRef is provided, attach the event listener directly to it
    useEffect(() => {
        const handleEl = handleRef?.current;
        if (handleEl) {
            // Assert type to ensure compatibility
            const listener = onPointerDown as unknown as EventListener;
            handleEl.addEventListener('pointerdown', listener);
            return () => {
                handleEl.removeEventListener('pointerdown', listener);
            };
        }
    }, [handleRef, onPointerDown]);

    return {
        position,
        isDragging,
        onPointerDown, // Always return it
        setPosition,
    };
};
