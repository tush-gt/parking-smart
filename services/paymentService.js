import { doc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Payment Service — Simulated Payment Gateway
 * 
 * Currently uses a simulated payment flow for demo/testing.
 * To integrate a real payment gateway (Razorpay/Stripe), replace
 * the `processPayment` function with the actual SDK call.
 * 
 * INTEGRATION GUIDE:
 * 
 * For Razorpay (requires dev build, not Expo Go):
 *   1. npm install react-native-razorpay
 *   2. npx expo prebuild
 *   3. Replace processPayment() with:
 *      import RazorpayCheckout from 'react-native-razorpay';
 *      const options = {
 *        key: 'rzp_test_xxxxx',
 *        amount: amount * 100, // in paise
 *        name: 'Smart Parking',
 *        description: `Parking at ${spotName}`,
 *        prefill: { email: userEmail },
 *      };
 *      const data = await RazorpayCheckout.open(options);
 *      return { success: true, paymentId: data.razorpay_payment_id };
 * 
 * For Stripe (requires dev build):
 *   1. npx expo install @stripe/stripe-react-native
 *   2. Set up Stripe publishable key
 *   3. Use PaymentSheet or CardField component
 */

/**
 * Process a payment (simulated for demo).
 * In production, this would open a real payment gateway.
 */
export const processPayment = async ({ amount, bookingId, spotId, userEmail, spotName }) => {
  try {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate a simulated payment ID
    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Update booking document with payment details
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'completed',
      endTime: serverTimestamp(),
      totalAmount: amount,
      paymentId: paymentId,
    });

    // Atomically increment availableSlots back in parkingSpots
    const spotRef = doc(db, 'parkingSpots', spotId);
    await runTransaction(db, async (transaction) => {
      const spotDoc = await transaction.get(spotRef);
      if (spotDoc.exists()) {
        const currentAvailable = spotDoc.data().availableSlots;
        const totalSlots = spotDoc.data().totalSlots;
        const newAvailable = Math.min(currentAvailable + 1, totalSlots);
        transaction.update(spotRef, { availableSlots: newAvailable });
      }
    });

    console.log(`Payment successful: ${paymentId} for ₹${amount}`);
    return { success: true, paymentId };
  } catch (error) {
    console.error('Payment processing error:', error);
    return { success: false, error: error.message || 'Payment failed' };
  }
};

/**
 * Get payment status for a booking.
 */
export const getPaymentStatus = async (bookingId) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const snap = await getDoc(bookingRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        isPaid: data.status === 'completed',
        paymentId: data.paymentId || null,
        amount: data.totalAmount || 0,
      };
    }
    return { isPaid: false, paymentId: null, amount: 0 };
  } catch (error) {
    console.error('Error checking payment status:', error);
    return { isPaid: false, paymentId: null, amount: 0 };
  }
};
