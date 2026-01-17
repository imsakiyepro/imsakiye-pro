import React, {
  useState,
  useEffect, // useEffect'i ekledik
  useContext,
  useRef,
  useCallback,
  memo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FlashList } from "@shopify/flash-list";
import {
  addMonths,
  subMonths,
  format,
  parse,
  differenceInCalendarDays,
  isWithinInterval,
} from "date-fns";
import { tr } from "date-fns/locale";

// PROJE İÇİ IMPORTLAR (Yolun doğru olduğundan emin olun)
import { Permissions } from "../src/context/Permissions";

import { wp, hp, rf, SCREEN_WIDTH } from "../src/utils/responsive";

// TypeScript hatasını önlemek için FlashList'i bypass ediyoruz
const FlashListFixed = FlashList as any;

// MİLLİ BAYRAMLAR VE RESMİ TATİLLER
const NATIONAL_HOLIDAYS: { [key: string]: string } = {
  "01-01-2026": "Yılbaşı",
  "23-04-2026": "23 Nisan",
  "01-05-2026": "Emek ve Dayanışma Günü",
  "19-05-2026": "19 Mayıs",
  "15-07-2026": "15 Temmuz",
  "30-08-2026": "30 Ağustos",
  "29-10-2026": "29 Ekim",
};

// DİĞER ÖZEL GÜNLER
const SPECIAL_DAYS: { [key: string]: string } = {
  "14-02-2026": "Sevgililer Günü",
  "08-03-2026": "Dünya Kadınlar Günü",
  "18-03-2026": "Çanakkale Zaferi",
  "10-05-2026": "Anneler Günü",
  "21-06-2026": "Babalar Günü",
  "24-11-2026": "Öğretmenler Günü",
  "31-12-2026": "Yılbaşı Gecesi",
};

const THEME_COLORS = {
  primary: "#D4AF37",
  background: "#000000",
  white: "#FFFFFF",
  textSecondary: "#94A3B8",
  rowEven: "rgba(255,255,255,0.02)",
  todayBorder: "#D4AF37",
  holidayText: "#F59E0B",
  nationalHolidayText: "#EF4444", // 🔴 Milli
  specialDayText: "#38BDF8", // 🔵 Diğer (Cyan 400)
  headerBg: "rgba(0,0,0,0.4)",
  separator: "rgba(255,255,255,0.1)",
  currentPrayer: "#22C55E",
  nextPrayer: "#D4AF37",
};

const RELIGIOUS_DAYS: { [key: string]: string } = {
  "15-01-2026": "Miraç Kandili",
  "02-02-2026": "Berat Kandili",
  "16-03-2026": "Kadir Gecesi",
  "20-03-2026": "Ramazan Bayramı 1",
  "21-03-2026": "Ramazan Bayramı 2",
  "22-03-2026": "Ramazan Bayramı 3",
  "27-05-2026": "Kurban Bayramı 1",
  "28-05-2026": "Kurban Bayramı 2",
  "29-05-2026": "Kurban Bayramı 3",
  "30-05-2026": "Kurban Bayramı 4",
  "16-06-2026": "Hicri Yılbaşı",
  "25-06-2026": "Aşure Günü",
  "24-08-2026": "Mevlid Kandili",
  "10-12-2026": "Regaip Kandili",
};

const RAMADAN_2026 = {
  start: "19-02-2026",
  end: "19-03-2026",
};

