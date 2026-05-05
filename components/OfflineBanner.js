import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getCacheAge } from '../services/offlineService';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [cacheAge, setCacheAge] = useState(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected || !state.isInternetReachable);
    });

    const checkCache = async () => {
      const age = await getCacheAge();
      setCacheAge(age);
    };
    checkCache();
    
    // Interval to keep cache age updated
    const interval = setInterval(checkCache, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        ⚠️ Offline Mode. Showing cached data {cacheAge ? `(${cacheAge})` : ''}.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fb923c', // Orange for offline warning
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default OfflineBanner;
