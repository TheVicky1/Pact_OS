'use client';
import { useEffect, useState } from 'react';
type EffectiveConnectionType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';

export interface NetworkQuality {
  isOnline: boolean;
  effectiveType: EffectiveConnectionType;
  saveData: boolean;
  isSlowConnection: boolean;
}
interface NetworkInformation extends EventTarget {
  effectiveType?: EffectiveConnectionType;
  saveData?: boolean;
}
interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

function getNetworkQuality(): Omit<NetworkQuality, 'isOnline'> {
  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection;

  return {
    effectiveType: connection?.effectiveType ?? 'unknown',
    saveData: connection?.saveData ?? false,
    isSlowConnection:
      connection?.effectiveType === '2g' ||
      connection?.effectiveType === 'slow-2g' ||
      connection?.saveData === true,
  };
}
function getCurrentNetworkQuality(): NetworkQuality {
  return {
    isOnline: navigator.onLine,
    ...getNetworkQuality(),
  };
}
function subscribeToNetwork(
  onChange: (quality: NetworkQuality) => void,
): () => void {
  const update = () => onChange(getCurrentNetworkQuality());
  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);

  const connection = (navigator as NavigatorWithConnection).connection;
  connection?.addEventListener('change' , update);
  
  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
    connection?.removeEventListener('change', update);
  };
}

export function useNetworkQuality(): NetworkQuality {
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>(
    getCurrentNetworkQuality(),
  );

  useEffect(() => {
    return subscribeToNetwork(setNetworkQuality);
  }, []);

  return networkQuality;
}
