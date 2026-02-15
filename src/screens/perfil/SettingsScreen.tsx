import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { logoutUser } from '../../features/auth/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

const APP_VERSION = '1.0.0';

const SettingsScreen = ({ navigation }: any) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    // Toggle states
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailNotifs, setEmailNotifs] = useState(false);
    const [eventReminders, setEventReminders] = useState(true);
    const [socialNotifs, setSocialNotifs] = useState(true);
    const [publicProfile, setPublicProfile] = useState(true);

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que querés cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sí, salir', style: 'destructive', onPress: () => dispatch(logoutUser()) },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            '⚠️ Eliminar Cuenta',
            'Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus datos, tickets y eventos.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sí, eliminar',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            '¿Estás completamente seguro?',
                            'Escribí "ELIMINAR" para confirmar (función deshabilitada en MVP).',
                            [
                                { text: 'Cancelar', style: 'cancel' },
                                {
                                    text: 'Entendido',
                                    onPress: () => Alert.alert('ℹ️', 'La eliminación de cuenta estará disponible en la versión final.')
                                },
                            ]
                        );
                    }
                },
            ]
        );
    };

    const renderToggleItem = (
        icon: string,
        iconColor: string,
        bgColor: string,
        title: string,
        subtitle: string,
        value: boolean,
        onToggle: (val: boolean) => void
    ) => (
        <View style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
                <Ionicons name={icon as any} size={22} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>{title}</Text>
                <Text style={styles.menuSubtext}>{subtitle}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#333', true: 'rgba(0,217,255,0.3)' }}
                thumbColor={value ? '#00D9FF' : '#666'}
                ios_backgroundColor="#333"
            />
        </View>
    );

    const renderLinkItem = (
        icon: string,
        iconColor: string,
        bgColor: string,
        title: string,
        subtitle: string,
        onPress: () => void
    ) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
                <Ionicons name={icon as any} size={22} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>{title}</Text>
                {subtitle ? <Text style={styles.menuSubtext}>{subtitle}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#444" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ajustes</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Notificaciones */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notificaciones</Text>
                    {renderToggleItem(
                        'notifications-outline', '#00D9FF', 'rgba(0,217,255,0.1)',
                        'Push Notifications', 'Recibir alertas en tu celular',
                        pushEnabled, setPushEnabled
                    )}
                    {renderToggleItem(
                        'mail-outline', '#9B59B6', 'rgba(155,89,182,0.1)',
                        'Notificaciones por Email', 'Resumen semanal y novedades',
                        emailNotifs, setEmailNotifs
                    )}
                    {renderToggleItem(
                        'alarm-outline', '#FF9500', 'rgba(255,149,0,0.1)',
                        'Recordatorios de Eventos', 'Avisos antes de cada evento',
                        eventReminders, setEventReminders
                    )}
                    {renderToggleItem(
                        'chatbubble-outline', '#00FF9D', 'rgba(0,255,157,0.1)',
                        'Actividad Social', 'Likes, comentarios y seguidores',
                        socialNotifs, setSocialNotifs
                    )}
                </View>

                {/* Privacidad */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Privacidad</Text>
                    {renderToggleItem(
                        'eye-outline', '#00D9FF', 'rgba(0,217,255,0.1)',
                        'Perfil Público', 'Otros usuarios pueden ver tu actividad',
                        publicProfile, setPublicProfile
                    )}
                    {renderLinkItem(
                        'document-text-outline', '#fff', 'rgba(255,255,255,0.05)',
                        'Política de Privacidad', '',
                        () => Linking.openURL('https://tiqly.app/privacy')
                    )}
                    {renderLinkItem(
                        'reader-outline', '#fff', 'rgba(255,255,255,0.05)',
                        'Términos y Condiciones', '',
                        () => Linking.openURL('https://tiqly.app/terms')
                    )}
                </View>

                {/* Acerca de */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acerca de</Text>
                    <View style={styles.aboutCard}>
                        <LinearGradient
                            colors={['rgba(0,217,255,0.08)', 'rgba(0,0,0,0)']}
                            style={styles.aboutGradient}
                        >
                            <Text style={styles.aboutLogo}>
                                Ti<Text style={{ color: '#00D9FF' }}>Q</Text>ly
                            </Text>
                            <Text style={styles.aboutVersion}>Versión {APP_VERSION} (MVP)</Text>
                            <Text style={styles.aboutCopyright}>
                                © 2025 Tironi Van Den Muysenberg T.R.
                            </Text>
                            <Text style={styles.aboutTagline}>
                                La venta de entradas hecha adictiva.
                            </Text>
                        </LinearGradient>
                    </View>

                    {renderLinkItem(
                        'star-outline', '#FFD700', 'rgba(255,215,0,0.1)',
                        'Calificar la App', 'Dejanos tu opinión en la Store',
                        () => Alert.alert('ℹ️', 'Disponible cuando la app esté publicada en las stores.')
                    )}
                    {renderLinkItem(
                        'chatbubbles-outline', '#00D9FF', 'rgba(0,217,255,0.1)',
                        'Contactar Soporte', 'soporte@tiqly.app',
                        () => Linking.openURL('mailto:soporte@tiqly.app')
                    )}
                    {renderLinkItem(
                        'logo-instagram', '#E4405F', 'rgba(228,64,95,0.1)',
                        'Seguinos en Instagram', '@tiqly.app',
                        () => Linking.openURL('https://instagram.com/tiqly.app')
                    )}
                </View>

                {/* Zona de peligro */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: '#FF4444' }]}>Zona de Peligro</Text>

                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="#FF4444" />
                        <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
                        <Ionicons name="trash-outline" size={22} color="#FF4444" />
                        <Text style={styles.deleteText}>Eliminar Cuenta</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    content: {
        paddingTop: 16,
        paddingBottom: 120,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    sectionTitle: {
        color: '#444',
        fontSize: 13,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 16,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    menuSubtext: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    aboutCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,217,255,0.15)',
    },
    aboutGradient: {
        padding: 24,
        alignItems: 'center',
    },
    aboutLogo: {
        color: '#fff',
        fontSize: 36,
        fontWeight: '900',
        marginBottom: 8,
    },
    aboutVersion: {
        color: '#00D9FF',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    aboutCopyright: {
        color: '#666',
        fontSize: 11,
        marginBottom: 12,
    },
    aboutTagline: {
        color: '#444',
        fontSize: 13,
        fontStyle: 'italic',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(255,68,68,0.08)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,68,68,0.15)',
        gap: 10,
        marginBottom: 12,
    },
    logoutText: {
        color: '#FF4444',
        fontSize: 16,
        fontWeight: '700',
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(255,68,68,0.04)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,68,68,0.08)',
        gap: 10,
    },
    deleteText: {
        color: '#FF4444',
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.7,
    },
});

export default SettingsScreen;
