import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { 
  RootStackParamList, 
  MainTabParamList, 
  // UserRole, // Eliminada, ya que no se usa y generaba una advertencia.
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
// TEMPORALMENTE COMENTADO: Este componente se importaba como 'undefined'.
// Reemplazado por un placeholder local para permitir que la app se cargue.
// import SocialNavigator from '../features/social/navigation/SocialNavigator';
import { checkAuthStatus } from '../features/auth/authSlice';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Pantallas de carga y autenticación (Temporales)
const LoadingScreen = () => <></>;
const LegalScreen = () => <></>;
const AuthScreen = () => <></>;
const RoleGateScreen = () => <></>;

// TEMPORAL: Placeholder para SocialNavigator (Eliminar/reemplazar cuando se solucione la importación real)
const SocialNavigator = () => {
  const Stack = createStackNavigator<SocialStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* CORRECCIÓN: Usamos un nombre de ruta genérico para evitar error de tipado 'SocialHome' */}
      <Stack.Screen name="SocialPlaceholder" component={() => <></>} />
    </Stack.Navigator>
  );
};


// Stacks para cada sección
const OrgEventosStack = () => {
  const Stack = createStackNavigator<OrgEventosStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrgEventosHome" component={() => <></>} />
      <Stack.Screen name="OrgEventoDetalle" component={() => <></>} />
      <Stack.Screen name="OrgCrearEvento" component={() => <></>} />
    </Stack.Navigator>
  );
};

const AttEventosStack = () => {
  const Stack = createStackNavigator<AttEventosStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttEventosHome" component={() => <></>} />
      <Stack.Screen name="AttEventoDetalle" component={() => <></>} />
    </Stack.Navigator>
  );
};

// Stacks para Mapa
const OrgMapaStack = () => {
  const Stack = createStackNavigator<OrgMapaStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrgMapaHome" component={() => <></>} />
      <Stack.Screen name="OrgMapaDetalle" component={() => <></>} />
    </Stack.Navigator>
  );
};

const AttMapaStack = () => {
  const Stack = createStackNavigator<AttMapaStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttMapaHome" component={() => <></>} />
      <Stack.Screen name="AttMapaDetalle" component={() => <></>} />
    </Stack.Navigator>
  );
};

// Stacks para Tickets
const OrgTicketsStack = () => {
  const Stack = createStackNavigator<OrgTicketsStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrgTicketsHome" component={() => <></>} />
      <Stack.Screen name="OrgValidarTicket" component={() => <></>} />
    </Stack.Navigator>
  );
};

const AttTicketsStack = () => {
  const Stack = createStackNavigator<AttTicketsStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttTicketsHome" component={() => <></>} />
      <Stack.Screen name="AttTicketDetalle" component={() => <></>} />
    </Stack.Navigator>
  );
};

// Stacks para Transporte
const OrgTranspStack = () => {
  const Stack = createStackNavigator<OrgTranspStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrgTranspHome" component={() => <></>} />
      <Stack.Screen name="OrgTranspDetalle" component={() => <></>} />
    </Stack.Navigator>
  );
};

const AttTranspStack = () => {
  const Stack = createStackNavigator<AttTranspStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttTranspHome" component={() => <></>} />
      <Stack.Screen name="AttTranspDetalle" component={() => <></>} />
    </Stack.Navigator>
  );
};

// Stack para Cuenta
const CuentaStack = () => {
  const Stack = createStackNavigator<CuentaStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CuentaHome" component={() => <></>} />
      <Stack.Screen name="Ajustes" component={() => <></>} />
      <Stack.Screen name="Perfil" component={() => <></>} />
    </Stack.Navigator>
  );
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Navegación principal con pestañas
const MainTabs = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isOrg = user?.roles.includes('organizer') && user?.activeRole === 'organizer';
  const Tab = createBottomTabNavigator<MainTabParamList>();

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen 
        name="Eventos" 
        component={isOrg ? OrgEventosStack : AttEventosStack} 
      />
      <Tab.Screen 
        name="Social" 
        component={SocialNavigator} 
        options={{
          title: 'Social',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Mapa" 
        component={isOrg ? OrgMapaStack : AttMapaStack} 
      />
      <Tab.Screen 
        name="Tickets" 
        component={isOrg ? OrgTicketsStack : AttTicketsStack} 
      />
      <Tab.Screen 
        name="Transporte" 
        component={isOrg ? OrgTranspStack : AttTranspStack} 
      />
      <Tab.Screen 
        name="Cuenta" 
        component={CuentaStack} 
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  // Removida la desestructuración de 'user' ya que no se usa aquí.
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
