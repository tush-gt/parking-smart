import { doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * Create a user profile document in Firestore.
 * Uses the Auth UID as the document ID so it's linked to Firebase Auth.
 * Called on user registration (sign up).
 */
export const createUserProfile = async (user) => {
  const userRef = doc(db, "users", user.uid);

  try {
    // Check if profile already exists (e.g. returning user)
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      console.log("User profile already exists");
      return { success: true, data: userSnap.data() };
    }

    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split("@")[0],
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };

    await setDoc(userRef, userData);
    console.log("User profile created successfully");
    return { success: true, data: userData };
  } catch (error) {
    console.error("Error creating user profile:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update last login timestamp for existing user.
 * If the user profile doesn't exist yet (e.g. account created before this feature),
 * it creates one automatically.
 * Called on user sign in.
 */
export const updateLastLogin = async (user) => {
  const userRef = doc(db, "users", user.uid);

  try {
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Profile doesn't exist — create it now (for accounts created before this feature)
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split("@")[0],
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };
      await setDoc(userRef, userData);
      console.log("User profile created on login");
    } else {
      // Profile exists — just update lastLogin
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
      console.log("Last login updated");
    }
  } catch (error) {
    console.error("Error updating last login:", error);
  }
};

/**
 * Get user profile from Firestore.
 */
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    }
    return { success: false, error: "User profile not found" };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Save a booking record to the "bookings" collection.
 * Linked to the user by their Auth UID (userId field).
 * Linked to the parking spot by spotId.
 */
export const saveBookingRecord = async (userId, spot, bookingDetails = {}) => {
  try {
    const bookingData = {
      userId: userId,
      spotId: spot.id,
      spotName: spot.name,
      spotAddress: spot.address || "N/A",
      pricePerHour: spot.pricePerHour,
      status: "confirmed",
      bookedAt: serverTimestamp(),
      ...bookingDetails,
    };

    const bookingsRef = collection(db, "bookings");
    const docRef = await addDoc(bookingsRef, bookingData);

    console.log("Booking saved with ID:", docRef.id);
    return { success: true, bookingId: docRef.id };
  } catch (error) {
    console.error("Error saving booking:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all bookings for a specific user, ordered by most recent first.
 */
export const getUserBookings = async (userId) => {
  try {
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("userId", "==", userId),
      orderBy("bookedAt", "desc")
    );

    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, data: bookings };
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return { success: false, error: error.message, data: [] };
  }
};
