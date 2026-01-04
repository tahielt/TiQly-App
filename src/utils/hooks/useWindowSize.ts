import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

type WindowDimensions = {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
};

/**
 * A custom hook that tracks the dimensions of the window.
 * @returns {WindowDimensions} An object containing width, height, scale, and fontScale of the window.
 *
 * @example
 * function ResponsiveComponent() {
 *   const { width, height } = useWindowSize();
 *   
 *   const isMobile = width < 768;
 *   
 *   return (
 *     <View style={{
 *       flex: 1,
 *       padding: isMobile ? 10 : 20,
 *     }}>
 *       <Text>Window width: {width}px</Text>
 *       <Text>Window height: {height}px</Text>
 *     </View>
 *   );
 * }
 */
function useWindowSize(): WindowDimensions {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height, scale, fontScale } = Dimensions.get('window');
    return { width, height, scale, fontScale };
  });

  useEffect(() => {
    const onChange = ({
      window: { width, height, scale, fontScale },
    }: {
      window: ScaledSize;
      screen: ScaledSize;
    }) => {
      setDimensions({ width, height, scale, fontScale });
    };

    // Set initial dimensions
    const subscription = Dimensions.addEventListener('change', onChange);

    // Clean up the event listener on unmount
    return () => {
      subscription?.remove();
    };
  }, []);

  return dimensions;
}

export default useWindowSize;
