import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { Permissions } from "../src/context/Permissions";
import { useNavigation } from "@react-navigation/native";
import { FONTS } from "../src/constants/theme";

const { width } = Dimensions.get("window");
const COMPASS_SIZE = width * 0.85;
const HALF_SIZE = COMPASS_SIZE / 2;

const COLORS = {
  gold: "#D4AF37",
  goldDark: "#AA771C",
  goldLight: "#FCF6BA",
  bg: "#050505",
  success: "#4ADE80",
  error: "#EF4444",
  textGray: "#888",
  surface: "#1A1A1A",
  warning: "#FCD34D",
};

const calculateQibla = (lat: number, lon: number) => {
  const PI = Math.PI;
  const latk = (21.4225 * PI) / 180.0;
  const longk = (39.8262 * PI) / 180.0;
  const phi = (lat * PI) / 180.0;
  const lambda = (lon * PI) / 180.0;
  const y = Math.sin(longk - lambda);
  const x =
    Math.cos(phi) * Math.tan(latk) - Math.sin(phi) * Math.cos(longk - lambda);
  return ((Math.atan2(y, x) * 180.0) / PI + 360) % 360;
};

const smoothAngle = (current: number, target: number, factor = 0.15) => {
  let delta = target - current;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return current + delta * factor;
};

