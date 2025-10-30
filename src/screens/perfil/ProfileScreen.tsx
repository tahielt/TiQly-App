import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography } from '../../theme';
import { getUserTicketHistory } from '../../services/ticketService';
import { Ticket } from '../../types/ticket';
import StorageService from '../../services/storage';

const ProfileScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  // Campos editables
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');

  // Historial de tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    loadTicketHistory();
  }, [user]);

  const loadTicketHistory = async () => {
    if (!user) return;

    try {
      const history = await getUserTicketHistory(user.id);
      setTickets(history);
    } catch (error) {
      console.error('Error loading ticket history:', error);
    } finally {
      setTicketsLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoURL(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // TODO: Subir foto a storage si cambió
      // const uploadedPhotoURL = photoURL !== user.photoURL 
      //   ? await uploadProfilePhoto(user.id, photoURL) 
      //   : photoURL;

      // Actualizar usuario
      const updatedUser = {
        ...user,
        name,
        bio,
        phoneNumber,
        photoURL,
        updatedAt: new Date()
      };

      await StorageService.saveAuthData(updatedUser);

      // TODO: Actualizar en Redux
      // dispatch(updateUser(updatedUser));

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setBio(user?.bio || '');
    setPhoneNumber(user?.phoneNumber || '');
    setPhotoURL(user?.photoURL || '');
    setIsEditing(false);
  };

  const renderTicketHistory = () => {
    if (ticketsLoading) {
      return <ActivityIndicator size="small" color={colors.primary} />;
    }

    if (tickets.length === 0) {
      return (
        <Text style={styles.emptyText}>No tienes entradas compradas</Text>
      );
    }

    return tickets.slice(0, 5).map((ticket) => (
      <View key={ticket.id} style={styles.ticketItem}>
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketTitle} numberOfLines={1}>
            {ticket.eventTitle}
          </Text>
          <Text style={styles.ticketDate}>
            {ticket.eventDate.toLocaleDateString()}
          </Text>
        </View>
        <View style={[
          styles.ticketStatus,
          { backgroundColor: ticket.status === 'used' ? colors.success : colors.primary }
        ]}>
          <Text style={styles.ticketStatusText}>
            {ticket.status === 'active' ? 'Activo' :
             ticket.status === 'used' ? 'Usado' :
             ticket.status === 'transferred' ? 'Transferido' : 
             'Cancelado'}
          </Text>
        </View>
      </View>
    ));
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text>Debes iniciar sesión</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header con foto de perfil */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.photoContainer}
          onPress={isEditing ? pickImage : undefined}
          disabled={!isEditing}
        >
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isEditing && (
            <View style={styles.editPhotoOverlay}>
              <Text style={styles.editPhotoText}>📷</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.email}>{user.email}</Text>
        
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user.activeRole === 'attendee' ? '👤 Usuario' :
             user.activeRole === 'organizer' ? '🎭 Organizador' :
             user.activeRole === 'driver' ? '🚗 Conductor' : '👑 Admin'}
          </Text>
        </View>
      </View>

      {/* Información del perfil */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          {!isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editButton}>✏️ Editar</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSave} 
                style={styles.saveButton}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={styles.saveText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          value={name}
          onChangeText={setName}
          editable={isEditing}
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Biografía</Text>
        <TextInput
          style={[styles.input, styles.textArea, !isEditing && styles.inputDisabled]}
          value={bio}
          onChangeText={setBio}
          editable={isEditing}
          placeholder="Cuéntanos sobre ti..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          editable={isEditing}
          placeholder="+54 9 11 1234-5678"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
        />
      </View>

      {/* Historial de entradas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis Entradas</Text>
          <Text style={styles.ticketCount}>{tickets.length} total</Text>
        </View>

        <View style={styles.ticketHistory}>
          {renderTicketHistory()}
        </View>

        {tickets.length > 5 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Ver todas →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Estadísticas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{tickets.length}</Text>
            <Text style={styles.statLabel}>Entradas Compradas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {tickets.filter(t => t.status === 'used').length}
            </Text>
            <Text style={styles.statLabel}>Eventos Asistidos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {(tickets.filter(t => t.status === 'used').length * 100).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Puntos</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: spacing.xlarge,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    ...typography.h1,
    color: colors.onPrimary,
  },
  editPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoText: {
    fontSize: 16,
  },
  email: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.small,
  },
  roleBadge: {
    marginTop: spacing.small,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.xsmall,
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
  roleText: {
    ...typography.caption,
    color: colors.onPrimary,
    fontWeight: 'bold',
  },
  section: {
    padding: spacing.medium,
    backgroundColor: colors.surface,
    marginTop: spacing.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  editButton: {
    ...typography.button,
    color: colors.primary,
  },
  editActions: {
    flexDirection: 'row',
  },
  cancelButton: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    marginRight: spacing.small,
  },
  cancelText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  saveButton: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  saveText: {
    ...typography.button,
    color: colors.onPrimary,
  },
  label: {
    ...typography.subtitle2,
    marginBottom: spacing.xsmall,
    color: colors.text,
  },
  input: {
    ...typography.body1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDisabled: {
    backgroundColor: colors.surface,
    color: colors.textSecondary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  ticketCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ticketHistory: {
    marginTop: spacing.small,
  },
  ticketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    ...typography.subtitle2,
    color: colors.text,
  },
  ticketDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ticketStatus: {
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ticketStatusText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
  emptyText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.large,
  },
  viewAllButton: {
    marginTop: spacing.medium,
    alignItems: 'center',
  },
  viewAllText: {
    ...typography.button,
    color: colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.medium,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xsmall,
  },
});

export default ProfileScreen;
