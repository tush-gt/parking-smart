import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@parking_spots_cache';

export const cacheParkingSpots = async (spots) => {
  try {
    const jsonValue = JSON.stringify(spots);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    console.log('Parking spots cached successfully');
  } catch (e) {
    console.error('Error caching parking spots', e);
  }
};

export const getCachedParkingSpots = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading cached parking spots', e);
    return [];
  }
};
