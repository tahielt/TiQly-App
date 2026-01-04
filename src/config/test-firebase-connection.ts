import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Test function to verify Firebase connection
 * @returns Promise<boolean> - True if connection is successful, false otherwise
 */
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Try to fetch a test collection (it's okay if it doesn't exist)
    const querySnapshot = await getDocs(collection(db, 'test_connection'));
    console.log('✅ Firebase connection successful!');
    console.log(`📊 Test collection contains ${querySnapshot.size} documents`);
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testFirebaseConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}
