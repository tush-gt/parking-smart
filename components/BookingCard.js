import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Clock, IndianRupee } from 'lucide-react-native';

const STATUS_CONFIG = {
  confirmed: { bg: '#dbeafe', color: '#1d4ed8', label: 'Confirmed' },
  active:    { bg: '#dcfce7', color: '#166534', label: 'Active' },
  completed: { bg: '#f1f5f9', color: '#475569', label: 'Completed' },
  cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const BookingCard = ({ booking, onPress }) => {
  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.confirmed;
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{booking.spotName}</Text>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <MapPin size={14} color="#64748b" />
        <Text style={styles.infoText} numberOfLines={1}>{booking.spotAddress || 'N/A'}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Clock size={14} color="#94a3b8" />
          <Text style={styles.footerText}>{formatDate(booking.bookedAt)}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{booking.pricePerHour}</Text>
          <Text style={styles.perHour}>/hr</Text>
        </View>
      </View>

      {booking.totalAmount && (
        <View style={styles.totalRow}>
          <IndianRupee size={14} color="#166534" />
          <Text style={styles.totalText}>Total Paid: ₹{booking.totalAmount}</Text>
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
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
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#64748b',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  perHour: {
    fontSize: 12,
    color: '#64748b',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
});

export default BookingCard;