// --- SATIR BİLEŞENİ ---
const CalendarRow = memo(({ item, index, activePrayerIndex }: any) => {
  const isRowActive = item.isToday;
  const nextPrayerIndex = (activePrayerIndex + 1) % 6;

  const getCellStyle = (colIndex: number) => {
    const style: any = [styles.cell];
    if (isRowActive) {
      if (colIndex === activePrayerIndex)
        style.push({ color: THEME_COLORS.currentPrayer, fontWeight: "bold" });
      else if (colIndex === nextPrayerIndex)
        style.push({ color: THEME_COLORS.nextPrayer, fontWeight: "bold" });
    }
    return style;
  };

  return (
    <View
      style={[
        styles.row,
        isRowActive && styles.activeRowBorder,
        index % 2 === 0 &&
        !isRowActive && { backgroundColor: THEME_COLORS.rowEven },
      ]}
    >
      <View style={styles.dayColumn}>
        <Text
          style={[
            styles.dayText,
            isRowActive && { color: THEME_COLORS.primary },
          ]}
        >
          {item.day}
        </Text>
        <Text
          style={[
            styles.weekdayText,
            item.ramadanDay
              ? { color: THEME_COLORS.primary, fontWeight: "bold" }
              : item.specialType === "religious"
                ? { color: THEME_COLORS.holidayText }
                : item.specialType === "national"
                  ? { color: THEME_COLORS.nationalHolidayText, fontWeight: "bold" }
                  : item.specialType === "other"
                    ? { color: THEME_COLORS.specialDayText, fontStyle: "italic" }
                    : {},
          ]}
          numberOfLines={1}
        >
          {item.ramadanDay
            ? `Ramazan ${item.ramadanDay}`
            : item.specialText || item.weekday}
        </Text>
      </View>
      <Text style={getCellStyle(0)}>{item.imsak}</Text>
      <Text style={getCellStyle(1)}>{item.gunes}</Text>
      <Text style={getCellStyle(2)}>{item.ogle}</Text>
      <Text style={getCellStyle(3)}>{item.ikindi}</Text>
      <Text style={getCellStyle(4)}>{item.aksam}</Text>
      <Text style={getCellStyle(5)}>{item.yatsi}</Text>
    </View>
  );
});

