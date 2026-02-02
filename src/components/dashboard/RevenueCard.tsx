import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import SlotMachineTicker from './SlotMachineTicker';
import { OrganizerRevenue } from '../../types/dashboard';

interface RevenueCardProps {
    revenue: OrganizerRevenue;
    feePercentage?: number;
}

const NEON_CYAN = '#00D9FF';
const NEON_GREEN = '#00FF9D';

const RevenueCard: React.FC<RevenueCardProps> = ({
    revenue,
    feePercentage = 10
}) => {
    const barWidth = useSharedValue(0);

    React.useEffect(() => {
        const netRatio = revenue.netProfit / revenue.grossRevenue;
        barWidth.value = withTiming(netRatio * 100, {
            duration: 1000,
            easing: Easing.out(Easing.cubic),
        });
    }, [revenue]);

    const animatedBarStyle = useAnimatedStyle(() => ({
        width: `${barWidth.value}%`,
    }));

    return (
        <View style={styles.container}>
            <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
                <LinearGradient
                    colors={['rgba(0,255,157,0.05)', 'rgba(0,0,0,0.6)']}
                    style={styles.innerGradient}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>REVENUE</Text>
                        <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                    </View>

                    <View style={styles.mainSection}>
                        <View style={styles.revenueRow}>
                            <View style={styles.revenueItem}>
                                <Text style={styles.revenueLabel}>Gross</Text>
                                <SlotMachineTicker
                                    value={revenue.grossRevenue}
                                    prefix="$"
                                    formatAsCurrency
                                    style={styles.grossValue}
                                />
                            </View>
                            <Ionicons name="arrow-forward" size={20} color="#444" />
                            <View style={styles.revenueItem}>
                                <Text style={styles.revenueLabelNet}>Net Profit</Text>
                                <SlotMachineTicker
                                    value={revenue.netProfit}
                                    prefix="$"
                                    formatAsCurrency
                                    style={styles.netValue}
                                />
                            </View>
                        </View>

                        <View style={styles.barContainer}>
                            <View style={styles.barBackground}>
                                <Animated.View style={[styles.barFill, animatedBarStyle]}>
                                    <LinearGradient
                                        colors={[NEON_GREEN, NEON_CYAN]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                </Animated.View>
                            </View>
                            <Text style={styles.barLabel}>
                                {((revenue.netProfit / revenue.grossRevenue) * 100).toFixed(0)}% retained
                            </Text>
                        </View>
                    </View>

                    <View style={styles.feeSection}>
                        <View style={styles.feeRow}>
                            <View style={styles.feeInfo}>
                                <Ionicons name="remove-circle-outline" size={14} color={NEON_CYAN} />
                                <Text style={styles.feeText}>TiQly Fee ({feePercentage}%)</Text>
                            </View>
                            <Text style={styles.feeValue}>
                                -${revenue.platformFee.toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.feeDivider} />
                        <View style={styles.feeRow}>
                            <View style={styles.feeInfo}>
                                <Ionicons name="repeat" size={14} color="#888" />
                                <Text style={styles.feeText}>Resale Volume</Text>
                            </View>
                            <SlotMachineTicker
                                value={revenue.resaleVolume}
                                style={styles.resaleValue}
                            />
                        </View>
                    </View>
                </LinearGradient>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        borderRadius: 20,
        overflow: 'hidden',
    },
    blurContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,255,157,0.2)',
    },
    innerGradient: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        color: NEON_GREEN,
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 2,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,255,157,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,255,157,0.3)',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: NEON_GREEN,
    },
    liveText: {
        color: NEON_GREEN,
        fontSize: 9,
        fontWeight: 'bold',
    },
    mainSection: {
        marginBottom: 16,
    },
    revenueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    revenueItem: {
        flex: 1,
    },
    revenueLabel: {
        color: '#666',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    revenueLabelNet: {
        color: NEON_GREEN,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
        textAlign: 'right',
    },
    grossValue: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
    },
    netValue: {
        color: NEON_GREEN,
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'right',
    },
    barContainer: {
        gap: 6,
    },
    barBackground: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
        overflow: 'hidden',
    },
    barLabel: {
        color: '#666',
        fontSize: 10,
        textAlign: 'right',
    },
    feeSection: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 12,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    feeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    feeText: {
        color: '#888',
        fontSize: 12,
    },
    feeValue: {
        color: NEON_CYAN,
        fontSize: 13,
        fontWeight: 'bold',
    },
    feeDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 4,
    },
    resaleValue: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
});

export default RevenueCard;
