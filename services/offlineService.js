import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const STORAGE_KEYS = {
  PARKING_SPOTS: '@parking_spots_cache',
  BOOKINGS: '@user_bookings_cache',
  OFFLINE_QUEUE: '@offline_action_queue',
  CACHE_TIMESTAMP: '@cache_timestamp',
};

// ─── PARKING SPOTS CACHE ───────────────────────────────

export const cacheParkingSpots = async (spots) => {
  try {
    const jsonValue = JSON.stringify(spots);
    await AsyncStorage.setItem(STORAGE_KEYS.PARKING_SPOTS, jsonValue);
    await setCacheTimestamp();
    console.log('Parking spots cached successfully');
  } catch (e) {
    console.error('Error caching parking spots', e);
  }
};

export const getCachedParkingSpots = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.PARKING_SPOTS);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading cached parking spots', e);
    return [];
  }
};

// ─── BOOKINGS CACHE ────────────────────────────────────

export const cacheUserBookings = async (bookings) => {
  try {
    // Serialize Firestore timestamps for storage
    const serialized = bookings.map(b => ({
      ...b,
      bookedAt: b.bookedAt?.toDate ? b.bookedAt.toDate().toISOString() : b.bookedAt,
      endTime: b.endTime?.toDate ? b.endTime.toDate().toISOString() : b.endTime,
    }));
    const jsonValue = JSON.stringify(serialized);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, jsonValue);
    console.log('Bookings cached successfully');
  } catch (e) {
    console.error('Error caching bookings', e);
  }
};

export const getCachedBookings = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading cached bookings', e);
    return [];
  }
};

// ─── OFFLINE ACTION QUEUE ──────────────────────────────

/**
 * Queue an action to perform when back online.
 * action = { type: 'BOOK_SPOT', payload: { spotId, ... } }
 */
export const queueOfflineAction = async (action) => {
  try {
    const queue = await getOfflineQueue();
    queue.push({
      ...action,
      queuedAt: new Date().toISOString(),
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    });
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    console.log('Action queued for offline sync:', action.type);
  } catch (e) {
    console.error('Error queuing offline action', e);
  }
};

export const getOfflineQueue = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading offline queue', e);
    return [];
  }
};

export const clearOfflineQueue = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    console.log('Offline queue cleared');
  } catch (e) {
    console.error('Error clearing offline queue', e);
  }
};

/**
 * Process queued actions when back online.
 * Returns the number of successfully processed actions.
 */
export const syncOfflineQueue = async (processAction) => {
  try {
    const queue = await getOfflineQueue();
    if (queue.length === 0) return 0;

    let processed = 0;
    const failed = [];

    for (const action of queue) {
      try {
        await processAction(action);
        processed++;
      } catch (e) {
        console.error('Failed to sync action:', action.id, e);
        failed.push(action);
      }
    }

    // Keep only failed actions in queue
    if (failed.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(failed));
    } else {
      await clearOfflineQueue();
    }

    return processed;
  } catch (e) {
    console.error('Error syncing offline queue', e);
    return 0;
  }
};

// ─── CACHE TIMESTAMPS ──────────────────────────────────

export const setCacheTimestamp = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, new Date().toISOString());
  } catch (e) {
    console.error('Error setting cache timestamp', e);
  }
};

export const getCacheTimestamp = async () => {
  try {
    const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_TIMESTAMP);
    return timestamp ? new Date(timestamp) : null;
  } catch (e) {
    console.error('Error reading cache timestamp', e);
    return null;
  }
};

/**
 * Get a human-readable "X mins ago" string for the last cache time.
 */
export const getCacheAge = async () => {
  const timestamp = await getCacheTimestamp();
  if (!timestamp) return null;

  const diff = Date.now() - timestamp.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) !== 1 ? 's' : ''} ago`;
};

// ─── NETWORK STATUS ────────────────────────────────────

/**
 * Check if device is currently online.
 */
export const isOnline = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (e) {
    return false;
  }
};

/**
 * Listen for network changes and trigger sync when back online.
 */
export const setupNetworkListener = (onReconnect) => {
  let wasOffline = false;
  return NetInfo.addEventListener(state => {
    const online = state.isConnected && state.isInternetReachable;
    if (!online) {
      wasOffline = true;
    } else if (online && wasOffline) {
      wasOffline = false;
      if (onReconnect) onReconnect();
    }
  });
};
