import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A custom hook that debounces a value.
 * @template T - The type of the value to be debounced.
 * @param {T} value - The value to be debounced.
 * @param {number} [delay=500] - The delay in milliseconds for debouncing.
 * @returns {T} The debounced value.
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     // Perform search or API call
 *     fetchResults(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 */
function useDebounce<T>(value: T, delay: number = 500): T {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  // Store the timeout ID
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear the timeout when the component unmounts or when the delay changes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Update the debounced value after the specified delay
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to clear the timeout if the value changes before the delay
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
