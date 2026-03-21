import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { RootState, AppDispatch } from '../../store/store';
import { logoutUser, updateUserProfile } from '../../features/auth/authSlice';
import * as authService from '../../services/authService';
import { supabase } from '../../lib/supabase';
import { getUserGamificationState, UserGamificationState } from '../../services/xpService';
import { LevelProgressBar } from '../../components/gamification';

const ProfileScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [stats, setStats] = useState({ tickets: 0, events: 0, following: 0 });
  const [xpState, setXpState] = useState<UserGamificationState | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const loadStats = useCallback(async () => {
    if (!user?.id) {
      setStats({ tickets: 0, events: 0, following: 0 });
      setXpState(null);
      setLoadingStats(false);
      return;
    }

    setLoadingStats(true);
    try {
      const [{ count: ticketCount }, { data: ticketsData }] = await Promise.all([
        supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('tickets')
          .select('event_id')
          .eq('user_id', user.id),
      ]);

      const uniqueEvents = new Set((ticketsData || []).map((ticket: any) => ticket.event_id));
      setStats({
        tickets: ticketCount || 0,
        events: uniqueEvents.size,
        following: 0,
      });

      const gamificationState = await getUserGamificationState(user.id);
      setXpState(gamificationState);
    } catch (error) {
      console.error('Error loading profile stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
      setEditName(user?.name || '');
      setEditPhone(user?.phone || '');
      setEditAvatar(user?.avatar || '');
    }, [loadStats, user?.avatar, user?.name, user?.phone]),
  );

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

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    if (!editName.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    setSavingProfile(true);
    try {
      const updates = {
        name: editName.trim(),
        phone: editPhone.trim(),
        avatar_url: editAvatar || undefined,
      };

      const profileResult = await authService.updateProfile(user.id, updates);
      if (!profileResult.success) {
        throw new Error(profileResult.error || 'No se pudo actualizar el perfil');
      }

      await supabase.auth.updateUser({
        data: {
          name: editName.trim(),
        },
      });

      dispatch(updateUserProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        avatar: editAvatar || undefined,
      }));

      setEditModalVisible(false);
      Alert.alert('Perfil actualizado', 'Tus cambios ya quedaron guardados.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
    } finally {
      setSavingProfile(false);
    }
  };

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

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordModalVisible(false);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Contraseña actualizada', 'Tu contraseña fue cambiada exitosamente.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cambiar la contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Querés cerrar tu sesión en TiQly?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => dispatch(logoutUser()) },
      ],
    );
  };

  const avatarUri = editAvatar || user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'TiQly')}&background=00D9FF&color=000&size=256`;

  const renderStat = (label: string, value: number) => (
    <View style={styles.statItem}>
      {loadingStats ? (
        <ActivityIndicator size="small" color="#00D9FF" />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <TouchableOpacity style={styles.editAvatarButton} onPress={() => setEditModalVisible(true)}>
              <Ionicons name="pencil" size={16} color="#000" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.name || 'Tu perfil'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@tiqly.app'}</Text>
          {!!user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}

          {xpState && (
            <View style={styles.levelContainer}>
              <LevelProgressBar
                level={xpState.level}
                progress={xpState.progressToNextLevel}
                xpToNext={xpState.xpToNextLevel}
              />
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          {renderStat('Eventos', stats.events)}
          <View style={styles.verticalDivider} />
          {renderStat('Tickets', stats.tickets)}
          <View style={styles.verticalDivider} />
          {renderStat('Siguiendo', stats.following)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi cuenta</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => setEditModalVisible(true)}>
            <View style={[styles.iconBox, styles.iconBlue]}>
              <Ionicons name="person-outline" size={20} color="#00D9FF" />
            </View>
            <View style={styles.menuCopy}>
              <Text style={styles.menuText}>Editar perfil</Text>
              <Text style={styles.menuSubtext}>Nombre, foto y teléfono</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#555" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setPasswordModalVisible(true)}>
            <View style={[styles.iconBox, styles.iconGreen]}>
              <Ionicons name="lock-closed-outline" size={20} color="#00FF9D" />
            </View>
            <View style={styles.menuCopy}>
              <Text style={styles.menuText}>Cambiar contraseña</Text>
              <Text style={styles.menuSubtext}>Actualizá tus credenciales</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#555" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pagos y tickets</Text>
          <View style={styles.infoCard}>
            <Ionicons name="card-outline" size={20} color="#00D9FF" />
            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>Checkout centralizado</Text>
              <Text style={styles.infoText}>
                Los medios de pago se gestionan durante la compra para mantener la experiencia real y sin datos de prueba en producción.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicación</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <View style={styles.iconBox}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.menuText}>Notificaciones</Text>
            <Ionicons name="chevron-forward" size={20} color="#555" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <View style={styles.iconBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.menuText}>Privacidad y seguridad</Text>
            <Ionicons name="chevron-forward" size={20} color="#555" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <View style={styles.iconBox}>
              <Ionicons name="help-circle-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.menuText}>Ayuda y soporte</Text>
            <Ionicons name="chevron-forward" size={20} color="#555" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF5A5A" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>TiQly v1.0.0</Text>
      </ScrollView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar perfil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.avatarEditor} onPress={pickImage}>
              <Image source={{ uri: editAvatar || avatarUri }} style={styles.editAvatarImage} />
              <View style={styles.avatarOverlay}>
                <Ionicons name="camera" size={22} color="#fff" />
                <Text style={styles.avatarOverlayText}>Cambiar foto</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.inputoabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Tu nombre"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputoabel}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+54 11 1234 5678"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator color="#000" /> : <Text style={styles.saveButtonText}>Guardar cambios</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar contraseña</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputoabel}>Nueva contraseña</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor="#666"
                  secureTextEntry={!showPasswords}
                />
                <TouchableOpacity onPress={() => setShowPasswords((prev) => !prev)}>
                  <Ionicons name={showPasswords ? 'eye-off' : 'eye'} size={22} color="#999" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputoabel}>Confirmar contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repetí la contraseña"
                placeholderTextColor="#666"
                secureTextEntry={!showPasswords}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? <ActivityIndicator color="#000" /> : <Text style={styles.saveButtonText}>Actualizar contraseña</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  headerCard: {
    backgroundColor: '#0F1013',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.16)',
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: '#00D9FF',
  },
  editAvatarButton: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#00D9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  userEmail: {
    color: '#9BA1AE',
    marginTop: 4,
  },
  userPhone: {
    color: '#D5D9E0',
    marginTop: 4,
  },
  levelContainer: {
    width: '100%',
    marginTop: 18,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 18,
    backgroundColor: '#0F1013',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 18,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: '#777F8C',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#0F1013',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginRight: 14,
  },
  iconBlue: {
    backgroundColor: 'rgba(0, 217, 255, 0.08)',
  },
  iconGreen: {
    backgroundColor: 'rgba(0, 255, 157, 0.08)',
  },
  menuCopy: {
    flex: 1,
  },
  menuText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  menuSubtext: {
    color: '#7E8795',
    marginTop: 2,
    fontSize: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 217, 255, 0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.14)',
    gap: 12,
  },
  infoCopy: {
    flex: 1,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  infoText: {
    color: '#9ABACA',
    marginTop: 4,
    lineHeight: 18,
  },
  logoutButton: {
    marginTop: 22,
    backgroundColor: '#0F1013',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 90, 0.18)',
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutText: {
    color: '#FF5A5A',
    fontSize: 15,
    fontWeight: '700',
  },
  versionText: {
    color: '#5D6673',
    textAlign: 'center',
    marginTop: 18,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111317',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  avatarEditor: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  editAvatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  avatarOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderBottomLeftRadius: 52,
    borderBottomRightRadius: 52,
  },
  avatarOverlayText: {
    color: '#fff',
    fontSize: 11,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputoabel: {
    color: '#C8D0DB',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0A0C0F',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0C0F',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingRight: 14,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: '#00D9FF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default ProfileScreen;