// --- HEADER BİLEŞENİ ---
const CalendarHeader = memo(({ activeIndex }: { activeIndex: number }) => {
  const nextIndex = (activeIndex + 1) % 6;
  const getHeaderStyle = (idx: number) => {
    const style: any = [styles.columnHeader];
    if (idx === activeIndex) style.push({ color: THEME_COLORS.currentPrayer });
    else if (idx === nextIndex) style.push({ color: THEME_COLORS.nextPrayer });
    return style;
  };

  return (
    <View style={styles.tableHeader}>
      <Text
        style={[
          styles.columnHeader,
          { flex: 0.8, textAlign: "left", paddingLeft: 10 },
        ]}
      >
        Gün
      </Text>
      <Text style={getHeaderStyle(0)}>İms</Text>
      <Text style={getHeaderStyle(1)}>Gün</Text>
      <Text style={getHeaderStyle(2)}>Öğl</Text>
      <Text style={getHeaderStyle(3)}>İkn</Text>
      <Text style={getHeaderStyle(4)}>Akş</Text>
      <Text style={getHeaderStyle(5)}>Yat</Text>
    </View>
  );
});

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const flashListRef = useRef<any>(null);
  const context = useContext(Permissions);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthData, setMonthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalActiveIndex, setInternalActiveIndex] = useState(-1);

  if (!context) return null;
  // locationName'i Context'ten alıyoruz ve bağımlılık olarak kullanacağız.
  const { locationName, getLocationCoordinates } = context;

  // --- AKTİF VAKİT HESAPLAMA ---
  const calculateActiveIndex = useCallback((data: any) => {
    if (!data) return 5;

    const now = new Date();
    const curMins = now.getHours() * 60 + now.getMinutes();

    const getT = (key1: string, key2: string) => {
      const val = data[key1] || data[key2];
      return val ? val : "00:00";
    };

    const tArray = [
      getT("Fajr", "imsak"),
      getT("Sunrise", "gunes"),
      getT("Dhuhr", "ogle"),
      getT("Asr", "ikindi"),
      getT("Maghrib", "aksam"),
      getT("Isha", "yatsi"),
    ].map((t: string) => {
      // Split hatası kontrolü
      if (!t || typeof t !== "string") return 0;
      // "05:12 (TRT)" gibi gelen veriyi önce boşluğa sonra :'ya bölüyoruz
      const [h, m] = t.split(" ")[0].split(":").map(Number);
      return h * 60 + m;
    });

    let activeIdx = 5;
    for (let i = 0; i < tArray.length; i++) {
      if (curMins < tArray[i]) {
        activeIdx = i - 1;
        break;
      }
    }
    return activeIdx < 0 ? 5 : activeIdx;
  }, []);

  // --- VERİ ÇEKME FONKSİYONU ---
  const fetchMonthlyData = useCallback(async () => {
    // 1. Yeni aya geçerken eskisini temizle ki karışıklık olmasın
    setMonthData([]);
    setLoading(true);

    try {
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();

      // Context'ten GÜNCEL koordinatları alıyoruz
      const coords = await getLocationCoordinates();
      if (!coords) throw new Error("Konum alınamadı");

      // Cache Key
      const cacheKey = `calendar_v7_${coords.lat.toFixed(2)}_${coords.lon.toFixed(2)}_${month}_${year}`;
      const cached = await AsyncStorage.getItem(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        setMonthData(parsed);
        const today = parsed.find((d: any) => d.isToday);
        if (today) setInternalActiveIndex(calculateActiveIndex(today));
        setLoading(false);
        return;
      }

      // API İSTEĞİ
      const response = await fetch(
        `https://api.aladhan.com/v1/calendar?latitude=${coords.lat}&longitude=${coords.lon}&method=13&month=${month}&year=${year}`
      );
      const json = await response.json();

      if (json.code === 200 && json.data) {
        const todayStr = format(new Date(), "dd-MM-yyyy");
        const ramadanStart = parse(
          RAMADAN_2026.start,
          "dd-MM-yyyy",
          new Date()
        );
        const ramadanEnd = parse(RAMADAN_2026.end, "dd-MM-yyyy", new Date());

        const processed = json.data.map((item: any, index: number) => {
          const dateKey = item.date.gregorian.date;
          const currentParsedDate = parse(dateKey, "dd-MM-yyyy", new Date());
          const isToday = dateKey === todayStr;

          let ramadanDay = null;
          if (
            isWithinInterval(currentParsedDate, {
              start: ramadanStart,
              end: ramadanEnd,
            })
          ) {
            ramadanDay =
              differenceInCalendarDays(currentParsedDate, ramadanStart) + 1;
          }

          if (isToday)
            setInternalActiveIndex(calculateActiveIndex(item.timings));

          return {
            id: index,
            day: item.date.gregorian.day,
            weekday: format(currentParsedDate, "EEE", { locale: tr }),
            // Split hatalarına karşı önlem alınmış veri işleme
            imsak: item.timings.Fajr ? item.timings.Fajr.split(" ")[0] : "",
            gunes: item.timings.Sunrise
              ? item.timings.Sunrise.split(" ")[0]
              : "",
            ogle: item.timings.Dhuhr ? item.timings.Dhuhr.split(" ")[0] : "",
            ikindi: item.timings.Asr ? item.timings.Asr.split(" ")[0] : "",
            aksam: item.timings.Maghrib
              ? item.timings.Maghrib.split(" ")[0]
              : "",
            yatsi: item.timings.Isha ? item.timings.Isha.split(" ")[0] : "",
            specialText:
              RELIGIOUS_DAYS[dateKey] ||
              NATIONAL_HOLIDAYS[dateKey] ||
              SPECIAL_DAYS[dateKey] ||
              null,
            specialType: RELIGIOUS_DAYS[dateKey]
              ? "religious"
              : NATIONAL_HOLIDAYS[dateKey]
                ? "national"
                : SPECIAL_DAYS[dateKey]
                  ? "other"
                  : null,
            ramadanDay,
            isToday,
          };
        });

        await AsyncStorage.setItem(cacheKey, JSON.stringify(processed));
        setMonthData(processed);
      }
      // ...
    } catch (e) {
      console.error("Veri çekme hatası:", e);
      // HATA DURUMUNDA LİSTE BOŞ KALSIN
      setMonthData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, locationName, getLocationCoordinates, calculateActiveIndex]);

  // Sayfa odaklandığında veya locationName değiştiğinde çalışır
  useFocusEffect(
    useCallback(() => {
      fetchMonthlyData();
    }, [fetchMonthlyData])
  );

  // Veri yüklendiğinde bugüne scroll et
  useEffect(() => {
    if (!loading && monthData.length > 0 && flashListRef.current) {
      const tIndex = monthData.findIndex((d: any) => d.isToday);
      if (tIndex !== -1) {
        // Liste render olduktan hemen sonra scroll etmek için küçük bir gecikme gerekebilir
        // ancak useEffect dependency ile daha güvenli
        setTimeout(() => {
          flashListRef.current?.scrollToIndex({
            index: tIndex,
            animated: true,
          });
        }, 100);
      }
    }
  }, [loading, monthData]);

  // Ek Güvenlik: locationName değişirse anında yükleniyor durumuna geçir
  useEffect(() => {
    setLoading(true);
  }, [locationName]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/mosque-bg.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View
            style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}
          >
            <View>
              <Text style={styles.pageTitle}>Takvim</Text>
              <View style={styles.locationBadge}>
                <Ionicons
                  name="location-sharp"
                  size={14}
                  color={THEME_COLORS.primary}
                />
                <Text style={styles.locationText}>
                  {locationName || "Konum Yükleniyor..."}
                </Text>
              </View>
            </View>
            <View style={styles.navContainer}>
              <TouchableOpacity
                onPress={() => setSelectedDate((prev) => subMonths(prev, 1))}
                style={styles.navBtn}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={THEME_COLORS.primary}
                />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {format(selectedDate, "MMMM yyyy", {
                  locale: tr,
                }).toUpperCase()}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedDate((prev) => addMonths(prev, 1))}
                style={styles.navBtn}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={THEME_COLORS.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={THEME_COLORS.primary} />
            </View>
          ) : monthData.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons
                name="cloud-offline-outline"
                size={60}
                color={THEME_COLORS.primary}
                style={{ opacity: 0.5, marginBottom: 20 }}
              />
              <Text style={{ color: THEME_COLORS.white, fontSize: rf(18), fontWeight: "bold", marginBottom: 10 }}>
                Bağlantı Hatası
              </Text>
              <Text style={{ color: THEME_COLORS.textSecondary, textAlign: "center", marginBottom: 20, paddingHorizontal: 40 }}>
                Veriler yüklenemedi. Lütfen internet bağlantınızı kontrol edin.
              </Text>
              <TouchableOpacity
                onPress={fetchMonthlyData}
                style={{
                  backgroundColor: THEME_COLORS.primary,
                  paddingHorizontal: 30,
                  paddingVertical: 12,
                  borderRadius: 25,
                }}
              >
                <Text style={{ color: "#000", fontWeight: "bold", fontSize: rf(14) }}>
                  Tekrar Dene
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <CalendarHeader activeIndex={internalActiveIndex} />

              <View style={{ flex: 1, minHeight: 2 }}>
                <FlashListFixed
                  ref={flashListRef}
                  data={monthData}
                  renderItem={({ item, index }: any) => (
                    <CalendarRow
                      item={item}
                      index={index}
                      activePrayerIndex={internalActiveIndex}
                    />
                  )}
                  estimatedItemSize={hp(6.8)}
                  keyExtractor={(item: any) => item.id.toString()}
                  contentContainerStyle={{ paddingBottom: 100 }}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </>
          )}
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME_COLORS.background },
  bg: { flex: 1, width: SCREEN_WIDTH, height: "100%" },
  overlay: { flex: 1, backgroundColor: "rgba(5, 20, 10, 0.92)" },
  headerContainer: { paddingHorizontal: wp(5), paddingBottom: hp(1.8) },
  pageTitle: { fontSize: rf(24), fontWeight: "bold", color: THEME_COLORS.white },
  locationBadge: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  locationText: {
    color: THEME_COLORS.primary,
    fontSize: rf(13),
    marginLeft: 4,
    fontWeight: "600",
  },
  navContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: wp(1.5),
    marginTop: hp(1.8),
  },
  navBtn: { padding: wp(2) },
  monthText: { color: THEME_COLORS.white, fontSize: rf(16), fontWeight: "700" },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.separator,
    backgroundColor: THEME_COLORS.headerBg,
  },
  columnHeader: {
    flex: 1,
    color: THEME_COLORS.textSecondary,
    fontSize: rf(10.5), // Biraz küçülttük tablo sığsın
    textAlign: "center",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    height: hp(6.8), // Responsive yükseklik
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  activeRowBorder: {
    borderColor: THEME_COLORS.todayBorder,
    borderLeftWidth: 4,
    borderLeftColor: THEME_COLORS.primary,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
  },
  dayColumn: { flex: 0.9, paddingLeft: wp(3) }, // Gün alanı biraz genişletildi
  dayText: { color: THEME_COLORS.white, fontWeight: "bold", fontSize: rf(15) },
  weekdayText: {
    fontSize: rf(9),
    color: THEME_COLORS.textSecondary,
    marginTop: 2,
  },
  cell: { flex: 1, color: "#E2E8F0", textAlign: "center", fontSize: rf(11.5) },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
