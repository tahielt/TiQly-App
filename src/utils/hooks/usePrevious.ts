import { useRef, useEffect } from 'react';

/**
 * A custom hook that tracks the previous value of a variable.
 * @template T - The type of the value to track.
 * @param {T} value - The value to track.
 * @returns {T | undefined} The previous value.
 *
 * @example
 * function Component({ value }) {
 *   const prevValue = usePrevious(value);
 *   
 *   useEffect(() => {
 *     if (prevValue !== undefined && prevValue !== value) {
 *       console.log(`Value changed from ${prevValue} to ${value}`);
 *     }
 *   }, [value, prevValue]);
 *   
 *   return <div>Current: {value}, Previous: {String(prevValue)}</div>;
 * }
 */
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

export default usePrevious;
