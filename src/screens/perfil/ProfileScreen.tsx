import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { logoutUser, updateUserProfile } from '../../features/auth/authSlice';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { clearAllTestData } from '../../lib/mock-data';
import { eventService } from '../../services/eventService';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { getUserGamificationState, UserGamificationState } from '../../services/xpService';
import { LevelProgressBar } from '../../components/gamification';

// Payment methods placeholder (will integrate with Mercado Pago later)
const PLACEHOLDER_PAYMENT_METHODS: any[] = [];

const ProfileScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  // Real stats from Supabase
  const [stats, setStats] = useState({ tickets: 0, events: 0, following: 0 });
  const [xpState, setXpState] = useState<UserGamificationState | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Edit Profile Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');

  // Password Modal State
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Payment Methods State (placeholder for Mercado Pago integration)
  const [paymentMethods, setPaymentMethods] = useState<{ id: string; type: string; last4: string; expiry: string; isDefault: boolean }[]>(PLACEHOLDER_PAYMENT_METHODS);
  const [addCardModalVisible, setAddCardModalVisible] = useState(false);

  // Load real stats from Supabase
  const loadStats = useCallback(async () => {
    if (!user?.id) return;
    setLoadingStats(true);
    try {
      // Count user's tickets
      const { count: ticketCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count unique events attended
      const { data: ordersData } = await supabase
        .from('tickets')
        .select('event_id')
        .eq('user_id', user.id);

      const uniqueEvents = new Set(ticketsData?.map(t => t.event_id) || []);

      setStats({
        tickets: ticketCount || 0,
        events: uniqueEvents.size,
        following: 0 // TODO: Implement following when social is ready
      });

      // Load Gamification State
      const gamificationState = await getUserGamificationState(user.id);
      setXpState(gamificationState);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

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

  // 📷 Pick Image from Gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para cambiar tu avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditAvatar(result.assets[0].uri);
    }
  };

  // 💾 Save Profile Changes
  const handleSaveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    // Mock save - in production this would call an API
    dispatch(updateUserProfile({ name: editName, phone: editPhone, avatar: editAvatar }));
    setEditModalVisible(false);
    Alert.alert('✅ Perfil Actualizado', 'Tus cambios fueron guardados correctamente.');
  };

  // 🔐 Handle Password Change (Real Supabase Auth)
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Completá la nueva contraseña');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('✅ Contraseña Actualizada', 'Tu contraseña fue cambiada exitosamente.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cambiar la contraseña');
    }
  };

  // 💳 Handle Add Card (Mock)
  const handleAddCard = () => {
    setAddCardModalVisible(false);
    const newCard = {
      id: Date.now().toString(),
      type: 'visa',
      last4: Math.floor(1000 + Math.random() * 9000).toString(),
      expiry: '12/28',
      isDefault: paymentMethods.length === 0,
    };
    setPaymentMethods([...paymentMethods, newCard]);
    Alert.alert('✅ Tarjeta Agregada', 'Tu nueva tarjeta fue guardada correctamente.');
  };

  // 🗑️ Delete Card
  const handleDeleteCard = (cardId: string) => {
    Alert.alert(
      'Eliminar Tarjeta',
      '¿Estás seguro que querés eliminar esta tarjeta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setPaymentMethods(paymentMethods.filter(c => c.id !== cardId))
        },
      ]
    );
  };

  // ⭐ Set Default Card
  const handleSetDefaultCard = (cardId: string) => {
    setPaymentMethods(paymentMethods.map(c => ({ ...c, isDefault: c.id === cardId })));
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'visa': return 'card';
      case 'mastercard': return 'card';
      default: return 'card-outline';
    }
  };

  const avatarUri = editAvatar || user?.avatar ||
    `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=00D9FF&color=000&size=256`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <TouchableOpacity style={styles.editAvatar} onPress={() => setEditModalVisible(true)}>
              <Ionicons name="pencil" size={18} color="#000" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || 'Nombre Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@tiqly.app'}</Text>
          {user?.phone && <Text style={styles.userPhone}>📱 {user.phone}</Text>}

          {xpState && (
            <View style={{ width: '80%', marginTop: 16 }}>
              <LevelProgressBar
                level={xpState.level}
                progress={xpState.progressToNextLevel}
                xpToNext={xpState.xpToNextLevel}
              />
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            {loadingStats ? (
              <ActivityIndicator size="small" color="#00D9FF" />
            ) : (
              <Text style={styles.statValue}>{stats.events}</Text>
            )}
            <Text style={styles.statLabel}>Eventos</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statItem}>
            {loadingStats ? (
              <ActivityIndicator size="small" color="#00D9FF" />
            ) : (
              <Text style={styles.statValue}>{stats.tickets}</Text>
            )}
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statItem}>
            {loadingStats ? (
              <ActivityIndicator size="small" color="#00D9FF" />
            ) : (
              <Text style={styles.statValue}>{stats.following}</Text>
            )}
            <Text style={styles.statLabel}>Siguiendo</Text>
          </View>
        </View>

        {/* ✏️ Mi Cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi Cuenta</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => setEditModalVisible(true)}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 217, 255, 0.1)' }]}>
              <Ionicons name="person-outline" size={22} color="#00D9FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>Editar Perfil</Text>
              <Text style={styles.menuSubtext}>Nombre, foto, teléfono</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setPasswordModalVisible(true)}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 255, 157, 0.1)' }]}>
              <Ionicons name="lock-closed-outline" size={22} color="#00FF9D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>Cambiar Contraseña</Text>
              <Text style={styles.menuSubtext}>Actualizar credenciales</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>
        </View>

        {/* 💳 Métodos de Pago */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Métodos de Pago</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setAddCardModalVisible(true)}
            >
              <Ionicons name="add" size={18} color="#00D9FF" />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {paymentMethods.length === 0 ? (
            <View style={styles.emptyPayment}>
              <Ionicons name="card-outline" size={40} color="#333" />
              <Text style={styles.emptyPaymentText}>No tenés tarjetas guardadas</Text>
              <Text style={styles.emptyPaymentSubtext}>Agregá una para comprar en 1 click</Text>
            </View>
          ) : (
            paymentMethods.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[styles.cardItem, card.isDefault && styles.cardItemDefault]}
                onPress={() => handleSetDefaultCard(card.id)}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name={getCardIcon(card.type)} size={24} color="#00D9FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardNumber}>
                    •••• •••• •••• {card.last4}
                  </Text>
                  <Text style={styles.cardExpiry}>Vence {card.expiry}</Text>
                </View>
                {card.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Predeterminada</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.deleteCardBtn}
                  onPress={() => handleDeleteCard(card.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ⚙️ Aplicación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicación</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.menuText}>Notificaciones</Text>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.menuText}>Privacidad y Seguridad</Text>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Ionicons name="help-circle-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.menuText}>Ayuda y Soporte</Text>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>
        </View>
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧪 Dev Tools (Demo)</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                Alert.alert(
                  'Limpiar Datos de Prueba',
                  '¿Eliminar todos los tickets comprados y eventos creados? (Los eventos de demo se mantienen)',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Sí, limpiar',
                      style: 'destructive',
                      onPress: async () => {
                        await clearAllTestData();
                        Alert.alert('✅ Listo', 'Todos los datos de prueba fueron eliminados. Recargá la app para ver los cambios.');
                      }
                    },
                  ]
                );
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255,157,0,0.1)' }]}>
                <Ionicons name="trash-outline" size={22} color="#FFA500" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>Limpiar Datos de Prueba</Text>
                <Text style={styles.menuSubtext}>Elimina tickets y eventos creados</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#444" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (!currentUser) {
                  Alert.alert("Error", "Debes estar logueado en Supabase");
                  return;
                }

                Alert.alert(
                  'Generar Eventos',
                  '¿Crear eventos de prueba (Gotham, Boris, etc.) en la base de datos real?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Sí, crear',
                      onPress: async () => {
                        try {
                          await eventService.seedEvents(currentUser.id);
                          Alert.alert('✅ Listo', 'Los eventos se han creado en Supabase. Recargá el mapa para verlos.');
                        } catch (error) {
                          console.error(error);
                          Alert.alert('❌ Error', 'Hubo un problema al crear los eventos. Revisa la consola.');
                        }
                      }
                    },
                  ]
                );
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 217, 255, 0.1)' }]}>
                <Ionicons name="cloud-upload-outline" size={22} color="#00D9FF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>Sembrar Eventos de Prueba</Text>
                <Text style={styles.menuSubtext}>Crea Gotham, Boris, Hash, etc.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#444" />
            </TouchableOpacity>
          </View>
        )}
