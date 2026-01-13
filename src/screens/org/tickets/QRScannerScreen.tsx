import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { validateTicket } from '../../../services/ticketService';
import { RootState } from '../../../store/store';

const { width } = Dimensions.get('window');

const QRScannerScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [scanning, setScanning] = useState(false);
  const [manualQR, setManualQR] = useState('');
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; ticket?: any } | null>(null);

  const handleSimulateScan = async (mockQRCode: string) => {
    setScanning(true);
    setLastResult(null);
    Vibration.vibrate(100);

    // Simulate validation delay
    setTimeout(async () => {
      try {
        const result = await validateTicket(mockQRCode, user?.id || 'Staff_1');
        if (result.isValid) {
          Vibration.vibrate([0, 200, 100, 200]);
          setLastResult({
            success: true,
            message: '¡TICKET VÁLIDO!',
            ticket: result.ticket
          });
        } else {
          Vibration.vibrate([0, 500]);
          setLastResult({
            success: false,
            message: result.reason || 'Ticket Inválido'
          });
        }
      } catch (error) {
        setLastResult({
          success: false,
          message: 'Error al validar'
        });
      } finally {
        setScanning(false);
      }
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validar Entradas</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {/* Scanner Frame */}
        <View style={styles.scannerWrapper}>
          <View style={styles.scannerFrame}>
            {/* Corner Markers */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Scanning UI */}
            {!lastResult && !scanning && (
              <View style={styles.idleTextContainer}>
                <Ionicons name="qr-code-outline" size={80} color="rgba(0, 217, 255, 0.3)" />
                <Text style={styles.idleText}>Listo para escanear</Text>
              </View>
            )}

            {scanning && (
              <View style={styles.scanningContainer}>
                <ActivityIndicator size="large" color="#00D9FF" />
                <Text style={styles.scanningText}>Validando...</Text>
              </View>
            )}

            {lastResult && (
              <View style={[styles.resultOverlay, { backgroundColor: lastResult.success ? 'rgba(0, 255, 157, 0.95)' : 'rgba(255, 68, 68, 0.95)' }]}>
                <Ionicons name={lastResult.success ? "checkmark-circle" : "close-circle"} size={100} color="#000" />
                <Text style={styles.resultTitle}>{lastResult.message}</Text>
                {lastResult.ticket && (
                  <View style={styles.ticketBrief}>
                    <Text style={styles.briefTitle}>{lastResult.ticket.eventTitle}</Text>
                    <Text style={styles.briefUser}>{lastResult.ticket.userName}</Text>
                    <Text style={styles.briefId}>#{lastResult.ticket.id.slice(-6).toUpperCase()}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.resetBtn} onPress={() => setLastResult(null)}>
                  <Text style={styles.resetBtnText}>Siguiente Escaneo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.instruction}>
          Apunta la cámara al código QR de la entrada.
        </Text>

        {/* Manual QR Input */}
        <View style={styles.manualInputContainer}>
          <Text style={styles.manualInputLabel}>O ingresá el código QR manualmente:</Text>
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
              onPress={() => {
                if (manualQR.trim()) {
                  handleSimulateScan(manualQR.trim());
                  setManualQR('');
                }
              }}
              disabled={!manualQR || scanning}
            >
              <Ionicons name="checkmark" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo Controls */}
        <View style={styles.simInfoBox}>
          <Ionicons name="flask-outline" size={16} color="#00D9FF" />
          <Text style={styles.simInfoText}>Modo Demo: Simuladores rápidos</Text>
        </View>

        {/* Mock Controls */}
        <View style={styles.mockControls}>
          <TouchableOpacity
            style={[styles.mockBtn, { borderColor: '#00D9FF' }]}
            onPress={() => handleSimulateScan('VALID_MOCK_QR')}
            disabled={scanning || !!lastResult}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#00D9FF" />
            <Text style={[styles.mockBtnText, { color: '#00D9FF' }]}>Simular Éxito</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mockBtn, { borderColor: '#FF4444' }]}
            onPress={() => handleSimulateScan('INVALID_QR')}
            disabled={scanning || !!lastResult}
          >
            <Ionicons name="alert-circle-outline" size={20} color="#FF4444" />
            <Text style={[styles.mockBtnText, { color: '#FF4444' }]}>Simular Fallo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#000',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  scannerWrapper: {
    width: width * 0.85,
    height: width * 0.85,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  scannerFrame: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 32,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050505',
  },
  corner: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderColor: '#00D9FF',
    borderWidth: 6,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 32,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 32,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 32,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 32,
  },
  idleTextContainer: {
    alignItems: 'center',
    gap: 20,
  },
  idleText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scanningContainer: {
    alignItems: 'center',
    gap: 16,
  },
  scanningText: {
    color: '#00D9FF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
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
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 16,
    width: '100%',
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
  instruction: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal: 50,
    marginBottom: 12,
    lineHeight: 24,
  },
  simInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 217, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 40,
  },
  simInfoText: {
    color: '#00D9FF',
    fontSize: 12,
    fontWeight: '700',
  },
  mockControls: {
    flexDirection: 'row',
    gap: 20,
  },
  mockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#111',
  },
  mockBtnText: {
    fontWeight: '900',
    fontSize: 15,
  },
  manualInputContainer: {
    width: '85%',
    marginBottom: 20,
  },
  manualInputLabel: {
    color: '#666',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 14,
  },
  validateBtn: {
    backgroundColor: '#00D9FF',
    width: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validateBtnDisabled: {
    opacity: 0.4,
  },
});

export default QRScannerScreen;
