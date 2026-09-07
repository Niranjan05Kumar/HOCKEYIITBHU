import { useEffect, useState } from "react";

/**
 * Custom hook to debounce any fast-changing value (e.g. search input).
 * @param value The raw input value
 * @param delayMs Debounce delay in milliseconds (default: 300ms)
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delayMs);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delayMs]);

    return debouncedValue;
}

export default useDebounce;
