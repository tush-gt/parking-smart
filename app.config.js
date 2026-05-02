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
  },
};