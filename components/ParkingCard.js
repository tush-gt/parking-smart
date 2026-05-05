import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Car, Navigation, Ban } from 'lucide-react-native';

const ParkingCard = ({ spot, distance, userVehicleType = 'Car', onPress }) => {
  const isAvailable = spot.availableSlots > 0;
  const supported = spot.supportedVehicles || ['Car', 'Bike'];
  const isCompatible = supported.includes(userVehicleType);
  
  return (
    <TouchableOpacity style={[styles.card, !isCompatible && styles.cardIncompatible]} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{spot.name}</Text>
        <View style={{flexDirection: 'row', gap: 6, alignItems: 'center'}}>
          {!isCompatible && (
            <View style={[styles.badge, { backgroundColor: '#fee2e2', flexDirection: 'row', alignItems: 'center' }]}>
              <Ban size={10} color="#dc2626" style={{marginRight: 4}}/>
              <Text style={[styles.badgeText, { color: '#dc2626' }]}>{supported.join(', ')} only</Text>
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: isAvailable ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={[styles.badgeText, { color: isAvailable ? '#166534' : '#991b1b' }]}>
              {isAvailable ? 'Available' : 'Full'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoRow}>
        <MapPin size={16} color="#64748b" />
        <Text style={styles.infoText}>{spot.address || 'Nearby'}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Car size={16} color="#2563eb" />
            <Text style={styles.statValue}>{spot.availableSlots}/{spot.totalSlots}</Text>
          </View>
          <View style={styles.statItem}>
            <Navigation size={16} color="#2563eb" />
            <Text style={styles.statValue}>{distance} km</Text>
          </View>
        </View>
        <Text style={styles.price}>${spot.pricePerHour}/hr</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardIncompatible: {
    opacity: 0.8,
    borderColor: '#fecaca',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#64748b',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  stats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statValue: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
});

export default ParkingCard;
