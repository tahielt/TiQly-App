// ====================================
// NOTIFICACIONES DESHABILITADAS
// ====================================
// Las notificaciones fueron removidas para evitar errores de dependencias
// TODO: Re-implementar cuando sea necesario

export const notifyTicketPurchase = async (...args: any[]) => { 
  console.log('[NOTIFICATIONS DISABLED] notifyTicketPurchase called'); 
};

export const notifyTicketTransferReceived = async (...args: any[]) => { 
  console.log('[NOTIFICATIONS DISABLED] notifyTicketTransferReceived called'); 
};

export const notifyTicketTransferAccepted = async (...args: any[]) => { 
  console.log('[NOTIFICATIONS DISABLED] notifyTicketTransferAccepted called'); 
};

export const scheduleEventReminder = async (...args: any[]) => { 
  console.log('[NOTIFICATIONS DISABLED] scheduleEventReminder called'); 
};

export const notifyEventUpdate = async (...args: any[]) => { 
  console.log('[NOTIFICATIONS DISABLED] notifyEventUpdate called'); 
};

export const notifyEventCancelled = async (...args: any[]) => { 
  console.log('[NOTIFICATIONS DISABLED] notifyEventCancelled called'); 
};

export default {
  notifyTicketPurchase,
  notifyTicketTransferReceived,
  notifyTicketTransferAccepted,
  scheduleEventReminder,
  notifyEventUpdate,
  notifyEventCancelled
};
