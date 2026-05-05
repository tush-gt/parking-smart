import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, IndianRupee } from 'lucide-react-native';

const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed':
      return { bg: '#dbeafe', text: '#2563eb' };
    case 'active':
      return { bg: '#fef08a', text: '#ca8a04' };
    case 'completed':
      return { bg: '#dcfce7', text: '#16a34a' };
    case 'cancelled':
      return { bg: '#fee2e2', text: '#dc2626' };
    default:
      return { bg: '#f1f5f9', text: '#64748b' };
  }
};

const BookingCard = ({ booking, onPress }) => {
  const { bg, text } = getStatusColor(booking.status);
  const [elapsed, setElapsed] = useState(0);
  
  // Format dates safely
  let bookedAtStr = 'Unknown Time';
  let startTime = null;
  if (booking.bookedAt) {
    const dateObj = booking.bookedAt.toDate ? booking.bookedAt.toDate() : new Date(booking.bookedAt);
    startTime = dateObj.getTime();
    bookedAtStr = dateObj.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  useEffect(() => {
    if ((booking.status !== 'active' && booking.status !== 'confirmed') || !startTime) return;
    setElapsed(Math.floor((Date.now() - startTime) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [booking.status, startTime]);

  const mins = elapsed / 60;
  const currentFare = Math.max(booking.pricePerHour, Math.ceil(mins) * booking.pricePerHour);

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={booking.status === 'completed' || booking.status === 'cancelled'}
    >
      <View style={styles.headerRow}>
        <Text style={styles.spotName} numberOfLines={1}>{booking.spotName}</Text>
        <View style={[styles.badge, { backgroundColor: bg }]}>
          <Text style={[styles.badgeText, { color: text }]}>
            {booking.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.address} numberOfLines={1}>{booking.spotAddress || 'Location unavailable'}</Text>
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Booked At</Text>
          <Text style={styles.detailValue}>{bookedAtStr}</Text>
        </View>
        {(booking.status === 'active' || booking.status === 'confirmed') ? (
          <>
            <View style={styles.detailItem}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Clock size={12} color="#94a3b8" style={{marginRight: 4}}/>
                <Text style={styles.detailLabel}>Elapsed</Text>
              </View>
              <Text style={styles.detailValue}>{formatTimer(elapsed)}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <IndianRupee size={12} color="#94a3b8" style={{marginRight: 4}}/>
                <Text style={styles.detailLabel}>Live Fare</Text>
              </View>
              <Text style={[styles.detailValue, {color: '#2563eb'}]}>₹{currentFare}</Text>
            </View>
          </>
        ) : (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Rate</Text>
            <Text style={styles.detailValue}>₹{booking.pricePerHour}/hr</Text>
          </View>
        )}
        {booking.totalAmount && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Paid</Text>
            <Text style={styles.detailValue}>₹{booking.totalAmount}</Text>
          </View>
        )}
      </View>
      
      {(booking.status === 'confirmed' || booking.status === 'active') && (
        <View style={styles.footer}>
          <Text style={styles.actionText}>Tap to view E-Ticket →</Text>
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
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  spotName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  address: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'flex-end',
  },
  actionText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BookingCard;
