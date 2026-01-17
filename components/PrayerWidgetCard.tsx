import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../src/constants/theme";
const { width } = Dimensions.get("window");

export default function PrayerWidgetCard({ nextPrayer, timeLeft }: any) {
  // nextPrayer: "Öğle", timeLeft: "02:45:10" gibi gelecek

  return (
    <View style={styles.container}>
      {/* Arka plan görseli veya Gradient (Opsiyonel) */}
      <View style={styles.cardFrame}>
        <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
          {/* Üst Kısım: Başlık ve İkon */}
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Ionicons name="time" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.headerText}>SIRADAKİ VAKİT</Text>
          </View>

          {/* Orta Kısım: Vakit İsmi ve Geri Sayım */}
          <View style={styles.mainContent}>
            <View>
              <Text style={styles.prayerName}>{nextPrayer || "İKİNDİ"}</Text>
              <Text style={styles.dateLabel}>6 Ocak, Salı</Text>
            </View>

            <View style={styles.timerWrapper}>
              <Text style={styles.timerText}>{timeLeft || "00:00:00"}</Text>
              <Text style={styles.remainingLabel}>KALAN SÜRE</Text>
            </View>
          </View>

          {/* Alt Kısım: Progress Bar (Vaktin ne kadarı geçti?) */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressFill, { width: "65%" }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressTime}>12:45</Text>
              <Text style={styles.progressTime}>15:20</Text>
            </View>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
    width: width,
  },
  cardFrame: {
    height: 180,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  blurContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  mainContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prayerName: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "800",
  },
  dateLabel: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  timerWrapper: {
    alignItems: "flex-end",
  },
  timerText: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "200",
    fontVariant: ["tabular-nums"],
  },
  remainingLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressTime: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
  },
});
