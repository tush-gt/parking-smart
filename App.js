import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { StatusBar } from 'expo-status-bar';
import { auth } from './services/firebaseConfig';
import { setupNotificationHandler } from './services/notificationService';
import { Home, ClipboardList, User } from 'lucide-react-native';

// Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ParkingDetailScreen from './screens/ParkingDetailScreen';
import BookingConfirmationScreen from './screens/BookingConfirmationScreen';
import BookingsScreen from './screens/BookingsScreen';
import ETicketScreen from './screens/ETicketScreen';
import ReceiptScreen from './screens/ReceiptScreen';
import ProfileScreen from './screens/ProfileScreen';

// Set up notification handler
try {
  setupNotificationHandler();
} catch (e) {
  console.log('Notifications not supported');
}

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Home Stack ────────────────────────────────────────
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMap" component={HomeScreen} />
    <Stack.Screen
      name="ParkingDetail"
      component={ParkingDetailScreen}
      options={{
        headerShown: true,
        headerTitle: 'Spot Details',
        headerBackTitleVisible: false,
      }}
    />
    <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
  </Stack.Navigator>
);

// ─── Bookings Stack ────────────────────────────────────
const BookingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BookingsList" component={BookingsScreen} />
    <Stack.Screen
      name="ETicket"
      component={ETicketScreen}
      options={{
        headerShown: true,
        headerTitle: 'E-Ticket',
        headerBackTitleVisible: false,
      }}
    />
    <Stack.Screen name="Receipt" component={ReceiptScreen} />
  </Stack.Navigator>
);

// ─── Profile Stack ─────────────────────────────────────
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
  </Stack.Navigator>
);

// ─── Main Tab Navigator ────────────────────────────────
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        if (route.name === 'Home') return <Home size={size} color={color} />;
        if (route.name === 'Bookings') return <ClipboardList size={size} color={color} />;
        if (route.name === 'Profile') return <User size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2563eb',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopColor: '#f1f5f9',
        paddingBottom: 8,
        paddingTop: 8,
        height: 64,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeStack} />
    <Tab.Screen name="Bookings" component={BookingsStack} />
    <Tab.Screen name="Profile" component={ProfileStack} />
  </Tab.Navigator>
);

// ─── Root App ──────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (initializing) return null;

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
