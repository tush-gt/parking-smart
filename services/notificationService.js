import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Notification Service
 * 
 * Uses expo-notifications for local notifications (works in Expo Go).
 * For remote push notifications (FCM), a development build is required.
 * 
 * Local notifications work immediately for:
 * - Booking confirmations
 * - Payment success
 * - Offline sync status
 * 
 * Remote notifications (future dev build):
 * - Real-time booking updates from other users
 * - Admin alerts
 * - Promotional messages
 */

// Configure notification handler (call this in App.js)
export const setupNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

// Set up Android notification channel
export const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('parking', {
      name: 'Parking Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
    });
  }
};

/**
 * Register for push notifications and save token.
 * Returns the Expo push token.
 */
export const registerForNotifications = async (userId) => {
  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    // Set up channel for Android
    await setupNotificationChannel();

    // Get Expo push token (works for local notifications)
    // For remote notifications, you'd need a project ID from EAS
    let token = null;
    if (Device.isDevice) {
      try {
        const tokenResponse = await Notifications.getExpoPushTokenAsync({
          projectId: '70ad698e-bb47-4d8d-8c20-b9d78b17ddc3',
        });
        token = tokenResponse.data;

        // Save token to user's Firestore doc
        if (userId && token) {
          const userRef = doc(db, 'users', userId);
          await setDoc(userRef, { expoPushToken: token }, { merge: true });
        }
      } catch (e) {
        console.log('Push token not available (Expo Go limitation):', e.message);
      }
    }

    return token;
  } catch (error) {
    console.error('Error registering for notifications:', error);
    return null;
  }
};

/**
 * Send a local notification immediately.
 * Works in Expo Go without any native build.
 */
export const sendLocalNotification = async (title, body) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // null = immediate
    });
    console.log('Local notification sent:', title);
  } catch (error) {
    console.error('Error sending local notification:', error);
  }
};

/**
 * Notify user that booking is confirmed.
 */
export const notifyBookingConfirmed = async (spotName) => {
  await sendLocalNotification(
    'Booking Confirmed! 🎫',
    `Your slot at ${spotName} has been booked. Slot held for 15 minutes.`
  );
};

/**
 * Notify user that payment was successful.
 */
export const notifyPaymentSuccess = async (amount, spotName) => {
  await sendLocalNotification(
    'Payment Successful ✅',
    `₹${amount} paid for parking at ${spotName}. Receipt generated.`
  );
};

/**
 * Notify user that offline actions were synced.
 */
export const notifyOfflineSync = async (count) => {
  await sendLocalNotification(
    'Back Online! 🌐',
    `${count} queued action${count !== 1 ? 's' : ''} synced successfully.`
  );
};
