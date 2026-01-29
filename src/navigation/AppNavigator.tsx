import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { BlurView } from 'expo-blur';
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
import TicketDetailScreen from '../screens/att/tickets/TicketDetailScreen';
import CreateEventScreen from '../screens/org/eventos/CreateEventScreen';
import MyEventsScreen from '../screens/org/eventos/MyEventsScreen';
import EventStatsScreen from '../screens/org/eventos/EventStatsScreen';
import QRScannerScreen from '../screens/org/tickets/QRScannerScreen';
import ProfileScreen from '../screens/perfil/ProfileScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import MapScreen from '../screens/map/MapScreen';
import SwapScreen from '../screens/swap/SwapScreen';

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
      <Stack.Screen name="OrgEventosHome" component={MyEventsScreen} />
      <Stack.Screen name="OrgEventoDetalle" component={EventDetailScreen} />
      <Stack.Screen name="OrgCrearEvento" component={CreateEventScreen} />
      <Stack.Screen name="OrgEventStats" component={EventStatsScreen} />
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
      <Stack.Screen name="OrgTicketsHome" component={QRScannerScreen} />
      <Stack.Screen name="OrgValidarTicket" component={QRScannerScreen} />
    </Stack.Navigator>
  );
};

const AttTicketsStack = () => {
  const Stack = createStackNavigator<AttTicketsStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttTicketsHome" component={MyTicketsScreen} />
      <Stack.Screen name="AttTicketDetalle" component={TicketDetailScreen} />
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
      <Stack.Screen name="Perfil" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Custom Tab Bar with Blur Effect
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.tabBarContainer}>
      <BlurView intensity={80} tint="dark" style={styles.tabBarBlur}>
        <View style={styles.tabBarContent}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const isMapTab = route.name === 'Mapa';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            // Get icon based on route
            let iconName: any = 'home-outline';
            let iconNameFocused: any = 'home';
            let label = route.name;

            switch (route.name) {
              case 'Home':
                iconName = 'home-outline';
                iconNameFocused = 'home';
                label = 'Home';
                break;
              case 'Tickets':
                iconName = 'ticket-outline';
                iconNameFocused = 'ticket';
                label = 'Tickets';
                break;
              case 'Mapa':
                iconName = 'map-outline';
                iconNameFocused = 'map';
                label = '';
                break;
              case 'Swap':
                iconName = 'swap-horizontal-outline';
                iconNameFocused = 'swap-horizontal';
                label = 'Swap';
                break;
              case 'Perfil':
                iconName = 'person-outline';
                iconNameFocused = 'person';
                label = 'Perfil';
                break;
            }

            if (isMapTab) {
              // Center Map Button - Special Design
              return (
                <View key={route.key} style={styles.mapTabWrapper}>
                  <View
                    style={[
                      styles.mapTabOuter,
                      isFocused && styles.mapTabOuterActive
                    ]}
                  >
                    <View
                      style={[
                        styles.mapTabInner,
                        isFocused && styles.mapTabInnerActive
                      ]}
                      onTouchEnd={onPress}
                    >
                      <Ionicons
                        name={isFocused ? iconNameFocused : iconName}
                        size={28}
                        color={isFocused ? '#000' : '#888'}
                      />
                    </View>
                  </View>
                </View>
              );
            }

            return (
              <View
                key={route.key}
                style={styles.tabItem}
                onTouchEnd={onPress}
              >
                <Ionicons
                  name={isFocused ? iconNameFocused : iconName}
                  size={24}
                  color={isFocused ? '#00D9FF' : '#666'}
                />
                {label ? (
                  <View style={styles.tabLabelContainer}>
                    <View style={[styles.tabLabel, isFocused && styles.tabLabelText]}>
                      {isFocused && <View style={styles.activeDot} />}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const MainTabs = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isOrg = user?.roles.includes('organizer') && user?.activeRole === 'organizer';
  const Tab = createBottomTabNavigator<any>();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={isOrg ? OrgEventosStack : AttEventosStack}
      />
      <Tab.Screen
        name="Tickets"
        component={isOrg ? OrgTicketsStack : AttTicketsStack}
      />
      <Tab.Screen
        name="Mapa"
        component={isOrg ? OrgMapaStack : AttMapaStack}
      />
      <Tab.Screen
        name="Swap"
        component={SwapScreen}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
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
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
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

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  tabBarBlur: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabelContainer: {
    marginTop: 4,
    height: 6,
  },
  tabLabel: {
    alignItems: 'center',
  },
  tabLabelText: {
    // Active state
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00D9FF',
  },
  mapTabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  mapTabOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  mapTabOuterActive: {
    borderColor: '#00D9FF',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  mapTabInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapTabInnerActive: {
    backgroundColor: '#00D9FF',
  },
});
