import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration } from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { validateTicket } from '../../../services/ticketService';
import { colors, spacing, typography } from '../../../theme';

const QRScannerScreen = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || validating || !user) return;

    setScanned(true);
    setValidating(true);
    Vibration.vibrate(100);

    try {
      const validation = await validateTicket(data, user.id);

      if (validation.isValid) {
        // Ticket válido
        Vibration.vibrate([0, 200, 100, 200]);
        
        Alert.alert(
          '✅ Entrada Válida',
          `Ticket verificado correctamente\n\nEvento: ${validation.ticket?.eventTitle}\nUsuario: ${validation.ticket?.userName}`,
          [
            {
              text: 'Continuar escaneando',
              onPress: () => {
                setScanned(false);
                setValidating(false);
              }
            }
          ]
        );
      } else {
        // Ticket inválido
        Vibration.vibrate([0, 500]);
        
        Alert.alert(
          '❌ Entrada Inválida',
          validation.reason || 'Este ticket no es válido',
          [
            {
              text: 'Continuar escaneando',
              onPress: () => {
                setScanned(false);
                setValidating(false);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error validating ticket:', error);
      Alert.alert(
        'Error',
        'No se pudo validar el ticket. Intenta nuevamente.',
        [
          {
            text: 'Reintentar',
            onPress: () => {
              setScanned(false);
              setValidating(false);
            }
          }
        ]
      );
    }
  };

  const toggleScanning = () => {
    setScanning(!scanning);
    setScanned(false);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text>Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se otorgó permiso de cámara</Text>
        <Text style={styles.errorSubtext}>
          Ve a configuración para habilitar el acceso a la cámara
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scanning && (
        <Camera
          style={styles.camera}
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          barCodeScannerSettings={{
            barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
          }}
        >
          <View style={styles.overlay}>
            {/* Esquinas del marco de escaneo */}
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            <View style={styles.instructionsContainer}>
              <Text style={styles.instructions}>
                {validating ? 'Validando ticket...' : 'Apunta la cámara al código QR'}
              </Text>
            </View>
          </View>
        </Camera>
      )}

      {/* Controles */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.toggleButton]}
          onPress={toggleScanning}
        >
          <Text style={styles.buttonText}>
            {scanning ? '⏸ Pausar' : '▶️ Reanudar'}
          </Text>
        </TouchableOpacity>

        {scanned && !validating && (
          <TouchableOpacity
            style={[styles.button, styles.scanAgainButton]}
            onPress={() => {
              setScanned(false);
              setValidating(false);
            }}
          >
            <Text style={styles.buttonText}>🔍 Escanear Otro</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Indicador de estado */}
      <View style={styles.statusBar}>
        <View style={[
          styles.statusIndicator,
          scanning && !scanned ? styles.statusActive : styles.statusInactive
        ]} />
        <Text style={styles.statusText}>
          {validating ? 'Validando...' :
           scanning && !scanned ? 'Listo para escanear' :
           scanned ? 'Ticket escaneado' : 'Escáner pausado'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xlarge,
  },
  errorText: {
    ...typography.h3,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.small,
  },
  errorSubtext: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructions: {
    ...typography.subtitle1,
    color: colors.white,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    padding: spacing.medium,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    padding: spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: spacing.xsmall,
  },
  toggleButton: {
    backgroundColor: colors.primary,
  },
  scanAgainButton: {
    backgroundColor: colors.success,
  },
  buttonText: {
    ...typography.button,
    color: colors.onPrimary,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.small,
  },
  statusActive: {
    backgroundColor: colors.success,
  },
  statusInactive: {
    backgroundColor: colors.textSecondary,
  },
  statusText: {
    ...typography.body2,
    color: colors.text,
  },
});

export default QRScannerScreen;
