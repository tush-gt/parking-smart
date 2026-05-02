import { collection, addDoc } from "firebase/firestore";
import { db } from "./services/firebaseConfig";

const dummyParkingSpots = [
  {
    name: "Central Plaza Parking",
    latitude: 37.78825,
    longitude: -122.4324,
    totalSlots: 50,
    availableSlots: 12,
    pricePerHour: 5.50,
    address: "123 Market St, San Francisco, CA"
  },
  {
    name: "Green View Garage",
    latitude: 37.79825,
    longitude: -122.4424,
    totalSlots: 30,
    availableSlots: 2,
    pricePerHour: 4.00,
    address: "456 Park Ave, San Francisco, CA"
  },
  {
    name: "Skyline Underground",
    latitude: 37.77825,
    longitude: -122.4224,
    totalSlots: 100,
    availableSlots: 45,
    pricePerHour: 7.00,
    address: "789 Mission St, San Francisco, CA"
  },
  {
    name: "Harbor Side Lot",
    latitude: 37.80825,
    longitude: -122.4124,
    totalSlots: 20,
    availableSlots: 0,
    pricePerHour: 3.50,
    address: "101 Embarcadero, San Francisco, CA"
  }
];

export const seedDatabase = async () => {
  try {
    const parkingSpotsRef = collection(db, "parkingSpots");
    for (const spot of dummyParkingSpots) {
      await addDoc(parkingSpotsRef, spot);
    }
    console.log("Database seeded successfully!");
  } catch (e) {
    console.error("Error seeding database: ", e);
  }
};
