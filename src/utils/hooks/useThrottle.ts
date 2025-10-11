import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A custom hook that throttles a value.
 * @template T - The type of the value to be throttled.
 * @param {T} value - The value to be throttled.
 * @param {number} [limit=300] - The time limit in milliseconds between updates.
 * @returns {T} The throttled value.
 *
 * @example
 * const [scrollY, setScrollY] = useState(0);
 * const throttledScrollY = useThrottle(scrollY, 100);
 *
 * useEffect(() => {
 *   const handleScroll = () => setScrollY(window.scrollY);
 *   window.addEventListener('scroll', handleScroll);
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, []);
 *
 * // throttledScrollY will update at most every 100ms during scroll
 */
function useThrottle<T>(value: T, limit: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());
  const lastValue = useRef<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      } else {
        // Store the latest value to be used when the timeout completes
        lastValue.current = value;
        
        // Set up a new timeout for the remaining time
        const remainingTime = limit - (Date.now() - lastRan.current);
        setTimeout(() => {
          setThrottledValue(lastValue.current);
          lastRan.current = Date.now();
        }, remainingTime);
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

export default useThrottle;
