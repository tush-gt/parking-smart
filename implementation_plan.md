# Implementation Plan - Smart Parking Finder

A React Native mobile application demonstrating Mobile and Cloud Computing concepts by providing a real-time parking spot finder with offline support and cloud-based booking.

## User Review Required

> [!IMPORTANT]
> This project requires a Firebase account and a Google Maps API key. I will provide placeholders in the configuration files, but you will need to replace them with your actual credentials to run the app on a physical device or emulator.

> [!NOTE]
> For the "Offline Support" requirement, I will implement a manual caching layer using `AsyncStorage` alongside Firestore to explicitly demonstrate the mobile computing concept of data persistence, even though Firestore has built-in persistence.

## Proposed Changes

### Project Foundation
- Initialize Expo app with a blank template.
- Set up directory structure: `components/`, `screens/`, `services/`, `utils/`, `assets/`.

### [NEW] Services
#### [firebaseConfig.js](file:///d:/projects-extraww/parking_smart/services/firebaseConfig.js)
- Initialize Firebase Auth and Firestore.
- Export standard Firebase instances.

#### [parkingService.js](file:///d:/projects-extraww/parking_smart/services/parkingService.js)
- Logic to fetch parking spots from Firestore.
- Logic to book a slot using Firestore transactions (to prevent overbooking).
- Logic to calculate distance between coordinates.

#### [offlineService.js](file:///d:/projects-extraww/parking_smart/services/offlineService.js)
- Wrapper for `AsyncStorage` to cache parking data.
- Logic to sync/fallback when connectivity changes.

### [NEW] Screens
#### [LoginScreen.js](file:///d:/projects-extraww/parking_smart/screens/LoginScreen.js)
- Simple email/password login using Firebase Auth.

#### [HomeScreen.js](file:///d:/projects-extraww/parking_smart/screens/HomeScreen.js)
- `react-native-maps` integration.
- Display current user location.
- Markers for parking spots with color coding (Green for many, Red for few/none).
- Real-time updates from Firestore.

#### [ParkingDetailScreen.js](file:///d:/projects-extraww/parking_smart/screens/ParkingDetailScreen.js)
- Detailed info: Address, Slots, Price, Distance.
- "Book Now" button.

#### [BookingConfirmationScreen.js](file:///d:/projects-extraww/parking_smart/screens/BookingConfirmationScreen.js)
- Success message and summary of booking.

### [NEW] Components
#### [ParkingCard.js](file:///d:/projects-extraww/parking_smart/components/ParkingCard.js)
- A reusable card for displaying parking info in a list or callout.

#### [CustomButton.js](file:///d:/projects-extraww/parking_smart/components/CustomButton.js)
- Styled button component for consistent UI.

## Verification Plan

### Automated Tests
- I will verify logical components (distance calculation, offline fallback) using unit tests in a scratch file.

### Manual Verification
1.  **Auth**: Test login/signup flow.
2.  **GPS**: Verify location is detected and map centers correctly.
3.  **Real-time**: Modify a slot count in the Firestore console (simulated) and verify the app updates immediately.
4.  **Booking**: Perform a booking and verify the `availableSlots` count decreases in the DB.
5.  **Offline**: Disable network (emulator) and verify cached data is displayed.

## Concept Explanations (to be included in final Walkthrough)
- **Mobile Computing**: Detailed look at LBS, Context Awareness (distance/proximity), and Persistence.
- **Cloud Computing**: Detailed look at BaaS, Real-time sync, and Cloud transactions.
