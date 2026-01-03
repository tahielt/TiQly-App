import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { saveEvent } from '../../../lib/mock-data';
import MapView from '../../../components/MapView';

const CreateEventScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Fiesta Electrónica',
    startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    startTime: '22:00',
    price: '',
    address: '',
    city: 'Bariloche',
    latitude: '-41.133',
    longitude: '-71.310'
  });

  const handleCreate = async () => {
    if (!form.title || !form.price || !form.address) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios');
      return;
    }

    setLoading(true);

    // Mock ID generation
    const newEvent = {
      id: `evt_${Date.now()}`,
      title: form.title,
      description: form.description,
      category: form.category,
      startDate: new Date(`${form.startDate}T${form.startTime}:00`),
      endDate: new Date(`${form.startDate}T06:00:00`), // @fox HORA DE FIN DE EVENTO  Mock end time
      price: parseInt(form.price),
      location: {
        address: form.address,
        city: form.city,
        coordinates: {
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude)
        }
      },
      organizerId: 'org_1',
      organizerName: 'Electronic Hub',
      coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200', // Default image
      status: 'published',
      attendeeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ticketTypes: [{ id: 't1', name: 'General', price: parseInt(form.price), quantity: 100, available: 100 }]
    };

    // Simulate network delay
    setTimeout(async () => {
      const success = await saveEvent(newEvent);
      setLoading(false);
      if (success) {
        Alert.alert('¡Evento Creado!', 'Tu evento ya está disponible en el mapa.', [
          { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Eventos' }) }
        ]);
      } else {
        Alert.alert('Error', 'Hubo un problema al guardar el evento.');
      }
    }, 1500);
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

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cover Image Placeholder */}
        <TouchableOpacity style={styles.imageUpload}>
          <Ionicons name="image-outline" size={40} color="#666" />
          <Text style={styles.uploadText}>Subir Portada</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={styles.label}>Título del Evento</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: White Party 2025"
            placeholderTextColor="#666"
            value={form.title}
            onChangeText={(t) => setForm({ ...form, title: t })}
          />

          <Text style={styles.label}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
            {['Fiesta Electrónica', 'Cachengue'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, form.category === cat && styles.chipActive]}
                onPress={() => setForm({ ...form, category: cat })}
              >
                <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

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
            <View style={styles.coordinatesOverlay}>
              <Ionicons name="location" size={12} color="#D4FF00" />
              <Text style={styles.coordsText}>
                {parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Av. Bustillo 1500"
                placeholderTextColor="#666"
                value={form.address}
                onChangeText={(t) => setForm({ ...form, address: t })}
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

          <Text style={styles.label}>Precio de Entrada ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={form.price}
            onChangeText={(t) => setForm({ ...form, price: t })}
          />
        </View>
      </ScrollView>

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
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#111',
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
    backgroundColor: '#111',
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
    backgroundColor: '#111',
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
    backgroundColor: '#D4FF00',
    borderColor: '#D4FF00',
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
    color: '#D4FF00',
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  createButton: {
    backgroundColor: '#D4FF00',
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
});

export default CreateEventScreen;
