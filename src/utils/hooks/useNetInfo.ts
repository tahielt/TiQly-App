import { useState, useEffect, useRef } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

type ConnectionType = 'none' | 'wifi' | 'cellular' | 'ethernet' | 'unknown' | 'bluetooth' | 'wimax' | 'vpn' | 'other';
type EffectiveConnectionType = '2g' | '3g' | '4g' | '5g' | 'unknown';

type NetworkState = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: ConnectionType;
  isWifi: boolean;
  isCellular: boolean;
  isEthernet: boolean;
  isVpn: boolean;
  isUnknown: boolean;
  details: {
    isConnectionExpensive?: boolean;
    cellularGeneration?: EffectiveConnectionType | null;
    carrier?: string | null;
    ipAddress?: string | null;
    subnet?: string | null;
    frequency?: number | null;
    linkSpeed?: number | null;
    rxLinkSpeedKbps?: number | null;
    txLinkSpeedKbps?: number | null;
    signalStrength?: number | null;
  };
};

const defaultState: NetworkState = {
  isConnected: null,
  isInternetReachable: null,
  type: 'unknown',
  isWifi: false,
  isCellular: false,
  isEthernet: false,
  isVpn: false,
  isUnknown: true,
  details: {},
};

function useNetInfo() {
  const [netInfo, setNetInfo] = useState<NetworkState>(defaultState);
  const subscriptionRef = useRef<NetInfoSubscription | null>(null);

  const updateNetInfo = (state: NetInfoState) => {
    const {
      isConnected,
      isInternetReachable,
      type,
      isWifiEnabled,
      details,
    } = state;

    const {
      isConnectionExpensive,
      cellularGeneration,
      carrier,
      ipAddress,
      subnet,
      frequency,
      linkSpeed,
      rxLinkSpeedKbps,
      txLinkSpeedKbps,
      signalStrength,
    } = details as any;

    setNetInfo({
      isConnected,
      isInternetReachable: isInternetReachable ?? null,
      type: type as ConnectionType,
      isWifi: type === 'wifi',
      isCellular: type === 'cellular',
      isEthernet: type === 'ethernet',
      isVpn: type === 'vpn',
      isUnknown: type === 'unknown',
      details: {
        isConnectionExpensive,
        cellularGeneration: cellularGeneration as EffectiveConnectionType || null,
        carrier: carrier || null,
        ipAddress: ipAddress || null,
        subnet: subnet || null,
        frequency: frequency || null,
        linkSpeed: linkSpeed || null,
        rxLinkSpeedKbps: rxLinkSpeedKbps || null,
        txLinkSpeedKbps: txLinkSpeedKbps || null,
        signalStrength: signalStrength || null,
      },
    });
  };

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(updateNetInfo);

    // Subscribe to network state updates
    subscriptionRef.current = NetInfo.addEventListener(updateNetInfo);

    // Clean up the subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, []);

  return netInfo;
}

export default useNetInfo;
