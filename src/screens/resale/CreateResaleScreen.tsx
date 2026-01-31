/**
 * CreateResaleScreen - Screen to list a ticket for resale
 * Follows TiQly Sci-Fi/Dopamine design system
 * 
 * Features:
 * - Price input with live fee calculation
 * - Fee breakdown preview
 * - Glassmorphism UI
 * - Haptic feedback
 */

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createResaleListing, calculateResaleFees } from '../../services/resaleService';
import { useSelector } from 'react-redux';

interface RouteParams {
    orderId: string;
    ticketInfo: {
        eventTitle: string;
        eventDate: string;
        ticketTypeName: string;
        originalPrice: number;
    };
}

const CreateResaleScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as RouteParams;

    const [askingPrice, setAskingPrice] = useState('');
    const [loading, setLoading] = useState(false);

    // Get user from Redux state
    const user = useSelector((state: any) => state.auth?.user);

    // Calculate fees in real-time
    const fees = useMemo(() => {
        const price = parseFloat(askingPrice) || 0;
        return calculateResaleFees(price);
    }, [askingPrice]);

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const handlePriceChange = (text: string) => {
        // Only allow numbers
        const cleaned = text.replace(/[^0-9]/g, '');
        setAskingPrice(cleaned);
        Haptics.selectionAsync();
    };

    const handlePublish = async () => {
        if (!askingPrice || parseFloat(askingPrice) <= 0) {
            Alert.alert('Error', 'Ingresá un precio válido');
            return;
        }

        if (!user?.id) {
            Alert.alert('Error', 'Debés iniciar sesión para publicar');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);

        try {
            await createResaleListing({
                orderId: params.orderId,
                askingPrice: parseFloat(askingPrice),
                expiresInDays: 30
            }, user.id);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                '¡Publicado!',
                'Tu ticket está ahora en el marketplace.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.message || 'No se pudo publicar el ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0a0a0a', '#1a1a2e', '#0a0a0a']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Publicar en Reventa</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Ticket info card */}
                    <BlurView intensity={20} tint="dark" style={styles.ticketCard}>
                        <Text style={styles.eventTitle}>{params?.ticketInfo?.eventTitle || 'Evento'}</Text>
                        <Text style={styles.eventDate}>{params?.ticketInfo?.eventDate || ''}</Text>
                        {params?.ticketInfo?.ticketTypeName && (
                            <View style={styles.tierBadge}>
                                <Text style={styles.tierText}>{params.ticketInfo.ticketTypeName}</Text>
                            </View>
                        )}
                        {params?.ticketInfo?.originalPrice && (
                            <Text style={styles.originalPrice}>
                                Precio original: {formatCurrency(params.ticketInfo.originalPrice)}
                            </Text>
                        )}
                    </BlurView>

                    {/* Price input */}
                    <View style={styles.priceSection}>
                        <Text style={styles.sectionTitle}>¿A cuánto lo querés vender?</Text>
                        <Text style={styles.sectionSubtitle}>
                            Mercado libre - Vos elegís el precio
                        </Text>

                        <View style={styles.priceInputContainer}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                                style={styles.priceInput}
                                placeholder="0"
                                placeholderTextColor="#444"
                                keyboardType="numeric"
                                value={askingPrice}
                                onChangeText={handlePriceChange}
                                maxLength={10}
                            />
                        </View>
                    </View>

                    {/* Fee breakdown */}
                    {parseFloat(askingPrice) > 0 && (
                        <BlurView intensity={20} tint="dark" style={styles.feeCard}>
                            <Text style={styles.feeTitle}>Desglose de la venta</Text>

                            <View style={styles.feeRow}>
                                <Text style={styles.feeLabel}>Tu precio</Text>
                                <Text style={styles.feeValue}>{formatCurrency(fees.askingPrice)}</Text>
                            </View>

                            <View style={styles.feeRow}>
                                <View style={styles.feeWithInfo}>
                                    <Text style={styles.feeLabel}>Comisión TiQly (10%)</Text>
                                    <Ionicons name="information-circle-outline" size={14} color="#666" />
                                </View>
                                <Text style={styles.feeValueNegative}>-{formatCurrency(fees.sellerCommission)}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.feeRow}>
                                <Text style={styles.totalLabel}>VAS A RECIBIR</Text>
                                <Text style={styles.totalValue}>{formatCurrency(fees.sellerReceives)}</Text>
                            </View>

                            <View style={styles.buyerNote}>
                                <Ionicons name="information-circle" size={16} color="#00FFFF" />
                                <Text style={styles.buyerNoteText}>
                                    El comprador pagará {formatCurrency(fees.buyerPays)} (+5% service fee)
                                </Text>
                            </View>
                        </BlurView>
                    )}

                    {/* Info cards */}
                    <View style={styles.infoCards}>
                        <View style={styles.infoCard}>
                            <Ionicons name="shield-checkmark" size={20} color="#00FF88" />
                            <Text style={styles.infoText}>Pago seguro</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <Ionicons name="flash" size={20} color="#00FFFF" />
                            <Text style={styles.infoText}>Transferencia instantánea</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <Ionicons name="timer" size={20} color="#FFAA00" />
                            <Text style={styles.infoText}>30 días de publicación</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Publish button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.publishButton,
                            (!askingPrice || parseFloat(askingPrice) <= 0) && styles.publishButtonDisabled
                        ]}
                        onPress={handlePublish}
                        disabled={loading || !askingPrice || parseFloat(askingPrice) <= 0}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Ionicons name="pricetag" size={20} color="#000" />
                                <Text style={styles.publishButtonText}>
                                    PUBLICAR POR {formatCurrency(fees.askingPrice || 0)}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    ticketCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    eventTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    eventDate: {
        color: '#888',
        fontSize: 14,
        marginBottom: 8,
    },
    tierBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(0,255,255,0.3)',
        marginBottom: 8,
    },
    tierText: {
        color: '#00FFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    originalPrice: {
        color: '#666',
        fontSize: 12,
    },
    priceSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    sectionSubtitle: {
        color: '#00FFFF',
        fontSize: 14,
        marginBottom: 20,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: 'rgba(0,255,255,0.3)',
    },
    currencySymbol: {
        color: '#00FFFF',
        fontSize: 36,
        fontWeight: 'bold',
        marginRight: 8,
    },
    priceInput: {
        flex: 1,
        color: '#fff',
        fontSize: 48,
        fontWeight: 'bold',
    },
    feeCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    feeTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    feeWithInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    feeLabel: {
        color: '#888',
        fontSize: 14,
    },
    feeValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    feeValueNegative: {
        color: '#FF6B6B',
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 12,
    },
    totalLabel: {
        color: '#00FFFF',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    totalValue: {
        color: '#00FFFF',
        fontSize: 24,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,255,255,0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    buyerNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        padding: 12,
        backgroundColor: 'rgba(0,255,255,0.05)',
        borderRadius: 8,
    },
    buyerNoteText: {
        color: '#888',
        fontSize: 12,
        flex: 1,
    },
    infoCards: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    infoCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        color: '#888',
        fontSize: 10,
        textAlign: 'center',
    },
    footer: {
        padding: 16,
        paddingBottom: 24,
    },
    publishButton: {
        backgroundColor: '#00FFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
    },
    publishButtonDisabled: {
        backgroundColor: '#333',
    },
    publishButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CreateResaleScreen;
