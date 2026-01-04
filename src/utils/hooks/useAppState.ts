import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

type AppStateType = {
  currentState: AppStateStatus;
  previousState?: AppStateStatus;
  isActive: boolean;
  isInactive: boolean;
  isBackground: boolean;
};

/**
 * A custom hook that tracks the app's state (active, background, inactive).
 * @returns {AppStateType} An object containing the current and previous app state.
 *
 * @example
 * function AppStateExample() {
 *   const appState = useAppState();
 *   
 *   useEffect(() => {
 *     if (appState.isActive) {
 *       // App came to the foreground
 *       console.log('App is active');
 *     } else if (appState.isBackground) {
 *       // App went to the background
 *       console.log('App is in background');
 *     }
 *   }, [appState.isActive, appState.isBackground]);
 *   
 *   return (
 *     <View>
 *       <Text>Current state: {appState.currentState}</Text>
 *       <Text>Previous state: {appState.previousState || 'N/A'}</Text>
 *     </View>
 *   );
 * }
 */
function useAppState() {
  const [appState, setAppState] = useState<AppStateType>(() => ({
    currentState: AppState.currentState,
    previousState: undefined,
    isActive: AppState.currentState === 'active',
    isInactive: AppState.currentState === 'inactive',
    isBackground: AppState.currentState === 'background',
  }));

  const previousAppState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setAppState(prevState => ({
        currentState: nextAppState,
        previousState: prevState.currentState,
        isActive: nextAppState === 'active',
        isInactive: nextAppState === 'inactive',
        isBackground: nextAppState === 'background',
      }));
      
      previousAppState.current = nextAppState;
    };

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial state check (especially important for Android)
    if (Platform.OS === 'android') {
      handleAppStateChange(AppState.currentState);
    }

    // Clean up the subscription on unmount
    return () => {
      // @ts-ignore - removeEventListener is available in newer versions of React Native
      if (subscription?.remove) {
        subscription.remove();
      } else {
        // Fallback for older versions of React Native
        // @ts-ignore - AppState.removeEventListener exists in older versions
        AppState.removeEventListener('change', handleAppStateChange);
      }
    };
  }, []);

  return appState;
}

export default useAppState;
