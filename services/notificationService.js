import { Platform } from 'react-native';

// Safely load — crashes Expo Go SDK 53 if imported directly
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.log('expo-notifications unavailable');
}

export const setupNotificationHandler = () => {
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

export const setupNotificationChannel = async () => {
  if (!Notifications || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('parking', {
    name: 'Parking Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2563eb',
  });
};

export const registerForNotifications = async (userId) => {
  return null; // disabled in Expo Go SDK 53
};

export const sendLocalNotification = async (title, body) => {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch (e) {
    console.log('Notification failed silently:', e.message);
  }
};

export const notifyBookingConfirmed = async (spotName) => {
  await sendLocalNotification(
    'Booking Confirmed! 🎫',
    `Your slot at ${spotName} has been booked. Slot held for 15 minutes.`
  );
};

export const notifyPaymentSuccess = async (amount, spotName) => {
  await sendLocalNotification(
    'Payment Successful ✅',
    `₹${amount} paid for parking at ${spotName}. Receipt generated.`
  );
};

export const notifyOfflineSync = async (count) => {
  await sendLocalNotification(
    'Back Online! 🌐',
    `${count} queued action${count !== 1 ? 's' : ''} synced successfully.`
  );
};