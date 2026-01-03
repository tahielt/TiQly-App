import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getEvents } from '../lib/mock-data';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (isFocused) {
      loadEvents();
    }
  }, [isFocused]);

  const loadEvents = async () => {
    const data = await getEvents();
    setEvents(data);
  };

  const renderEventItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AttEventoDetalle', { eventId: item.id })}
    >
      <Image source={{ uri: item.coverImage }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{item.category}</Text>
        </View>
        <Text style={styles.date}>
          {item.startDate ? new Date(item.startDate).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase() : 'FECHA PENDIENTE'}
        </Text>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.location}>{item.location.address}, {item.location.city}</Text>
        </View>
        <Text style={styles.price}>${item.price?.toLocaleString() || '0'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Image source={require('../../assets/Tiqly nuevo color marca SINLOGO.png')} style={styles.logoImage} resizeMode="contain" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('CreateEvent')}>
            <Ionicons name="add-circle-outline" size={24} color="#00D9FF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000000',
  },
  logoImage: {
    height: 32,
    width: 100,
  },
  logo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  badgeContainer: {
    position: 'absolute',
    top: -160,
    right: 16,
    backgroundColor: '#00D9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  date: {
    color: '#00D9FF',
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 12,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    color: '#888',
    marginLeft: 4,
    fontSize: 14,
  },
  price: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