export default function KibleScreen() {
  const context = useContext(Permissions);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const [heading, setHeading] = useState(0);
  const [qibla, setQibla] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [guidanceText, setGuidanceText] = useState("Konum Bekleniyor...");
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const init = async () => {
      if (context?.getLocationCoordinates) {
        const coords = await context.getLocationCoordinates();
        if (coords) {
          const q = calculateQibla(coords.lat, coords.lon);
          setQibla(q);
          setGuidanceText("Pusula Hazırlanıyor...");
        }
      }
    };
    if (isFocused) init();
  }, [context, isFocused]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let lastHeading = 0;

    const startCompass = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Hatası", "Pusula için konum izni gereklidir.");
        return;
      }

      subscription = await Location.watchHeadingAsync((obj) => {
        const { trueHeading, magHeading, accuracy } = obj;
        const actualHeading = trueHeading !== -1 ? trueHeading : magHeading;

        setAccuracy(accuracy);

        const smoothedHeading = smoothAngle(lastHeading, actualHeading, 0.2);
        lastHeading = smoothedHeading;

        const displayHeading = (smoothedHeading + 360) % 360;
        setHeading(displayHeading);
        rotateAnim.setValue(-smoothedHeading);
        checkAlignment(displayHeading, qibla);
      });
    };

    if (isFocused) {
      startCompass();
    }

    return () => {
      if (subscription) subscription.remove();
    };
  }, [isFocused, qibla]);

  const checkAlignment = (currentHeading: number, targetQibla: number) => {
    if (targetQibla === 0) return;

    const diff = targetQibla - currentHeading;
    let normalizedDiff = ((diff + 180) % 360) - 180;
    if (normalizedDiff < -180) normalizedDiff += 360;

    const absDiff = Math.abs(normalizedDiff);

    if (absDiff < 4) {
      if (!isLocked) {
        setIsLocked(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setGuidanceText("MÜKEMMEL");
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } else {
      if (isLocked) {
        setIsLocked(false);
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }

      if (Math.abs(normalizedDiff) > 100) {
        setGuidanceText("DÖNMEYE DEVAM ET");
      } else if (normalizedDiff > 0) {
        setGuidanceText("SAĞA DÖN  >>>");
      } else {
        setGuidanceText("<<<  SOLA DÖN");
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER: İYİLEŞTİRİLDİ (HATA KAYNAĞI DÜZELTİLDİ) */}
      <View style={styles.header}>
        {/* İkon ve Text'i View içine alıp row yaptık. Text içine ikon koymak bazen hata verir. */}
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={14} color={COLORS.gold} />
          <Text style={styles.locationText}>
            {" "}
            {context?.locationName || "Konum Bekleniyor..."}
          </Text>
        </View>

        <Text
          style={[
            styles.guidanceText,
            { color: isLocked ? COLORS.success : COLORS.gold },
          ]}
        >
          {guidanceText}
        </Text>

        {/* HATA DÜZELTMESİ: (accuracy || 0) diyerek null/undefined kontrolü yaptık */}
        {/* Ayrıca mantıksal operatör hatasını önlemek için !!accuracy kullandık */}
        {!!accuracy && accuracy > 20 && (
          <View style={styles.warningContainer}>
            <Ionicons name="infinite" size={14} color="#000" />
            <Text style={styles.warningText}>
              Pusula için telefonu "8" şeklinde sallayın.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.compassWrapper}>
        <View style={styles.topIndicatorContainer}>
          <View
            style={[
              styles.triangle,
              { borderBottomColor: isLocked ? COLORS.success : COLORS.gold },
            ]}
          />
          {isLocked && <View style={styles.glow} />}
        </View>

        <Animated.View
          style={[
            styles.dialContainer,
            {
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 360],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={
              isLocked
                ? [COLORS.success, "#052e16"]
                : [COLORS.gold, "#3f2c00", "#1a1a1a"]
            }
            style={styles.dialGradient}
          >
            <View style={styles.dialInner}>
              {[...Array(72)].map((_, i) => {
                const angle = i * 5;
                const isMajor = angle % 90 === 0;
                const isMinor = angle % 30 === 0;
                return (
                  <View
                    key={i}
                    style={[
                      styles.tickLine,
                      {
                        height: isMajor ? 16 : isMinor ? 10 : 6,
                        width: isMajor ? 3 : 1,
                        backgroundColor: isMajor
                          ? isLocked
                            ? COLORS.success
                            : COLORS.gold
                          : "rgba(255,255,255,0.3)",
                        transform: [
                          { rotate: `${angle}deg` },
                          { translateY: -HALF_SIZE + 10 },
                        ],
                      },
                    ]}
                  />
                );
              })}

              <Text
                style={[styles.cardinalText, { top: 25, color: COLORS.error }]}
              >
                N
              </Text>
              <Text
                style={[styles.cardinalText, { bottom: 25, color: "#FFF" }]}
              >
                S
              </Text>
              <Text
                style={[
                  styles.cardinalText,
                  { right: 25, top: "46%", color: "#FFF" },
                ]}
              >
                E
              </Text>
              <Text
                style={[
                  styles.cardinalText,
                  { left: 25, top: "46%", color: "#FFF" },
                ]}
              >
                W
              </Text>

              <View
                style={[
                  styles.kaabaContainer,
                  { transform: [{ rotate: `${qibla}deg` }] },
                ]}
              >
                <View style={styles.kaabaWrapper}>
                  <View style={styles.kaabaLine} />
                  <Ionicons name="cube" size={28} color={COLORS.gold} />
                  <Text style={styles.kaabaLabel}>KABE</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.centerKnob}>
          <LinearGradient colors={["#333", "#111"]} style={styles.knobInner} />
          <Ionicons
            name="add"
            size={20}
            color="#555"
            style={{ position: "absolute" }}
          />
        </View>
      </View>

      <View style={styles.footerContainer}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>PUSULA</Text>
          <Text style={[styles.infoValue, { fontFamily: FONTS.bold }]}>{Math.round(heading)}°</Text>
        </View>

        <View style={styles.verticalLine} />

        <View style={styles.infoBox}>
          <Text style={[styles.infoLabel, { color: COLORS.gold }]}>KIBLE</Text>
          <Text style={[styles.infoValue, { color: COLORS.gold, fontFamily: FONTS.bold }]}>
            {Math.round(qibla)}°
          </Text>
        </View>
      </View>

      <Text style={styles.hintText}>
        Doğru sonuç için metal eşyalardan uzak durunuz.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 50,
  },
  header: { alignItems: "center", marginTop: 20 },

  // YENİ EKLENEN STİL (İkon ve Text hizalaması için)
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: { color: COLORS.textGray, fontSize: 12 },

  guidanceText: { fontSize: 24, fontWeight: "bold", letterSpacing: 2 },

  warningContainer: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  warningText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 6,
  },

  compassWrapper: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  topIndicatorContainer: {
    position: "absolute",
    top: -15,
    zIndex: 10,
    alignItems: "center",
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  glow: {
    position: "absolute",
    width: 40,
    height: 40,
    backgroundColor: COLORS.success,
    borderRadius: 20,
    opacity: 0.4,
    top: 5,
    shadowColor: COLORS.success,
    shadowRadius: 20,
    shadowOpacity: 1,
  },
  dialContainer: { width: "100%", height: "100%" },
  dialGradient: { flex: 1, borderRadius: COMPASS_SIZE / 2, padding: 4 },
  dialInner: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    borderRadius: COMPASS_SIZE / 2,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tickLine: {
    position: "absolute",
    top: "50%",
    left: "50%",
    borderRadius: 2,
  },
  cardinalText: {
    position: "absolute",
    fontSize: 16,
    fontWeight: "bold",
  },
  kaabaContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  kaabaWrapper: {
    marginTop: 45,
    alignItems: "center",
    transform: [{ rotate: "180deg" }],
  },
  kaabaLine: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.gold,
    marginBottom: 5,
    opacity: 0.5,
  },
  kaabaLabel: {
    color: COLORS.gold,
    fontSize: 8,
    fontWeight: "bold",
    marginTop: 2,
  },
  centerKnob: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#111",
    borderWidth: 2,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  knobInner: { width: 40, height: 40, borderRadius: 20 },
  footerContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: "85%",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  infoBox: { alignItems: "center", width: 80 },
  infoLabel: {
    color: COLORS.textGray,
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  infoValue: { color: "#FFF", fontSize: 24, fontWeight: "300" },
  verticalLine: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  hintText: {
    color: "#444",
    fontSize: 10,
    marginTop: -20,
    textAlign: "center",
  },
});
