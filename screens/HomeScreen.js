  import React, { useState, useEffect, useRef } from 'react';
  import {
    View, StyleSheet, Dimensions, FlatList,
    Text, ActivityIndicator, TouchableOpacity, Alert, Platform, Image
  } from 'react-native';
  import MapView, { Marker, Callout, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
  import * as Location from 'expo-location';
  import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
  import { List, Map as MapIcon, MapPin, X, Ban } from 'lucide-react-native';
  // Firebase imports available via services
  import { calculateDistance } from '../services/parkingService';
  import { subscribeToParkingSpots } from '../services/parkingService';
  import { getCachedParkingSpots } from '../services/offlineService';
  import { getUserProfile } from '../services/userService';
  import { auth } from '../services/firebaseConfig';
  import ParkingCard from '../components/ParkingCard';
  import OfflineBanner from '../components/OfflineBanner';

  const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_MAPS_API;
  // console.log("MAPS KEY:", process.env.EXPO_PUBLIC_MAPS_API);
  const HomeScreen = ({ navigation }) => {
    const mapRef = useRef(null);
    const [userLocation, setUserLocation] = useState(null);
    const [mapRegion, setMapRegion] = useState(null);
    const [allSpots, setAllSpots] = useState([]);         // all from Firestore
    const [filteredSpots, setFilteredSpots] = useState([]); // filtered by search
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('map');
    const [isOffline, setIsOffline] = useState(false);
    const [offlineSnapshot, setOfflineSnapshot] = useState(null);
    const [userVehicleType, setUserVehicleType] = useState('Car');
    const [activeVehicle, setActiveVehicle] = useState(null);

    useEffect(() => {
      if (auth.currentUser) {
        getUserProfile(auth.currentUser.uid).then(res => {
          if (res.success && res.data.vehicles) {
            const active = res.data.vehicles.find(v => v.isActive) || res.data.vehicles[0];
            if (active) {
              setActiveVehicle(active);
              setUserVehicleType(active.type);
            }
          } else if (res.success && res.data.vehicleType) {
            // Fallback for older profiles
            setUserVehicleType(res.data.vehicleType);
          }
        });
      }
    }, []);

    useEffect(() => {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status === 'granted') {
          try {
            const loc = await Location.getCurrentPositionAsync({});
            const coords = loc.coords;

            setUserLocation(coords);
            setMapRegion({
              latitude: coords.latitude,
              longitude: coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          } catch (error) {
            console.log("Error getting location:", error.message);
            // Fallback if location services are disabled
            setMapRegion({
              latitude: 19.0760,
              longitude: 72.8777,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        } else {
          // Permission denied — use default region (Mumbai)
          setMapRegion({
            latitude: 19.0760,
            longitude: 72.8777,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }

        // Load all spots regardless of location permission
        const cached = await getCachedParkingSpots();
        if (cached.length > 0) {
          setAllSpots(cached);
          setLoading(false);
        }

        const unsubscribe = subscribeToParkingSpots(
          (spots) => { setAllSpots(spots); setLoading(false); },
          async () => {
            const cached = await getCachedParkingSpots();
            setAllSpots(cached);
            setLoading(false);
          }
        );
        return () => unsubscribe();
      })();
    }, []);

    useEffect(() => {
      // Load last offline snapshot
      import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
        AsyncStorage.getItem('@offline_map_snapshot').then(val => {
          if (val) setOfflineSnapshot(val);
        });
      });

      const { default: NetInfo } = require('@react-native-community/netinfo');
      const unsubNet = NetInfo.addEventListener(state => {
        setIsOffline(!state.isConnected || !state.isInternetReachable);
      });
      return () => unsubNet();
    }, []);

    const handleMapIdle = async () => {
      if (mapRef.current && !isOffline) {
        try {
          const snapshot = await mapRef.current.takeSnapshot({
            format: 'base64',
            quality: 0.5,
            result: 'base64'
          });
          const base64Str = `data:image/png;base64,${snapshot}`;
          setOfflineSnapshot(base64Str);
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem('@offline_map_snapshot', base64Str);
        } catch (e) {
          console.log('Snapshot failed', e);
        }
      }
    };

    // 2. When user picks a place from autocomplete
    const handlePlaceSelect = async (data, placeDetails) => {
      const { lat, lng } = placeDetails.geometry.location;
      const placeName = data.description;

      setSelectedPlace({ lat, lng, name: placeName });

      // Animate map to selected place
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,  // zoom in closer
        longitudeDelta: 0.01,
      };
      setMapRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);

      // Filter spots near this place (within ~500m radius)
      const nearby = allSpots.filter(spot => {
        const dist = calculateDistance(lat, lng, spot.latitude, spot.longitude);
        return parseFloat(dist) <= 0.5; // 0.5 km = 500m radius
      });
      setFilteredSpots(nearby);
    };

    // 3. Reset search
    const handleReset = () => {
      setFilteredSpots([]);
      setSelectedPlace(null);
      if (userLocation && mapRef.current) {
        const region = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setMapRegion(region);
        mapRef.current.animateToRegion(region, 800);
      }
    };

    const displayedSpots = filteredSpots.length > 0 ? filteredSpots : 
      (selectedPlace ? [] : allSpots); // if searched but no results, show empty

    const sortedSpots = [...displayedSpots].sort((a, b) => {
      if (!userLocation) return 0;
      const distA = parseFloat(calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude));
      const distB = parseFloat(calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude));
      return distA - distB;
    });

    if (loading && allSpots.length === 0) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Detecting your location...</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <OfflineBanner />
        {/* Search Bar — floats on top of everything */}
        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            placeholder="Search mall, building, area..."
            fetchDetails={true}
            onPress={handlePlaceSelect}
            query={{
              key: process.env.EXPO_PUBLIC_MAPS_API,
              language: 'en',
              components: 'country:in', // restrict to India
            }}
            styles={{
              container: { flex: 1 },
              textInput: styles.searchInput,
              listView: styles.autocompleteList,
              row: styles.autocompleteRow,
              description: styles.autocompleteText,
            }}
            enablePoweredByContainer={false}
            debounce={300}
          />
          {selectedPlace && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleReset}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Selected place label */}
        {selectedPlace && (
          <View style={styles.selectedLabel}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <MapPin size={14} color="#fff" style={{marginRight: 4}} />
              <Text style={styles.selectedText}>
                {filteredSpots.length} parking spot{filteredSpots.length !== 1 ? 's' : ''} near {selectedPlace.name}
              </Text>
            </View>
          </View>
        )}

        {viewMode === 'map' ? (
          mapRegion? (
            isOffline && offlineSnapshot ? (
              <View style={styles.map}>
                <Image source={{ uri: offlineSnapshot }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                <View style={styles.offlineOverlay}>
                  <Text style={styles.offlineOverlayText}>Map tiles unavailable (Offline)</Text>
                </View>
              </View>
            ) : (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={mapRegion}
                // mapType="none"
                onRegionChangeComplete={handleMapIdle}
                onMapReady={() => {
                  if (mapRegion && mapRef.current) {
                    mapRef.current.animateToRegion(mapRegion, 1000);
                  }
                }}
              >
                {/* Fallback to OpenStreetMap Tiles */}
                <UrlTile
                  urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maximumZ={19}
                  flipY={false}
                  tileSize={256}      
                  zIndex={-1}
                />
                
                {displayedSpots.map((spot) => {
                  const supported = spot.supportedVehicles || ['Car', 'Bike'];
                  const isCompatible = supported.includes(userVehicleType);
                  return (
                  <Marker
                    key={spot.id}
                    coordinate={{
                      latitude: parseFloat(spot.latitude),
                      longitude: parseFloat(spot.longitude),
                    }}
                    pinColor={spot.availableSlots > 5 ? 'green' : spot.availableSlots > 0 ? 'orange' : 'red'}
                  >
                    <Callout onPress={() => navigation.navigate('ParkingDetail', { spot, location: userLocation, userVehicleType, activeVehicle })}>
                      <View style={styles.callout}>
                        <Text style={styles.calloutTitle}>{spot.name}</Text>
                        <Text style={styles.calloutSub}>{spot.availableSlots} slots • ₹{spot.pricePerHour}/hr</Text>
                        {!isCompatible && (
                          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                            <Ban size={12} color="#dc2626" style={{marginRight: 4}}/>
                            <Text style={{color: '#dc2626', fontWeight: 'bold', fontSize: 11}}>Incompatible ({supported.join(', ')})</Text>
                          </View>
                        )}
                        <Text style={styles.calloutAction}>Tap for details →</Text>
                      </View>
                    </Callout>
                  </Marker>
                  );
                })}
              </MapView>
            )
        ) : (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )) : (
          <FlatList
            data={sortedSpots}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <ParkingCard
                spot={item}
                distance={userLocation ? calculateDistance(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude) : '...'}
                userVehicleType={userVehicleType}
                onPress={() => navigation.navigate('ParkingDetail', { spot: item, location: userLocation, userVehicleType, activeVehicle })}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {selectedPlace ? `No parking found near ${selectedPlace.name}` : 'No parking spots found.'}
                </Text>
                {selectedPlace && (
                  <Text style={styles.emptySubText}>Try searching a nearby landmark</Text>
                )}
              </View>
            }
          />
        )}

        {/* Toggle Map/List */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
        >
          {viewMode === 'map'
            ? <List color="#fff" size={24} />
            : <MapIcon color="#fff" size={24} />
          }
        </TouchableOpacity>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#64748b', fontSize: 16 },
    offlineOverlay: {
      position: 'absolute',
      top: '45%',
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    offlineOverlayText: { color: '#fff', fontWeight: '600' },

    // Search
    searchContainer: {
      position: 'absolute',
      top: 50,
      left: 16,
      right: 16,
      zIndex: 999,
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#fff',
      borderRadius: 14,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    searchInput: {
      height: 50,
      fontSize: 15,
      color: '#1e293b',
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: '#fff',
    },
    autocompleteList: {
      borderRadius: 12,
      marginTop: 4,
      elevation: 5,
    },
    autocompleteRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    autocompleteText: {
      fontSize: 14,
      color: '#1e293b',
    },
    clearBtn: {
      padding: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    clearText: {
      fontSize: 16,
      color: '#94a3b8',
      fontWeight: '700',
    },

    // Selected label
    selectedLabel: {
      position: 'absolute',
      top: 112,
      left: 16,
      right: 16,
      zIndex: 998,
      backgroundColor: '#2563eb',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    selectedText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },

    // Callout
    callout: { padding: 10, minWidth: 160 },
    calloutTitle: { fontWeight: '700', fontSize: 14, marginBottom: 2 },
    calloutSub: { fontSize: 12, color: '#64748b', marginBottom: 4 },
    calloutAction: { fontSize: 12, color: '#2563eb', fontWeight: '600' },

    // List
    listContainer: { padding: 16, paddingTop: 120 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#64748b', fontSize: 16, textAlign: 'center' },
    emptySubText: { color: '#94a3b8', fontSize: 14, marginTop: 8 },

    // Toggle
    toggleButton: {
      position: 'absolute',
      bottom: 30,
      right: 20,
      backgroundColor: '#2563eb',
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    },
  });

  export default HomeScreen;