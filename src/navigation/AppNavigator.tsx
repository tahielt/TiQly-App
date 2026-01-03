import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  RootStackParamList,
  MainTabParamList,
  OrgEventosStackParamList,
  AttEventosStackParamList,
  OrgMapaStackParamList,
  AttMapaStackParamList,
  OrgTicketsStackParamList,
  AttTicketsStackParamList,
  OrgTranspStackParamList,
  AttTranspStackParamList,
  CuentaStackParamList,
  SocialStackParamList
} from '../types/navigation';

import { checkAuthStatus } from '../features/auth/authSlice';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import EventDetailScreen from '../screens/att/eventos/EventDetailScreen';
import HomeScreen from '../screens/HomeScreen';
import MyTicketsScreen from '../screens/att/tickets/MyTicketsScreen';
import CreateEventScreen from '../screens/org/eventos/CreateEventScreen';
import ProfileScreen from '../screens/perfil/ProfileScreen';
import MapScreen from '../screens/map/MapScreen';

// Pantallas de carga y autenticación (Temporales)
const LoadingScreen = PlaceholderScreen;
const LegalScreen = PlaceholderScreen;
const AuthScreen = PlaceholderScreen;
const RoleGateScreen = PlaceholderScreen;

// Stacks para cada sección
const OrgEventosStack = () => {
  const Stack = createStackNavigator<OrgEventosStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrgEventosHome" component={PlaceholderScreen} />
      <Stack.Screen name="OrgEventoDetalle" component={PlaceholderScreen} />
      <Stack.Screen name="OrgCrearEvento" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
};

const AttEventosStack = () => {
  const Stack = createStackNavigator<AttEventosStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttEventosHome" component={HomeScreen} />
    </Stack.Navigator>
  );
};

// Stacks para Mapa
const OrgMapaStack = () => {
  const Stack = createStackNavigator<OrgMapaStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrgMapaHome" component={MapScreen} />
      <Stack.Screen name="OrgMapaDetalle" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
};

const AttMapaStack = () => {
  const Stack = createStackNavigator<AttMapaStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttMapaHome" component={MapScreen} />
      <Stack.Screen name="AttMapaDetalle" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
};

// Stacks para Tickets
const OrgTicketsStack = () => {
  const Stack = createStackNavigator<OrgTicketsStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrgTicketsHome" component={PlaceholderScreen} />
      <Stack.Screen name="OrgValidarTicket" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
};

const AttTicketsStack = () => {
  const Stack = createStackNavigator<AttTicketsStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttTicketsHome" component={MyTicketsScreen} />
      <Stack.Screen name="AttTicketDetalle" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
};

// Stacks para Transporte
const OrgTranspStack = () => {
  const Stack = createStackNavigator<OrgTranspStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrgTranspHome" component={PlaceholderScreen} />
      <Stack.Screen name="OrgTranspDetalle" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
};

const AttTranspStack = () => {
  const Stack = createStackNavigator<AttTranspStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttTranspHome" component={PlaceholderScreen} />
      <Stack.Screen name="AttTranspDetalle" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
};

// Stack para Cuenta
const CuentaStack = () => {
  const Stack = createStackNavigator<CuentaStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CuentaHome" component={PlaceholderScreen} />
      <Stack.Screen name="Ajustes" component={PlaceholderScreen} />
      <Stack.Screen name="Perfil" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const MainTabs = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isOrg = user?.roles.includes('organizer') && user?.activeRole === 'organizer';
  const Tab = createBottomTabNavigator<MainTabParamList>();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#222',
          height: 80, // Taller tab bar
          paddingBottom: 20,
        },
        tabBarActiveTintColor: '#D4FF00', // Fluorescent green
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Eventos"
        component={isOrg ? OrgEventosStack : AttEventosStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Mapa"
        component={isOrg ? OrgMapaStack : AttMapaStack} // We'll implement this stack/screen next
        options={{
          tabBarLabel: () => null, // Hide label for the center button
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                top: -20, // Float up
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: focused ? '#D4FF00' : '#222',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#D4FF00',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: focused ? 0.5 : 0,
                shadowRadius: 10,
                elevation: 5,
                borderWidth: 4,
                borderColor: '#000', // Match background to look like it cuts out
              }}
            >
              <Ionicons
                name="map"
                size={32}
                color={focused ? '#000' : '#666'}
              />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Tickets"
        component={isOrg ? OrgTicketsStack : AttTicketsStack}
        options={{
          title: 'Mis Tickets',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ticket-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const [isAppReady, setIsAppReady] = useState(false);

  // Verificar estado de autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await dispatch(checkAuthStatus()).unwrap();
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsAppReady(true);
      }
    };

    checkAuth();
  }, [dispatch]);

  if (!isAppReady || isLoading) {
    return <LoadingScreen />;
  }

  // Define screens that are not part of the tab bar but share global nav context if needed
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAppReady ? (
          <Stack.Screen name="Loading" component={LoadingScreen} />
        ) : !isAuthenticated ? (
          <>
            <Stack.Screen name="Legal" component={LegalScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="RoleGate" component={RoleGateScreen} />
            <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="AttEventoDetalle" component={EventDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
