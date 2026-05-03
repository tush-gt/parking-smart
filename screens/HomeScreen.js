import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, Dimensions, FlatList,
  Text, ActivityIndicator, TouchableOpacity, Alert
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { List, Map as MapIcon } from 'lucide-react-native';
// Firebase imports available via services
import { calculateDistance } from '../services/parkingService';
import { subscribeToParkingSpots } from '../services/parkingService';
import { getCachedParkingSpots } from '../services/offlineService';
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

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const coords = loc.coords;

        // Alert.alert(
        //   `Location detected: ${loc.coords}`,
        //   `Lat: ${coords.latitude}, Long: ${coords.longitude}`,
        //   [{text:'OK'}]
        // )
        setUserLocation(coords);
        setMapRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
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
            key: GOOGLE_PLACES_API_KEY,
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
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selected place label */}
      {selectedPlace && (
        <View style={styles.selectedLabel}>
          <Text style={styles.selectedText}>
            📍 {filteredSpots.length} parking spot{filteredSpots.length !== 1 ? 's' : ''} near {selectedPlace.name}
          </Text>
        </View>
      )}

      {viewMode === 'map' ? (
        mapRegion? (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onMapReady={() => {
            if (mapRegion && mapRef.current) {
              mapRef.current.animateToRegion(mapRegion, 1000);
            }
          }}
        >
          {displayedSpots.map((spot) => (
            <Marker
              key={spot.id}
              coordinate={{
                latitude: parseFloat(spot.latitude),
                longitude: parseFloat(spot.longitude),
              }}
              pinColor={spot.availableSlots > 5 ? 'green' : spot.availableSlots > 0 ? 'orange' : 'red'}
            >
              <Callout onPress={() => navigation.navigate('ParkingDetail', { spot, location: userLocation })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{spot.name}</Text>
                  <Text style={styles.calloutSub}>{spot.availableSlots} slots • ₹{spot.pricePerHour}/hr</Text>
                  <Text style={styles.calloutAction}>Tap for details →</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
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
              onPress={() => navigation.navigate('ParkingDetail', { spot: item, location: userLocation })}
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
          : <Text style={{ color: '#fff', fontSize: 18 }}>🗺</Text>
        }
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 16 },

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