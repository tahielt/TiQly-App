import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
} from 'react-native-reanimated';

interface SlotMachineTickerProps {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    style?: TextStyle;
    formatAsCurrency?: boolean;
}

const SlotMachineTicker: React.FC<SlotMachineTickerProps> = ({
    value,
    duration = 800,
    prefix = '',
    suffix = '',
    decimals = 0,
    style,
    formatAsCurrency = false,
}) => {
    const animatedValue = useSharedValue(0);
    const [displayValue, setDisplayValue] = React.useState('0');
    const previousValue = useRef(0);

    useEffect(() => {
        animatedValue.value = withTiming(value, {
            duration,
            easing: Easing.out(Easing.cubic),
        });

        const startValue = previousValue.current;
        const endValue = value;
        const startTime = Date.now();

        const updateDisplay = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (endValue - startValue) * easedProgress;

            let formatted: string;
            if (formatAsCurrency) {
                formatted = currentValue.toLocaleString('es-AR', {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                });
            } else {
                formatted = currentValue.toFixed(decimals);
            }

            setDisplayValue(`${prefix}${formatted}${suffix}`);

            if (progress < 1) {
                requestAnimationFrame(updateDisplay);
            }
        };

        updateDisplay();
        previousValue.current = value;
    }, [value, duration, prefix, suffix, decimals, formatAsCurrency]);

    return (
        <Text style={[styles.ticker, style]}>
            {displayValue}
        </Text>
    );
};

const styles = StyleSheet.create({
    ticker: {
        fontVariant: ['tabular-nums'],
        fontWeight: '900',
        color: '#fff',
        fontSize: 24,
    },
});

export default SlotMachineTicker;
