import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withDelay,
    withTiming
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface DailyRewardModalProps {
    visible: boolean;
    streak: number;
    xpBonus: number;
    onClose: () => void;
}

const { width } = Dimensions.get('window');

const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ visible, streak, xpBonus, onClose }) => {
    const scale = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = withSequence(
                withTiming(0, { duration: 0 }),
                withSpring(1, { damping: 12 })
            );
            rotate.value = withDelay(300, withSequence(
                withTiming(15, { duration: 100 }),
                withTiming(-15, { duration: 100 }),
                withTiming(0, { duration: 100 })
            ));
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value },
                { rotate: `${rotate.value}deg` }
            ]
        };
    });

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />

                <Animated.View style={[styles.card, animatedStyle]}>
                    <LinearGradient
                        colors={['rgba(20,20,20,0.95)', 'rgba(10,10,10,0.98)']}
                        style={styles.gradient}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="flame" size={48} color="#FF6B00" />
                        </View>

                        <Text style={styles.title}>DAILY STREAK!</Text>

                        <View style={styles.streakRow}>
                            <Text style={styles.streakValue}>{streak}</Text>
                            <Text style={styles.streakLabel}>DAYS</Text>
                        </View>

                        <Text style={styles.xpText}>+{xpBonus} XP Received</Text>

                        <TouchableOpacity onPress={onClose} style={styles.button}>
                            <LinearGradient
                                colors={['#00D9FF', '#00A0C0']}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>CLAIM</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    card: {
        width: width * 0.8,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        shadowColor: '#00D9FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    gradient: {
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,107,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,107,0,0.3)',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    streakValue: {
        color: '#fff',
        fontSize: 48,
        fontWeight: '900',
        textShadowColor: 'rgba(255,107,0,0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    streakLabel: {
        color: '#FF6B00',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    xpText: {
        color: '#00D9FF',
        fontSize: 16,
        marginBottom: 24,
        opacity: 0.8,
    },
    button: {
        width: '100%',
        height: 48,
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
    },
});

export default DailyRewardModal;
