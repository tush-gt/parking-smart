import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, Dimensions
} from 'react-native';
import { Clock, MapPin, Phone, CreditCard, Shield, Zap, Accessibility } from 'lucide-react-native';
import { processPayment } from '../services/paymentService';
import { auth } from '../services/firebaseConfig';

const { width } = Dimensions.get('window');

const ETicketScreen = ({ route, navigation }) => {
  const { booking } = route.params;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFrozen, setIsFrozen] = useState(false);
  const [paying, setPaying] = useState(false);
  const timerRef = useRef(null);

  // Calculate start time
  const startTime = booking.bookedAt?.toDate
    ? booking.bookedAt.toDate()
    : new Date(booking.bookedAt?.seconds ? booking.bookedAt.seconds * 1000 : Date.now());

  useEffect(() => {
    // Calculate initial elapsed
    const now = Date.now();
    const start = startTime.getTime();
    const initialElapsed = Math.max(0, Math.floor((now - start) / 1000));
    setElapsedSeconds(initialElapsed);

    // Start ticking
    timerRef.current = setInterval(() => {
      if (!isFrozen) {
        const elapsed = Math.max(0, Math.floor((Date.now() - start) / 1000));
        setElapsedSeconds(elapsed);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFrozen]);

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // For demonstration: 1 minute = 1 unit of fare
  const minutesElapsed = elapsedSeconds / 60;
  const currentFare = Math.max(booking.pricePerHour, Math.ceil(minutesElapsed) * booking.pricePerHour);

  const handlePayNow = () => {
    const finalAmount = Math.max(booking.pricePerHour, Math.ceil(minutesElapsed) * booking.pricePerHour);

    Alert.alert(
      'Confirm Payment',
      `Pay ₹${finalAmount} for ${Math.ceil(minutesElapsed)} minute${Math.ceil(minutesElapsed) !== 1 ? 's' : ''} at ${booking.spotName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            setIsFrozen(true);
            if (timerRef.current) clearInterval(timerRef.current);
            setPaying(true);

            try {
              const user = auth.currentUser;
              const result = await processPayment({
                amount: finalAmount,
                bookingId: booking.id,
                spotId: booking.spotId,
                userEmail: user?.email || '',
                spotName: booking.spotName,
              });

              if (result.success) {
                navigation.replace('Receipt', {
                  bookingId: booking.id,
                  spotName: booking.spotName,
                  spotAddress: booking.spotAddress,
                  entryTime: startTime.toISOString(),
                  exitTime: new Date().toISOString(),
                  duration: elapsedSeconds,
                  amountPaid: finalAmount,
                  paymentId: result.paymentId,
                  pricePerHour: booking.pricePerHour,
                });
              } else {
                setIsFrozen(false);
                Alert.alert('Payment Failed', result.error || 'Please try again.');
              }
            } catch (e) {
              setIsFrozen(false);
              Alert.alert('Error', 'Something went wrong. Please try again.');
            } finally {
              setPaying(false);
            }
          }
        }
      ]
    );
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const facilities = booking.facilities || ['CCTV', 'EV Charging', 'Disabled Access'];

  const FACILITY_ICONS = {
    'CCTV': <Shield size={16} color="#2563eb" />,
    'EV Charging': <Zap size={16} color="#2563eb" />,
    'Disabled Access': <Accessibility size={16} color="#2563eb" />,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Ticket Card */}
        <View style={styles.ticketCard}>
          {/* Top Strip */}
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketLabel}>PARKING TICKET</Text>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>ACTIVE</Text>
            </View>
          </View>

          {/* Booking ID */}
          <View style={styles.idSection}>
            <Text style={styles.idLabel}>Booking ID</Text>
            <Text style={styles.idValue}>#{booking.id ? booking.id.slice(-9).toUpperCase() : 'N/A'}</Text>
          </View>

          {/* Dashed Divider */}
          <View style={styles.dashedDivider} />

          {/* Spot Info */}
          <View style={styles.spotSection}>
            <View style={styles.spotRow}>
              <MapPin size={18} color="#2563eb" />
              <View style={styles.spotInfo}>
                <Text style={styles.spotName}>{booking.spotName}</Text>
                <Text style={styles.spotAddress}>{booking.spotAddress || 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* Entry Time */}
          <View style={styles.timeSection}>
            <View style={styles.timeItem}>
              <Clock size={16} color="#64748b" />
              <Text style={styles.timeLabel}>Entry Time</Text>
            </View>
            <Text style={styles.timeValue}>{formatTime(startTime)} · {formatDate(startTime)}</Text>
          </View>

          {/* Dashed Divider */}
          <View style={styles.dashedDivider} />

          {/* Live Timer */}
          <View style={styles.timerSection}>
            <Text style={styles.timerLabel}>Duration</Text>
            <Text style={styles.timerValue}>{formatTimer(elapsedSeconds)}</Text>
            {!isFrozen && <View style={styles.livePulse} />}
          </View>

          {/* Live Fare */}
          <View style={styles.fareSection}>
            <Text style={styles.fareLabel}>Current Fare</Text>
            <View style={styles.fareRow}>
              <Text style={styles.fareValue}>₹{currentFare}</Text>
              <Text style={styles.fareRate}>@ ₹{booking.pricePerHour}/hr</Text>
            </View>
          </View>

          {/* Dashed Divider */}
          <View style={styles.dashedDivider} />

          {/* Facilities */}
          <View style={styles.facilitiesSection}>
            <Text style={styles.facilitiesLabel}>Facilities</Text>
            <View style={styles.facilitiesList}>
              {facilities.map((f, i) => (
                <View key={i} style={styles.facilityTag}>
                  {FACILITY_ICONS[f] || <Shield size={16} color="#2563eb" />}
                  <Text style={styles.facilityText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tear Effect Bottom */}
          <View style={styles.tearBottom} />
        </View>

        {/* Need Help */}
        <TouchableOpacity style={styles.helpBtn}>
          <Phone size={18} color="#2563eb" />
          <Text style={styles.helpText}>Need Help?</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Pay Now Button */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Total Due</Text>
          <Text style={styles.footerAmount}>₹{currentFare}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, paying && styles.payBtnDisabled]}
          onPress={handlePayNow}
          disabled={paying}
        >
          <CreditCard size={20} color="#fff" />
          <Text style={styles.payBtnText}>{paying ? 'Processing...' : 'PAY NOW'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  ticketHeader: {
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  ticketLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  activeText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '700',
  },
  idSection: {
    padding: 20,
    alignItems: 'center',
  },
  idLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 6,
  },
  idValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  dashedDivider: {
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginHorizontal: 20,
  },
  spotSection: {
    padding: 20,
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  spotInfo: {
    marginLeft: 12,
    flex: 1,
  },
  spotName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  spotAddress: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  timeSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 22,
  },
  timerSection: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  timerLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1e293b',
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  livePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    marginTop: 8,
  },
  fareSection: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  fareLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  fareValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2563eb',
  },
  fareRate: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 8,
  },
  facilitiesSection: {
    padding: 20,
  },
  facilitiesLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  facilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  facilityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 8,
  },
  facilityText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  tearBottom: {
    height: 12,
    backgroundColor: '#f1f5f9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  helpText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  footerInfo: {},
  footerLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  footerAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    elevation: 4,
  },
  payBtnDisabled: {
    backgroundColor: '#93c5fd',
  },
  payBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 1,
  },
});

export default ETicketScreen;
