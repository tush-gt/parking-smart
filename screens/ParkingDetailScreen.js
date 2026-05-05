import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Image,
  Alert
} from 'react-native';
import { MapPin, Clock, Info, ShieldCheck, Navigation } from 'lucide-react-native';
import { bookParkingSlot, calculateDistance } from '../services/parkingService';
import CustomButton from '../components/CustomButton';

const ParkingDetailScreen = ({ route, navigation }) => {
  const { spot, location, userVehicleType = 'Car' } = route.params;
  const [booking, setBooking] = useState(false);

  const supported = spot.supportedVehicles || ['Car', 'Bike'];
  const isCompatible = supported.includes(userVehicleType);

  const distance = location 
    ? calculateDistance(location.latitude, location.longitude, spot.latitude, spot.longitude) 
    : '...';

  const executeBooking = async () => {
    setBooking(true);
    const result = await bookParkingSlot(spot, route.params.activeVehicle);
    setBooking(false);
    
    if (result.success) {
      navigation.navigate('BookingConfirmation', { 
        spot, 
        bookingId: result.bookingId 
      });
    } else {
      Alert.alert("Booking Failed", result.error || "Please try again later.");
    }
  };

  const handleBooking = async () => {
    if (!isCompatible) {
      Alert.alert(
        "Incompatible Vehicle",
        `This parking spot only supports ${supported.join(' and ')}. Your registered vehicle is a ${userVehicleType}.\n\nAre you sure you want to proceed?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Book Anyway", style: "destructive", onPress: () => {
            Alert.alert(
              "Confirm Booking",
              `Do you want to book a slot at ${spot.name} for Rs${spot.pricePerHour}/hr?`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Book Now", onPress: executeBooking }
              ]
            );
          }}
        ]
      );
      return;
    }

    Alert.alert(
      "Confirm Booking",
      `Do you want to book a slot at ${spot.name} for Rs${spot.pricePerHour}/hr?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Book Now", onPress: executeBooking }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageText}>Parking Image Placeholder</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>{spot.name}</Text>
            <Text style={styles.price}>${spot.pricePerHour}<Text style={styles.perHour}>/hr</Text></Text>
          </View>

          <View style={styles.row}>
            <MapPin size={20} color="#2563eb" />
            <Text style={styles.locationText}>{spot.address || 'Street Name, City'}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Navigation size={24} color="#2563eb" />
              <Text style={styles.gridLabel}>Distance</Text>
              <Text style={styles.gridValue}>{distance} km</Text>
            </View>
            <View style={styles.gridItem}>
              <Clock size={24} color="#2563eb" />
              <Text style={styles.gridLabel}>Available</Text>
              <Text style={styles.gridValue}>{spot.availableSlots} Slots</Text>
            </View>
            <View style={styles.gridItem}>
              <ShieldCheck size={24} color="#2563eb" />
              <Text style={styles.gridLabel}>Secure</Text>
              <Text style={styles.gridValue}>Verified</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Facilities</Text>
          <View style={styles.facilities}>
            <View style={styles.facilityTag}><Text>CCTV</Text></View>
            <View style={styles.facilityTag}><Text>EV Charging</Text></View>
            <View style={styles.facilityTag}><Text>Disabled Access</Text></View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              Modern parking facility located in the heart of the city. Equipped with real-time slot tracking and automated entry/exit systems.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <CustomButton 
          title={spot.availableSlots > 0 ? "Book Slot Now" : "Currently Full"} 
          onPress={handleBooking}
          loading={booking}
          style={spot.availableSlots === 0 ? styles.disabledBtn : null}
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
  imagePlaceholder: {
    height: 250,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    color: '#64748b',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2563eb',
  },
  perHour: {
    fontSize: 14,
    color: '#64748b',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    alignItems: 'center',
    flex: 1,
  },
  gridLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginTop: 4,
  },
  facilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  facilityTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 24,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  disabledBtn: {
    backgroundColor: '#cbd5e1',
  }
});

export default ParkingDetailScreen;
