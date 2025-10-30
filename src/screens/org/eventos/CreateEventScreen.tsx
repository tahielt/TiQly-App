import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import * as ImagePicker from 'expo-image-picker';
import { Event, EventType, EventLocation, EventTicketType } from '../../../types/event';
import { createEvent, uploadEventImage } from '../../../services/eventService';
import { colors, spacing, typography } from '../../../theme';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreateEventScreen = () => {
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('public');
  const [category, setCategory] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  
  // Fecha y hora
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Ubicación
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Tickets
  const [ticketName, setTicketName] = useState('General');
  const [ticketPrice, setTicketPrice] = useState('');
  const [ticketQuantity, setTicketQuantity] = useState('');

  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const handleCreateEvent = async () => {
    // Validaciones
    if (!title.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }

    if (!address.trim() || !city.trim()) {
      Alert.alert('Error', 'La ubicación es requerida');
      return;
    }

    if (!latitude || !longitude) {
      Alert.alert('Error', 'Las coordenadas son requeridas');
      return;
    }

    if (!ticketPrice || !ticketQuantity) {
      Alert.alert('Error', 'Debes agregar al menos un tipo de entrada');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }

    setLoading(true);

    try {
      const location: EventLocation = {
        address,
        city,
        venue,
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }
      };

      const ticketType: EventTicketType = {
        id: 'general',
        name: ticketName,
        price: parseFloat(ticketPrice),
        quantity: parseInt(ticketQuantity),
        available: parseInt(ticketQuantity),
        saleStartDate: startDate,
        saleEndDate: endDate
      };

      const eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
        title,
        description,
        organizerId: user.id,
        organizerName: user.name,
        type: eventType,
        status: 'published',
        location,
        startDate,
        endDate,
        gallery: [],
        ticketTypes: [ticketType],
        attendeeCount: 0,
        tags: [],
        category: category || 'Música Electrónica'
      };

      const event = await createEvent(eventData);

      // Subir imagen de portada si existe
      if (coverImage) {
        const imageUrl = await uploadEventImage(event.id, coverImage, 'cover');
        console.log('Cover image uploaded:', imageUrl);
      }

      Alert.alert(
        'Éxito',
        'Evento creado correctamente',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'No se pudo crear el evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Crear Evento</Text>

      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Nombre del evento"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.label}>Descripción *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe tu evento"
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Tipo de Evento *</Text>
      <View style={styles.typeContainer}>
        {(['public', 'private'] as EventType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              eventType === type && styles.typeButtonActive
            ]}
            onPress={() => setEventType(type)}
          >
            <Text style={[
              styles.typeButtonText,
              eventType === type && styles.typeButtonTextActive
            ]}>
              {type === 'public' ? '🌐 Público' : '🔒 Privado (Con invitación)'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Categoría</Text>
      <TextInput
        style={styles.input}
        value={category}
        onChangeText={setCategory}
        placeholder="Ej: Música Electrónica, Concierto"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.sectionTitle}>📅 Fecha y Hora</Text>

      <Text style={styles.label}>Inicio *</Text>
      <TouchableOpacity 
        style={styles.dateButton}
        onPress={() => setShowStartPicker(true)}
      >
        <Text>{startDate.toLocaleString()}</Text>
      </TouchableOpacity>

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="datetime"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}

      <Text style={styles.label}>Fin *</Text>
      <TouchableOpacity 
        style={styles.dateButton}
        onPress={() => setShowEndPicker(true)}
      >
        <Text>{endDate.toLocaleString()}</Text>
      </TouchableOpacity>

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="datetime"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}

      <Text style={styles.sectionTitle}>📍 Ubicación</Text>

      <Text style={styles.label}>Dirección *</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="Calle y número"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.label}>Ciudad *</Text>
      <TextInput
        style={styles.input}
        value={city}
        onChangeText={setCity}
        placeholder="Ciudad"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.label}>Lugar</Text>
      <TextInput
        style={styles.input}
        value={venue}
        onChangeText={setVenue}
        placeholder="Nombre del lugar"
        placeholderTextColor={colors.textSecondary}
      />

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Latitud *</Text>
          <TextInput
            style={styles.input}
            value={latitude}
            onChangeText={setLatitude}
            placeholder="-34.6037"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Longitud *</Text>
          <TextInput
            style={styles.input}
            value={longitude}
            onChangeText={setLongitude}
            placeholder="-58.3816"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>🎫 Entradas</Text>

      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={ticketName}
        onChangeText={setTicketName}
        placeholder="Ej: General, VIP"
        placeholderTextColor={colors.textSecondary}
      />

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Precio *</Text>
          <TextInput
            style={styles.input}
            value={ticketPrice}
            onChangeText={setTicketPrice}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>Cantidad *</Text>
          <TextInput
            style={styles.input}
            value={ticketQuantity}
            onChangeText={setTicketQuantity}
            placeholder="100"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>🖼️ Imagen de Portada</Text>

      <TouchableOpacity 
        style={styles.imageButton}
        onPress={pickImage}
      >
        <Text style={styles.imageButtonText}>
          {coverImage ? '✓ Imagen seleccionada' : '📷 Seleccionar imagen'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.createButton, loading && styles.disabledButton]}
        onPress={handleCreateEvent}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.createButtonText}>Crear Evento</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.medium,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.large,
  },
  sectionTitle: {
    ...typography.h3,
    marginTop: spacing.large,
    marginBottom: spacing.medium,
  },
  label: {
    ...typography.subtitle1,
    marginBottom: spacing.small,
    color: colors.text,
  },
  input: {
    ...typography.body1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  typeButton: {
    flex: 1,
    padding: spacing.medium,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.small,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    ...typography.button,
    color: colors.text,
  },
  typeButtonTextActive: {
    color: colors.onPrimary,
  },
  dateButton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: spacing.small,
  },
  imageButton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  imageButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.medium,
    alignItems: 'center',
    marginTop: spacing.large,
  },
  disabledButton: {
    opacity: 0.5,
  },
  createButtonText: {
    ...typography.button,
    color: colors.onPrimary,
  },
});

export default CreateEventScreen;
