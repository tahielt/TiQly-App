import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/auth';

const AUTH_KEY = '@TiqlyApp:auth';

export const StorageService = {
  // Guardar datos de autenticación
  async saveAuthData(user: User) {
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Error al guardar datos de autenticación:', error);
      return false;
    }
  },

  // Obtener datos de autenticación
  async getAuthData(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem(AUTH_KEY);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error al obtener datos de autenticación:', error);
      return null;
    }
  },
  
  // FUNCIÓN DE EJEMPLO QUE REQUIERE CORRECCIÓN DE TIPADO
  // Si tienes una función similar que llama a multiGet, aplica el spread operator.
  async loadMultipleItems(keys: string[]) {
    try {
      // CORRECCIÓN: AsyncStorage.multiGet devuelve un array 'readonly' (solo lectura).
      // Usamos el operador spread [...] para crear una copia mutable (lectura y escritura).
      const result = [...(await AsyncStorage.multiGet(keys))];
      return result;
    } catch (error) {
      console.error('Error al obtener múltiples ítems:', error);
      return [];
    }
  },

  // Eliminar datos de autenticación
  async removeAuthData() {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
      return true;
    } catch (error) {
      console.error('Error al eliminar datos de autenticación:', error);
      return false;
    }
  },

  // Limpiar todo el almacenamiento
  async clearAll() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error al limpiar el almacenamiento:', error);
      return false;
    }
  },
};

export default StorageService;
