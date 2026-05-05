import { collection, query, onSnapshot, doc, runTransaction } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";
import { cacheParkingSpots } from "./offlineService";
import { saveBookingRecord } from "./userService";

// Collection reference
const parkingSpotsRef = collection(db, "parkingSpots");

/**
 * Subscribe to parking spots in real-time.
 * It also caches the data for offline access.
 */
export const subscribeToParkingSpots = (onUpdate, onError) => {
  const q = query(parkingSpotsRef);
  
  return onSnapshot(q, (snapshot) => {
    const spots = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Cache for offline use
    cacheParkingSpots(spots);
    
    onUpdate(spots);
  }, (error) => {
    console.error("Firestore subscription error:", error);
    if (onError) onError(error);
  });
};

/**
 * Book a parking slot atomically and save a booking record.
 * 1. Uses a Firestore transaction to decrement availableSlots (Cloud Computing).
 * 2. Saves a booking record to the "bookings" collection linked by user UID.
 */
export const bookParkingSlot = async (spot, activeVehicle = null) => {
  const spotDocRef = doc(db, "parkingSpots", spot.id);
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return { success: false, error: "You must be logged in to book." };
  }

  try {
    // Atomically decrement available slots
    await runTransaction(db, async (transaction) => {
      const spotDoc = await transaction.get(spotDocRef);
      if (!spotDoc.exists()) {
        throw "Parking spot does not exist!";
      }

      const newAvailable = spotDoc.data().availableSlots - 1;
      if (newAvailable < 0) {
        throw "No slots available!";
      }

      transaction.update(spotDocRef, { availableSlots: newAvailable });
    });

    // Fetch user details for the booking record
    const { getDoc } = require("firebase/firestore");
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    const bookingDetails = {
      ownerName: userData.displayName || currentUser.email,
      ownerPhone: userData.phone || 'N/A',
      vehicle: activeVehicle || null
    };

    // Save booking record to Firestore (linked by user UID)
    const bookingResult = await saveBookingRecord(currentUser.uid, spot, bookingDetails);

    if (bookingResult.success) {
      try {
        const { notifyBookingConfirmed } = require('./notificationService');
        await notifyBookingConfirmed(spot.name);
      } catch (e) {
        console.log('Notification failed', e);
      }
      return { success: true, bookingId: bookingResult.bookingId };
    } else {
      return { success: true, bookingId: null }; // Slot was booked even if record save failed
    }
  } catch (e) {
    console.error("Booking transaction failed: ", e);
    return { success: false, error: e };
  }
};

/**
 * Calculate distance between two coordinates in kilometers.
 * Demonstrates Context Awareness (Mobile Computing).
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d.toFixed(2);
};

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
