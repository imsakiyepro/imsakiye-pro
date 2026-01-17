import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native"; // ✅ Ekran odaklanınca yenilemek için

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#D4AF37",
  bg: "#050505",
  surface: "#111",
  lcd: "#2a3b2a",
  lcdText: "#000",
};

import { FONTS } from "../src/constants/theme";

export default function ZikirmatikScreen() {
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [isMuted, setIsMuted] = useState(false);

  // Animasyon Değerleri
  const buttonScale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // 1. Ekran Yüklendiğinde veya Odaklandığında Veriyi Çek
  // useFocusEffect: Başka sekmeden veya geri gelindiğinde veriyi tazeler.
  useFocusEffect(
    React.useCallback(() => {
      loadCount();
    }, [])
  );

  // 2. Kaydetme Fonksiyonu
  const saveCount = async (val: number) => {
    try {
      await AsyncStorage.setItem("zikir_count", val.toString());
    } catch (e) {
      console.error("Kayıt hatası", e);
    }
  };

  // 3. Yükleme Fonksiyonu
  const loadCount = async () => {
    try {
      const saved = await AsyncStorage.getItem("zikir_count");
      if (saved !== null) {
        setCount(parseInt(saved));
      }
    } catch (e) {
      console.error("Yükleme hatası", e);
    }
  };

  const handlePress = () => {
    if (!isMuted) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newCount = count + 1;
    setCount(newCount);

    // ✅ KRİTİK DÜZELTME: Anlık Kayıt
    // Bekleme yapmadan direkt kaydediyoruz. Böylece uygulamayı kapatsan bile veri kalır.
    saveCount(newCount);

    if (target !== 0 && newCount % target === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      triggerGlow();
    }

    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setCount(0);
    saveCount(0); // ✅ Reset anında da anlık kayıt
  };

  const toggleTarget = () => {
    if (target === 33) setTarget(99);
    else if (target === 99) setTarget(0);
    else setTarget(33);
    Haptics.selectionAsync();
  };

  const triggerGlow = () => {
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>ZİKİRMATİK</Text>
        <Text style={styles.subtitle}>PRO</Text>
      </View>

      <View style={styles.lcdContainer}>
        <View style={styles.lcdScreen}>
          <View style={styles.lcdGrid} />
          <View style={styles.lcdHeader}>
            <Text style={styles.lcdSmallText}>
              {target === 0 ? "∞ MODU" : `HEDEF: ${target}`}
            </Text>
            <Ionicons
              name={isMuted ? "volume-mute" : "radio-button-on"}
              size={12}
              color="#000"
              style={{ opacity: 0.5 }}
            />
          </View>
          <Text style={styles.lcdCount}>
            {count.toString().padStart(5, "0")}
          </Text>
        </View>
        <Animated.View style={[styles.glowOverlay, { opacity: glowAnim }]} />
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={handleReset} style={styles.controlBtn}>
          <View style={styles.controlBtnInner}>
            <Ionicons name="refresh" size={20} color="#555" />
          </View>
          <Text style={styles.btnLabel}>SIFIRLA</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleTarget} style={styles.controlBtn}>
          <View style={styles.controlBtnInner}>
            <Text style={{ fontWeight: "bold", color: "#555" }}>
              {target === 0 ? "∞" : target}
            </Text>
          </View>
          <Text style={styles.btnLabel}>HEDEF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsMuted(!isMuted)}
          style={styles.controlBtn}
        >
          <View style={styles.controlBtnInner}>
            <Ionicons
              name={isMuted ? "fitness" : "pulse"}
              size={20}
              color={isMuted ? "#999" : COLORS.primary}
            />
          </View>
          <Text style={styles.btnLabel}>TİTREŞİM</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainButtonContainer}>
        <Pressable onPress={handlePress}>
          <Animated.View
            style={[
              styles.bigButton,
              {
                transform: [
                  { scale: buttonScale },
                  // Nabız efekti (sadece boşta dururken veya hedef tamamlanınca)
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05],
                    }),
                  },
                ],
                shadowOpacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={["#222", "#000", "#222"]}
              style={styles.bigButtonGradient}
            >
              <View style={styles.bigButtonBorder}>
                <LinearGradient
                  colors={["#BF953F", "#AA771C"]}
                  style={{ flex: 1, borderRadius: 100, padding: 4 }}
                >
                  <View style={styles.bigButtonInner}>
                    <Ionicons
                      name="finger-print"
                      size={60}
                      color="rgba(212, 175, 55, 0.3)"
                    />
                  </View>
                </LinearGradient>
              </View>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>

      <Text style={styles.footerText}>
        "Allah'ı çokça zikredin ki kurtuluşa eresiniz."
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    paddingTop: 60,
  },
  header: { alignItems: "center", marginBottom: 30 },
  title: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  subtitle: { color: "#666", fontSize: 10, letterSpacing: 5 },
  lcdContainer: {
    width: "85%",
    height: 120,
    backgroundColor: "#333",
    borderRadius: 15,
    padding: 10,
    borderWidth: 2,
    borderColor: "#444",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    position: "relative",
    overflow: "hidden",
  },
  lcdScreen: {
    flex: 1,
    backgroundColor: "#9ea792",
    borderRadius: 8,
    padding: 10,
    justifyContent: "space-between",
    borderColor: "rgba(0,0,0,0.1)",
  },
  lcdGrid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    opacity: 0.05,
  },
  lcdHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  lcdSmallText: {
    fontSize: 12,
    color: "#000",
    fontWeight: "600",
  },
  lcdCount: {
    fontSize: 50,
    color: "#000",
    textAlign: "right",
    letterSpacing: 2,
    fontFamily: FONTS.extraBold, // ✅ YENİ FONT
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(212, 175, 55, 0.4)",
  },
  controlsRow: {
    flexDirection: "row",
    width: "80%",
    justifyContent: "space-around",
    marginTop: 30,
    marginBottom: 20,
  },
  controlBtn: { alignItems: "center" },
  controlBtnInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  btnLabel: {
    color: "#666",
    fontSize: 10,
    marginTop: 8,
    fontWeight: "600",
  },
  mainButtonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bigButton: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  bigButtonGradient: {
    flex: 1,
    borderRadius: (width * 0.6) / 2,
    padding: 10,
  },
  bigButtonBorder: {
    flex: 1,
    borderRadius: 200,
    borderWidth: 1,
    borderColor: "#333",
    padding: 5,
  },
  bigButtonInner: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    color: "#444",
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 40,
    textAlign: "center",
    width: "80%",
  },
});
