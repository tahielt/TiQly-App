import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    interpolateColor
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import HypeIndexWidget from './HypeIndexWidget';

interface Ticket {
    id: string;
    section: string;
    row: string;
    seat: string;
    basePrice: number;
    askingPrice: number;
    currency: string;
}

interface TicketCardProps {
    ticket: Ticket;
    onPress: (ticket: Ticket) => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onPress }) => {
    const isHighDemand = ticket.askingPrice >= ticket.basePrice * 2;
    const glowOpacity = useSharedValue(0);

    useEffect(() => {
        if (isHighDemand) {
            glowOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.6, { duration: 1000 }),
                    withTiming(0.2, { duration: 1000 })
                ),
                -1,
                true
            );
        }
    }, [isHighDemand]);

    const handlePress = () => {
        if (isHighDemand) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.selectionAsync();
        }
        onPress(ticket);
    };

    const glowStyle = useAnimatedStyle(() => {
        return {
            shadowColor: '#00FFFF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: glowOpacity.value,
            shadowRadius: 20,
            borderColor: interpolateColor(
                glowOpacity.value,
                [0.2, 0.6],
                ['rgba(0,255,255,0.1)', 'rgba(0,255,255,0.6)']
            )
        };
    });

    return (
        <Animated.View style={[styles.container, isHighDemand && glowStyle]}>
            <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
                <BlurView intensity={isHighDemand ? 40 : 20} tint="dark" style={styles.glassContent}>
                    <View style={styles.header}>
                        <View style={styles.seatInfo}>
                            <Text style={styles.sectionText}>SEC {ticket.section}</Text>
                            <Text style={styles.rowSeatText}>Row {ticket.row} • Seat {ticket.seat}</Text>
                        </View>
                        {isHighDemand && (
                            <View style={styles.demandBadge}>
                                <Ionicons name="flame" size={12} color="#000" />
                                <Text style={styles.demandText}>HIGH DEMAND</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.body}>
                        <View>
                            <Text style={styles.priceLabel}>ASKING PRICE</Text>
                            <Text style={[styles.priceValue, isHighDemand && styles.neonText]}>
                                ${ticket.askingPrice.toLocaleString()}
                            </Text>
                        </View>

                        <HypeIndexWidget
                            basePrice={ticket.basePrice}
                            askingPrice={ticket.askingPrice}
                        />
                    </View>

                    <View style={styles.circuitDecoration} />
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    glassContent: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    seatInfo: {
        gap: 4,
    },
    sectionText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 18,
        letterSpacing: 0.5,
    },
    rowSeatText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '500',
    },
    demandBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00FFFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    demandText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
    },
    body: {
        gap: 8,
    },
    priceLabel: {
        color: '#666',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 2,
    },
    priceValue: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    neonText: {
        color: '#00FFFF',
        textShadowColor: 'rgba(0,255,255,0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    circuitDecoration: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 60,
        height: 60,
        borderRightWidth: 2,
        borderBottomWidth: 2,
        borderColor: 'rgba(255,255,255,0.05)',
        borderBottomRightRadius: 16,
    }
});

export default TicketCard;
