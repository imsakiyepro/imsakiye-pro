import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { Platform, Alert } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Application from "expo-application";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PermissionManager } from "../utils/PermissionManager";
import { syncUserToCloud } from "../services/userService";

// --- BİLDİRİM HANDLER ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PrayerTimeItem {
  id: number;
  name: string;
  time: string;
  icon: string;
}

export interface SettingsState {
  ezan: boolean;
  iftar: boolean;
  sahur: boolean;
}

interface PermissionsContextType {
  prayerTimes: PrayerTimeItem[];
  locationName: string;
  loading: boolean;
  settings: SettingsState;
  refreshData: () => Promise<void>;
  toggleSetting: (key: keyof SettingsState) => Promise<void>;
  setManualLocation: (country: string, city: string) => Promise<boolean>;
  getLocationCoordinates: () => Promise<{
    lat: number;
    lon: number;
    displayName: string;
  }>;
  requestInitialPermissions: () => Promise<void>;
}

export const Permissions = createContext<PermissionsContextType | null>(null);

// YARDIMCI: DAKİKA ÇIKARMA
const subtractMinutes = (dateObj: Date, mins: number) => {
  return new Date(dateObj.getTime() - mins * 60000);
};

// YARDIMCI: TARİH PARSE
const parseDateTime = (dateStr: string, timeStr: string) => {
  const [d, m, y] = dateStr.split("-").map(Number);
  const [hour, min] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, hour, min, 0);
};

// KATEGORİLER
const setupNotificationCategories = async () => {
  await Notifications.setNotificationCategoryAsync("PRAYER_ACTION", [
    {
      identifier: "READ_DUA",
      buttonTitle: "🤲 Duayı Oku",
      options: { opensAppToForeground: true },
    },
  ]);
};

