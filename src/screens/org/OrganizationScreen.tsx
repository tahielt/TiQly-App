import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { organizationService } from '../../services/organizationService';
import { OrganizationMember, Organization } from '../../types/organization';

const OrganizationScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [organizations, setOrganizations] = useState<OrganizationMember[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<OrganizationMember[]>([]);

    const loadData = async () => {
        try {
            const context = await organizationService.getUserOrgContext();
            setOrganizations(context.organizations.filter(o =>
                o.role === 'owner' || o.role === 'manager'
            ));

            const invitations = await organizationService.getPendingInvitations();
            setPendingInvitations(invitations);
        } catch (error) {
            console.error('Error loading org data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAcceptInvitation = async (memberId: string) => {
        const success = await organizationService.acceptInvitation(memberId);
        if (success) {
            loadData();
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00D9FF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <LinearGradient
                colors={['#1a1a1a', '#0D0D0D']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Mi Organización</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Ionicons name="add-circle" size={28} color="#00D9FF" />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); loadData(); }}
                        tintColor="#00D9FF"
                    />
                }
            >
                {/* Pending Invitations */}
                {pendingInvitations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📩 Invitaciones Pendientes</Text>
                        {pendingInvitations.map((inv) => (
                            <View key={inv.id} style={styles.invitationCard}>
                                <View style={styles.invitationInfo}>
                                    <Text style={styles.orgName}>{inv.organization?.name}</Text>
                                    <Text style={styles.roleText}>Rol: {inv.role}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.acceptButton}
                                    onPress={() => handleAcceptInvitation(inv.id)}
                                >
                                    <Text style={styles.acceptButtonText}>Aceptar</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* My Organizations */}
                {organizations.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🏢 Mis Organizaciones</Text>
                        {organizations.map((member) => (
                            <TouchableOpacity key={member.id} style={styles.orgCard}>
                                <View style={styles.orgIcon}>
                                    <Ionicons name="business" size={24} color="#00D9FF" />
                                </View>
                                <View style={styles.orgInfo}>
                                    <Text style={styles.orgName}>{member.organization?.name}</Text>
                                    <Text style={styles.roleText}>
                                        {member.role === 'owner' ? '👑 Dueño' : '👔 Manager'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#666" />
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="business-outline" size={64} color="#333" />
                        <Text style={styles.emptyTitle}>Sin organizaciones</Text>
                        <Text style={styles.emptySubtitle}>
                            Creá tu primera organización para empezar a vender tickets
                        </Text>
                        <TouchableOpacity style={styles.createButton}>
                            <LinearGradient
                                colors={['#00D9FF', '#00B4CC']}
                                style={styles.createButtonGradient}
                            >
                                <Ionicons name="add" size={20} color="#000" />
                                <Text style={styles.createButtonText}>Crear Organización</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0D',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0D0D0D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFF',
    },
    addButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 12,
    },
    invitationCard: {
        backgroundColor: 'rgba(255, 157, 0, 0.1)',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 157, 0, 0.3)',
    },
    invitationInfo: {
        flex: 1,
    },
    acceptButton: {
        backgroundColor: '#00D9FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    acceptButtonText: {
        color: '#000',
        fontWeight: '600',
    },
    orgCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    orgIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 217, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    orgInfo: {
        flex: 1,
    },
    orgName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 2,
    },
    roleText: {
        fontSize: 14,
        color: '#888',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFF',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 24,
    },
    createButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    createButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        gap: 8,
    },
    createButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default OrganizationScreen;
