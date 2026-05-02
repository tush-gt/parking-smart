# Smart Parking Finder - Project Walkthrough

This project is a complete React Native application that demonstrates the integration of **Mobile Computing** and **Cloud Computing** concepts.

## Setup Instructions

### 1. Firebase Setup
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project named "Smart Parking Finder".
3.  Add a **Web App** to your project.
4.  Copy the `firebaseConfig` object.
5.  Open `services/firebaseConfig.js` and replace the placeholders with your actual credentials.
6.  Enable **Authentication** (Email/Password provider).
7.  Enable **Cloud Firestore** and set the security rules to "test mode" or allow reads/writes for authenticated users.

### 2. Google Maps Setup
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Enable the **Maps SDK for Android** and **Maps SDK for iOS**.
3.  Create an API Key.
4.  For Expo Go, you might not need the API key for development, but for standalone builds, add it to `app.json`.

### 3. Installation & Running
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the project:
    ```bash
    npx expo start
    ```
3.  Open the app on your physical device using the **Expo Go** app.

## Project Structure
- `components/`: Reusable UI elements (Buttons, Cards).
- `screens/`: Main application screens (Login, Home, Details, Confirmation).
- `services/`: Logic for Firebase (Auth/Firestore), Offline caching, and Distance calculation.
- `utils/`: Helper scripts (Dummy data seeding).

## Core Concepts Explained

### 1. Mobile Computing Concepts
- **Location-Based Services (LBS)**: The app uses `expo-location` to detect the user's current GPS coordinates. This is the foundation for finding nearby parking spots.
- **Context Awareness**: By calculating the distance between the user's current location and the parking spots in real-time (`parkingService.js:calculateDistance`), the app provides contextually relevant information (proximity).
- **Offline Handling (Persistence)**: Using `AsyncStorage` in `services/offlineService.js`, the app caches the last known parking data. If the internet is disconnected, the app still functions by displaying the cached markers, demonstrating local data persistence.

### 2. Cloud Computing Concepts
- **Backend as a Service (BaaS)**: Instead of building a custom server, the app leverages Firebase for Authentication and Firestore for the database. This allows for rapid scaling and reduced infrastructure management.
- **Real-time Synchronization**: The app uses Firestore's `onSnapshot` listener (`parkingService.js:subscribeToParkingSpots`). When a slot is booked by *any* user, all other users see the update instantly without refreshing.
- **Cloud Logic & Scalability**: The booking process uses Firestore **Transactions**. This ensures that even if thousands of users try to book the last slot at the same time, the cloud backend handles the atomic update correctly, preventing overbooking.

## Firestore Schema Example
**Collection**: `parkingSpots`
```json
{
  "name": "Central Plaza Parking",
  "latitude": 37.78825,
  "longitude": -122.4324,
  "totalSlots": 50,
  "availableSlots": 12,
  "pricePerHour": 5.50,
  "address": "123 Market St, San Francisco, CA"
}
```

## UI Flow
1.  **Auth**: Users sign in or create an account via Firebase Auth.
2.  **Discovery**: Users see a map with markers or a list of nearby spots sorted by distance.
3.  **Selection**: Users tap a spot to see detailed information and real-time slot availability.
4.  **Action**: Users book a slot, triggering a cloud transaction that updates the database and syncs to all devices.
