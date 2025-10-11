import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';

type BackHandlerProps = {
  enabled?: boolean;
  onBackPress?: () => boolean | null | undefined;
};

/**
 * A custom hook that handles the hardware back button on Android.
 * @param {BackHandlerProps} props - The hook configuration.
 * @param {boolean} [props.enabled=true] - Whether the back handler is enabled.
 * @param {() => (boolean | null | undefined)} [props.onBackPress] - The callback to be called when the back button is pressed.
 *
 * @example
 * function ScreenWithBackHandler() {
 *   useBackHandler({
 *     onBackPress: () => {
 *       if (shouldPreventBack) {
 *         // Show a confirmation dialog
 *         showConfirmationDialog();
 *         return true; // Prevent default behavior
 *       }
 *       return false; // Let default behavior
 *     },
 *   });
 *
 *   return <View>...</View>;
 * }
 */
function useBackHandler({ enabled = true, onBackPress }: BackHandlerProps = {}) {
  const backHandlerRef = useRef<(() => void) | null>(null);
  const isEnabled = enabled && Platform.OS === 'android';

  const handleBackPress = useCallback(() => {
    if (typeof onBackPress === 'function') {
      const shouldPreventDefault = onBackPress();
      // If the callback returns `true`, then we need to prevent the default back behavior
      return shouldPreventDefault === true;
    }
    // If no callback is provided, don't prevent default behavior
    return false;
  }, [onBackPress]);

  useEffect(() => {
    if (!isEnabled) {
      if (backHandlerRef.current) {
        backHandlerRef.current();
        backHandlerRef.current = null;
      }
      return;
    }

    // Add the back handler
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    backHandlerRef.current = () => {
      subscription.remove();
    };

    // Clean up the subscription on unmount or when dependencies change
    return () => {
      if (backHandlerRef.current) {
        backHandlerRef.current();
        backHandlerRef.current = null;
      }
    };
  }, [isEnabled, handleBackPress]);

  // Return a function to manually remove the back handler
  const removeBackHandler = useCallback(() => {
    if (backHandlerRef.current) {
      backHandlerRef.current();
      backHandlerRef.current = null;
    }
  }, []);

  return { removeBackHandler };
}

export default useBackHandler;
