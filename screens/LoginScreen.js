import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { createUserProfile, updateLastLogin } from '../services/userService';
import CustomButton from '../components/CustomButton';
import * as ImagePicker from 'expo-image-picker';
import { PlusCircle, Trash2, Camera } from 'lucide-react-native';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [idProof, setIdProof] = useState('');
  
  const [vehicles, setVehicles] = useState([
    { id: Date.now().toString(), type: 'Car', make: '', model: '', plateNumber: '', photoUrl: '', uploading: false }
  ]);

  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const addVehicle = () => {
    setVehicles([...vehicles, { id: Date.now().toString(), type: 'Car', make: '', model: '', plateNumber: '', photoUrl: '', uploading: false }]);
  };

  const removeVehicle = (id) => {
    if (vehicles.length === 1) return Alert.alert("Error", "You must have at least one vehicle.");
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  const updateVehicle = (id, field, value) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const pickImage = async (id) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadToCloudinary(result.assets[0].uri, id);
    }
  };

  const uploadToCloudinary = async (uri, vehicleId) => {
    updateVehicle(vehicleId, 'uploading', true);
    try {
      const data = new FormData();
      data.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'vehicle_photo.jpg'
      });
      data.append('upload_preset', process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'smart_parking');
      
      const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: data,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const result = await res.json();
      
      if (result.secure_url) {
        updateVehicle(vehicleId, 'photoUrl', result.secure_url);
      } else {
        Alert.alert('Upload Failed', 'Could not upload image to Cloudinary.');
      }
    } catch (e) {
      console.error('Cloudinary Upload Error:', e);
      Alert.alert('Error', 'Image upload failed.');
    } finally {
      updateVehicle(vehicleId, 'uploading', false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (!isLogin) {
      if (!name || !phone || !age || !idProof) {
        Alert.alert('Error', 'Please fill in all personal details');
        return;
      }
      for (const v of vehicles) {
        if (!v.make || !v.model || !v.plateNumber) {
          Alert.alert('Error', 'Please fill in all vehicle details (Make, Model, Plate Number).');
          return;
        }
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await updateLastLogin(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        const vehiclesData = vehicles.map((v, index) => ({
          id: v.id,
          type: v.type,
          make: v.make,
          model: v.model,
          plateNumber: v.plateNumber,
          photoUrl: v.photoUrl,
          isActive: index === 0 // Make the first vehicle active by default
        }));

        await createUserProfile(userCredential.user, {
          name,
          phone,
          age,
          idProof,
          vehicles: vehiclesData
        });
      }
    } catch (error) {
      Alert.alert('Authentication Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Smart Parking</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Welcome back! Find your spot easily.' : 'Join us and register your vehicles.'}
            </Text>
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <>
                <Text style={styles.sectionTitle}>Personal Info</Text>
                <TextInput style={styles.input} placeholder="Full Name (e.g. John Doe)" value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <TextInput style={styles.input} placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
                <TextInput style={styles.input} placeholder="Identity Proof No (Aadhar/License)" value={idProof} onChangeText={setIdProof} />
                
                <Text style={[styles.sectionTitle, {marginTop: 24}]}>Your Vehicles</Text>
                {vehicles.map((v, index) => (
                  <View key={v.id} style={styles.vehicleCard}>
                    <View style={styles.vehicleCardHeader}>
                      <Text style={styles.vehicleTitle}>Vehicle {index + 1}</Text>
                      {vehicles.length > 1 && (
                        <TouchableOpacity onPress={() => removeVehicle(v.id)}>
                          <Trash2 size={20} color="#dc2626" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <View style={styles.vehicleTypeContainer}>
                      {['Car', 'Bike', 'Truck'].map(type => (
                        <Text 
                          key={type} 
                          style={[styles.vehicleBadge, v.type === type && styles.vehicleBadgeActive]} 
                          onPress={() => updateVehicle(v.id, 'type', type)}>
                          {type}
                        </Text>
                      ))}
                    </View>

                    <TextInput style={styles.inputSmall} placeholder="Make (e.g. Honda)" value={v.make} onChangeText={(val) => updateVehicle(v.id, 'make', val)} />
                    <TextInput style={styles.inputSmall} placeholder="Model (e.g. Civic)" value={v.model} onChangeText={(val) => updateVehicle(v.id, 'model', val)} />
                    <TextInput style={styles.inputSmall} placeholder="Plate Number (e.g. MH-12-AB-1234)" value={v.plateNumber} onChangeText={(val) => updateVehicle(v.id, 'plateNumber', val)} autoCapitalize="characters" />
                    
                    <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(v.id)}>
                      {v.uploading ? (
                        <ActivityIndicator color="#2563eb" />
                      ) : v.photoUrl ? (
                        <Image source={{ uri: v.photoUrl }} style={styles.vehicleImage} />
                      ) : (
                        <View style={{flexDirection:'row', alignItems:'center'}}>
                          <Camera size={20} color="#64748b" style={{marginRight: 8}} />
                          <Text style={{color: '#64748b'}}>Upload Vehicle Photo</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity style={styles.addVehicleBtn} onPress={addVehicle}>
                  <PlusCircle size={20} color="#2563eb" style={{marginRight: 8}}/>
                  <Text style={styles.addVehicleText}>Add Another Vehicle</Text>
                </TouchableOpacity>

                <View style={styles.divider} />
              </>
            )}

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="example@mail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <View style={{marginTop: 16}}>
              <CustomButton 
                title={isLogin ? 'Sign In' : 'Create Account'} 
                onPress={handleAuth} 
                loading={loading}
              />
            </View>

            <CustomButton 
              title={isLogin ? 'Don\'t have an account? Sign Up' : 'Already have an account? Sign In'} 
              onPress={() => setIsLogin(!isLogin)} 
              type="secondary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  scrollContent: { paddingVertical: 40 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b', lineHeight: 24 },
  form: { width: '100%' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, color: '#1e293b', marginBottom: 12 },
  inputSmall: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15, color: '#1e293b', marginBottom: 8 },
  vehicleCard: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  vehicleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  vehicleTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  vehicleTypeContainer: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  vehicleBadge: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#e2e8f0', borderRadius: 6, color: '#64748b', fontWeight: '600', overflow: 'hidden' },
  vehicleBadgeActive: { backgroundColor: '#2563eb', color: '#fff' },
  uploadBtn: { height: 100, backgroundColor: '#e2e8f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginTop: 4 },
  vehicleImage: { width: '100%', height: '100%' },
  addVehicleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#2563eb', borderRadius: 12, marginBottom: 24 },
  addVehicleText: { color: '#2563eb', fontWeight: '700', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 24 }
});

export default LoginScreen;