<View style={{ flex: 1 }}>
              <Text style={styles.menuText}>Limpiar Datos de Prueba</Text>
              <Text style={styles.menuSubtext}>Elimina tickets y eventos creados</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={async () => {
              const { data: { user: currentUser } } = await supabase.auth.getUser();
              if (!currentUser) {
                Alert.alert("Error", "Debes estar logueado en Supabase");
                return;
              }

              Alert.alert(
                'Generar Eventos',
                '¿Crear eventos de prueba (Gotham, Boris, etc.) en la base de datos real?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Sí, crear',
                    onPress: async () => {
                      try {
                        await eventService.seedEvents(currentUser.id);
                        Alert.alert('✅ Listo', 'Los eventos se han creado en Supabase. Recargá el mapa para verlos.');
                      } catch (error) {
                        console.error(error);
                        Alert.alert('❌ Error', 'Hubo un problema al crear los eventos. Revisa la consola.');
                      }
                    }
                  },
                ]
              );
            }}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 217, 255, 0.1)' }]}>
              <Ionicons name="cloud-upload-outline" size={22} color="#00D9FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>Sembrar Eventos de Prueba</Text>
              <Text style={styles.menuSubtext}>Crea Gotham, Boris, Hash, etc.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FF4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.versionText}>TiQly v1.0.0 (MVP Demo)</Text>
        </View>
      </ScrollView>

      {/* 📝 Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Avatar Editor */}
            <TouchableOpacity style={styles.avatarEditor} onPress={pickImage}>
              <Image source={{ uri: editAvatar || avatarUri }} style={styles.editAvatarImage} />
              <View style={styles.avatarOverlay}>
                <Ionicons name="camera" size={28} color="#fff" />
                <Text style={styles.avatarOverlayText}>Cambiar foto</Text>
              </View>
            </TouchableOpacity>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Tu nombre"
                placeholderTextColor="#555"
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+54 11 1234 5678"
                placeholderTextColor="#555"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🔐 Password Change Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña Actual</Text>
              <View style={styles.passwordInputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#555"
                  secureTextEntry={!showPasswords}
                />
                <TouchableOpacity onPress={() => setShowPasswords(!showPasswords)}>
                  <Ionicons name={showPasswords ? "eye-off" : "eye"} size={22} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nueva Contraseña</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#555"
                secureTextEntry={!showPasswords}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repetí la nueva contraseña"
                placeholderTextColor="#555"
                secureTextEntry={!showPasswords}
              />
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
              <Text style={styles.saveButtonText}>Actualizar Contraseña</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 💳 Add Card Modal */}
      <Modal
        visible={addCardModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddCardModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Tarjeta</Text>
              <TouchableOpacity onPress={() => setAddCardModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.cardPreview}>
              <View style={styles.cardPreviewTop}>
                <Ionicons name="card" size={32} color="#00D9FF" />
                <Text style={styles.cardPreviewBrand}>VISA</Text>
              </View>
              <Text style={styles.cardPreviewNumber}>•••• •••• •••• ••••</Text>
              <View style={styles.cardPreviewBottom}>
                <View>
                  <Text style={styles.cardPreviewLabel}>TITULAR</Text>
                  <Text style={styles.cardPreviewValue}>{user?.name?.toUpperCase() || 'TU NOMBRE'}</Text>
                </View>
                <View>
                  <Text style={styles.cardPreviewLabel}>VENCE</Text>
                  <Text style={styles.cardPreviewValue}>MM/AA</Text>
                </View>
              </View>
            </View>

            <View style={styles.secureNote}>
              <Ionicons name="shield-checkmark" size={20} color="#00FF9D" />
              <Text style={styles.secureNoteText}>
                Tus datos están protegidos con encriptación de nivel bancario
              </Text>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddCard}>
              <Text style={styles.saveButtonText}>Agregar con Mercado Pago</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#00D9FF',
  },
  editAvatar: {
    position: 'absolute',
    bottom: 0,
    right: 5,
    backgroundColor: '#00D9FF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  userEmail: {
    color: '#666',
    fontSize: 16,
    marginTop: 4,
  },
  userPhone: {
    color: '#00D9FF',
    fontSize: 14,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#111',
    marginHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#222',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#00D9FF',
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#222',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,217,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#00D9FF',
    fontSize: 13,
    fontWeight: '700',
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
    flex: 1,
  },
  menuSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  // Payment Methods
  emptyPayment: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    borderStyle: 'dashed',
  },
  emptyPaymentText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptyPaymentSubtext: {
    color: '#444',
    fontSize: 13,
    marginTop: 4,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  cardItemDefault: {
    borderColor: 'rgba(0,217,255,0.3)',
    backgroundColor: 'rgba(0,217,255,0.03)',
  },
  cardIcon: {
    width: 48,
    height: 32,
    backgroundColor: 'rgba(0,217,255,0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cardExpiry: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: 'rgba(0,217,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  defaultBadgeText: {
    color: '#00D9FF',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteCardBtn: {
    padding: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.1)',
  },
  logoutText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  versionText: {
    color: '#222',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  avatarEditor: {
    alignSelf: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  editAvatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    paddingRight: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  forgotPassword: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#00D9FF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#00D9FF',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
  },
  // Card Preview
  cardPreview: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,217,255,0.2)',
  },
  cardPreviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardPreviewBrand: {
    color: '#00D9FF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  cardPreviewNumber: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 24,
  },
  cardPreviewBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardPreviewLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardPreviewValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,255,157,0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  secureNoteText: {
    color: '#666',
    fontSize: 12,
    flex: 1,
  },
});

export default ProfileScreen;



