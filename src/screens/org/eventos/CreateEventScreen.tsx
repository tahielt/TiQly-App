import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { eventService } from '../../../services/eventService';
import { supabase } from '../../../lib/supabase';
import { EVENT_CATEGORIES } from '../../../lib/mock-data';
import MapView from '../../../components/MapView';
import * as ImagePicker from 'expo-image-picker';

interface TicketLote {
  id: string;
  name: string;
  price: string;
  quantity: string;
}

const LOTE_PRESETS = ['Early Bird', 'General', 'VIP', 'Last Call', 'VIP Last Call'];

const CreateEventScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Fiesta Electrónica',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '22:00',
    address: '',
    city: 'Bariloche',
    latitude: '-41.133',
    longitude: '-71.310',
    coverImage: '',
    spotifyArtist: '',
    spotifyPlaylist: '',
  });

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para subir la portada.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setForm({ ...form, coverImage: result.assets[0].uri });
    }
  };

  // Ticket Lotes State
  const [ticketLotes, setTicketLotes] = useState<TicketLote[]>([
    { id: '1', name: 'Early Bird', price: '15000', quantity: '50' },
    { id: '2', name: 'General', price: '20000', quantity: '100' },
  ]);
  const [loteErrors, setLoteErrors] = useState<{ [key: string]: boolean }>({});
  const [formErrors, setFormErrors] = useState<{ title?: boolean; address?: boolean }>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const loteRefs = useRef<{ [key: string]: View | null }>({});

  const addLote = () => {
    const newLote: TicketLote = {
      id: Date.now().toString(),
      name: '',
      price: '',
      quantity: ''
    };
    setTicketLotes([...ticketLotes, newLote]);
  };

  const removeLote = (id: string) => {
    if (ticketLotes.length > 1) {
      setTicketLotes(ticketLotes.filter(l => l.id !== id));
    }
  };

  const updateLote = (id: string, field: keyof TicketLote, value: string) => {
    setTicketLotes(ticketLotes.map(l =>
      l.id === id ? { ...l, [field]: value } : l
    ));
  };

  const handleCreate = async () => {
    const newFormErrors: { title?: boolean; address?: boolean } = {};
    let hasFormErrors = false;

    if (!form.title) {
      newFormErrors.title = true;
      hasFormErrors = true;
    }
    if (!form.address) {
      newFormErrors.address = true;
      hasFormErrors = true;
    }

    if (hasFormErrors) {
      setFormErrors(newFormErrors);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert('Error', 'Por favor completa los campos requeridos');
      return;
    }

    // Validate Lotes
    const newLoteErrors: { [key: string]: boolean } = {};
    let hasErrors = false;
    let firstErrorId = '';

    ticketLotes.forEach(lote => {
      if (!lote.name.trim()) {
        newLoteErrors[lote.id] = true;
        hasErrors = true;
        if (!firstErrorId) firstErrorId = lote.id;
      }
    });

    if (hasErrors) {
      setLoteErrors(newLoteErrors);
      // Scroll to lotes section roughly, or specific lote if possible
      scrollViewRef.current?.scrollToEnd({ animated: true });
      return;
    }

    const validLotes = ticketLotes.filter(l => l.name && l.price && l.quantity);
    if (validLotes.length === 0) {
      Alert.alert('Error', 'Agrega al menos un lote de entradas');
      return;
    }

    setLoading(true);

    // Get current user first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'Debes estar logueado para crear eventos.');
      setLoading(false);
      return;
    }

    // Upload cover image to Supabase Storage if selected
    let coverImageUrl = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200';

    if (form.coverImage) {
      try {
        const fileName = `event_${Date.now()}.jpg`;
        const response = await fetch(form.coverImage);
        const blob = await response.blob();

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-covers')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.warn('Upload error (using default image):', uploadError.message);
          Alert.alert('Aviso', 'No se pudo subir la imagen (¿Bucket "event-covers" existe?). Usando imagen por defecto.');
        } else {
          const { data: urlData } = supabase.storage
            .from('event-covers')
            .getPublicUrl(fileName);
          coverImageUrl = urlData.publicUrl;
        }
      } catch (uploadErr) {
        console.warn('Error uploading image:', uploadErr);
      }
    }

    const ticketTypes = validLotes.map((lote, index) => ({
      id: `t${index + 1}`,
      name: lote.name,
      price: parseInt(lote.price),
      quantity: parseInt(lote.quantity),
      available: parseInt(lote.quantity)
    }));

    const basePrice = Math.min(...ticketTypes.map(t => t.price));

    const newEvent = {
      id: `evt_${Date.now()}`,
      title: form.title,
      description: form.description,
      category: form.category,
      startDate: new Date(`${form.startDate}T${form.startTime}:00`),
      endDate: new Date(`${form.startDate}T06:00:00`),
      price: basePrice,
      location: {
        address: form.address,
        city: form.city,
        coordinates: {
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude)
        }
      },
      organizerId: user.id,
      organizerName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Organizador',
      coverImage: coverImageUrl,
      spotifyArtist: form.spotifyArtist || null,
      spotifyPlaylist: form.spotifyPlaylist || null,
      status: 'published',
      attendeeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ticketTypes
    };

    try {
      const success = await eventService.createEvent(newEvent, user.id);
      setLoading(false);
      if (success) {
        Alert.alert('¡Evento Creado!', `Tu evento ya está disponible con ${ticketTypes.length} tipos de entrada.`, [
          { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Eventos' }) }
        ]);
      } else {
        Alert.alert('Error', 'Hubo un problema al guardar el evento.');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setLoading(false);
      Alert.alert('Error', 'Hubo un problema al guardar el evento.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Evento</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Cover Image Placeholder */}
          <TouchableOpacity style={styles.imageUpload} onPress={pickMedia}>
            {form.coverImage ? (
              <Image source={{ uri: form.coverImage }} style={styles.previewImage} />
            ) : (
              <>
                <Ionicons name="image-outline" size={40} color="#666" />
                <Text style={styles.uploadText}>Subir Portada</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.form}>
            <Text style={styles.label}>Título del Evento</Text>
            <TextInput
              style={[styles.input, formErrors.title && styles.inputError]}
              placeholder={formErrors.title ? "Falta título" : "Ej: White Party 2025"}
              placeholderTextColor={formErrors.title ? "#FF4444" : "#666"}
              value={form.title}
              onChangeText={(t) => {
                setForm({ ...form, title: t });
                if (formErrors.title) setFormErrors({ ...formErrors, title: false });
              }}
            />

            <Text style={styles.label}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
              {EVENT_CATEGORIES.filter(c => c !== 'Todos').map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, form.category === cat && styles.chipActive]}
                  onPress={() => setForm({ ...form, category: cat })}
                >
                  <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Spotify Integration */}
            <View style={styles.spotifySection}>
              <View style={styles.spotifyHeader}>
                <Ionicons name="musical-notes" size={20} color="#1DB954" />
                <Text style={[styles.label, { color: '#1DB954', marginBottom: 0 }]}>Spotify</Text>
              </View>
              <TextInput
                style={[styles.input, styles.spotifyInput]}
                placeholder="Link del artista/DJ en Spotify"
                placeholderTextColor="#666"
                value={form.spotifyArtist}
                onChangeText={(t) => setForm({ ...form, spotifyArtist: t })}
                autoCapitalize="none"
                keyboardType="url"
              />
              <TextInput
                style={[styles.input, styles.spotifyInput]}
                placeholder="Link de playlist en Spotify (opcional)"
                placeholderTextColor="#666"
                value={form.spotifyPlaylist}
                onChangeText={(t) => setForm({ ...form, spotifyPlaylist: t })}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text style={styles.spotifyHint}>
                Pega el link del perfil del DJ o una playlist del evento
              </Text>
            </View>

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe tu evento..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              value={form.description}
              onChangeText={(t) => setForm({ ...form, description: t })}
            />

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Fecha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#666"
                  value={form.startDate}
                  onChangeText={(t) => setForm({ ...form, startDate: t })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Hora</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  placeholderTextColor="#666"
                  value={form.startTime}
                  onChangeText={(t) => setForm({ ...form, startTime: t })}
                />
              </View>
            </View>

            {/* Location Picker */}
            <Text style={styles.label}>Ubicación (Toca el mapa)</Text>
            <View style={styles.mapContainer}>
              <MapView
                editable={true}
                style={{ flex: 1 }}
                initialLocation={{
                  latitude: parseFloat(form.latitude),
                  longitude: parseFloat(form.longitude)
                }}
                onLocationChange={(loc) => {
                  setForm({
                    ...form,
                    latitude: loc.latitude.toString(),
                    longitude: loc.longitude.toString()
                  });
                }}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Dirección</Text>
                <TextInput
                  style={[styles.input, formErrors.address && styles.inputError]}
                  placeholder={formErrors.address ? "Falta dirección" : "Ej: Av. Bustillo 1500"}
                  placeholderTextColor={formErrors.address ? "#FF4444" : "#666"}
                  value={form.address}
                  onChangeText={(t) => {
                    setForm({ ...form, address: t });
                    if (formErrors.address) setFormErrors({ ...formErrors, address: false });
                  }}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Ciudad</Text>
                <TextInput
                  style={styles.input}
                  value={form.city}
                  onChangeText={(t) => setForm({ ...form, city: t })}
                />
              </View>
            </View>

            {/* TICKET LOTES SECTION */}
            <View style={styles.lotesSection}>
              <View style={styles.lotesSectionHeader}>
                <Text style={styles.sectionTitle}>🎫 Lotes de Entradas</Text>
                <TouchableOpacity style={styles.addLoteBtn} onPress={addLote}>
                  <Ionicons name="add" size={20} color="#00D9FF" />
                  <Text style={styles.addLoteBtnText}>Agregar</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
                {LOTE_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={styles.presetChip}
                    onPress={() => {
                      const newLote: TicketLote = {
                        id: Date.now().toString(),
                        name: preset,
                        price: preset.includes('VIP') ? '35000' : preset === 'Early Bird' ? '15000' : '20000',
                        quantity: '50'
                      };
                      setTicketLotes([...ticketLotes, newLote]);
                    }}
                  >
                    <Text style={styles.presetChipText}>+ {preset}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {ticketLotes.map((lote, index) => (
                <View key={lote.id} style={styles.loteCard}>
                  <View style={styles.loteHeader}>
                    <Text style={styles.loteNumber}>
                      {lote.name ? lote.name.toUpperCase() : ""}
                    </Text>
                    {ticketLotes.length > 1 && (
                      <TouchableOpacity onPress={() => removeLote(lote.id)}>
                        <Ionicons name="trash-outline" size={20} color="#FF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput
                    style={[
                      styles.loteInput,
                      loteErrors[lote.id] && styles.inputError
                    ]}
                    placeholder={loteErrors[lote.id] ? "Falta nombre" : "Nombre..."}
                    placeholderTextColor={loteErrors[lote.id] ? "#FF4444" : "#555"}
                    value={lote.name}
                    onChangeText={(v) => {
                      updateLote(lote.id, 'name', v);
                      if (loteErrors[lote.id]) {
                        setLoteErrors({ ...loteErrors, [lote.id]: false });
                      }
                    }}
                  />
                  <View style={styles.loteRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.loteLabel}>Precio ($)</Text>
                      <TextInput
                        style={styles.loteInput}
                        placeholder="20000"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        value={lote.price}
                        onChangeText={(v) => updateLote(lote.id, 'price', v)}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.loteLabel}>Cantidad</Text>
                      <TextInput
                        style={styles.loteInput}
                        placeholder="100"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        value={lote.quantity}
                        onChangeText={(v) => updateLote(lote.id, 'quantity', v)}
                      />
                    </View>
                  </View>
                </View>
              ))}

              <View style={styles.comisionInfo}>
                <Ionicons name="information-circle-outline" size={16} color="#00D9FF" />
                <Text style={styles.comisionText}>
                  TiQly cobra 15% de comisión al comprador. Vos recibís el 100% del precio de entrada.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.disabledButton]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.createButtonText}>Publicar Evento</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#111111',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  imageUpload: {
    width: '100%',
    height: 150,
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadText: {
    color: '#666',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  label: {
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    gap: 0,
  },
  categories: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#222',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: {
    backgroundColor: '#00D9FF',
    borderColor: '#00D9FF',
  },
  chipText: {
    color: '#888',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#000',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
    position: 'relative',
  },
  coordinatesOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coordsText: {
    color: '#00D9FF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Lotes Section
  lotesSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 24,
  },
  lotesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  addLoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00D9FF',
  },
  addLoteBtnText: {
    color: '#00D9FF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  presetsScroll: {
    marginBottom: 16,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  presetChipText: {
    color: '#00D9FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loteCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  loteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loteNumber: {
    color: '#00D9FF',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loteInput: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  loteRow: {
    flexDirection: 'row',
  },
  loteLabel: {
    color: '#666',
    fontSize: 11,
    marginBottom: 4,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  comisionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(0, 217, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  comisionText: {
    flex: 1,
    color: '#888',
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  createButton: {
    backgroundColor: '#00D9FF',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  spotifySection: {
    backgroundColor: 'rgba(29, 185, 84, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.2)',
    gap: 10,
  },
  spotifyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  spotifyInput: {
    borderColor: 'rgba(29, 185, 84, 0.3)',
  },
  spotifyHint: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default CreateEventScreen;
