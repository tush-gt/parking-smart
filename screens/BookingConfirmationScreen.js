import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import CustomButton from '../components/CustomButton';

const BookingConfirmationScreen = ({ route, navigation }) => {
  const { spot, bookingId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={80} color="#22c55e" />
        </View>
        
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>
          You have successfully booked a parking slot at {spot.name}.
        </Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{spot.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Rate</Text>
            <Text style={styles.value}>Rs{spot.pricePerHour}/hr</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Booking ID</Text>
            <Text style={styles.value}>#{bookingId ? bookingId.slice(-9).toUpperCase() : 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Navigate to the location using the map on the home screen. Your slot will be held for 15 minutes.
          </Text>
        </View>

        <CustomButton 
          title="Back to Home" 
          onPress={() => navigation.navigate('Home')} 
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    fontSize: 14,
    color: '#64748b',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  infoText: {
    fontSize: 14,
    color: '#2563eb',
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: {
    width: '100%',
  }
});

export default BookingConfirmationScreen;
