import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView, Image
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { getUserProfile, updateActiveVehicle } from '../services/userService';
import { LogOut, User as UserIcon, Mail, Calendar, Shield, Car, CheckCircle } from 'lucide-react-native';

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const user = auth.currentUser;

  const loadProfile = async () => {
    if (user) {
      const result = await getUserProfile(user.uid);
      if (result.success) {
        setProfile(result.data);
        setVehicles(result.data.vehicles || []);
      }
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const handleSetVehicleActive = async (vehicleId) => {
    const result = await updateActiveVehicle(user.uid, vehicleId);
    if (result.success) {
      setVehicles(vehicles.map(v => ({ ...v, isActive: v.id === vehicleId })));
    } else {
      Alert.alert('Error', 'Could not update active vehicle.');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.displayName || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.displayName || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.phone}>{profile?.phone || 'No phone added'}</Text>
          {profile?.role && profile.role !== 'user' && (
            <View style={styles.roleBadge}>
              <Shield size={14} color="#2563eb" />
              <Text style={styles.roleText}>{profile.role.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Vehicles Section */}
        {vehicles.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Your Vehicles</Text>
            {vehicles.map(v => (
              <TouchableOpacity 
                key={v.id} 
                style={[styles.vehicleCard, v.isActive && styles.vehicleCardActive]}
                onPress={() => handleSetVehicleActive(v.id)}
              >
                {v.photoUrl ? (
                  <Image source={{ uri: v.photoUrl }} style={styles.vehicleImage} />
                ) : (
                  <View style={styles.vehicleIconPlaceholder}>
                    <Car size={24} color="#64748b" />
                  </View>
                )}
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleMakeModel}>{v.make} {v.model}</Text>
                  <Text style={styles.vehiclePlate}>{v.plateNumber}</Text>
                  <Text style={styles.vehicleType}>{v.type}</Text>
                </View>
                <View style={styles.radioContainer}>
                  {v.isActive ? <CheckCircle size={24} color="#2563eb" /> : <View style={styles.radioEmpty} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <UserIcon size={18} color="#2563eb" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Display Name</Text>
              <Text style={styles.infoValue}>{profile?.displayName || 'Not set'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Mail size={18} color="#2563eb" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Calendar size={18} color="#2563eb" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>{formatDate(profile?.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#dc2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Smart Parking v1.0.0</Text>
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
  avatarSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: '#64748b',
  },
  phone: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
    marginLeft: 6,
  },
  sectionContainer: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 16,
  },
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  vehicleCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#f8fafc',
  },
  vehicleImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  vehicleIconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 16,
  },
  vehicleMakeModel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  vehicleType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    marginTop: 4,
  },
  radioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  radioEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  logoutBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 24,
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
  version: {
    fontSize: 13,
    color: '#cbd5e1',
  },
});

export default ProfileScreen;
