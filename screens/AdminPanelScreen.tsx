import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CitySelectorModal from '../components/CitySelectorModal';
import { COLORS } from '../src/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from "@react-navigation/native";
import {
  promoteUserToAdmin,
  getDeviceId,
  sendGlobalNotification,
  checkIsAdmin,
} from "../src/services/userService";

import { wp, hp, rf } from "../src/utils/responsive";

// Renk Paleti (Premium Dark)
const THEME = {
  bg: "#020617", // Çok koyu lacivert/siyah
  cardBg: "#0f172a", // Slate 900
  cardBorder: "#1e293b", // Slate 800
  primary: "#6366f1", // Indigo 500
  gold: "#F59E0B", // Amber 500
  textMain: "#F8FAFC", // Slate 50
  textSec: "#94A3B8", // Slate 400
  danger: "#EF4444", // Red 500
  success: "#10B981", // Emerald 500
  loading: "#D4AF37",
};

const AdminPanelScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // --- STATE ---
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [myId, setMyId] = useState("Yükleniyor...");
  const [targetId, setTargetId] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [date, setDate] = useState(new Date());
  const [loadingPromote, setLoadingPromote] = useState(false);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [seconds, setSeconds] = useState("00");

  // 'modal' = Tam Ekran Kart, 'banner' = Sistem Bildirimi
  const [displayType, setDisplayType] = useState<"modal" | "banner">("modal");

  useEffect(() => {
    const init = async () => {
      try {
        const id = await getDeviceId();
        setMyId(id || "Bilinmiyor");

        // Admin kontrolü
        const isAdmin = await checkIsAdmin();
        if (!isAdmin) {
          Alert.alert(
            "Erişim Engellendi",
            "Bu alana sadece yetkili yöneticiler erişebilir.",
            [{ text: "Tamam", onPress: () => navigation.goBack() }]
          );
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        Alert.alert("Hata", "Kimlik doğrulama yapılamadı.");
        navigation.goBack();
      } finally {
        setCheckingAuth(false);
      }
    };

    init();
  }, []);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(myId);
    Alert.alert("Kopyalandı", "Cihaz ID panoya kopyalandı!");
  };

  const handlePromote = async (makeAdmin: boolean) => {
    if (!targetId.trim()) {
      Alert.alert("Eksik Bilgi", "Lütfen işlem yapılacak kullanıcının ID'sini girin.");
      return;
    }

    const actionText = makeAdmin ? "ADMIN YAPMAK" : "YETKİSİNİ ALMAK";
    const confirmText = makeAdmin
      ? "Bu kullanıcıya tam admin yetkisi verilecek. Onaylıyor musunuz?"
      : "Bu kullanıcının admin yetkisi kaldırılacak. Onaylıyor musunuz?";

    Alert.alert(
      "Yetki İşlemi",
      `${targetId} ID'li kullanıcıyı ${actionText} üzeresiniz.\n\n${confirmText}`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "ONAYLA",
          style: makeAdmin ? "default" : "destructive",
          onPress: async () => {
            setLoadingPromote(true);
            try {
              await promoteUserToAdmin(targetId, makeAdmin);
              Alert.alert(
                "İşlem Başarılı",
                `Kullanıcı yetkisi güncellendi.\n\nID: ${targetId}\nDurum: ${makeAdmin ? "ADMIN" : "STANDART KULLANICI"
                }`
              );
              setTargetId(""); // Input'u temizle
            } catch (error: any) {
              Alert.alert("Hata", error.message);
            } finally {
              setLoadingPromote(false);
            }
          },
        },
      ]
    );
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      Alert.alert("Eksik Bilgi", "Başlık ve içerik alanları boş olamaz.");
      return;
    }

    // Tarih + Saniye birleştirme
    const finalDate = new Date(date);
    const sec = parseInt(seconds) || 0;
    finalDate.setSeconds(sec);

    // Tarihi kullanıcıya göstermek için formatlayalım
    const dateStr = finalDate.toLocaleString("tr-TR");
    const typeLabel = displayType === "modal" ? "Tam Ekran KART" : "Sistem BANNER";

    Alert.alert(
      "Bildirim Planla",
      `Bu bildirim (${typeLabel}) \n📅 ${dateStr}\ntarihinden sonra kullanıcılara gönderilecek. Onaylıyor musunuz?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "PLANLA VE GÖNDER",
          style: "destructive",
          onPress: async () => {
            setLoadingNotif(true);
            Keyboard.dismiss();
            try {
              // displayType eklendi
              await sendGlobalNotification(notifTitle, notifBody, finalDate, displayType);

              Alert.alert(
                "Başarılı",
                "Bildirim sisteme başarıyla planlandı! 🚀"
              );
              setNotifTitle("");
              setNotifBody("");
              setDate(new Date()); // Tarihi sıfırla
              setSeconds("00");
            } catch (error: any) {
              Alert.alert("Hata", error.message);
            } finally {
              setLoadingNotif(false);
            }
          },
        },
      ]
    );
  };

  // --- RENDER HELPERS ---

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View>

        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Sistem Yönetim Paneli</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>v1.0</Text>
      </View>
    </View>
  );



  const renderMyIdCard = () => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Ionicons name="finger-print" size={20} color={THEME.gold} />
        <Text style={styles.cardLabel}>SİZİN CİHAZ ID (ADMIN)</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={copyToClipboard}
        style={styles.idContainer}
      >
        <Text style={styles.idText}>{myId}</Text>
        <View style={styles.copyBtn}>
          <Ionicons name="copy-outline" size={16} color="#000" />
          <Text style={styles.copyBtnText}>KOPYALA</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderUserManagement = () => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Ionicons name="shield-half" size={20} color={THEME.success} />
        <Text style={[styles.cardLabel, { color: THEME.success }]}>
          YETKİ YÖNETİMİ
        </Text>
      </View>

      <Text style={styles.inputLabel}>Hedef Kullanıcı ID:</Text>
      <View style={styles.inputBox}>
        <Ionicons name="qr-code-outline" size={20} color={THEME.textSec} />
        <TextInput
          style={styles.input}
          placeholder="Örn: E1E95452..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={targetId}
          onChangeText={setTargetId}
          autoCapitalize="none"
        />
        {targetId.length > 0 && (
          <TouchableOpacity onPress={() => setTargetId("")}>
            <Ionicons name="close-circle" size={18} color={THEME.textSec} />
          </TouchableOpacity>
        )}
      </View>

      {loadingPromote ? (
        <ActivityIndicator
          size="small"
          color={THEME.primary}
          style={{ marginTop: 15 }}
        />
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                borderColor: THEME.danger,
              },
            ]}
            onPress={() => handlePromote(false)}
          >
            <Ionicons name="person-remove" size={18} color={THEME.danger} />
            <Text style={[styles.actionBtnText, { color: THEME.danger }]}>
              YETKİ AL
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                borderColor: THEME.success,
              },
            ]}
            onPress={() => handlePromote(true)}
          >
            <Ionicons name="shield-checkmark" size={18} color={THEME.success} />
            <Text style={[styles.actionBtnText, { color: THEME.success }]}>
              ADMIN YAP
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderNotificationCenter = () => (
    <View style={[styles.card, { borderColor: THEME.primary, borderWidth: 1 }]}>
      <View style={styles.cardTopRow}>
        <Ionicons name="notifications" size={20} color={THEME.primary} />
        <Text style={[styles.cardLabel, { color: THEME.primary }]}>
          DUYURU MERKEZİ
        </Text>
      </View>

      {/* TÜR SEÇİCİ */}
      <View style={{ flexDirection: "row", marginBottom: hp(2), backgroundColor: "#020617", borderRadius: 12, padding: 4, borderWidth: 1, borderColor: THEME.cardBorder }}>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: displayType === "modal" ? THEME.primary : "transparent" }}
          onPress={() => setDisplayType("modal")}
        >
          <Text style={{ color: displayType === "modal" ? "#FFF" : THEME.textSec, fontWeight: "bold", fontSize: rf(12) }}>Kart (Modal)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: displayType === "banner" ? THEME.primary : "transparent" }}
          onPress={() => setDisplayType("banner")}
        >
          <Text style={{ color: displayType === "banner" ? "#FFF" : THEME.textSec, fontWeight: "bold", fontSize: rf(12) }}>Sistem (Banner)</Text>
        </TouchableOpacity>
      </View>

      {/* DATA & TIME SEÇİCİ */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: hp(2) }}>
        <TouchableOpacity
          style={[styles.inputBox, { flex: 0.4, marginBottom: 0, justifyContent: "center" }]}
          onPress={() => {
            setShowDatePicker(!showDatePicker);
            setShowTimePicker(false);
          }}
        >
          <Ionicons name="calendar-outline" size={20} color={THEME.textSec} style={{ marginRight: 8 }} />
          <Text style={{ color: "#FFF", fontSize: rf(13) }}>
            {date.toLocaleDateString("tr-TR")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.inputBox, { flex: 0.35, marginBottom: 0, justifyContent: "center" }]}
          onPress={() => {
            setShowTimePicker(!showTimePicker);
            setShowDatePicker(false);
          }}
        >
          <Ionicons name="time-outline" size={20} color={THEME.textSec} style={{ marginRight: 8 }} />
          <Text style={{ color: "#FFF", fontSize: rf(13) }}>
            {date.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        <View style={[styles.inputBox, { flex: 0.2, marginBottom: 0, justifyContent: "center", paddingHorizontal: 5 }]}>
          <Text style={{ color: THEME.textSec, fontSize: rf(12), marginRight: 4 }}>sn:</Text>
          <TextInput
            style={{ color: "#FFF", fontSize: rf(13), minWidth: 20, textAlign: "center" }}
            value={seconds}
            onChangeText={(text) => setSeconds(text.replace(/[^0-9]/g, '').slice(0, 2))}
            keyboardType="number-pad"
            placeholder="00"
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
        </View>
      </View>

      <Text style={styles.inputLabel}>Bildirim Başlığı:</Text>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          placeholder="Örn: Hayırlı Kandiller"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={notifTitle}
          onChangeText={setNotifTitle}
        />
      </View>

      <Text style={styles.inputLabel}>Bildirim İçeriği:</Text>
      <View
        style={[
          styles.inputBox,
          { height: 100, alignItems: "flex-start", paddingTop: 10 },
        ]}
      >
        <TextInput
          style={[styles.input, { height: "100%", textAlignVertical: "top" }]}
          placeholder="Mesajınızı buraya yazın..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={notifBody}
          onChangeText={setNotifBody}
          multiline
        />
      </View>

      <View style={styles.infoBox}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={THEME.textSec}
        />
        <Text style={styles.infoText}>
          {displayType === "modal"
            ? "Kullanıcılar ekranda tam boy kart görür."
            : "Kullanıcılar sadece üstten bildirim alır."}
        </Text>
      </View>

      {loadingNotif ? (
        <ActivityIndicator
          size="small"
          color={THEME.primary}
          style={{ marginTop: 15 }}
        />
      ) : (
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSendNotification}
        >
          <Text style={styles.sendBtnText}>BİLDİRİMİ YAYINLA</Text>
          <Ionicons
            name="paper-plane"
            size={18}
            color="#FFF"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  // --- MAIN RENDER ---
  return (
    <View style={{ flex: 1, backgroundColor: THEME.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderHeader()}
          {renderMyIdCard()}
          {renderUserManagement()}
          {renderNotificationCenter()}

          {/* DATE PICKERS */}
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event: any, selectedDate?: Date) => {
                // iOS'te anında kapanmasın, Android'de kapansın
                if (Platform.OS === 'android') {
                  setShowDatePicker(false);
                }
                if (selectedDate) {
                  const newDate = new Date(date);
                  newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                  setDate(newDate);
                }
              }}
              style={Platform.OS === "ios" ? { marginBottom: 10, alignSelf: "center" } : undefined}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display="spinner" // Spinner iOS için daha kullanışlı olabilir modal gibi duruyorsa
              onChange={(event: any, selectedDate?: Date) => {
                // iOS'te anında kapanmasın, Android'de kapansın
                if (Platform.OS === 'android') {
                  setShowTimePicker(false);
                }
                if (selectedDate) {
                  const newDate = new Date(date);
                  newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                  setDate(newDate);
                }
              }}
              textColor="#FFF"
              style={Platform.OS === "ios" ? { marginBottom: 10, alignSelf: "center" } : undefined}
            />
          )}

          <Text style={styles.footerText}>Secure Admin System • v1.0.2</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(6),
  },
  // Header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: hp(3),
  },
  headerTitle: {
    fontSize: rf(28),
    fontWeight: "800",
    color: THEME.textMain,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: rf(14),
    color: THEME.textSec,
    marginTop: hp(0.5),
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: 8,
  },
  badgeText: {
    color: THEME.textSec,
    fontSize: rf(12),
    fontWeight: "bold",
  },
  // Card Common
  card: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: wp(5),
    marginBottom: hp(2.5),
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    // Hafif gölge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(2),
  },
  cardLabel: {
    fontSize: rf(12),
    fontWeight: "700",
    color: THEME.gold,
    marginLeft: wp(2),
    letterSpacing: 1,
  },
  // My ID Section
  idContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: wp(3),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  idText: {
    color: "#FFF",
    fontSize: rf(15),
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontWeight: "600",
    flex: 1,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.gold,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.8),
    borderRadius: 8,
  },
  copyBtnText: {
    fontSize: rf(10),
    fontWeight: "bold",
    color: "#000",
    marginLeft: 4,
  },
  // Inputs
  inputLabel: {
    color: THEME.textSec,
    fontSize: rf(12),
    marginBottom: hp(1),
    marginLeft: 4,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    borderRadius: 12,
    paddingHorizontal: wp(3),
    height: hp(6),
    marginBottom: hp(2),
  },
  input: {
    flex: 1,
    color: "#FFF",
    marginLeft: 10,
    fontSize: rf(14),
  },
  // Buttons
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp(0.6),
  },
  actionBtn: {
    flex: 0.48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1.5),
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: rf(12),
    fontWeight: "bold",
    marginLeft: 6,
  },
  sendBtn: {
    flexDirection: "row",
    backgroundColor: THEME.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(1.8),
    borderRadius: 12,
    marginTop: hp(1.2),
    shadowColor: THEME.primary,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  sendBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: rf(14),
    letterSpacing: 0.5,
  },
  // Misc
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1.8),
    opacity: 0.7,
  },
  infoText: {
    color: THEME.textSec,
    fontSize: rf(11),
    marginLeft: 6,
  },
  footerText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.1)",
    fontSize: rf(11),
    marginTop: hp(1.2),
  },
});

export default AdminPanelScreen;
