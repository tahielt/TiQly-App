import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// URL de tu backend que manejará la comunicación con Mercado Pago
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://tu-backend.com/api';
const PAYMENT_ENDPOINT = `${API_BASE_URL}/payments/create`;

// Tipos para la respuesta del servidor
type PaymentResponse = {
  paymentUrl: string;
  // Otros campos que pueda devolver tu backend
};

/**
 * Inicia el proceso de pago abriendo una página web de Mercado Pago.
 * @param ticketId El ID del ticket que se está comprando.
 * @param successUrl URL a la que redirigir después de un pago exitoso
 * @param failureUrl URL a la que redirigir después de un pago fallido
 */
export async function initiatePayment(
  ticketId: string,
  successUrl: string = 'tiqlyapp://payment/success',
  failureUrl: string = 'tiqlyapp://payment/failure'
) {
  try {
    // 1. Llama a tu backend para generar la URL de pago de Mercado Pago
    const response = await fetch(PAYMENT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Aquí deberías incluir el token de autenticación del usuario si es necesario
        // 'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({ 
        ticketId,
        successUrl,
        failureUrl,
        // Incluye cualquier otro dato necesario para el pago
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al iniciar el pago en el backend.');
    }

    const { paymentUrl } = await response.json();

    // 2. Abre la URL de pago en un navegador web
    const browserOptions: WebBrowser.WebBrowserOpenOptions = {
      // Opciones comunes
      toolbarColor: '#009ee3', // Color de la barra de herramientas (azul de Mercado Pago)
      controlsColor: '#fff', // Color de los controles
      showTitle: true, // Mostrar el título de la página
      enableBarCollapsing: true, // Permitir colapso de la barra de herramientas
      
      // Opciones específicas de plataforma
      ...(Platform.OS === 'android' ? {
        showInRecents: true, // Mostrar en el selector de aplicaciones recientes
      } : {
        // Opciones específicas de iOS
        dismissButtonStyle: 'close', // Estilo del botón de cierre
        // Nota: preferredBarTintColor y preferredControlTintColor no son compatibles con la versión actual
      })
    };

    const result = await WebBrowser.openBrowserAsync(paymentUrl, browserOptions);

    // 3. Maneja el resultado de la navegación
    if (result.type === 'cancel') {
      console.log('El usuario canceló el pago');
      // Aquí puedes manejar la cancelación del pago
    } else if (result.type === 'dismiss') {
      console.log('El usuario cerró el navegador');
      // Aquí puedes manejar el cierre del navegador
    }

    return result;
  } catch (error) {
    console.error('Error durante el proceso de pago:', error);
    throw error; // Relanza el error para que el componente que llama pueda manejarlo
  }
}

// Tipos para los parámetros de la función initiatePayment
type InitiatePaymentParams = {
  ticketId: string;
  successUrl?: string;
  failureUrl?: string;
  // Agrega aquí cualquier otro parámetro que necesites
};

// Exporta la función principal
export default {
  initiatePayment,
};
