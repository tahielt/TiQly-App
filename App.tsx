import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useEffect, useRef } from 'react';
import { registerForPushNotifications, setupNotificationListeners } from './src/services/notificationService';

export default function App() {
  const notificationCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    registerForPushNotifications();
    notificationCleanupRef.current = setupNotificationListeners();
    return () => notificationCleanupRef.current?.();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}
