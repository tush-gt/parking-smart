// app.config.js
export default {
  expo: {
    name: "parking_smart",
    slug: "parking_smart",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourname.parkingsmart",
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_MAPS_API,
      },
    },
    android: {
      permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "INTERNET"],
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.yourname.parkingsmart",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_MAPS_API,
        },
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-sharing",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow Smart Parking to use your location to find nearby parking spots."
        }
      ]
    ],
  },
};