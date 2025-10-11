import { useState, useEffect } from 'react';
import { Keyboard, KeyboardEventListener, KeyboardMetrics, Platform } from 'react-native';

type KeyboardEventName = 'keyboardWillShow' | 'keyboardDidShow' | 'keyboardWillHide' | 'keyboardDidHide' | 'keyboardWillChangeFrame' | 'keyboardDidChangeFrame';

type KeyboardState = {
  isVisible: boolean;
  height: number;
  endCoordinates?: KeyboardMetrics;
  startCoordinates?: KeyboardMetrics;
  duration?: number;
  easing?: string;
};

const defaultState: KeyboardState = {
  isVisible: false,
  height: 0,
};

/**
 * A custom hook that tracks the keyboard state.
 * @returns {KeyboardState} An object containing keyboard visibility and dimensions.
 *
 * @example
 * function InputWithKeyboardAvoidance() {
 *   const { isVisible, height } = useKeyboard();
 *   
 *   return (
 *     <KeyboardAvoidingView
 *       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
 *       style={styles.container}
 *       keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
 *     >
 *       <ScrollView contentContainerStyle={styles.inner}>
 *         <TextInput
 *           style={styles.textInput}
 *           placeholder="Tap me..."
 *         />
 *         <Text>Keyboard is {isVisible ? 'visible' : 'hidden'}</Text>
 *         <Text>Keyboard height: {height}</Text>
 *       </ScrollView>
 *     </KeyboardAvoidingView>
 *   );
 * }
 */
function useKeyboard() {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>(defaultState);

  const handleKeyboardEvent: KeyboardEventListener = (event) => {
    setKeyboardState({
      isVisible: event.endCoordinates.screenY < 1000, // Simple heuristic for keyboard visibility
      height: event.endCoordinates.height,
      endCoordinates: event.endCoordinates,
      startCoordinates: event.startCoordinates,
      duration: event.duration,
      easing: event.easing,
    });
  };

  const handleKeyboardWillShow: KeyboardEventListener = (event) => {
    handleKeyboardEvent(event);
  };

  const handleKeyboardDidShow: KeyboardEventListener = (event) => {
    handleKeyboardEvent(event);
  };

  const handleKeyboardWillHide: KeyboardEventListener = (event) => {
    handleKeyboardEvent(event);
  };

  const handleKeyboardDidHide: KeyboardEventListener = (event) => {
    handleKeyboardEvent(event);
  };

  const handleKeyboardWillChangeFrame: KeyboardEventListener = (event) => {
    // Only update if the keyboard is visible
    if (keyboardState.isVisible) {
      handleKeyboardEvent(event);
    }
  };

  const handleKeyboardDidChangeFrame: KeyboardEventListener = (event) => {
    // Only update if the keyboard is visible
    if (keyboardState.isVisible) {
      handleKeyboardEvent(event);
    }
  };

  useEffect(() => {
    const showEvent: KeyboardEventName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent: KeyboardEventName = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const willChangeFrameEvent: KeyboardEventName = 'keyboardWillChangeFrame';
    const didChangeFrameEvent: KeyboardEventName = 'keyboardDidChangeFrame';

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardDidShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardDidHide);
    const willShowSubscription = Keyboard.addListener('keyboardWillShow', handleKeyboardWillShow);
    const willHideSubscription = Keyboard.addListener('keyboardWillHide', handleKeyboardWillHide);
    const willChangeFrameSubscription = Keyboard.addListener(willChangeFrameEvent, handleKeyboardWillChangeFrame);
    const didChangeFrameSubscription = Keyboard.addListener(didChangeFrameEvent, handleKeyboardDidChangeFrame);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      willShowSubscription.remove();
      willHideSubscription.remove();
      willChangeFrameSubscription.remove();
      didChangeFrameSubscription.remove();
    };
  }, [keyboardState.isVisible]);

  return keyboardState;
}

export default useKeyboard;
