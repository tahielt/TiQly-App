import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A custom hook that provides a simple interface to AsyncStorage with state synchronization.
 * @template T - The type of the stored value.
 * @param {string} key - The key to store the value under.
 * @param {T} initialValue - The initial value to use if no value is found in storage.
 * @param {boolean} [sync=true] - Whether to sync the value with AsyncStorage.
 * @returns {[T, (value: T | ((val: T) => T)) => Promise<void>, boolean]} A tuple containing the current value, a function to update the value, and a loading state.
 *
 * @example
 * function UserPreferences() {
 *   const [theme, setTheme, isLoading] = useAsyncStorage('user-theme', 'light');
 *
 *   const toggleTheme = () => {
 *     setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
 *   };
 *
 *   if (isLoading) {
 *     return <ActivityIndicator />;
 *   }
 *
 *   return (
 *     <View>
 *       <Text>Current theme: {theme}</Text>
 *       <Button title="Toggle Theme" onPress={toggleTheme} />
 *     </View>
 *   );
 * }
 */
type UseAsyncStorageReturn<T> = [
  T,
  (value: T | ((val: T) => T)) => Promise<void>,
  boolean,
  {
    removeItem: () => Promise<void>;
    clearStorage: () => Promise<void>;
  }
];

function useAsyncStorage<T>(
  key: string,
  initialValue: T,
  sync: boolean = true
): UseAsyncStorageReturn<T> {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState<boolean>(sync);

  // Load the stored value from AsyncStorage when the component mounts
  useEffect(() => {
    const loadStoredValue = async () => {
      if (!sync) {
        setIsLoading(false);
        return;
      }

      try {
        const item = await AsyncStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item) as T);
        }
      } catch (error) {
        console.error(`Error loading data for key "${key}" from AsyncStorage:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredValue();
  }, [key, sync]);

  // Update AsyncStorage when the stored value changes
  const setValue = useCallback(
    async (value: T | ((val: T) => T)): Promise<void> => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save to state
        setStoredValue(valueToStore);

        // Save to AsyncStorage if sync is enabled
        if (sync) {
          await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting data for key "${key}" in AsyncStorage:`, error);
      }
    },
    [key, storedValue, sync]
  );

  // Function to remove the item from AsyncStorage
  const removeItem = useCallback(async (): Promise<void> => {
    try {
      setStoredValue(initialValue);
      if (sync) {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing data for key "${key}" from AsyncStorage:`, error);
    }
  }, [key, initialValue, sync]);

  // Function to clear all AsyncStorage
  const clearStorage = useCallback(async (): Promise<void> => {
    try {
      setStoredValue(initialValue);
      if (sync) {
        await AsyncStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  }, [initialValue, sync]);

  // Return the stored value, setter function, loading state, and utility functions
  return [
    storedValue,
    setValue,
    isLoading,
    {
      removeItem,
      clearStorage,
    },
  ];
}

export default useAsyncStorage;
