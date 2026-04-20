import { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Linking,
  Platform,
  Image,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import useUser from "@/utils/auth/useUser";

const VIBES = [
  { id: "cozy", emoji: "🕯️", label: "Cozy", sub: "Blankets, comfort, warmth" },
  {
    id: "adventurous",
    emoji: "🌍",
    label: "Adventurous",
    sub: "Something new, bold",
  },
  { id: "romantic", emoji: "🌹", label: "Romantic", sub: "Date night energy" },
  {
    id: "fun",
    emoji: "🎉",
    label: "Fun & Light",
    sub: "No stress, just laughs",
  },
  {
    id: "thoughtful",
    emoji: "🌿",
    label: "Thoughtful",
    sub: "Deep, meaningful, quiet",
  },
  {
    id: "hype",
    emoji: "⚡",
    label: "High Energy",
    sub: "Intense, thrilling, loud",
  },
];

const RADII = [5, 10, 20];

export default function TonightHome() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [step, setStep] = useState(1); // 1: vibe, 2: location, 3: loading, 4: result
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [location, setLocation] = useState(null);
  const [city, setCity] = useState(null);
  const [radius, setRadius] = useState(10);
  const [locationStatus, setLocationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [reaction, setReaction] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [manualCityInput, setManualCityInput] = useState("");
  const [geocodingCity, setGeocodingCity] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleVibeSelect = (vibe) => {
    setSelectedVibe(vibe);
  };

  const handleVibeNext = () => {
    setStep(2);
    animateIn();
  };

  const handleGetLocation = async () => {
    setLocationStatus("loading");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationStatus("denied");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geocode[0]) {
        const { city: geoCity, region } = geocode[0];
        setCity(`${geoCity || "Your Location"}, ${region || ""}`);
      } else {
        setCity("Your Location");
      }

      setLocationStatus("success");
    } catch (error) {
      console.error("Location error:", error);
      setLocationStatus("denied");
    }
  };

  const handleManualCity = async () => {
    const input = manualCityInput.trim();
    if (!input) return;
    setGeocodingCity(true);
    try {
      const baseUrl =
        process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";
      const res = await fetch(
        `${baseUrl}/api/geocode?city=${encodeURIComponent(input)}`,
      );
      if (!res.ok) throw new Error("Geocode failed");
      const data = await res.json();
      setLocation({ latitude: data.latitude, longitude: data.longitude });
      setCity(data.displayName);
      setLocationStatus("success");
    } catch (err) {
      console.error("Nominatim geocode error:", err);
      // Still let them proceed with city name only, no coords
      setCity(input);
      setLocation(null);
      setLocationStatus("success");
    } finally {
      setGeocodingCity(false);
    }
  };

  const handleFindNight = async () => {
    setStep(3);
    setLoading(true);
    animateIn();

    try {
      const response = await fetch("/api/recommendations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vibe: selectedVibe,
          city: city || "nearby",
          radius,
          latitude: location?.latitude,
          longitude: location?.longitude,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate recommendation");
      }

      const data = await response.json();
      setRecommendation(data.recommendation);

      // Save to database with user ID if authenticated
      const saveResponse = await fetch("/api/recommendations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || null,
          vibe: selectedVibe,
          city: city || "nearby",
          radius,
          movie: data.recommendation.movie,
          food: data.recommendation.food,
          reaction: null,
        }),
      });

      if (saveResponse.ok) {
        const saveData = await saveResponse.json();
        setSavedId(saveData.id);
      }

      setLoading(false);
      setTimeout(() => {
        setStep(4);
        animateIn();
      }, 1500);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
      setLocationStatus("error");
    }
  };

  const handleReaction = async (reactionType) => {
    setReaction(reactionType);

    if (savedId) {
      try {
        await fetch("/api/recommendations/react", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: savedId,
            reaction: reactionType,
          }),
        });
      } catch (error) {
        console.error("Error saving reaction:", error);
      }
    }
  };

  const handleReshuffle = () => {
    setReaction(null);
    setStep(3);
    setLoading(true);
    handleFindNight();
  };

  const handleStartOver = () => {
    setStep(1);
    setSelectedVibe(null);
    setLocation(null);
    setCity(null);
    setRadius(10);
    setLocationStatus(null);
    setRecommendation(null);
    setReaction(null);
    setSavedId(null);
    setManualCityInput("");
    setGeocodingCity(false);
    animateIn();
  };

  const openMaps = () => {
    if (!recommendation) return;
    const query = encodeURIComponent(
      `${recommendation.food.name} ${city || ""}`,
    );
    const url = Platform.select({
      ios: `maps://app?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://maps.google.com/?q=${query}`,
    });
    Linking.openURL(url);
  };

  const openUberEats = () => {
    Linking.openURL("https://ubereats.com");
  };

  const vibeData = VIBES.find((v) => v.id === selectedVibe);

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f0e8" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 28,
          paddingHorizontal: 24,
          paddingBottom: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontSize: 22,
            letterSpacing: -0.5,
            color: "#0f0e0c",
          }}
        >
          to<Text style={{ color: "#c8602a", fontStyle: "italic" }}>night</Text>
        </Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: step >= 1 ? "#c8602a" : "#e8dfc8",
              borderWidth: 1.5,
              borderColor: step >= 1 ? "#c8602a" : "#8a8070",
            }}
          />
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: step >= 2 ? "#c8602a" : "#e8dfc8",
              borderWidth: 1.5,
              borderColor: step >= 2 ? "#c8602a" : "#8a8070",
            }}
          />
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: step >= 3 ? "#c8602a" : "#e8dfc8",
              borderWidth: 1.5,
              borderColor: step >= 3 ? "#c8602a" : "#8a8070",
            }}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: VIBE */}
        {step === 1 && (
          <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 24 }}>
            <View style={{ paddingVertical: 40 }}>
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 38,
                  lineHeight: 44,
                  letterSpacing: -1,
                  color: "#0f0e0c",
                  marginBottom: 10,
                }}
              >
                What's the{" "}
                <Text style={{ color: "#c8602a", fontStyle: "italic" }}>
                  vibe
                </Text>
                {"\n"}tonight?
              </Text>
              <Text
                style={{ color: "#8a8070", fontSize: 15, fontWeight: "300" }}
              >
                We'll match your movie and dinner to it.
              </Text>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {VIBES.map((vibe) => (
                <TouchableOpacity
                  key={vibe.id}
                  onPress={() => handleVibeSelect(vibe.id)}
                  style={{
                    width: "48%",
                    backgroundColor:
                      selectedVibe === vibe.id ? "#fdf3ee" : "#faf7f2",
                    borderWidth: 1.5,
                    borderColor:
                      selectedVibe === vibe.id ? "#c8602a" : "#e8dfc8",
                    borderRadius: 16,
                    padding: 20,
                  }}
                >
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>
                    {vibe.emoji}
                  </Text>
                  <Text
                    style={{
                      fontWeight: "500",
                      fontSize: 15,
                      color: "#0f0e0c",
                    }}
                  >
                    {vibe.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#8a8070",
                      marginTop: 3,
                      fontWeight: "300",
                    }}
                  >
                    {vibe.sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleVibeNext}
              disabled={!selectedVibe}
              style={{
                backgroundColor: "#c8602a",
                borderRadius: 14,
                padding: 18,
                marginTop: 24,
                opacity: selectedVibe ? 1 : 0.4,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 15,
                  fontWeight: "500",
                  textAlign: "center",
                }}
              >
                Pick this vibe →
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* STEP 2: LOCATION */}
        {step === 2 && (
          <Animated.View
            style={{ opacity: fadeAnim, paddingHorizontal: 24, flex: 1 }}
          >
            <View style={{ paddingVertical: 40 }}>
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 34,
                  lineHeight: 41,
                  letterSpacing: -0.8,
                  color: "#0f0e0c",
                  marginBottom: 10,
                }}
              >
                Where are{"\n"}you tonight?
              </Text>
              <Text
                style={{ color: "#8a8070", fontSize: 15, fontWeight: "300" }}
              >
                So we only show restaurants you can actually get to.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleGetLocation}
              disabled={locationStatus === "loading"}
              style={{
                backgroundColor: "#0f0e0c",
                borderRadius: 14,
                padding: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 12,
                opacity: locationStatus === "loading" ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 18 }}>📍</Text>
              <Text
                style={{ color: "#f5f0e8", fontSize: 15, fontWeight: "500" }}
              >
                {locationStatus === "loading"
                  ? "Getting location..."
                  : "Use my location"}
              </Text>
            </TouchableOpacity>

            {/* Status row */}
            {locationStatus && locationStatus !== "denied" && (
              <View
                style={{
                  marginTop: 4,
                  padding: 16,
                  backgroundColor: "#faf7f2",
                  borderWidth: 1.5,
                  borderColor:
                    locationStatus === "success" ? "#2a6b5e" : "#e8dfc8",
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Text style={{ fontSize: 16 }}>
                  {locationStatus === "loading" ? "⏳" : "✅"}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: locationStatus === "success" ? "#2a6b5e" : "#8a8070",
                    flex: 1,
                  }}
                >
                  {locationStatus === "loading"
                    ? "Getting your location..."
                    : `${city} — searching within ${radius} miles`}
                </Text>
              </View>
            )}

            {/* Manual city entry — shown always so user can override, shown prominently if GPS denied */}
            <View style={{ marginTop: 20 }}>
              <Text
                style={{ fontSize: 13, color: "#8a8070", marginBottom: 8 }}
              >
                {locationStatus === "denied"
                  ? "📍 Location access denied — enter your city:"
                  : "Or enter a city manually:"}
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  value={manualCityInput}
                  onChangeText={setManualCityInput}
                  placeholder="e.g. Austin, TX"
                  placeholderTextColor="#c0b8a8"
                  returnKeyType="search"
                  onSubmitEditing={handleManualCity}
                  style={{
                    flex: 1,
                    backgroundColor: "#faf7f2",
                    borderWidth: 1.5,
                    borderColor: "#e8dfc8",
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    fontSize: 15,
                    color: "#0f0e0c",
                  }}
                />
                <TouchableOpacity
                  onPress={handleManualCity}
                  disabled={!manualCityInput.trim() || geocodingCity}
                  style={{
                    backgroundColor:
                      manualCityInput.trim() ? "#0f0e0c" : "#e8dfc8",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {geocodingCity ? (
                    <ActivityIndicator size="small" color="#f5f0e8" />
                  ) : (
                    <Text style={{ color: "#f5f0e8", fontSize: 15 }}>→</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Radius picker — shown once location is set */}
            {locationStatus === "success" && (
              <View style={{ marginTop: 24 }}>
                <Text
                  style={{ fontSize: 13, color: "#8a8070", marginBottom: 10 }}
                >
                  How far is too far for dinner?
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {RADII.map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setRadius(r)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 99,
                        borderWidth: 1.5,
                        borderColor: radius === r ? "#0f0e0c" : "#e8dfc8",
                        backgroundColor: radius === r ? "#0f0e0c" : "#faf7f2",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: radius === r ? "#f5f0e8" : "#0f0e0c",
                        }}
                      >
                        {r} mi
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleFindNight}
              disabled={locationStatus !== "success"}
              style={{
                backgroundColor: "#c8602a",
                borderRadius: 14,
                padding: 18,
                marginTop: 24,
                opacity: locationStatus === "success" ? 1 : 0.4,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 15,
                  fontWeight: "500",
                  textAlign: "center",
                }}
              >
                Find my perfect night →
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* STEP 3: LOADING */}
        {step === 3 && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 80,
            }}
          >
            <ActivityIndicator
              size="large"
              color="#c8602a"
              style={{ marginBottom: 32 }}
            />
            <Text
              style={{
                fontFamily: "System",
                fontSize: 22,
                color: "#0f0e0c",
                marginBottom: 10,
              }}
            >
              Finding your night...
            </Text>
            <Text style={{ color: "#8a8070", fontSize: 14, fontWeight: "300" }}>
              One recommendation. Made for you.
            </Text>
          </Animated.View>
        )}

        {/* STEP 4: RESULT */}
        {step === 4 && recommendation && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View
              style={{
                paddingHorizontal: 24,
                paddingBottom: 20,
                borderBottomWidth: 1,
                borderColor: "#e8dfc8",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: "#0f0e0c",
                  paddingVertical: 5,
                  paddingHorizontal: 12,
                  borderRadius: 99,
                  alignSelf: "flex-start",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 12 }}>{vibeData?.emoji}</Text>
                <Text style={{ fontSize: 12, color: "#f5f0e8" }}>
                  {vibeData?.label} night
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: "System",
                  fontSize: 26,
                  letterSpacing: -0.5,
                  lineHeight: 31,
                  color: "#0f0e0c",
                }}
              >
                Your{" "}
                <Text style={{ color: "#c8602a", fontStyle: "italic" }}>
                  perfect
                </Text>
                {"\n"}night is ready.
              </Text>
            </View>

            {/* Movie */}
            <View
              style={{
                paddingHorizontal: 24,
                paddingVertical: 20,
                borderBottomWidth: 1,
                borderColor: "#e8dfc8",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "500",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "#8a8070",
                  marginBottom: 14,
                }}
              >
                🎬 THE MOVIE
              </Text>
              <View style={{ flexDirection: "row", gap: 14 }}>
                <View
                  style={{
                    width: 80,
                    height: 120,
                    borderRadius: 10,
                    backgroundColor: "#e8dfc8",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {recommendation.movie.posterUrl ? (
                    <Image
                      source={{ uri: recommendation.movie.posterUrl }}
                      style={{ width: 80, height: 120 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 32 }}>
                      {recommendation.movie.emoji}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "System",
                      fontSize: 20,
                      letterSpacing: -0.3,
                      color: "#0f0e0c",
                      marginBottom: 4,
                    }}
                  >
                    {recommendation.movie.title}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: "#8a8070", marginBottom: 8 }}
                  >
                    {recommendation.movie.year} · {recommendation.movie.genre} ·{" "}
                    {recommendation.movie.runtime}
                    {recommendation.movie.tmdbRating
                      ? ` · ⭐ ${recommendation.movie.tmdbRating}`
                      : ""}
                  </Text>
                  {recommendation.movie.streaming && (
                    <View
                      style={{
                        backgroundColor: "#edf5f3",
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        borderRadius: 6,
                        alignSelf: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#2a6b5e",
                          fontWeight: "500",
                        }}
                      >
                        📺 {recommendation.movie.streaming}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={{
                      fontSize: 13,
                      lineHeight: 19.5,
                      color: "#3a3830",
                      fontWeight: "300",
                      fontStyle: "italic",
                    }}
                  >
                    {recommendation.movie.why}
                  </Text>
                </View>
              </View>
            </View>

            {/* Food */}
            <View
              style={{
                paddingHorizontal: 24,
                paddingVertical: 20,
                borderBottomWidth: 1,
                borderColor: "#e8dfc8",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "500",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "#8a8070",
                  marginBottom: 14,
                }}
              >
                🍽️ THE RESTAURANT
              </Text>
              <View
                style={{
                  backgroundColor: "#faf7f2",
                  borderWidth: 1.5,
                  borderColor: "#e8dfc8",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "System",
                      fontSize: 20,
                      letterSpacing: -0.3,
                      color: "#0f0e0c",
                      flex: 1,
                      marginRight: 12,
                    }}
                  >
                    {recommendation.food.name}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: "#8a8070", paddingTop: 4 }}
                  >
                    {recommendation.food.distance} mi
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#8a8070" }}>
                    {recommendation.food.cuisine}
                  </Text>
                  {recommendation.food.rating && (
                    <Text style={{ fontSize: 12, color: "#c8602a" }}>
                      ⭐ {recommendation.food.rating}
                      {recommendation.food.reviewCount
                        ? ` (${recommendation.food.reviewCount.toLocaleString()})`
                        : ""}
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 19.5,
                    color: "#3a3830",
                    fontWeight: "300",
                    fontStyle: "italic",
                    marginBottom: 12,
                  }}
                >
                  {recommendation.food.why}
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={openMaps}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: "#e8dfc8",
                      backgroundColor: "white",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        textAlign: "center",
                        color: "#0f0e0c",
                      }}
                    >
                      📍 Directions
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={openUberEats}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: "#e8dfc8",
                      backgroundColor: "white",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        textAlign: "center",
                        color: "#0f0e0c",
                      }}
                    >
                      🚗 Uber Eats
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Reactions */}
            <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
              <Text
                style={{
                  fontSize: 13,
                  color: "#8a8070",
                  marginBottom: 14,
                  fontWeight: "300",
                }}
              >
                How does this land?
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                {[
                  { type: "loved", emoji: "❤️", label: "Love it" },
                  { type: "meh", emoji: "😐", label: "It's okay" },
                  { type: "pass", emoji: "👎", label: "Pass" },
                ].map((r) => (
                  <TouchableOpacity
                    key={r.type}
                    onPress={() => handleReaction(r.type)}
                    style={{
                      flex: 1,
                      padding: 14,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor:
                        reaction === r.type
                          ? r.type === "loved"
                            ? "#2a6b5e"
                            : r.type === "meh"
                              ? "#c0a860"
                              : "#b05050"
                          : "#e8dfc8",
                      backgroundColor:
                        reaction === r.type
                          ? r.type === "loved"
                            ? "#edf5f3"
                            : r.type === "meh"
                              ? "#fdf8ed"
                              : "#fdf0f0"
                          : "#faf7f2",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
                    <Text style={{ fontSize: 11, color: "#8a8070" }}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                onPress={handleReshuffle}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: "#0f0e0c",
                  backgroundColor: "transparent",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: "#0f0e0c" }}
                >
                  ↻ Try a different pick
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStartOver}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 13, color: "#8a8070" }}>
                  ← Start over
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
