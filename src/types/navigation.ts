// Navigation types for Tiqly App

export type UserRole = 'guest' | 'attendee' | 'organizer' | 'driver';

export type SocialStackParamList = {
  SocialFeed: undefined;
  CreatePost: undefined;
  PostDetail: { postId: string };
};

export type RootStackParamList = {
  Loading: undefined;
  Legal: undefined;
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  RoleGate: undefined;
  MainTabs: { screen: keyof MainTabParamList; params?: any };
  CreateEvent: undefined;
  Profile: undefined;
  AttEventoDetalle: { eventId: string };
};

// Stacks para cada rol
export type OrgEventosStackParamList = {
  OrgEventosHome: undefined;
  OrgEventoDetalle: { eventId: string };
  OrgCrearEvento: undefined;
  OrgEventStats: { eventId: string };
};

export type AttEventosStackParamList = {
  AttEventosHome: undefined;
};

export type OrgMapaStackParamList = {
  OrgMapaHome: undefined;
  OrgMapaDetalle: { locationId: string };
};

export type AttMapaStackParamList = {
  AttMapaHome: undefined;
  AttMapaDetalle: { locationId: string };
};

export type OrgTicketsStackParamList = {
  OrgTicketsHome: undefined;
  OrgValidarTicket: { ticketId: string };
};

export type AttTicketsStackParamList = {
  AttTicketsHome: undefined;
  AttTicketDetalle: { ticketId: string };
  TransferInbox: undefined;
};

export type OrgTranspStackParamList = {
  OrgTranspHome: undefined;
  OrgTranspDetalle: { transportId: string };
};

export type AttTranspStackParamList = {
  AttTranspHome: undefined;
  AttTranspDetalle: { transportId: string };
};

export type CuentaStackParamList = {
  CuentaHome: undefined;
  Ajustes: undefined;
  Perfil: undefined;
};

export type MainTabParamList = {
  Eventos: undefined;
  Social: undefined;
  Mapa: undefined;
  Tickets: undefined;
  Transporte: undefined;
  Cuenta: undefined;
};
