# 🅿️ Smart Parking Finder

A real-time parking spot finder built with **React Native (Expo)**, **Firebase**, and **Google Maps**. The app demonstrates core concepts of **Mobile Computing** and **Cloud Computing** by providing users with a live map of available parking spots, location-based search, and an atomic booking system.

> **Tech Stack:** React Native · Expo SDK 55 · Firebase Auth · Cloud Firestore · Google Maps · AsyncStorage

---

## 📑 Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Setup Instructions](#-setup-instructions)
  - [1. Clone & Install](#1-clone--install)
  - [2. Firebase Setup](#2-firebase-setup)
  - [3. Google Maps & Places API](#3-google-maps--places-api)
  - [4. Environment Variables](#4-environment-variables)
  - [5. Seed Parking Data](#5-seed-parking-data)
  - [6. Run the App](#6-run-the-app)
- [Firestore Database Schema](#-firestore-database-schema)
- [App Flow & Screens](#-app-flow--screens)
- [Core Concepts Explained](#-core-concepts-explained)
  - [Mobile Computing Concepts](#1-mobile-computing-concepts)
  - [Cloud Computing Concepts](#2-cloud-computing-concepts)
- [Key Dependencies](#-key-dependencies)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Email/Password login & signup via Firebase Auth |
| 🗺️ **Live Map View** | Google Maps with color-coded markers (green/orange/red) based on availability |
| 🔍 **Place Search** | Google Places Autocomplete to search malls, buildings, landmarks |
| 📍 **Location-Based Sorting** | Parking spots sorted by proximity to user's GPS location |
| ⚡ **Real-Time Sync** | Firestore `onSnapshot` listener — all users see live availability updates |
| 🎫 **Atomic Booking** | Firestore Transactions prevent overbooking even under concurrent access |
| 👤 **User Profiles** | User data stored in Firestore linked by Auth UID |
| 📋 **Booking History** | Every booking is recorded in a `bookings` collection linked to the user |
| 📶 **Offline Support** | AsyncStorage caches parking data for offline access |
| 📱 **Map/List Toggle** | Switch between map view and a sortable list view |

---

## 📁 Project Structure

```
parking_smart/
├── App.js                      # Root — Auth state listener & navigation
├── index.js                    # Entry point (registerRootComponent)
├── app.json                    # Expo configuration & Google Maps API keys
├── .env                        # Environment variables (API keys)
├── babel.config.js             # Babel preset configuration
├── metro.config.js             # Metro bundler configuration
│
├── screens/
│   ├── LoginScreen.js          # Email/Password auth (sign in & sign up)
│   ├── HomeScreen.js           # Map view + list view + search
│   ├── ParkingDetailScreen.js  # Spot details, facilities, booking action
│   └── BookingConfirmationScreen.js  # Booking success with real booking ID
│
├── components/
│   ├── CustomButton.js         # Reusable button (primary/secondary variants)
│   └── ParkingCard.js          # Parking spot card for list view
│
├── services/
│   ├── firebaseConfig.js       # Firebase initialization (Auth + Firestore)
│   ├── parkingService.js       # Real-time spot subscription & booking logic
│   ├── userService.js          # User profile CRUD & booking records
│   └── offlineService.js       # AsyncStorage caching for offline support
│
├── utils/
│   └── seedData.js             # Dummy data seed helper
│
├── importToFirestore.js        # Node.js script to bulk-import CSV parking data
└── mumbai_parking_spots.csv    # Sample parking data (Mumbai locations)
```

---

## 📋 Prerequisites

- **Node.js** v18+ and **npm**
- **Expo CLI** (`npx expo`)
- **Expo Go** app on your Android/iOS device
- A **Firebase** project ([console.firebase.google.com](https://console.firebase.google.com/))
- A **Google Cloud** project with Maps & Places APIs enabled ([console.cloud.google.com](https://console.cloud.google.com/))

---

## 🛠️ Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd parking_smart
npm install
```

### 2. Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (or use existing).
2. **Add a Web App** to your project and copy the `firebaseConfig` object.
3. Open `services/firebaseConfig.js` and verify the config matches your project:
   ```javascript
   const firebaseConfig = {
     apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.firebasestorage.app",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
4. **Enable Authentication:**
   - Firebase Console → Authentication → Sign-in method → Enable **Email/Password**
5. **Enable Cloud Firestore:**
   - Firebase Console → Firestore Database → Create Database
   - Start in **test mode** (or configure rules for authenticated users)

> **Note:** Firebase Auth handles all user credentials (email, password, tokens). You do **not** need a separate collection for login data.

### 3. Google Maps & Places API

1. Go to the [Google Cloud Console → APIs & Services → Library](https://console.cloud.google.com/apis/library).
2. Enable the following APIs for your project:
   - ✅ **Maps SDK for Android**
   - ✅ **Maps SDK for iOS**
   - ✅ **Places API** (for search autocomplete)
   - ✅ **Geocoding API** (optional, for address lookups)
3. Create an **API Key** (or use existing) under APIs & Services → Credentials.
4. Add the API key to `app.json` under both `ios.config.googleMapsApiKey` and `android.config.googleMaps.apiKey`.

### 4. Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
EXPO_PUBLIC_MAPS_API=your_google_maps_api_key_here
```

> Expo automatically loads variables prefixed with `EXPO_PUBLIC_` and makes them available via `process.env`.

### 5. Seed Parking Data

You can either add parking spots manually in Firebase Console or bulk-import from CSV:

#### Option A: Manual (Firebase Console)
Add documents to the `parkingSpots` collection with this structure:
```json
{
  "name": "Central Plaza Parking",
  "address": "123 Market St, Mumbai",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "totalSlots": 50,
  "availableSlots": 12,
  "pricePerHour": 40,
  "type": "Multi-Level",
  "facilities": ["CCTV", "EV Charging", "Disabled Access"],
  "timings": "24/7",
  "managedBy": "SmartPark Pvt Ltd"
}
```

#### Option B: Bulk Import from CSV
1. Download your Firebase service account key:
   - Firebase Console → Project Settings → Service Accounts → **Generate New Private Key**
   - Save as `serviceAccountKey.json` in the project root
2. Prepare your CSV file (`mumbai_parking_spots.csv`) with columns: `ID, Name, Area / Locality, Address, Type, Latitude, Longitude, Total Slots, Available Slots, Price/Hr (₹), Facilities, Timings, Managed By, Notes`
3. Install admin dependencies and run:
   ```bash
   npm install firebase-admin csv-parse
   node importToFirestore.js
   ```

### 6. Run the App

```bash
npx expo start --clear
```

- Scan the QR code with **Expo Go** on your Android/iOS device.
- The app requires a **physical device** — `react-native-maps` does not work on web.

---

## 🗄️ Firestore Database Schema

All collections are linked by the Firebase Auth **UID**:

```
Firebase Auth (handles credentials)
  └── uid: "abc123"

Firestore Collections:
  ├── users/{uid}                    ← Auth UID as document ID
  │   ├── uid: "abc123"
  │   ├── email: "user@mail.com"
  │   ├── displayName: "user"
  │   ├── createdAt: Timestamp
  │   └── lastLogin: Timestamp
  │
  ├── bookings/{auto-generated-id}   ← Linked via userId field
  │   ├── userId: "abc123"           ← same Auth UID
  │   ├── spotId: "P001"             ← links to parkingSpots
  │   ├── spotName: "Central Plaza Parking"
  │   ├── spotAddress: "123 Market St"
  │   ├── pricePerHour: 40
  │   ├── status: "confirmed"
  │   └── bookedAt: Timestamp
  │
  └── parkingSpots/{spotId}          ← Your parking data
      ├── name: "Central Plaza Parking"
      ├── address: "123 Market St, Mumbai"
      ├── latitude: 19.0760
      ├── longitude: 72.8777
      ├── totalSlots: 50
      ├── availableSlots: 12
      ├── pricePerHour: 40
      ├── type: "Multi-Level"
      ├── facilities: ["CCTV", "EV Charging"]
      ├── timings: "24/7"
      └── managedBy: "SmartPark Pvt Ltd"
```

| Collection | Document ID | Created When | How Linked |
|---|---|---|---|
| `users` | Auth UID (e.g. `abc123`) | On first sign up or sign in | Auth UID = doc ID |
| `bookings` | Auto-generated by Firestore | When user books a slot | `userId` field = Auth UID |
| `parkingSpots` | Custom ID (e.g. `P001`) | Seeded manually or via CSV import | `spotId` in bookings |

---

## 📱 App Flow & Screens

```
┌─────────────┐     ┌──────────────┐     ┌───────────────────┐     ┌──────────────────────┐
│  Login /     │     │  Home Screen │     │  Parking Detail   │     │  Booking             │
│  Sign Up     │────▶│  (Map + List │────▶│  (Info + Book     │────▶│  Confirmation        │
│  Screen      │     │   + Search)  │     │   Button)         │     │  (Booking ID shown)  │
└─────────────┘     └──────────────┘     └───────────────────┘     └──────────────────────┘
```

1. **LoginScreen** — Users sign in or create an account via Firebase Auth. On signup, a user profile document is created in Firestore. On signin, `lastLogin` is updated.
2. **HomeScreen** — Displays a Google Map with color-coded markers or a sortable list of nearby spots. Includes Google Places search bar to search by location/landmark.
3. **ParkingDetailScreen** — Shows parking spot details (distance, available slots, price, facilities). Users can book a slot via a confirmation dialog.
4. **BookingConfirmationScreen** — Displays booking success with the real Firestore booking ID, spot name, and rate.

---

## 🧠 Core Concepts Explained

### 1. Mobile Computing Concepts

| Concept | Implementation |
|---|---|
| **Location-Based Services (LBS)** | Uses `expo-location` to detect the user's current GPS coordinates. This is the foundation for finding nearby parking spots and sorting by proximity. |
| **Context Awareness** | Calculates real-time distance between user and each parking spot using the Haversine formula (`parkingService.js → calculateDistance`). Spots are sorted by proximity to provide contextually relevant results. |
| **Offline Handling (Persistence)** | Uses `AsyncStorage` (`offlineService.js`) to cache the last known parking data. When the internet is disconnected, the app still functions by displaying cached markers, demonstrating local data persistence. |
| **Place Search** | Google Places Autocomplete allows users to search by mall, building, or area name. The app filters spots within 500m of the selected location. |

### 2. Cloud Computing Concepts

| Concept | Implementation |
|---|---|
| **Backend as a Service (BaaS)** | Leverages Firebase for Authentication and Firestore for the database, eliminating the need for a custom backend server. This allows rapid scaling and reduced infrastructure management. |
| **Real-time Synchronization** | Uses Firestore's `onSnapshot` listener (`parkingService.js → subscribeToParkingSpots`). When a slot is booked by *any* user, all other users see the availability update instantly without refreshing. |
| **Cloud Transactions** | The booking process uses Firestore **Transactions** (`parkingService.js → bookParkingSlot`). This ensures atomic updates — even if thousands of users try to book the last slot simultaneously, the transaction prevents overbooking. |
| **User Data Management** | User profiles are stored in Firestore with Auth UID as document ID (`userService.js`). Booking records are stored in a separate collection linked by the same UID, enabling booking history queries. |
| **Scalability** | Firebase's serverless architecture automatically scales based on usage. No server management required. |

---

## 📦 Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `expo` | ^55.0.0 | Development framework & toolchain |
| `react-native` | 0.83.6 | Core mobile framework |
| `firebase` | ^12.12.1 | Auth, Firestore (client SDK) |
| `react-native-maps` | 1.27.2 | Google Maps integration |
| `react-native-google-places-autocomplete` | ^2.6.4 | Location search autocomplete |
| `expo-location` | ~55.1.8 | GPS location services |
| `@react-native-async-storage/async-storage` | 2.2.0 | Offline data caching |
| `@react-navigation/native` | ^7.2.2 | Screen navigation |
| `@react-navigation/stack` | ^7.8.11 | Stack-based navigation |
| `lucide-react-native` | ^1.14.0 | Icon library |
| `react-native-svg` | 15.15.3 | SVG rendering (required by icons) |
| `firebase-admin` | ^13.8.0 | Server-side Firestore access (for data import script) |
| `csv-parse` | ^6.2.1 | CSV parsing (for data import script) |

---

## 🔧 Troubleshooting

| Issue | Solution |
|---|---|
| **Map not loading on Android** | Ensure **Maps SDK for Android** is enabled in Google Cloud Console for your API key |
| **Map not loading on web** | `react-native-maps` does not support web. Use a physical device with Expo Go |
| **"Cannot find module babel-preset-expo"** | Run `npm install --save-dev babel-preset-expo@~55.0.8` |
| **Firebase Auth crash on React Native** | Use `initializeAuth` with `getReactNativePersistence(AsyncStorage)` instead of `getAuth()` (already configured in `firebaseConfig.js`) |
| **Port 8081 already in use** | Run `npx kill-port 8081` then restart Expo |
| **Users collection not updating on login** | Log out and log back in. The `updateLastLogin` function auto-creates the profile if it doesn't exist |
| **Icons not rendering** | Ensure `react-native-svg` is installed: `npx expo install react-native-svg` |
| **Package version mismatch warnings** | Run `npx expo install --fix` to align all packages with your SDK version |

---

## 📄 License

This project is private and intended for educational/demonstration purposes.

---

> **Built with ❤️ using React Native, Firebase, and Google Maps**
