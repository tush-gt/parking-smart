import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert
} from 'react-native';
import { CheckCircle, Download, Home, FileText } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { sendLocalNotification } from '../services/notificationService';

const ReceiptScreen = ({ route, navigation }) => {
  const {
    bookingId, spotName, spotAddress, entryTime, exitTime,
    duration, amountPaid, paymentId, pricePerHour
  } = route.params;

  const entry = new Date(entryTime);
  const exit = new Date(exitTime);

  const formatDateTime = (date) => {
    return date.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs === 0) return `${mins} min${mins !== 1 ? 's' : ''}`;
    return `${hrs} hr${hrs !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
  };

  // Send notification on mount
  React.useEffect(() => {
    sendLocalNotification(
      'Payment Successful ✅',
      `₹${amountPaid} paid for parking at ${spotName}. Receipt generated.`
    );
  }, []);

  const generateReceiptHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; background: #f8fafc; }
          .receipt { max-width: 400px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: #1e293b; color: #fff; padding: 24px; text-align: center; }
          .header h1 { font-size: 18px; letter-spacing: 2px; margin-bottom: 4px; }
          .header p { font-size: 12px; color: #94a3b8; }
          .paid-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 13px; margin: 20px auto; }
          .content { padding: 24px; }
          .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
          .row:last-child { border-bottom: none; }
          .label { color: #64748b; font-size: 13px; }
          .value { color: #1e293b; font-weight: 600; font-size: 13px; text-align: right; }
          .total-row { background: #f8fafc; margin: 0 -24px; padding: 16px 24px; display: flex; justify-content: space-between; }
          .total-label { font-size: 16px; font-weight: 700; color: #1e293b; }
          .total-value { font-size: 20px; font-weight: 800; color: #2563eb; }
          .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 11px; border-top: 2px dashed #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>SMART PARKING</h1>
            <p>Parking Receipt</p>
          </div>
          <div style="text-align: center; padding-top: 16px;">
            <span class="paid-badge">✅ PAID</span>
          </div>
          <div class="content">
            <div class="row"><span class="label">Booking ID</span><span class="value">#${bookingId ? bookingId.slice(-9).toUpperCase() : 'N/A'}</span></div>
            <div class="row"><span class="label">Location</span><span class="value">${spotName}</span></div>
            <div class="row"><span class="label">Address</span><span class="value">${spotAddress || 'N/A'}</span></div>
            <div class="row"><span class="label">Entry Time</span><span class="value">${formatDateTime(entry)}</span></div>
            <div class="row"><span class="label">Exit Time</span><span class="value">${formatDateTime(exit)}</span></div>
            <div class="row"><span class="label">Duration</span><span class="value">${formatDuration(duration)}</span></div>
            <div class="row"><span class="label">Rate</span><span class="value">₹${pricePerHour}/hr</span></div>
            <div class="row"><span class="label">Payment ID</span><span class="value">${paymentId}</span></div>
            <div class="total-row">
              <span class="total-label">Amount Paid</span>
              <span class="total-value">₹${amountPaid}</span>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for using Smart Parking!</p>
            <p style="margin-top: 4px;">Generated on ${new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadReceipt = async () => {
    try {
      const html = generateReceiptHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Smart Parking Receipt',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', `Receipt saved to: ${uri}`);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate receipt. Please try again.');
    }
  };

  const details = [
    { label: 'Booking ID', value: `#${bookingId ? bookingId.slice(-9).toUpperCase() : 'N/A'}` },
    { label: 'Location', value: spotName },
    { label: 'Address', value: spotAddress || 'N/A' },
    { label: 'Entry Time', value: formatDateTime(entry) },
    { label: 'Exit Time', value: formatDateTime(exit) },
    { label: 'Duration', value: formatDuration(duration) },
    { label: 'Rate', value: `₹${pricePerHour}/hr` },
    { label: 'Payment ID', value: paymentId },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Icon */}
        <View style={styles.successSection}>
          <View style={styles.iconCircle}>
            <CheckCircle size={56} color="#22c55e" />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSub}>Your parking session has been completed</Text>
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount Paid</Text>
          <Text style={styles.amountValue}>₹{amountPaid}</Text>
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>PAID</Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <FileText size={18} color="#1e293b" />
            <Text style={styles.detailsTitle}>Receipt Details</Text>
          </View>
          {details.map((item, index) => (
            <View key={index} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadReceipt}>
          <Download size={20} color="#2563eb" />
          <Text style={styles.downloadText}>Download Receipt (PDF)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Home size={20} color="#fff" />
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  successSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 15,
    color: '#64748b',
  },
  amountCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  amountValue: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
  },
  paidBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  paidBadgeText: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
  downloadBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
  },
  downloadText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  homeBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    elevation: 4,
  },
  homeBtnText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default ReceiptScreen;
