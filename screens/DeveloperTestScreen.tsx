import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
} from "react-native";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";

// --- FIREBASE IMPORTLARI (Adminlik İçin) ---
import { doc, setDoc } from "firebase/firestore";
import { db } from "../src/services/firebaseConfig"; // ⚠️ Yolunu kontrol et!
import * as Application from "expo-application";
import { useNavigation } from "@react-navigation/native";
import { checkIsAdmin } from "../src/services/userService";

// HANDLER
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const DeveloperTestScreen = () => {
    const navigation = useNavigation<any>();
    const [permStatus, setPermStatus] = useState("Bildirim İzni Kontrol Ediliyor...");
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState("Yönetici Yetkisi Doğrulanıyor...");

    const checkPermissions = async () => {
        try {
            const { status } = await Notifications.getPermissionsAsync();
            setPermStatus(status === "granted" ? "✅ BİLDİRİM İZNİ VAR" : "❌ İZİN YOK");
        } catch (e) {
            setPermStatus("⚠️ İZİN KONTROL HATASI");
        }
    };

    const requestPermissionsAgain = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        setPermStatus(status === "granted" ? "✅ BİLDİRİM İZNİ VAR" : "❌ REDDEDİLDİ");
    };

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                // 1. Admin Kontrolü (5 sn zaman aşımı)
                const adminCheckPromise = checkIsAdmin();
                const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 5000));

                const isAdmin = await Promise.race([adminCheckPromise, timeoutPromise]);

                if (!isMounted) return;

                // Zaman aşımı veya false durumu
                if (isAdmin === null) {
                    console.log("Admin check timed out - allowing access for debugging or showing error");
                    // Opsiyonel: Timeout olunca ne yapalım?
                    // Şimdilik admin değilmiş gibi davranalım ama mesaj verelim
                    Alert.alert("Zaman Aşımı", "Admin kontrolü çok uzun sürdü. Bağlantınızı kontrol edin.");
                    navigation.goBack();
                    return;
                }

                if (!isAdmin) {
                    Alert.alert("Erişim Engellendi", "Bu menüye sadece yöneticiler erişebilir.", [
                        { text: "Tamam", onPress: () => navigation.goBack() },
                    ]);
                    return;
                }

                // 2. Admin ise içeriği göster
                setLoading(false);
                checkPermissions();

            } catch (e) {
                console.error(e);
                Alert.alert("Hata", "Bir sorun oluştu.");
                navigation.goBack();
            }
        };

        init();

        return () => { isMounted = false; };
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#D4AF37" />
                <Text style={{ color: "#FFF", marginTop: 20 }}>{statusMessage}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, padding: 10 }}>
                    <Text style={{ color: "#EF4444" }}>İptal / Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }



    // --- 🔥 YENİ: OTOMATİK ADMİN OLMA FONKSİYONU ---
    const forceMakeMeAdmin = async () => {
        try {
            Alert.alert("İşlem Başladı", "Cihaz ID alınıyor ve yetki veriliyor...");

            let uniqueId: string | null = null;
            if (Platform.OS === "android") {
                uniqueId = Application.getAndroidId();
            } else {
                uniqueId = await Application.getIosIdForVendorAsync();
            }

            if (!uniqueId) {
                Alert.alert("Hata", "Cihaz ID alınamadı.");
                return;
            }

            // ID Temizliği (userService ile aynı mantık)
            const safeId = String(uniqueId).replace(/[^a-zA-Z0-9]/g, "_");

            // Firebase'e "admin" olarak yaz (Merge: true ile diğer verileri silmez)
            const userRef = doc(db, "users", safeId);
            await setDoc(userRef, { role: "admin" }, { merge: true });

            Alert.alert(
                "🎉 TEBRİKLER!",
                "Artık ADMIN yetkisine sahipsin.\n\nAyarlar sayfasına gidip 'Admin Paneli'ni görmek için uygulamayı bir kez kapatıp açman gerekebilir."
            );
        } catch (error: any) {
            Alert.alert("Hata", "Admin yetkisi verilemedi: " + error.message);
        }
    };

    // --- BİLDİRİM FONKSİYONLARI ---
    const sendTestNotification = async (
        title: string,
        body: string,
        categoryId?: string
    ) => {
        try {
            if (Platform.OS === "android") {
                await Notifications.setNotificationChannelAsync("default", {
                    name: "Namaz Vakitleri",
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: "#FF231F7C",
                });
            }
            const notificationContent: Notifications.NotificationContentInput = {
                title: title,
                body: body,
                sound: true,
                vibrate: [0, 500, 200, 500],
                data: { test: true },
            };
            if (categoryId) notificationContent.categoryIdentifier = categoryId;

            await Notifications.scheduleNotificationAsync({
                content: notificationContent,
                trigger: null,
            });
        } catch (error) {
            Alert.alert("Hata", String(error));
        }
    };

    const simSahur = () =>
        sendTestNotification(
            "🌙 Sahur Vakti",
            "Bereket saati yaklaşıyor (04:15). Su içmeyi unutma."
        );
    const simIftarPrep = () =>
        sendTestNotification(
            "🍞 İftara Doğru",
            "Son 45 dakika. Sofralar kuruluyor, dualar kabul oluyor."
        );
    const simIftarTime = () =>
        sendTestNotification(
            "🤲 İftar Sevinci",
            "Oruçunu açma vakti (20:30). Allah kabul etsin.",
            "PRAYER_ACTION"
        );
    const simNormalEzan = () =>
        sendTestNotification(
            "🕌 Öğle Vakti",
            "13:12 - Günün ortasında bir huzur molası ver."
        );
    const simNormalSabah = () =>
        sendTestNotification("🛑 Niyet Vakti", "Sabahın nuru doğuyor (05:12). Yeni güne Bismillah.");
    const clearAll = async () => {
        await Notifications.dismissAllNotificationsAsync();
        await Notifications.cancelAllScheduledNotificationsAsync();
        Alert.alert("Temizlendi", "Tüm bildirimler silindi.");
    };

    const TestButton = ({ title, sub, icon, onPress, color, badge }: any) => (
        <TouchableOpacity
            style={[styles.btn, { borderColor: color + "40" }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconBox, { backgroundColor: color + "20" }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.btnTitle}>{title}</Text>
                    {badge && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{badge}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.btnSub}>{sub}</Text>
            </View>
            <Ionicons name="play" size={20} color={color} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* 🔥 ADMIN OLMA BUTONU (EN ÜSTTE) */}
                <TouchableOpacity
                    style={[
                        styles.btn,
                        { backgroundColor: "#D4AF37", borderColor: "#FFF" },
                    ]}
                    onPress={forceMakeMeAdmin}
                >
                    <View
                        style={[styles.iconBox, { backgroundColor: "rgba(0,0,0,0.2)" }]}
                    >
                        <Ionicons name="shield-checkmark" size={24} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={[styles.btnTitle, { color: "#000", fontWeight: "bold" }]}
                        >
                            BENİ ADMİN YAP
                        </Text>
                        <Text style={[styles.btnSub, { color: "#333" }]}>
                            Bu cihaza kalıcı yetki ver
                        </Text>
                    </View>
                </TouchableOpacity>

                <View
                    style={[
                        styles.infoBox,
                        { borderColor: permStatus.includes("VAR") ? "#10B981" : "#EF4444" },
                    ]}
                >
                    <Ionicons
                        name={
                            permStatus.includes("VAR") ? "checkmark-circle" : "alert-circle"
                        }
                        size={24}
                        color={permStatus.includes("VAR") ? "#10B981" : "#EF4444"}
                    />
                    <Text
                        style={[
                            styles.infoText,
                            { color: permStatus.includes("VAR") ? "#10B981" : "#EF4444" },
                        ]}
                    >
                        Durum: {permStatus}
                    </Text>
                    {!permStatus.includes("VAR") && (
                        <TouchableOpacity
                            onPress={requestPermissionsAgain}
                            style={{
                                backgroundColor: "#EF4444",
                                padding: 5,
                                borderRadius: 5,
                            }}
                        >
                            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>
                                İZİN İSTE
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.sectionTitle}>🌙 RAMAZAN MODU</Text>
                <TestButton
                    title="Sahur Vakti"
                    sub="Hemen tetiklenir"
                    icon="alarm"
                    color="#10B981"
                    onPress={simSahur}
                    badge="DAVUL"
                />
                <TestButton
                    title="İftar Hazırlık"
                    sub="60 dk kala uyarısı"
                    icon="hourglass"
                    color="#3B82F6"
                    onPress={simIftarPrep}
                />
                <TestButton
                    title="İftar Vakti"
                    sub="Duayı Oku butonu ile"
                    icon="restaurant"
                    color="#F59E0B"
                    onPress={simIftarTime}
                    badge="BUTONLU"
                />


                <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
                    🕌 NORMAL GÜN
                </Text>
                <TestButton
                    title="Namaz Tik Testi"
                    sub="Yatsı için prompt açar"
                    icon="checkmark-circle-outline"
                    color="#10B981"

                    badge="YENİ"
                />
                <TestButton
                    title="Standart Ezan"
                    sub="Klasik bildirim"
                    icon="notifications"
                    color="#8B5CF6"
                    onPress={simNormalEzan}
                />
                <TestButton
                    title="İmsak"
                    sub="Sabah namazı"
                    icon="sunny"
                    color="#EC4899"
                    onPress={simNormalSabah}
                />

                <Text style={[styles.sectionTitle, { marginTop: 30 }]}>🛠 ARAÇLAR</Text>
                <TestButton
                    title="Temizle"
                    sub="Tüm bildirimleri sil"
                    icon="trash"
                    color="#EF4444"
                    onPress={clearAll}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0f172a" },
    content: { padding: 20, paddingBottom: 50 },
    sectionTitle: {
        color: "#94a3b8",
        fontSize: 13,
        fontWeight: "bold",
        marginBottom: 10,
        letterSpacing: 1,
    },
    btn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1e293b",
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    btnTitle: { color: "#FFF", fontSize: 16, fontWeight: "600" },
    btnSub: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
    badge: {
        backgroundColor: "#F59E0B",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    badgeText: { color: "#000", fontSize: 9, fontWeight: "bold" },
    infoBox: {
        backgroundColor: "#1e293b",
        padding: 15,
        borderRadius: 12,
        marginBottom: 25,
        borderWidth: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    infoText: { fontSize: 14, marginLeft: 10, flex: 1, fontWeight: "bold" },
});

export default DeveloperTestScreen;
