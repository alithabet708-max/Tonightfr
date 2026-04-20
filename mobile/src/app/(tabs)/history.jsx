import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import useUser from "@/utils/auth/useUser";
import { useAuthModal } from "@/utils/auth/store";

const VIBE_MAP = {
  cozy: { emoji: "🕯️", label: "Cozy" },
  adventurous: { emoji: "🌍", label: "Adventurous" },
  romantic: { emoji: "🌹", label: "Romantic" },
  fun: { emoji: "🎉", label: "Fun & Light" },
  thoughtful: { emoji: "🌿", label: "Thoughtful" },
  hype: { emoji: "⚡", label: "High Energy" },
};

export default function History() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { open } = useAuthModal();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/recommendations/history?userId=${user.id}&limit=20`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getReactionEmoji = (reaction) => {
    if (reaction === "loved") return "❤️";
    if (reaction === "meh") return "😐";
    if (reaction === "pass") return "👎";
    return null;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f0e8" }}>
      <StatusBar style="dark" />

      <View
        style={{
          paddingTop: insets.top + 28,
          paddingHorizontal: 24,
          paddingBottom: 20,
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontSize: 28,
            letterSpacing: -0.8,
            color: "#0f0e0c",
          }}
        >
          Your Nights
        </Text>
        <Text
          style={{
            color: "#8a8070",
            fontSize: 15,
            fontWeight: "300",
            marginTop: 4,
          }}
        >
          Past recommendations and reactions
        </Text>
      </View>

      {!user ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
          <Text
            style={{
              fontSize: 18,
              color: "#0f0e0c",
              textAlign: "center",
              marginBottom: 8,
              fontWeight: "500",
            }}
          >
            Sign in to save your nights
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#8a8070",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Create an account to keep track of all your perfect movie + dinner
            pairings
          </Text>
          <TouchableOpacity
            onPress={() => open({ mode: "signin" })}
            style={{
              backgroundColor: "#c8602a",
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 32,
            }}
          >
            <Text style={{ color: "white", fontSize: 15, fontWeight: "500" }}>
              Sign in or create account
            </Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#c8602a" />
        </View>
      ) : recommendations.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🌙</Text>
          <Text style={{ fontSize: 16, color: "#8a8070", textAlign: "center" }}>
            Your history will appear here once you get your first recommendation
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: 24,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#c8602a"
            />
          }
        >
          {recommendations.map((rec) => {
            const vibeData = VIBE_MAP[rec.vibe] || {
              emoji: "✨",
              label: rec.vibe,
            };
            const reactionEmoji = getReactionEmoji(rec.reaction);

            return (
              <View
                key={rec.id}
                style={{
                  backgroundColor: "#faf7f2",
                  borderWidth: 1.5,
                  borderColor: "#e8dfc8",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{vibeData.emoji}</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#8a8070",
                        fontWeight: "500",
                      }}
                    >
                      {vibeData.label}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: "#8a8070" }}>
                    {formatDate(rec.created_at)}
                  </Text>
                </View>

                <View
                  style={{ flexDirection: "row", gap: 12, marginBottom: 10 }}
                >
                  <View
                    style={{
                      width: 50,
                      height: 75,
                      borderRadius: 8,
                      backgroundColor: "#e8dfc8",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>
                      {rec.movie_emoji || "🎬"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "System",
                        fontSize: 16,
                        letterSpacing: -0.3,
                        color: "#0f0e0c",
                        marginBottom: 2,
                      }}
                    >
                      {rec.movie_title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#8a8070",
                        marginBottom: 6,
                      }}
                    >
                      {rec.movie_year} · {rec.movie_runtime}
                    </Text>
                    {rec.movie_streaming && (
                      <Text style={{ fontSize: 10, color: "#2a6b5e" }}>
                        📺 {rec.movie_streaming}
                      </Text>
                    )}
                  </View>
                </View>

                <View
                  style={{
                    backgroundColor: "#f5f0e8",
                    borderRadius: 10,
                    padding: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#0f0e0c",
                        flex: 1,
                      }}
                    >
                      {rec.food_name}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#8a8070" }}>
                      {rec.food_distance} mi
                    </Text>
                  </View>
                  <Text
                    style={{ fontSize: 11, color: "#8a8070", marginTop: 2 }}
                  >
                    {rec.food_cuisine}
                  </Text>
                </View>

                {reactionEmoji && (
                  <View
                    style={{
                      marginTop: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{reactionEmoji}</Text>
                    <Text style={{ fontSize: 12, color: "#8a8070" }}>
                      {rec.reaction === "loved"
                        ? "You loved this"
                        : rec.reaction === "meh"
                          ? "It was okay"
                          : "You passed"}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