// --- 🔥 BİLDİRİM PLANLAYICI ---
const schedulePrayerNotifications = async (
  monthlyData: any[],
  settings: SettingsState,
  isRamadan: boolean,
  locationName: string
) => {
  try {
    // Önce temizle
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!settings.ezan && !settings.iftar && !settings.sahur) {
      return;
    }

    const now = new Date();
    // Gelecek 10 gün
    const upcomingDays = monthlyData
      .filter((d) => {
        const [day, month, year] = d.date.gregorian.date.split("-").map(Number);
        const itemDate = new Date(year, month - 1, day, 23, 59);
        return itemDate >= now;
      })
      .slice(0, 10);

    for (const dayData of upcomingDays) {
      const dateStr = dayData.date.gregorian.date;
      const t = dayData.timings;

      const times = [
        { name: "İmsak", time: t.Fajr.split(" ")[0] },
        { name: "Güneş", time: t.Sunrise.split(" ")[0] },
        { name: "Öğle", time: t.Dhuhr.split(" ")[0] },
        { name: "İkindi", time: t.Asr.split(" ")[0] },
        { name: "Akşam", time: t.Maghrib.split(" ")[0] },
        { name: "Yatsı", time: t.Isha.split(" ")[0] },
      ];

      for (const item of times) {
        const prayerDate = parseDateTime(dateStr, item.time);
        if (prayerDate <= now) continue;

        // --- 1. 15 DAKİKA KALA UYARISI (HER VAKİT İÇİN) ---
        if (settings.ezan) {
          const fifteenMinBefore = subtractMinutes(prayerDate, 15);
          if (fifteenMinBefore > now) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "⏳ Vakit Yaklaşıyor",
                body: `${item.name} vaktine son 15 dakika.`,
                sound: true,
              },
              trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fifteenMinBefore },
            });
          }
        }

        let title = "";
        let body = "";

        // --- 2. SAHUR (İMSAK ÖNCESİ - 60 DK) ---
        if (item.name === "İmsak") {
          if (isRamadan && settings.sahur) {
            const sahurDate = subtractMinutes(prayerDate, 60);
            if (sahurDate > now) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "🌙 Sahur Vakti",
                  body: `Bereket saati yaklaşıyor. Son 1 saat. Su içmeyi unutma.`,
                  sound: true,
                },
                trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: sahurDate },
              });
            }
          }
          if (settings.ezan) {
            title = isRamadan ? "🛑 Niyet Vakti" : "İmsak Vakti";
            body = `Sabahın nuru doğuyor (${item.time}). Yeni güne Bismillah.`;
          }
        }
        // --- 3. İFTAR (AKŞAM - 60 DK) ---
        else if (item.name === "Akşam") {
          if (isRamadan && settings.iftar) {
            const iftarPrepDate = subtractMinutes(prayerDate, 60);
            if (iftarPrepDate > now) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "🍞 İftara Doğru",
                  body: `Son 1 saat. Sofralar kuruluyor, dualar kabul oluyor.`,
                  sound: true,
                },
                trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: iftarPrepDate },
              });
            }
          }
          if (settings.ezan) {
            title = isRamadan ? "🤲 İftar Sevinci" : "Akşam Ezanı";
            body = isRamadan
              ? `Oruçunu açma vakti (${item.time}). Allah kabul etsin.`
              : `Günün yorgunluğunu atma vakti (${item.time}).`;
          }
        }
        // --- DİĞER VAKİTLER ---
        else if (settings.ezan && item.name !== "Güneş") {
          title = `🕌 ${item.name} Vakti`;
          const messages: any = {
            "Öğle": "Günün ortasında bir huzur molası ver.",
            "İkindi": "Güneş alçalırken ruhunu dinlendir.",
            "Yatsı": "Günü huzurla kapat, yarına umutla bak.",
          };
          const extraText = messages[item.name] || "Haydi namaza, haydi kurtuluşa.";
          body = `${item.time} - ${extraText}`;
        }

        // --- ANA BİLDİRİM ---
        if (title) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              sound: true,
              categoryIdentifier: "PRAYER_ACTION",
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: prayerDate,
            },
          });
        }
      }
    }
  } catch (error) {
    console.warn("Bildirim Planlama Hatası:", error);
    // Bildirim hatası kritik değildir, kullanıcıya alert göstermeye gerek yok (sessiz hata).
  }
};

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeItem[]>([]);
  const [monthlyRawData, setMonthlyRawData] = useState<any[]>([]);
  const [locationName, setLocationName] = useState<string>("İstanbul");
  const [loading, setLoading] = useState<boolean>(true);
  const [isRamadan, setIsRamadan] = useState<boolean>(false);
  const [settings, setSettings] = useState<SettingsState>({
    ezan: false,
    iftar: false,
    sahur: false,
  });

  useEffect(() => {
    const initApp = async () => {
      await setupNotificationCategories();
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Namaz Vakitleri",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
      const gpsSetting = await AsyncStorage.getItem("settings_gps");
      if (gpsSetting === null) {
        await AsyncStorage.setItem("settings_gps", "false");
      }
      loadData();
    };
    initApp();
  }, []);

  const requestInitialPermissions = useCallback(async () => {
    try {
      // console.log("🚀 [ONBOARDING] İzinler İsteniyor...");
      const locGranted = await PermissionManager.askLocation();
      await AsyncStorage.setItem("settings_gps", locGranted ? "true" : "false");

      const notifGranted = await PermissionManager.askNotification();
      if (notifGranted) {
        await AsyncStorage.setItem("settings_ezan", "true");
        await AsyncStorage.setItem("settings_iftar", "true");
        await AsyncStorage.setItem("settings_sahur", "true");
        setSettings({ ezan: true, iftar: true, sahur: true });
      }
      await loadData();
    } catch (error) {
      console.error("İlk izin hatası:", error);
      Alert.alert(
        "Hata",
        "Uygulama kurulumu sırasında bir hata oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin."
      );
    }
  }, []);

  const getLocationCoordinates = useCallback(async () => {
    try {
      const useGPS = (await AsyncStorage.getItem("settings_gps")) === "true";

      if (!useGPS) {
        const lat = await AsyncStorage.getItem("manual_lat");
        const lon = await AsyncStorage.getItem("manual_lng");
        const city = await AsyncStorage.getItem("manual_city");
        if (lat && lon) {
          const name = city || "Seçili Konum";
          setLocationName(name);
          return {
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            displayName: name,
          };
        }
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted" && useGPS) {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        try {
          const address = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (address[0]) {
            const city = address[0].region || address[0].city || "Konum";
            const district = address[0].district || "";
            const full = district ? `${city} / ${district}` : city;
            setLocationName(full);

            syncUserToCloud({
              lat: loc.coords.latitude,
              lon: loc.coords.longitude,
              country: address[0].country || "TR",
              city: city,
              district: district,
            });
            return {
              lat: loc.coords.latitude,
              lon: loc.coords.longitude,
              displayName: full,
            };
          }
        } catch (err) {
          console.warn("Geo error", err);
        }
        return {
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
          displayName: "GPS Konumu",
        };
      }

      setLocationName("İstanbul");
      return { lat: 41.0082, lon: 28.9784, displayName: "İstanbul" };
    } catch (e) {
      setLocationName("İstanbul");
      return { lat: 41.0082, lon: 28.9784, displayName: "İstanbul" };
    }
  }, []);

  // API'den veri çekme (CACHE'siz sadece network)
  const fetchFromNetwork = async (lat: number, lon: number, m: number, y: number) => {
    try {
      const res = await fetch(
        `https://api.aladhan.com/v1/calendar?latitude=${lat}&longitude=${lon}&method=13&month=${m}&year=${y}`
      );
      const json = await res.json();
      return json.data;
    } catch (error) {
      console.warn("Network fetch error:", error);
      return null;
    }
  };

  const loadData = useCallback(async () => {
    // 1. Önce Ayarları Yükle
    const ezan = (await AsyncStorage.getItem("settings_ezan")) === "true";
    const iftar = (await AsyncStorage.getItem("settings_iftar")) === "true";
    const sahur = (await AsyncStorage.getItem("settings_sahur")) === "true";
    const currentSettings = { ezan, iftar, sahur };
    setSettings(currentSettings);

    // 2. Konumu Bul
    const loc = await getLocationCoordinates();

    // CACHE KEY OLUŞTUR
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    const cacheKey = `cache_prayer_${m}_${y}_${loc.lat.toFixed(1)}_${loc.lon.toFixed(1)}`;

    // 3. ÖNCE CACHE KONTROLÜ (HIZ İÇİN)
    let cachedData = null;
    try {
      const cachedStr = await AsyncStorage.getItem(cacheKey);
      if (cachedStr) {
        cachedData = JSON.parse(cachedStr);
        // Cache varsa hemen state güncelle ve loading'i kapat
        processAndSetData(cachedData, currentSettings, loc.displayName);
        setLoading(false);
      } else {
        // Cache yoksa loading göster
        setLoading(true);
      }
    } catch (e) {
      console.warn("Cache read error", e);
      setLoading(true);
    }

    // 4. NETWORK FETCH (ARKADA GÜNCELLEME)
    // Eğer cache varsa kullanıcı zaten veriyi gördü, arkada sessizce güncelle.
    // Eğer cache yoksa kullanıcı loading görüyor, veriyi bekliyor.
    const networkData = await fetchFromNetwork(loc.lat, loc.lon, m, y);

    if (networkData) {
      // Yeni veri geldiyse cache'i ve state'i güncelle
      await AsyncStorage.setItem(cacheKey, JSON.stringify(networkData));
      processAndSetData(networkData, currentSettings, loc.displayName);
    }

    // Her türlü işlem bitti
    setLoading(false);

  }, [getLocationCoordinates]);

  // Veriyi İşleme Yardımcısı (Tekrarı önlemek için ayrıldı)
  const processAndSetData = (allDaysData: any[], settings: SettingsState, locName: string) => {
    if (!allDaysData) return;

    setMonthlyRawData(allDaysData);

    const now = new Date();
    const todayStr = `${now.getDate().toString().padStart(2, "0")}-${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${now.getFullYear()}`;

    const todayData = allDaysData.find(
      (d: any) => d.date.gregorian.date === todayStr
    );

    if (todayData) {
      const hijriMonth = todayData.date.hijri.month.en;
      const isRam = hijriMonth === "Ramaḍān";

      setIsRamadan(isRam);

      const t = todayData.timings;
      const clean = (time: string) => (time ? time.split(" ")[0] : "00:00");
      const formatted = [
        {
          id: 1,
          name: "İmsak",
          time: clean(t.Fajr),
          icon: "cloudy-night-outline",
        },
        {
          id: 2,
          name: "Güneş",
          time: clean(t.Sunrise),
          icon: "sunny-outline",
        },
        { id: 3, name: "Öğle", time: clean(t.Dhuhr), icon: "sunny" },
        {
          id: 4,
          name: "İkindi",
          time: clean(t.Asr),
          icon: "partly-sunny-outline",
        },
        {
          id: 5,
          name: "Akşam",
          time: clean(t.Maghrib),
          icon: "moon-outline",
        },
        { id: 6, name: "Yatsı", time: clean(t.Isha), icon: "moon" },
      ];
      setPrayerTimes(formatted);

      // Bildirimleri sadece network'ten güncel veri gelince veya ayar değişince tekrar kurabiliriz
      // Ama burada her seferinde çağırmak da sorun olmaz, çünkü cancelAll yapıyor.
      schedulePrayerNotifications(
        allDaysData,
        settings,
        isRam,
        locName
      );
    }
  };

  const toggleSetting = async (key: keyof SettingsState) => {
    const newVal = !settings[key];
    if (newVal) {
      const hasPerm = await PermissionManager.askNotification();
      if (!hasPerm) return;
    }

    const updated = { ...settings, [key]: newVal };
    setSettings(updated);
    await AsyncStorage.setItem(`settings_${key}`, String(newVal));

    if (monthlyRawData.length > 0) {
      await schedulePrayerNotifications(
        monthlyRawData,
        updated,
        isRamadan,
        locationName
      );
    }
  };

  const setManualLocation = async (country: string, city: string) => {
    try {
      const geo = await Location.geocodeAsync(`${city}, ${country}`);
      if (geo[0]) {
        await AsyncStorage.setItem("manual_lat", String(geo[0].latitude));
        await AsyncStorage.setItem("manual_lng", String(geo[0].longitude));
        await AsyncStorage.setItem("manual_city", city);
        await AsyncStorage.setItem("settings_gps", "false");
        await loadData();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const value = useMemo(
    () => ({
      prayerTimes,
      locationName,
      loading,
      settings,
      refreshData: loadData,
      toggleSetting,
      setManualLocation,
      getLocationCoordinates,
      requestInitialPermissions,
    }),
    [
      prayerTimes,
      locationName,
      loading,
      settings,
      loadData,
      getLocationCoordinates,
      requestInitialPermissions,
    ]
  );

  return <Permissions.Provider value={value}>{children}</Permissions.Provider>;
};
