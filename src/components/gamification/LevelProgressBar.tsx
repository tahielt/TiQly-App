import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface LevelProgressBarProps {
    level: number;
    progress: number; // 0 to 1
    xpToNext: number;
}

const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ level, progress, xpToNext }) => {
    const progressWidth = useSharedValue(0);

    useEffect(() => {
        progressWidth.value = withTiming(progress * 100, { duration: 1000 });
    }, [progress]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progressWidth.value}%`,
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.levelText}>LVL {level}</Text>
                <Text style={styles.xpText}>{xpToNext} XP to Lvl {level + 1}</Text>
            </View>

            <View style={styles.track}>
                <Animated.View style={[styles.barContainer, animatedStyle]}>
                    <LinearGradient
                        colors={['#00D9FF', '#00FFFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.bar}
                    />
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
        alignItems: 'center',
    },
    levelText: {
        color: '#00D9FF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    xpText: {
        color: '#666',
        fontSize: 10,
    },
    track: {
        height: 6,
        backgroundColor: '#1A1A1A',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barContainer: {
        height: '100%',
    },
    bar: {
        flex: 1,
        borderRadius: 3,
    },
});

export default LevelProgressBar;
