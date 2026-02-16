import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Vibration,
  Platform,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { validateTicket } from '../../../services/ticketService';
import { RootState } from '../../../store/store';

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.7;

const QRScannerScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manualQR, setManualQR] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; ticket?: any } | null>(null);

  // Animated scan line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || scanning) return;
    setScanned(true);
    setScanning(true);
    Vibration.vibrate(100);

    try {
      const result = await validateTicket(data, user?.id || 'Staff_1');
      if (result.isValid) {
        Vibration.vibrate([0, 200, 100, 200]);
        setLastResult({
          success: true,
          message: '¡TICKET VÁLIDO!',
          ticket: result.ticket,
        });
      } else {
        Vibration.vibrate([0, 500]);
        setLastResult({
          success: false,
          message: result.reason || 'Ticket Inválido',
        });
      }
    } catch (error) {
      setLastResult({
        success: false,
        message: 'Error de conexión',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleManualValidation = async () => {
    if (!manualQR.trim() || scanning) return;
    setScanning(true);
    setScanned(true);
    Vibration.vibrate(100);

    try {
      const result = await validateTicket(manualQR.trim(), user?.id || 'Staff_1');
      if (result.isValid) {
        Vibration.vibrate([0, 200, 100, 200]);
        setLastResult({
          success: true,
          message: '¡TICKET VÁLIDO!',
          ticket: result.ticket,
        });
      } else {
        Vibration.vibrate([0, 500]);
        setLastResult({
          success: false,
          message: result.reason || 'Ticket Inválido',
        });
      }
    } catch (error) {
      setLastResult({
        success: false,
        message: 'Error de conexión',
      });
    } finally {
      setScanning(false);
      setManualQR('');
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setLastResult(null);
  };

  // ── Permission states ──
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00D9FF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIconCircle}>
            <Ionicons name="camera-outline" size={48} color="#00D9FF" />
          </View>
          <Text style={styles.permissionTitle}>Acceso a la Cámara</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a tu cámara para escanear los códigos QR de las entradas.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Ionicons name="lock-open-outline" size={20} color="#000" />
            <Text style={styles.permissionButtonText}>Permitir Cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.permissionSecondary} onPress={() => navigation.goBack()}>
            <Text style={styles.permissionSecondaryText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main Scanner UI ──
  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCANNER_SIZE - 4],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validar Entradas</Text>
        <TouchableOpacity onPress={() => setShowManualInput(!showManualInput)}>
          <Ionicons name={showManualInput ? 'camera' : 'keypad-outline'} size={24} color="#00D9FF" />
        </TouchableOpacity>
      </View>

      {/* Camera or Manual */}
      <View style={styles.cameraContainer}>
        {!showManualInput ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            {/* Dark overlay with transparent scanner hole */}
            <View style={styles.overlay}>
              <View style={styles.overlayTop} />
              <View style={styles.overlayMiddleRow}>
                <View style={styles.overlaySide} />
                <View style={styles.scannerHole}>
                  {/* Corner lines */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />

                  {/* Animated scan line */}
                  {!scanned && !scanning && (
                    <Animated.View
                      style={[
                        styles.scanLine,
                        { transform: [{ translateY: scanLineTranslate }] },
                      ]}
                    />
                  )}

                  {/* Scanning spinner */}
                  {scanning && (
                    <View style={styles.scanningOverlay}>
                      <ActivityIndicator size="large" color="#00D9FF" />
                      <Text style={styles.scanningText}>Validando...</Text>
                    </View>
                  )}
                </View>
                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom} />
            </View>

            {/* Result overlay */}
            {lastResult && (
              <View style={[
                styles.resultOverlay,
                { backgroundColor: lastResult.success ? 'rgba(0, 255, 157, 0.97)' : 'rgba(255, 68, 68, 0.97)' }
              ]}>
                <Ionicons
                  name={lastResult.success ? 'checkmark-circle' : 'close-circle'}
                  size={100}
                  color="#000"
                />
                <Text style={styles.resultTitle}>{lastResult.message}</Text>
                {lastResult.ticket && (
                  <View style={styles.ticketBrief}>
                    <Text style={styles.briefTitle}>{lastResult.ticket.eventTitle}</Text>
                    <Text style={styles.briefUser}>{lastResult.ticket.userName}</Text>
                    <Text style={styles.briefId}>#{lastResult.ticket.id.slice(-6).toUpperCase()}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.resetBtn} onPress={resetScanner}>
                  <Text style={styles.resetBtnText}>Siguiente Escaneo</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          /* Manual Input Mode */
          <View style={styles.manualContainer}>
            <View style={styles.manualIconCircle}>
              <Ionicons name="keypad" size={48} color="#00D9FF" />
            </View>
            <Text style={styles.manualTitle}>Código Manual</Text>
            <Text style={styles.manualSubtitle}>Ingresá el código QR de la entrada</Text>
            <View style={styles.manualInputRow}>
              <TextInput
                style={styles.manualInput}
                placeholder="Pegar código QR aquí..."
                placeholderTextColor="#555"
                value={manualQR}
                onChangeText={setManualQR}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.validateBtn, (!manualQR || scanning) && styles.validateBtnDisabled]}
                onPress={handleManualValidation}
                disabled={!manualQR || scanning}
              >
                {scanning ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Ionicons name="checkmark" size={24} color="#000" />
                )}
              </TouchableOpacity>
            </View>

            {/* Manual mode result */}
            {lastResult && (
              <View style={[
                styles.manualResult,
                { borderColor: lastResult.success ? '#00FF9D' : '#FF4444' }
              ]}>
                <Ionicons
                  name={lastResult.success ? 'checkmark-circle' : 'close-circle'}
                  size={32}
                  color={lastResult.success ? '#00FF9D' : '#FF4444'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.manualResultText, { color: lastResult.success ? '#00FF9D' : '#FF4444' }]}>
                    {lastResult.message}
                  </Text>
                  {lastResult.ticket && (
                    <Text style={styles.manualResultDetail}>
                      {lastResult.ticket.eventTitle} — {lastResult.ticket.userName}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={resetScanner}>
                  <Ionicons name="refresh" size={24} color="#00D9FF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Bottom instruction */}
      <View style={styles.bottomBar}>
        <Text style={styles.instruction}>
          {showManualInput
            ? 'Escribí o pegá el código de la entrada'
            : 'Apuntá la cámara al código QR de la entrada'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#000',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ── Camera ──
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },

  // ── Overlay ──
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  overlayMiddleRow: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  scannerHole: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    position: 'relative',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },

  // ── Corners ──
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#00D9FF',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },

  // ── Scan line ──
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: '#00D9FF',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },

  // ── Scanning ──
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanningText: {
    color: '#00D9FF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 12,
    letterSpacing: 1,
  },

  // ── Result ──
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  resultTitle: {
    color: '#000',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  ticketBrief: {
    marginTop: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 16,
    borderRadius: 16,
    width: '80%',
  },
  briefTitle: {
    color: '#000',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  briefUser: {
    color: 'rgba(0,0,0,0.7)',
    fontSize: 17,
    marginTop: 4,
    fontWeight: '600',
  },
  briefId: {
    color: 'rgba(0,0,0,0.4)',
    fontSize: 13,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  resetBtn: {
    marginTop: 32,
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  resetBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    textTransform: 'uppercase',
  },

  // ── Bottom ──
  bottomBar: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#000',
  },
  instruction: {
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },

  // ── Permission ──
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
  },
  permissionText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    flexDirection: 'row',
    backgroundColor: '#00D9FF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    gap: 10,
  },
  permissionButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
  },
  permissionSecondary: {
    marginTop: 16,
    paddingVertical: 12,
  },
  permissionSecondaryText: {
    color: '#666',
    fontSize: 14,
  },

  // ── Manual Input ──
  manualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  manualIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 217, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.15)',
  },
  manualTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  manualSubtitle: {
    color: '#666',
    fontSize: 14,
    marginBottom: 32,
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 14,
    padding: 16,
    color: '#fff',
    fontSize: 15,
  },
  validateBtn: {
    backgroundColor: '#00D9FF',
    width: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validateBtnDisabled: {
    opacity: 0.35,
  },
  manualResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    width: '100%',
  },
  manualResultText: {
    fontWeight: '900',
    fontSize: 16,
  },
  manualResultDetail: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
});

export default QRScannerScreen;
