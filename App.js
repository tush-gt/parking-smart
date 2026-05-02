import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { StatusBar } from 'expo-status-bar';
import { auth } from './services/firebaseConfig';

// Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ParkingDetailScreen from './screens/ParkingDetailScreen';
import BookingConfirmationScreen from './screens/BookingConfirmationScreen';

const Stack = createStackNavigator();

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
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
