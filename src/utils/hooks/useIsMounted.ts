import { useRef, useEffect, useCallback } from 'react';

/**
 * A custom hook that tracks whether the component is mounted.
 * @returns {() => boolean} A function that returns the current mounted state.
 *
 * @example
 * function Component() {
 * const isMounted = useIsMounted();
 * * useEffect(() => {
 * const fetchData = async () => {
 * const data = await someAsyncOperation();
 * * // Only update state if the component is still mounted
 * if (isMounted()) {
 * setData(data);
 * }
 * };
 * * fetchData();
 * * return () => {
 * // Cleanup logic
 * };
 * }, []);
 * * return <div>Component Content</div>;
 * }
 */
function useIsMounted() {
  const isMounted = useRef(false);
  
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Usamos useCallback para asegurar que la función devuelta sea estable
  return useCallback(() => isMounted.current, []);
}

export default useIsMounted;
