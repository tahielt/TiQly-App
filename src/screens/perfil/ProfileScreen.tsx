import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { setActiveRole, logoutUser } from '../../features/auth/authSlice';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleToggleRole = () => {
    const newRole = user?.activeRole === 'attendee' ? 'organizer' : 'attendee';
    dispatch(setActiveRole(newRole));
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=00D9FF&color=000&size=256` }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatar}>
              <Ionicons name="camera" size={20} color="#000" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || 'Nombre Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@tiqly.app'}</Text>
        </View>

        {/* Stats / Badges (Visual only) */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Eventos</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>82</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </View>
        </View>

        {/* Settings Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi Cuenta</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 217, 255, 0.1)' }]}>
              <Ionicons name="person-outline" size={22} color="#00D9FF" />
            </View>
            <Text style={styles.menuText}>Editar Perfil</Text>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleToggleRole}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 157, 0, 0.1)' }]}>
              <Ionicons name="swap-horizontal" size={22} color="#FFA500" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>Cambiar Rol</Text>
              <Text style={styles.menuSubtext}>
                Estás como: {user?.activeRole === 'attendee' ? 'Asistente' : 'Organizador'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicación</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.menuText}>Notificaciones</Text>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.menuText}>Privacidad y Seguridad</Text>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Ionicons name="help-circle-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.menuText}>Ayuda y Soporte</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingBottom: 40,
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
    borderColor: '#111',
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
    fontSize: 20,
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
    flex: 1,
  },
  menuSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
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
});

export default ProfileScreen;
