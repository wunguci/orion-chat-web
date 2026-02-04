import clsx, { type ClassValue } from "clsx";

/**
 * Utility function để merge Tailwind classes
 * Ví dụ: cn('px-4', 'py-2', condition && 'bg-blue-500')
 */
export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}