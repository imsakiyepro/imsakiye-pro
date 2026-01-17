import React, {
  useRef,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  FlatList,
  StatusBar,
  ImageBackground,
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  RefreshControl // Added
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { COLORS, FONTS } from '../src/constants/theme';
// FIREBASE
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../src/services/firebaseConfig";

// PROJE İÇİ IMPORTLAR
import { PrayerStatsService } from "../src/services/PrayerStatsService";

import { Permissions } from "../src/context/Permissions";

import { DAILY_QUOTES } from "../src/constants/data";
import { MOODS } from "../src/constants/moods";
import {
  calculateNextPrayer,
  formatTimeLeft,
  getFormattedDate,
  getHijriDateString,
} from "../src/utils/dateHelper";

import { checkIsAdmin } from "../src/services/userService";
import { wp, hp, rf, SCREEN_WIDTH, SCREEN_HEIGHT } from "../src/utils/responsive";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>(); // Route hook'u ekledik
  const context = useContext(Permissions);
  // MOVED UP TO AVOID TDZ
  const { prayerTimes, locationName, loading, refreshData } = context || {};

  const flatListRef = useRef<FlatList>(null);

  // --- STATE ---
  const [refreshing, setRefreshing] = useState(false);
  const [todaysQuote, setTodaysQuote] = useState("");
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  // Başlangıç değerini null yaptık, string yaparsak hata verir
  const [targetPrayer, setTargetPrayer] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [iftarTime, setIftarTime] = useState("--:--");
  const [isRamadan, setIsRamadan] = useState(false);
  const [activeDayLabel, setActiveDayLabel] = useState("Bugün"); // "Bugün", "Dün", veya tarih

  // --- 🔥 GLOBAL COUNTER STATE ---
  const [globalStats, setGlobalStats] = useState<any>({});

  // Saati başlangıçta hesapla, bekleme yapmasın
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  });

  const [isAdmin, setIsAdmin] = useState(false);

  // --- BİLDİRİM STATE ---
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [targetNotification, setTargetNotification] = useState<any>(null);
  const [scaleAnim] = useState(new Animated.Value(0));

  // 🔥 VAKİT TAKİBİ (INTERACTIVE CHECK-IN)
  const [completedPrayers, setCompletedPrayers] = useState<string[]>([]);
  // const [checkinPrayer, setCheckinPrayer] = useState<string | null>(null); // ESKİ TEKLİ SİSTEM
  const [missedPrayersList, setMissedPrayersList] = useState<string[]>([]); // YENİ ÇOKLU SİSTEM
  const [currentCheckingPrayer, setCurrentCheckingPrayer] = useState<string | null>(null); // Modalda gösterilen (veya 'multiple')
  const [dismissedCheckins, setDismissedCheckins] = useState<string[]>([]);

  // MODAL İÇİ SEÇİM STATE'İ
  const [selectedInModal, setSelectedInModal] = useState<string[]>([]);

  // Missed Prayers List her değiştiğinde seçimleri sıfırla (veya hepsini seçili yap - tercih meselesi)
  // Kullanıcı kolaylığı için varsayılan olarak HEPSİ SEÇİLİ gelsin mi? Yoksa BOŞ mu?
  // "Kıldınız mı?" diye sorduğumuz için genelde "Evet" denmesi beklenir, bence BOŞ gelsin, kullanıcı seçsin.
  useEffect(() => {
    if (missedPrayersList.length > 0) {
      setSelectedInModal([]); // Reset selection
    }
  }, [missedPrayersList]);

  // 🎭 RUH HALİ STATE
  const [selectedMood, setSelectedMood] = useState<any>(null); // Modal açar

  // 0. GLOBAL STATS LISTENER
  const targetIndex = prayerTimes ? prayerTimes.findIndex((p: any) => p.name === targetPrayer?.name) : -1;

  useEffect(() => {
    const unsubscribe = PrayerStatsService.listenToTodayStats((stats) => {
      setGlobalStats(stats);
    });
    return () => unsubscribe();
  }, []);

  // 🧪 TEST TRIGGER (DeveloperScreen'den gelen)
  useEffect(() => {
    if (route.params?.testCheckin) {
      // Parametre geldiyse hemen promptu aç
      setMissedPrayersList([route.params.testCheckin]);
      setCurrentCheckingPrayer(route.params.testCheckin);

      // Parametreyi temizle ki tekrar tekrar tetiklenmesin
      navigation.setParams({ testCheckin: undefined });
    }
  }, [route.params?.testCheckin]);

  useEffect(() => {
    loadCompletedPrayers();
    loadDismissedCheckins();
  }, [prayerTimes]); // Vakitler değişince (yeni gün) tekrar yükle

  const loadCompletedPrayers = async () => {
    try {
      let targetDateStr = getFormattedDate();

      // 🔥 "AKTİF GÜN" KURALI: Saat 02:00'a kadar dünün verilerini kullan
      // (Yatsı'nın son işaretlenebilir zamanı 02:00 olduğu için)
      const now = new Date();
      if (now.getHours() < 2) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const dd = String(yesterday.getDate()).padStart(2, "0");
        const mm = String(yesterday.getMonth() + 1).padStart(2, "0");
        const yyyy = yesterday.getFullYear();
        targetDateStr = `${dd}.${mm}.${yyyy}`;
      }

      const key = `completed_prayers_${targetDateStr}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        setCompletedPrayers(JSON.parse(saved));
      } else {
        setCompletedPrayers([]);
      }
    } catch (e) {
      console.error("Load prayers error", e);
    }
  };

  const loadDismissedCheckins = async () => {
    try {
      let targetDateStr = getFormattedDate();

      // 🔥 "AKTİF GÜN" KURALI: Saat 02:00'a kadar dünün verilerini kullan
      const now = new Date();
      if (now.getHours() < 2) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const dd = String(yesterday.getDate()).padStart(2, "0");
        const mm = String(yesterday.getMonth() + 1).padStart(2, "0");
        const yyyy = yesterday.getFullYear();
        targetDateStr = `${dd}.${mm}.${yyyy}`;
      }

      const key = `dismissed_checkins_${targetDateStr}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        setDismissedCheckins(JSON.parse(saved));
      } else {
        setDismissedCheckins([]);
      }
    } catch (e) {
      console.error("Load dismissed error", e);
    }
  };

  // Dismiss listesi değişince kaydet
  useEffect(() => {
    const saveDismissed = async () => {
      let targetDateStr = getFormattedDate();

      // 🔥 "AKTİF GÜN" KURALI: Saat 02:00'a kadar dünün tarihine kaydet
      const now = new Date();
      if (now.getHours() < 2) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const dd = String(yesterday.getDate()).padStart(2, "0");
        const mm = String(yesterday.getMonth() + 1).padStart(2, "0");
        const yyyy = yesterday.getFullYear();
        targetDateStr = `${dd}.${mm}.${yyyy}`;
      }

      await AsyncStorage.setItem(`dismissed_checkins_${targetDateStr}`, JSON.stringify(dismissedCheckins));
    };
    if (dismissedCheckins.length > 0) saveDismissed();
  }, [dismissedCheckins]);

  const togglePrayer = async (prayerName: string, skipListUpdate = false) => {
    const isAlreadyCompleted = completedPrayers.includes(prayerName);

    if (!isAlreadyCompleted) {
      // 🔥 KONTROL 1: O NAMAZ VAKTİ GİRDİ Mİ?
      const prayer = prayerTimes?.find((p: any) => p.name === prayerName);
      if (prayer) {
        const now = new Date();
        const [h, m] = prayer.time.split(":").map(Number);
        const prayerTime = new Date();
        prayerTime.setHours(h, m, 0, 0);

        if (now < prayerTime) {
          Alert.alert("Henüz Vakit Girmedi", `${prayerName} vakti henüz gelmedi. Vakit: ${prayer.time}`);
          return;
        }
      }

      // 🔥 KONTROL 2: SON İŞARETLENEBİLİR ZAMAN GEÇTİ Mİ?
      const now = new Date();
      const currentHour = now.getHours();

      if (prayerName === "Yatsı") {
        // Yatsı için DEADLINE KONTROLÜ YOK
        // Çünkü "aktif gün" sistemi otomatik hallediyor:
        // - Saat < 2 → Dünün Yatsı'sı işaretlenebilir (ertesi gün 02:00'a kadar)
        // - Saat >= 2 → Bugünün verileri, vakit girdi mi kontrolü yeterli
      } else {
        // Diğer namazlar için: Gece 00:00'dan sonra deadline geçmiş
        // (Aktif gün sistemi saat < 2 ise dünün verilerini yüklüyor)
        if (currentHour >= 0 && currentHour < 2) {
          Alert.alert(
            "Süre Doldu",
            `${prayerName} namazının işaretlenebilir süresi (gece 00:00) dolmuştur.`
          );
          return;
        }
      }
    }

    // Haptic Feedback (Titreşim)
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    }

    setCompletedPrayers((prev: string[]) => {
      const isCompleted = prev.includes(prayerName);
      let newStats;
      if (isCompleted) {
        newStats = prev.filter((p) => p !== prayerName);
        // 📉 GLOBAL: Azalt
        PrayerStatsService.decrementCount(prayerName);

        // 🔥 İŞARETİ KALDIRINCA DİREKT DISMISS ET (Tekrar sormasın)
        // Kullanıcı kendi eliyle kaldırdıysa, "Kılmadım" demiş sayılır ve prompt çıkmamalı.
        setDismissedCheckins((dPrev) => {
          if (!dPrev.includes(prayerName)) return [...dPrev, prayerName];
          return dPrev;
        });
      } else {
        newStats = [...prev, prayerName];
        // 📈 GLOBAL: Artır (Varsa dismiss listesinden çıkarılabilir ama gerek yok, kılındı zaten)
        PrayerStatsService.incrementCount(prayerName);

        // 🔥 NAMAZ KILINDI! Varsa kurulmuş hatırlatma bildirimini iptal et
        AsyncStorage.getItem("pending_checkin_notifications").then(async (stored) => {
          if (stored) {
            const pending = JSON.parse(stored);
            const notifId = pending[prayerName];
            if (notifId) {
              // console.log("İptal edilen bildirim ID:", notifId);
              await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => { });

              // Listeden sil
              delete pending[prayerName];
              await AsyncStorage.setItem("pending_checkin_notifications", JSON.stringify(pending));
            }
          }
        });
      }

      // Kaydet - "AKTİF GÜN" mantığıyla
      let targetDateStr = getFormattedDate();
      const now = new Date();
      if (now.getHours() < 2) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const dd = String(yesterday.getDate()).padStart(2, "0");
        const mm = String(yesterday.getMonth() + 1).padStart(2, "0");
        const yyyy = yesterday.getFullYear();
        targetDateStr = `${dd}.${mm}.${yyyy}`;
      }
      AsyncStorage.setItem(`completed_prayers_${targetDateStr}`, JSON.stringify(newStats));

      return newStats;
    });

    // Eğer bu vakit listedeyse çıkar (SADECE skipListUpdate FALSE İSE)
    if (!skipListUpdate && missedPrayersList.includes(prayerName)) {
      const updatedList = missedPrayersList.filter(p => p !== prayerName);
      setMissedPrayersList(updatedList);
      if (updatedList.length === 0) {
        setCurrentCheckingPrayer(null);
      } else if (updatedList.length === 1) {
        setCurrentCheckingPrayer(updatedList[0]);
      }
    }
  };

  // MODAL ONAY FONKSİYONU
  const confirmMissedPrayers = async () => {
    // 0. BOŞ SEÇİM KONTROLÜ
    if (selectedInModal.length === 0) {
      Alert.alert("Seçim Yapmadınız", "Lütfen en az bir vakit seçin veya 'Hiçbirini Kılmadım' diyerek geçin.");
      return;
    }

    // 1. Seçilenleri işaretle (Listeyi güncelleme, en son toptan temizleyeceğiz)
    selectedInModal.forEach(p => togglePrayer(p, true));

    // 2. SEÇİLMEYENLERİ (Kılınmadı veya Pas Geçildi) İŞLE
    // 2. SEÇİLMEYENLERİ (Kılınmadı veya Pas Geçildi) İŞLE
    const unselected = missedPrayersList.filter(p => !selectedInModal.includes(p));

    if (unselected.length > 0) {
      const now = new Date();
      for (const prayer of unselected) {
        // 🔥 KONTROL 1: O NAMAZ VAKTİ GİRDİ Mİ?
        const prayerData = prayerTimes?.find((p: any) => p.name === prayer);
        if (!prayerData) continue; // Prayer not found, skip

        const [h, m] = prayerData.time.split(":").map(Number);
        const prayerTime = new Date();
        prayerTime.setHours(h, m, 0, 0);

        // Eğer vakit henüz gelmemişse → Bildirim kurma (mantıksız)
        if (now < prayerTime) {
          setDismissedCheckins((prev) => [...prev, prayer]);
          continue;
        }

        // 🔥 KONTROL 2: DEADLINE GEÇTİ Mİ?
        let deadlinePassed = false;
        const currentHour = now.getHours();

        if (prayer === "Yatsı") {
          // Yatsı için deadline yok (aktif gün sistemi hallediyor)
          deadlinePassed = false;
        } else {
          // Diğer namazlar: Gece 00:00-01:59 arası deadline geçmiş
          if (currentHour >= 0 && currentHour < 2) {
            deadlinePassed = true;
          }
        }

        // Eğer deadline geçtiyse → Bildirim kurma
        if (deadlinePassed) {
          setDismissedCheckins((prev) => [...prev, prayer]);
          continue;
        }

        // 🔥 KONTROL 3: BİR SONRAKİ VAKİT GİRDİ Mİ? (Vakit penceresi kapandı mı?)
        let windowClosed = false;

        if (prayerTimes) {
          const currentIndex = prayerTimes.findIndex((p: any) => p.name === prayer);

          if (currentIndex !== -1 && currentIndex < prayerTimes.length - 1) {
            const nextPrayer = prayerTimes[currentIndex + 1];
            const [nh, nm] = nextPrayer.time.split(":").map(Number);
            const nextDate = new Date();
            nextDate.setHours(nh, nm, 0, 0);
            if (now >= nextDate) windowClosed = true;
          }
        }

        // Eğer bir sonraki vakit girdiyse → Bildirim kurma (artık o vakit geçmiş sayılır)
        if (windowClosed) {
          setDismissedCheckins((prev) => [...prev, prayer]);
          continue;
        }

        // ✅ TÜM KONTROLLER GEÇTİ → 45dk sonra bildirim kur
        const scheduledTime = new Date(Date.now() + 45 * 60 * 1000);
        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: { title: "Hatırlatma", body: `${prayer} namazını kıldın mı?`, sound: true },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: scheduledTime },
          });
          const stored = await AsyncStorage.getItem("pending_checkin_notifications");
          const pending = stored ? JSON.parse(stored) : {};
          pending[prayer] = id;
          await AsyncStorage.setItem("pending_checkin_notifications", JSON.stringify(pending));
        } catch (e) {
          console.warn(e);
        }

        // Her halükarda dismiss listesine ekle ki tekrar sormasın
        setDismissedCheckins((prev) => [...prev, prayer]);
      }
    }

    // Temizlik
    setMissedPrayersList([]);
    setCurrentCheckingPrayer(null);
    setSelectedInModal([]);
  };

  const dismissCheckin = async () => {
    if (missedPrayersList.length > 0) {
      const now = new Date();

      // Her bir kaçan vakit için bildirim kur (Sadece vakti geçmemişse!)
      for (const prayer of missedPrayersList) {
        // ... (Existing logic) ...
        let isExpired = false;
        if (prayerTimes) {
          const currentIndex = prayerTimes.findIndex((p: any) => p.name === prayer);
          if (currentIndex !== -1 && currentIndex < prayerTimes.length - 1) {
            const nextPrayer = prayerTimes[currentIndex + 1];
            const [nh, nm] = nextPrayer.time.split(":").map(Number);
            const nextDate = new Date();
            nextDate.setHours(nh, nm, 0, 0);
            if (now >= nextDate) isExpired = true;
          }
        }

        if (!isExpired) {
          const scheduledTime = new Date(Date.now() + 45 * 60 * 1000);
          try {
            const id = await Notifications.scheduleNotificationAsync({
              content: {
                title: "Hatırlatma",
                body: `${prayer} namazını kıldın mı? İşaretlemek için dokun.`,
                sound: true,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: scheduledTime,
              },
            });
            const stored = await AsyncStorage.getItem("pending_checkin_notifications");
            const pending = stored ? JSON.parse(stored) : {};
            pending[prayer] = id;
            await AsyncStorage.setItem("pending_checkin_notifications", JSON.stringify(pending));
          } catch (e) { console.warn(e); }
        }
        setDismissedCheckins((prev: string[]) => [...prev, prayer]);
      }

      setMissedPrayersList([]);
      setCurrentCheckingPrayer(null);
    }
  };


  // 1. ADMIN KONTROLÜ (UI'ı bloklamadan arkada çalışır)
  useEffect(() => {
    checkIsAdmin().then((status) => setIsAdmin(status));
  }, []);

  // 2. SAAT GÜNCELLEME
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        `${now.getHours().toString().padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      );
    };

    // Saniye senkronizasyonu
    const now = new Date();
    const delay = (60 - now.getSeconds()) * 1000;

    const timeout = setTimeout(() => {
      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, []);



  // 3. BİLDİRİM DİNLEYİCİSİ (Gelişmiş & Yerel Zamanlanmış)
  useEffect(() => {
    // Sadece gelecekteki veya çok yeni geçmişteki bildirimleri al
    // (Son 5 dakika içindekileri de alalım ki "şimdi" gönderilenler kaçmasın)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000);

    const q = query(
      collection(db, "global_notifications"),
      where("scheduledAt", ">", Timestamp.fromDate(fiveMinsAgo)),
      orderBy("scheduledAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) return;

        const scheduledIdsStr = await AsyncStorage.getItem("scheduled_notif_ids");
        const scheduledIds = scheduledIdsStr ? JSON.parse(scheduledIdsStr) : [];
        let updatedIds = [...scheduledIds];
        let hasChanges = false;

        for (const doc of snapshot.docs) {
          const data = doc.data();
          const docId = doc.id;

          // Zaten zamanlandıysa atla
          if (scheduledIds.includes(docId)) continue;

          const scheduledTime =
            data.scheduledAt instanceof Timestamp
              ? data.scheduledAt.toDate()
              : new Date();

          const now = new Date();

          // Eğer zamanı geldiyse veya geçtiyse (but not too old) -> SHOW IMMEDIATELY
          if (scheduledTime <= now) {
            // 🔥 YENİ KONTROL: Eğer üzerinden 1 dakikadan fazla geçtiyse gösterme (Süresi geçti)
            const diffMs = now.getTime() - scheduledTime.getTime();
            if (diffMs > 60000) {
              // Süresi geçmiş, sadece listeye ekle ki tekrar bakmasın
              updatedIds.push(docId);
              hasChanges = true;
              continue;
            }

            // Show immediately (Banner or Modal)
            if (data.displayType === "banner") {
              await Notifications.scheduleNotificationAsync({
                content: { title: data.title, body: data.body, sound: true },
                trigger: null,
              });
            } else {
              // If modal, set to state
              setTargetNotification({ title: data.title, body: data.body });
              setShowNotificationModal(true);
              Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
            }
          }
          // If in the FUTURE -> SCHEDULE LOCALLY (works when app is closed)
          else {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: data.title,
                body: data.body,
                sound: true,
                data: { displayType: data.displayType }, // Data payload
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: scheduledTime
              },
            });
            console.log(`Bildirim zamanlandı: ${data.title} -> ${scheduledTime}`);
          }

          // Add ID to list
          updatedIds.push(docId);
          hasChanges = true;
        }

        if (hasChanges) {
          await AsyncStorage.setItem("scheduled_notif_ids", JSON.stringify(updatedIds));
        }
      },
      (error) => {
        // Offline veya network hatalarında sessizce devam et
        console.warn("Global notification listener error (offline?):", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const closeNotification = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowNotificationModal(false));
  };

  if (!context) return null;


  // 4. NAMAZ VAKİTLERİNE BAĞLI HESAPLAMALAR
  useEffect(() => {
    if (!prayerTimes || prayerTimes.length === 0) return;

    const hijri = getHijriDateString();
    setIsRamadan(hijri.includes("Ramazan"));

    // 🔥 AKTİF GÜN ETİKETİNİ HESAPLA
    const now = new Date();
    if (now.getHours() < 2) {
      // Saat 00:00-01:59 arası → Dünün verileri gösteriliyor
      setActiveDayLabel("Dün");
    } else {
      // Normal saat → Bugünün verileri
      setActiveDayLabel("Bugün");
    }

    // Günlük sözü hemen set et
    setTodaysQuote(DAILY_QUOTES[new Date().getDate() % DAILY_QUOTES.length]);

    // 🔥 GÜN SONU HATIRLATMA SİSTEMİ (Saat 23:00)
    const checkEndOfDayReminder = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Sadece saat 23:00-23:59 arasında kontrol et
      if (currentHour !== 23) return;

      // Bugün için zaten gönderildi mi kontrol et
      const todayStr = getFormattedDate();
      const sentKey = `eod_reminder_sent_${todayStr}`;
      const alreadySent = await AsyncStorage.getItem(sentKey);
      if (alreadySent === "true") return; // Zaten gönderilmiş

      // Kılınmamış namazları bul (Güneş hariç)
      const allPrayers = prayerTimes.filter((p: any) => p.name !== "Güneş").map((p: any) => p.name);
      const missed = allPrayers.filter(p => !completedPrayers.includes(p));

      // Eğer hepsi kılındıysa bildirim gönderme
      if (missed.length === 0) return;

      // Bildirim içeriği hazırla
      const missedList = missed.join(", ");
      const title = "🕌 Gün Bitmeden Hatırlatma";
      const body = `Bugün şu namazları kılmayı unuttunuz: ${missedList}.\n\nGün bitmeden kazaya kalmadan kılabilirsiniz. 🤲`;

      // Bildirim gönder
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data: { displayType: "banner" }, // Banner olarak göster
        },
        trigger: null, // Hemen göster
      });

      // Kaydı işaretle ki tekrar göndermesin
      await AsyncStorage.setItem(sentKey, "true");
    };

    checkEndOfDayReminder();
    //   }, [prayerTimes, completedPrayers]);

    const timerId = setInterval(() => {
      const currentTarget = calculateNextPrayer(prayerTimes) as any;
      if (currentTarget) {
        setTargetPrayer(currentTarget);

        let tDate =
          currentTarget.targetDate instanceof Date
            ? currentTarget.targetDate
            : null;

        if (!tDate) {
          const [h, m] = currentTarget.time.split(":").map(Number);
          tDate = new Date();
          tDate.setHours(h, m, 0, 0);
          if (tDate.getTime() < new Date().getTime())
            tDate.setDate(tDate.getDate() + 1);
        }

        setTimeLeft(formatTimeLeft(tDate));

        const now = new Date().getTime();
        const targetT = tDate.getTime();
        const currentIndex = prayerTimes.findIndex(
          (p: any) => p.name === currentTarget.name
        );
        const prevIndex =
          currentIndex === 0 ? prayerTimes.length - 1 : currentIndex - 1;

        let prevTime = new Date();
        const [ph, pm] = prayerTimes[prevIndex].time.split(":").map(Number);
        prevTime.setHours(ph, pm, 0, 0);
        if (prevTime.getTime() > targetT)
          prevTime.setDate(prevTime.getDate() - 1);

        const total = targetT - prevTime.getTime();
        const elapsed = now - prevTime.getTime();
        setProgress(Math.max(0, Math.min(100, (elapsed / total) * 100)));
      }

      const aksam = prayerTimes.find((p: any) => p.name === "Akşam") as any;
      if (aksam) {
        const [ah, am] = aksam.time.split(":").map(Number);
        let iDate = new Date();
        iDate.setHours(ah, am, 0, 0);
        if (iDate.getTime() < new Date().getTime())
          iDate.setDate(iDate.getDate() + 1);
        setIftarTime(formatTimeLeft(iDate));
      }
    }, 1000);

    // --- CHECK-IN PROMPT LOGIC (UPDATED MULTI) ---
    // Sadece "Günün Son Vakti" veya "Her An" kontrol edebiliriz.
    // Şimdilik timer her saniye çalıştığı için burayı çok yormayalım.
    // 5 saniyede bir kontrol etsin veya sadece vakit değişiminde.
    // Ancak basitleştirmek için:
    if (prayerTimes && prayerTimes.length > 0) {
      const now = new Date();
      const needsAction: string[] = [];

      prayerTimes.forEach((p: any) => {
        if (p.name === "Güneş") return; // Güneş namaz değil

        const [h, m] = p.time.split(":").map(Number);
        const pDate = new Date();
        pDate.setHours(h, m, 0, 0);

        // Eğer vakit geçmişse (veya şimdi girmişse)
        if (pDate <= now) {
          // Eğer işaretlenmemişse VE dismiss edilmemişse
          const isCompleted = completedPrayers.includes(p.name);
          const isDismissed = dismissedCheckins.includes(p.name);

          if (!isCompleted && !isDismissed) {
            needsAction.push(p.name);
          }
        }
      });

      if (needsAction.length > 0) {
        // Eğer liste değiştiyse güncelle (loop'u önlemek için JSON karşılaştırma basit bir yöntem)
        if (JSON.stringify(needsAction) !== JSON.stringify(missedPrayersList)) {
          setMissedPrayersList(needsAction);
          setCurrentCheckingPrayer(needsAction.length > 1 ? "multiple" : needsAction[0]);
        }
      }
    }

    return () => clearInterval(timerId);
  }, [prayerTimes, completedPrayers, dismissedCheckins, missedPrayersList]);

  // --- RENDER HELPERS ---
  useEffect(() => {
    if (targetPrayer && prayerTimes && flatListRef.current) {
      const index = prayerTimes.findIndex(
        (p: any) => p.name === targetPrayer.name
      );
      if (index !== -1) {
        const timer = setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: index,
            animated: true,
            viewPosition: 0.3,
          });
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [targetPrayer?.name]);

  // REFRESH FONKSİYONU
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 800));
    const dataFetch = refreshData ? refreshData() : Promise.resolve();
    const adminCheck = checkIsAdmin().then(setIsAdmin);
    await Promise.all([minDelay, dataFetch, adminCheck]);
    setRefreshing(false);
  }, [refreshData]);

  // --- RENDER HELPERS ---

  // Veri yüklenirken gösterilecek şık loader (Siyah ekran yerine)
  const renderLoading = () => (
    <View style={[styles.centerContent, { paddingTop: insets.top }]}>
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={{ transform: [{ scale: 1.5 }] }}
      />
      <Text style={styles.loadingText}>Vakitler Hesaplanıyor...</Text>
    </View>
  );

  // Veri Hatası Ekranı
  const renderError = () => (
    <View style={[styles.centerContent, { paddingTop: insets.top }]}>
      <Ionicons
        name="cloud-offline-outline"
        size={80}
        color={COLORS.primary}
        style={{ opacity: 0.5, marginBottom: 20 }}
      />
      <Text style={styles.errorTitle}>Bağlantı Hatası</Text>
      <Text style={styles.errorDesc}>
        Namaz vakitleri güncellenemedi. Lütfen internet bağlantınızı kontrol
        edin.
      </Text>
      <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
        <Text style={styles.retryText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );

  // 🎭 MOOD SELECTOR (Yatay Liste)


  // 🎭 MOOD MODAL (İçerik)
  const renderMoodModal = () => {
    if (!selectedMood) return null;
    // Rastgele bir içerik seç (her açılışta değişsin istemiyorsak dışarıda seçilmeli ama şimdilik burada ok)
    // Basitlik için ilkini veya random gösterelim.
    const content = selectedMood.content[Math.floor(Math.random() * selectedMood.content.length)];

    return (
      <Modal
        visible={!!selectedMood}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMood(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", padding: 20 }}
          onPress={() => setSelectedMood(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: "#1e293b",
              width: "100%",
              maxWidth: 340,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: COLORS.primary
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 40 }}>{selectedMood.emoji}</Text>
              <Text style={{ color: "#FFF", fontSize: 20, fontFamily: FONTS.bold, marginTop: 10 }}>{selectedMood.label}</Text>
            </View>

            <View style={{ backgroundColor: "rgba(212, 175, 55, 0.1)", padding: 20, borderRadius: 16, marginBottom: 20 }}>
              <Text style={{ color: "#D4AF37", fontSize: 18, fontFamily: FONTS.medium, textAlign: "center", lineHeight: 28 }}>
                "{content.text}"
              </Text>
            </View>

            <Text style={{ color: "#94A3B8", textAlign: "center", fontFamily: FONTS.regular, marginBottom: 24 }}>
              — {content.source}{content.reference ? `, ${content.reference}` : ""}
            </Text>

            <TouchableOpacity
              onPress={() => setSelectedMood(null)}
              style={{ backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#000", fontFamily: FONTS.bold }}>Kapat</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 1. ARKA PLAN EN DIŞTA (Hemen yüklenir) */}
      <ImageBackground
        source={require("../assets/mosque-bg.png")}
        style={styles.backgroundImage}
      >
        {/* Kar Efekti iptal edilmiş, istenirse açılabilir */}
        {/* <View style={StyleSheet.absoluteFill} pointerEvents="none">
           <LottieView source={require("...")} autoPlay loop style={{ flex: 1, opacity: 0.4 }} />
        </View> */}

        <View style={styles.darkOverlay}>
          {/* DURUMA GÖRE İÇERİK */}

          {/* A) YÜKLENİYORSA: Arka plan üzerine loader göster */}
          {loading &&
            !refreshing &&
            (!prayerTimes || prayerTimes.length === 0) ? (
            renderLoading()
          ) : /* B) HATA VARSA: Arka plan üzerine hata göster */
            !loading && (!prayerTimes || prayerTimes.length === 0) ? (
              renderError()
            ) : (
              /* C) VERİ VARSA: Ana içeriği göster */
              <View style={{ flex: 1, paddingTop: insets.top }}>
                {/* HEADER */}
                <View style={styles.header}>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.locationText} numberOfLines={1} adjustsFontSizeToFit>
                      📍 {locationName || "Konum..."}
                    </Text>
                    <Text style={styles.gregorianDate}>{getFormattedDate()}</Text>
                    <Text style={styles.hijriDate}>{getHijriDateString()}</Text>
                  </View>

                  <View style={styles.toolsContainer}>
                    {isAdmin && (
                      <TouchableOpacity
                        onPress={() => navigation.navigate("DeveloperTest")}
                        style={[styles.toolButton, { marginRight: 12 }]}
                      >
                        <Ionicons name="flask" size={24} color="#FF5252" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => navigation.navigate("QadaScreen")}
                      style={[styles.toolButton, { marginRight: 0 }]}
                    >
                      <Ionicons
                        name="receipt-outline"
                        size={22}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("ZikirmatikScreen")}
                      style={styles.toolButton}
                    >
                      <FontAwesome5
                        name="praying-hands"
                        size={22}
                        color="#D4AF37"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("KibleScreen")}
                      style={[styles.toolButton, { marginLeft: 12 }]}
                    >
                      <Ionicons
                        name="compass-outline"
                        size={28}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* PREMIUM HERO */}
                <View style={styles.premiumHero}>
                  <View style={styles.topRow}>
                    <View style={styles.vakitBadge}>
                      <Text style={[styles.vakitBadgeText, { fontFamily: FONTS.bold }]}>
                        {isRamadan && targetPrayer?.name === "Akşam"
                          ? "İFTARA KALAN SÜRE"
                          : (() => {
                            const prayerName = targetPrayer?.name?.toUpperCase() || "BEKLENİYOR...";
                            // İmsak sıradaysa ve saat >= 2 ise (yeni günün verilerindeyiz) → YARIN ekle
                            const now = new Date();
                            const isTomorrow = prayerName === "İMSAK" && now.getHours() >= 2;
                            return `SIRADAKİ: ${prayerName}${isTomorrow ? " (YARIN)" : ""}`;
                          })()
                        }
                      </Text>
                    </View>
                    <Text style={[styles.prayerTimeValue, { fontFamily: FONTS.medium }]}>{time}</Text>
                  </View>

                  <View style={styles.mainCounterContainer}>
                    <Text style={[styles.timeDigit, { fontFamily: FONTS.extraBold }]}>{timeLeft}</Text>
                    <View style={styles.progressLineContainer}>
                      <View
                        style={[
                          styles.progressLineActive,
                          { width: `${progress}%` },
                        ]}
                      />
                    </View>
                  </View>

                  {isRamadan && targetPrayer?.name !== "Akşam" && (
                    <View style={styles.iftarMiniBox}>
                      <Ionicons
                        name="restaurant-outline"
                        size={14}
                        color={COLORS.primary}
                      />
                      <Text style={styles.iftarMiniText}>
                        {" "}
                        İftara Kalan: {iftarTime}
                      </Text>
                    </View>
                  )}

                  <View style={styles.minimalQuoteBox}>
                    <Text style={styles.quoteText}>“{todaysQuote}”</Text>
                  </View>
                </View>

                {/* LİSTE */}
                <View style={styles.listContainer}>
                  {/* 🔥 MOOD SELECTOR */}


                  <Text style={styles.listTitle}>{activeDayLabel} Vakitleri</Text>
                  <FlatList
                    ref={flatListRef}
                    data={prayerTimes}
                    keyExtractor={(_, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={true}
                    getItemLayout={(data, index) => ({
                      length: hp(7.5) + hp(1), // height + marginBottom
                      offset: (hp(7.5) + hp(1)) * index,
                      index,
                    })}
                    renderItem={({ item }) => {
                      const isNext = targetPrayer && item.name === targetPrayer.name;
                      const isCompleted = completedPrayers.includes(item.name);
                      const globalCount = globalStats[item.name] || 0;
                      const isGunes = item.name === "Güneş"; // Güneş bir namaz değil

                      return (
                        <TouchableOpacity
                          activeOpacity={isGunes ? 1 : 0.7} // Güneş için tıklama efekti yok
                          disabled={isGunes} // Güneş tıklanamaz
                          onPress={() => !isGunes && togglePrayer(item.name)}
                          style={[
                            styles.card,
                            isNext && {
                              backgroundColor: "rgba(212, 175, 55, 0.2)",
                              borderColor: "#D4AF37",
                              borderWidth: 1,
                            },
                            isCompleted && {
                              borderColor: "#10B981", // Green border for completed
                              borderWidth: 1,
                              backgroundColor: "rgba(16, 185, 129, 0.1)"
                            },
                            isGunes && {
                              opacity: 0.6, // Güneş soluk görünsün
                            }
                          ]}
                        >
                          <View style={styles.cardContent}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <Ionicons
                                name={isCompleted ? "checkmark-circle" : (item.icon || "time-outline")}
                                size={22}
                                color={isCompleted ? "#10B981" : (isNext ? COLORS.primary : "#94A3B8")}
                                style={{ marginRight: 12 }}
                              />
                              <View>
                                <Text
                                  style={[
                                    styles.prayerName,
                                    isNext && { color: "#FFF", fontFamily: FONTS.bold },
                                    !isNext && { fontFamily: FONTS.medium },
                                    isCompleted && { color: "#10B981" } // Strikethrough for effect
                                  ]}
                                >
                                  {item.name}
                                </Text>
                                {/* 🔥 GLOBAL SAYAC ROZETİ (Güneş hariç) */}
                                {!isGunes && (globalCount > 0 || isCompleted) && (
                                  <Text style={{ fontSize: rf(10), color: isCompleted ? "#10B981" : "rgba(255,255,255,0.5)", marginTop: 2 }}>
                                    👥 {globalCount > 0 ? `${globalCount.toLocaleString()} kişi kıldı` : "İlk kılan sen ol!"}
                                  </Text>
                                )}
                              </View>
                            </View>
                            <Text
                              style={[
                                styles.prayerTime,
                                isNext && {
                                  color: "#FFF",
                                  fontFamily: FONTS.extraBold,
                                  fontSize: rf(20),
                                },
                                !isNext && { fontFamily: FONTS.bold },
                                isCompleted && { color: "#10B981", opacity: 0.8 }
                              ]}
                            >
                              {item.time}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                        progressBackgroundColor="#1e293b"
                      />
                    }
                    ListFooterComponent={<View style={{ height: 80 }} />}
                  />
                  {/* EN ALT BOŞLUK (Scroll Payı) */}
                </View>
              </View>
            )}
        </View>

        {/* MODALS */}

        {/* 1. MOOD MODAL */}
        {renderMoodModal()}

        {/* 2. NOTIFICATION MODAL (Existing) */}
        <Modal
          transparent
          visible={showNotificationModal}
          animationType="none"
          onRequestClose={closeNotification}
        >
          <View style={styles.modalBackdrop}>
            <Animated.View
              style={[
                styles.premiumModal,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <View style={styles.glowEffect} />
              <View style={styles.iconWrapper}>
                <View style={styles.iconCircleOuter}>
                  <View style={styles.iconCircleInner}>
                    <Ionicons name="notifications" size={32} color="#482900" />
                  </View>
                </View>
              </View>
              <Text style={styles.premiumTitle}>{targetNotification?.title}</Text>

              <View style={{ maxHeight: 150, width: "100%", marginTop: 10 }}>
                <Text style={styles.premiumBody}>{targetNotification?.body}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={closeNotification}
                style={styles.premiumButton}
              >
                <Text style={styles.premiumButtonText}>OKUDUM</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

        {/* 3. CHECK-IN PROMPT MODAL (Updated) */}
        <Modal
          transparent
          visible={!!currentCheckingPrayer}
          animationType="fade"
          onRequestClose={dismissCheckin}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.premiumModal, { borderColor: '#10B981', borderWidth: 1 }]}>
              <View style={[styles.glowEffect, { backgroundColor: '#10B981' }]} />

              <View style={styles.iconWrapper}>
                <View style={[styles.iconCircleOuter, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                  <View style={[styles.iconCircleInner, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Ionicons name="checkmark" size={32} color="#10B981" />
                  </View>
                </View>
              </View>

              <Text style={styles.premiumTitle}>
                {currentCheckingPrayer === 'multiple' ? 'Kılınmamış Namazlar' : 'Namaz Vakti'}
              </Text>

              <Text style={[styles.premiumBody, { marginBottom: 20 }]}>
                {currentCheckingPrayer === 'multiple'
                  ? `Bugün aşağıdaki vakitleri işaretlemediniz. Kıldıklarınızı seçiniz:`
                  : `${currentCheckingPrayer} namazı vakti girdi. Namazını kıldıysan listene işleyelim mi?`
                }
              </Text>

              {/* CHECKBOX LIST (Sadece multiple ise veya tekli de olsa seçim mantığıyla) */}
              {currentCheckingPrayer === 'multiple' ? (
                <View style={{ width: '100%', paddingHorizontal: 20, marginBottom: 20 }}>
                  {missedPrayersList.map((p) => {
                    const isSelected = selectedInModal.includes(p);
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => {
                          if (isSelected) setSelectedInModal(prev => prev.filter(x => x !== p));
                          else setSelectedInModal(prev => [...prev, p]);
                        }}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                          padding: 12, borderRadius: 12, marginBottom: 8,
                          borderWidth: 1, borderColor: isSelected ? '#10B981' : 'transparent'
                        }}
                      >
                        <Ionicons
                          name={isSelected ? "checkbox" : "square-outline"}
                          size={24} color={isSelected ? "#10B981" : "#64748B"}
                          style={{ marginRight: 12 }}
                        />
                        <Text style={{ color: '#FFF', fontSize: rf(16), fontFamily: FONTS.medium }}>{p}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (currentCheckingPrayer === 'multiple') {
                    if (selectedInModal.length === 0) return; // Disable press
                    confirmMissedPrayers();
                  } else if (currentCheckingPrayer) {
                    togglePrayer(currentCheckingPrayer);
                    setMissedPrayersList([]);
                    setCurrentCheckingPrayer(null);
                  }
                }}
                style={[
                  styles.premiumButton,
                  {
                    backgroundColor: '#10B981',
                    marginBottom: 12,
                    width: '80%',
                    opacity: currentCheckingPrayer === 'multiple' && selectedInModal.length === 0 ? 0.5 : 1 // 👈 Opacity change
                  }
                ]}
              >
                <Text style={[styles.premiumButtonText, { color: '#FFF' }]}>
                  {currentCheckingPrayer === 'multiple' ? "SEÇİLENLERİ KAYDET" : "EVET, KILDIM"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={dismissCheckin}
                style={{ padding: 10 }}
              >
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: rf(14) }}>
                  {currentCheckingPrayer === 'multiple' ? "Hiçbirini Kılmadım / Sonra" : "Daha Sonra"}
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, width: width, height: height },
  darkOverlay: { flex: 1, backgroundColor: "rgba(0, 20, 10, 0.75)" },

  // Loading & Error States
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "#FFF",
    marginTop: 15,
    fontSize: 16,
    fontWeight: "500",
    opacity: 0.8,
  },
  errorTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  errorDesc: {
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 30,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: wp(8),
    paddingVertical: hp(1.5),
    borderRadius: 25,
  },
  retryText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: rf(16),
  },

  // Main UI
  // Main UI
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start", // align center yerine start daha güvenli metin uzarsa
    paddingHorizontal: wp(6),
    paddingTop: hp(1.5),
    zIndex: 10,
  },
  headerTextContainer: {
    flex: 1, // Metin alanı esnek olsun
    marginRight: 10, // Butonlara yapışmasın
  },
  locationText: { color: COLORS.primary, fontSize: rf(20), fontWeight: "bold" }, // Fontu biraz kıstık
  gregorianDate: { color: "#FFF", fontSize: rf(16) },
  hijriDate: { color: "rgba(255,255,255,0.4)", fontSize: rf(12), marginTop: 2 },

  premiumHero: {
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5), // Dikey boşluğu azalttık
    flexShrink: 0, // Listeye yer kalsın diye büzülebilir yapmayalım, ama boyutu kontrollü olsun
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(0.5), // Boşluğu azalttık
  },
  vakitBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primary,
  },
  vakitBadgeText: {
    color: COLORS.primary,
    fontSize: rf(10), // Fontu 11 -> 10 yaptık
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  prayerTimeValue: { color: "rgba(255,255,255,0.5)", fontSize: rf(15) },

  mainCounterContainer: {
    width: "100%",
    marginVertical: hp(0.5) // Boşluğu ciddi oranda azalttık (1.2 -> 0.5)
  },
  timeDigit: {
    color: "#FFF",
    fontSize: rf(64), // 72 -> 60 yaptık, çok yer kaplıyordu
    fontWeight: "100",
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
  },
  progressLineContainer: {
    width: "100%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: hp(0.8),
  },
  progressLineActive: {
    height: 2,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowRadius: 10,
    shadowOpacity: 0.8,
  },

  iftarMiniBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: hp(0.8),
    borderWidth: 0.5,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  iftarMiniText: {
    color: COLORS.primary,
    fontSize: rf(12),
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },

  minimalQuoteBox: {
    marginTop: hp(1.5),
    paddingRight: wp(5),
    marginBottom: hp(0.5), // Alt boşluğu azalttık
  },
  quoteText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: rf(13), // 15 -> 13 yaptık, yer açmak için
    lineHeight: rf(18),
    fontWeight: "300",
    fontStyle: "italic",
  },

  // LIST CONTAINER
  listContainer: {
    flex: 1, // Kalan tüm alanı kapla
    paddingHorizontal: wp(5),
    marginTop: hp(4),
    backgroundColor: "rgba(0,0,0,0.6)", // Okunurluk için biraz daha koyulaştırdık
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: hp(2),
    paddingBottom: 10,
  },
  listTitle: {
    color: "#FFF",
    fontSize: rf(16),
    marginBottom: hp(1.5),
    textAlign: "center",
    opacity: 0.9,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.08)", // Biraz daha belirgin yaptık
    marginBottom: hp(1),
    borderRadius: 12,
    height: hp(7.5), // Kart yüksekliğini biraz kıstık
  },
  activeCard: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    borderColor: "rgba(212, 175, 55, 0.5)",
    borderWidth: 1,
  },
  cardContent: {
    paddingHorizontal: wp(4),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
  },
  prayerName: { color: "#E2E8F0", fontSize: rf(17), fontWeight: "500" },
  prayerTime: { color: "#E2E8F0", fontSize: rf(17), fontWeight: "600" },
  activeText: { color: COLORS.primary, fontWeight: "bold", fontSize: rf(18) },

  toolsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 5,
    flexShrink: 0, // Asla büzülme
  },
  toolButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 40, // Dokunma alanı artsın
    height: 40,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  premiumModal: {
    width: "85%",
    backgroundColor: "#18181b",
    borderRadius: 30, // Daha yuvarlak
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)", // Daha ince kenarlık
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 30,
    overflow: "hidden",
    paddingBottom: 30,
  },
  glowEffect: {
    position: "absolute",
    top: -60,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "rgba(212, 175, 55, 0.1)", // Daha soft glow
    borderRadius: 100,
    transform: [{ scaleX: 1.5 }],
  },
  iconWrapper: {
    marginTop: 30,
    marginBottom: 20,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircleOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.6)",
  },
  iconCircleInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#D4AF37", // Gold
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  premiumTitle: {
    fontSize: rf(22),
    fontFamily: FONTS.bold, // OUTFIT FONT
    color: "#FFF",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 5,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  premiumBody: {
    fontSize: rf(15),
    fontFamily: FONTS.medium, // OUTFIT FONT
    color: "#e4e4e7",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
    paddingHorizontal: 20,
    opacity: 0.9,
  },
  premiumButton: {
    backgroundColor: "#D4AF37",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 100,
    marginTop: 10,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  premiumButtonText: {
    color: "#000",
    fontSize: rf(14),
    fontFamily: FONTS.extraBold, // OUTFIT FONT
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
  },
});
