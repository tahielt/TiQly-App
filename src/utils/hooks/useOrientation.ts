import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

type Orientation = 'portrait' | 'landscape';

/**
 * A custom hook that tracks the device's orientation.
 * @returns {Orientation} The current orientation ('portrait' or 'landscape').
 *
 * @example
 * function ResponsiveComponent() {
 *   const orientation = useOrientation();
 *   
 *   return (
 *     <View style={{
 *       flex: 1,
 *       flexDirection: orientation === 'portrait' ? 'column' : 'row',
 *     }}>
 *       <View style={{ flex: 1 }} />
 *       <View style={{ flex: 1 }} />
 *     </View>
 *   );
 * }
 */
function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(() => {
    const { width, height } = Dimensions.get('window');
    return width < height ? 'portrait' : 'landscape';
  });

  useEffect(() => {
    const onChange = ({
      window: { width, height },
    }: {
      window: ScaledSize;
      screen: ScaledSize;
    }) => {
      setOrientation(width < height ? 'portrait' : 'landscape');
    };

    // Set initial orientation
    const subscription = Dimensions.addEventListener('change', onChange);

    // Clean up the event listener on unmount
    return () => {
      subscription?.remove();
    };
  }, []);

  return orientation;
}

export default useOrientation;
