import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { isObject } from './helpers';

type StorageKey = '@auth_token' | '@user_data' | '@app_settings' | string;

/**
 * Gets an item from AsyncStorage
 */
export const getItem = async <T = string>(
  key: StorageKey,
  defaultValue: T | null = null
): Promise<T | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return defaultValue;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  } catch (error) {
    console.error(`Error getting item from storage: ${key}`, error);
    return defaultValue;
  }
};

/**
 * Sets an item in AsyncStorage
 */
export const setItem = async (
  key: StorageKey,
  value: unknown
): Promise<boolean> => {
  try {
    const item = isObject(value) || Array.isArray(value)
      ? JSON.stringify(value)
      : String(value);

    await AsyncStorage.setItem(key, item);
    return true;
  } catch (error) {
    console.error(`Error setting item in storage: ${key}`, error);
    return false;
  }
};

/**
 * Removes an item from AsyncStorage
 */
export const removeItem = async (key: StorageKey): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing item from storage: ${key}`, error);
    return false;
  }
};

/**
 * Clears all items from AsyncStorage
 */
export const clear = async (): Promise<boolean> => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing storage', error);
    return false;
  }
};

/**
 * Gets multiple items from AsyncStorage
 */
export const multiGet = async <T = any>(
  keys: StorageKey[]
): Promise<Record<string, T | null>> => {
  try {
    const results = await AsyncStorage.multiGet(keys);
    return results.reduce<Record<string, T | null>>((acc, [key, value]) => {
      try {
        acc[key] = value !== null ? JSON.parse(value) : null;
      } catch {
        acc[key] = value as unknown as T;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error('Error getting multiple items from storage', error);
    return keys.reduce<Record<string, null>>((acc, key) => {
      acc[key] = null;
      return acc;
    }, {});
  }
};

/**
 * Sets multiple items in AsyncStorage
 */
export const multiSet = async (
  items: [StorageKey, unknown][]
): Promise<boolean> => {
  try {
    const stringifiedItems = items.map(([key, value]) => [
      key,
      isObject(value) || Array.isArray(value)
        ? JSON.stringify(value)
        : String(value),
    ]) as [string, string][];

    await AsyncStorage.multiSet(stringifiedItems);
    return true;
  } catch (error) {
    console.error('Error setting multiple items in storage', error);
    return false;
  }
};

/**
 * Removes multiple items from AsyncStorage
 */
export const multiRemove = async (keys: StorageKey[]): Promise<boolean> => {
  try {
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch (error) {
    console.error('Error removing multiple items from storage', error);
    return false;
  }
};

/**
 * Gets all keys from AsyncStorage
 */
export const getAllKeys = async (): Promise<string[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return [...keys]; // Convert readonly array to mutable
  } catch (error) {
    console.error('Error getting all storage keys', error);
    return [];
  }
};

/**
 * Secure storage functions for sensitive data
 */
export const secureStorage = {
  /**
   * Saves a value to secure storage
   */
  save: async (key: string, value: string): Promise<boolean> => {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.error('Error saving to secure storage', error);
      return false;
    }
  },

  /**
   * Gets a value from secure storage
   */
  get: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting from secure storage', error);
      return null;
    }
  },

  /**
   * Deletes a value from secure storage
   */
  delete: async (key: string): Promise<boolean> => {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error('Error deleting from secure storage', error);
      return false;
    }
  },
};

/**
 * Storage wrapper with type safety
 */
export const storage = {
  get: getItem,
  set: setItem,
  remove: removeItem,
  clear,
  multiGet,
  multiSet,
  multiRemove,
  getAllKeys,
  secure: secureStorage,
};

export default storage;
