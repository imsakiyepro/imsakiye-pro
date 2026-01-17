import React, {
    useState,
    useRef,
    useContext,
    useEffect,
    useCallback,
} from "react"; // 👈 useCallback eklendi
import {
    View,
    Text,
    StyleSheet,
    Switch,
    ScrollView,
    TouchableOpacity,
    Alert,
    Share,
    ImageBackground,
    Modal,
    Animated,
    Easing,
    TouchableWithoutFeedback,
    Pressable,
    Platform,
    Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // 👈 useFocusEffect eklendi
import * as Application from "expo-application";
import { checkIsAdmin, getDeviceId } from "../src/services/userService";
// FIREBASE IMPORTLARI
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../src/services/firebaseConfig";

// PROJE İÇİ IMPORTLAR
import { Permissions } from "../src/context/Permissions";
import { PermissionManager } from "../src/utils/PermissionManager";
import CitySelectorModal from "../components/CitySelectorModal";
import { COLORS } from "../src/constants/theme";

// --- GİZLİ CREDITS MODAL ---
const CreditsModal = ({
    visible,
    onClose,
}: {
    visible: boolean;
    onClose: () => void;
}) => {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.back(1.5)),
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.8);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.creditsContainer,
                                { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
                            ]}
                        >
                            <View style={styles.modalIconBox}>
                                <Ionicons name="code-slash" size={32} color={COLORS.primary} />
                            </View>
                            <Text style={styles.creditLabel}>Yazılım Geliştirici</Text>
                            <Text style={styles.creditName}>Tunahan KIZILBOĞA</Text>
                            <View style={styles.creditDivider} />
                            <Text style={styles.creditLabel}>Powered by</Text>
                            <Text style={styles.creditCompany}>AKDEM YAZILIM</Text>
                            <Text style={styles.creditVersion}>v1.0.0 (Build 2026)</Text>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

// --- AYAR SATIRI BİLEŞENİ ---
interface SettingRowProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    isSwitch?: boolean;
    subtitle?: string | null;
    onPress?: () => void;
    disabled?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
    icon,
    title,
    value = false,
    onValueChange,
    isSwitch = false,
    subtitle = null,
    onPress,
    disabled = false,
}) => {
    const rowStyle = [styles.row, disabled && { opacity: 0.5 }];

    if (isSwitch) {
        return (
            <View style={rowStyle}>
                <Pressable
                    style={styles.rowLeft}
                    onPress={() => !disabled && onValueChange && onValueChange(!value)}
                    android_ripple={{ color: "rgba(255,255,255,0.1)" }}
                    disabled={disabled}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name={icon} size={20} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{title}</Text>
                        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
                    </View>
                </Pressable>
                <Switch
                    trackColor={{ false: "#334155", true: "rgba(212, 175, 55, 0.5)" }}
                    thumbColor={value ? COLORS.primary : "#f4f3f4"}
                    ios_backgroundColor="#334155"
                    onValueChange={onValueChange}
                    value={value}
                    disabled={disabled}
                    style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                />
            </View>
        );
    }

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={disabled ? undefined : onPress}
            style={rowStyle}
        >
            <View style={styles.rowLeft}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{title}</Text>
                    {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <Ionicons
                name={disabled ? "lock-closed-outline" : "chevron-forward"}
                size={20}
                color={COLORS.textSecondary}
            />
        </TouchableOpacity>
    );
};

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const context = useContext<any>(Permissions);
    const navigation = useNavigation<any>();

    const [isAdmin, setIsAdmin] = useState(false);
    const [tapCount, setTapCount] = useState(0);
    const tapTimer = useRef<NodeJS.Timeout | null>(null);
    const [showCredits, setShowCredits] = useState(false);
    const [useGPS, setUseGPS] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // --- 🔥 DEĞİŞİKLİK BURADA: useFocusEffect KULLANILDI ---
    // Sayfaya her odaklanıldığında (geri gelindiğinde) admin yetkisini ve GPS'i kontrol eder.
    useFocusEffect(
        useCallback(() => {
            // 1. Admin Kontrolü
            checkIsAdmin().then((status) => setIsAdmin(status));

            // 2. GPS Ayarı Kontrolü
            AsyncStorage.getItem("settings_gps").then((savedGPS) => {
                setUseGPS(savedGPS === "true");
            });
        }, [])
    );

    if (!context) return null;
    const {
        settings,
        toggleSetting,
        locationName,
        setManualLocation,
        refreshData,
    } = context;

    const handleResetApp = async () => {
        Alert.alert(
            "Hesabı ve Verileri Sil",
            "Bu işlem geri alınamaz. Firebase üzerindeki konum verileriniz ve yerel ayarlarınız kalıcı olarak silinecektir.",
            [
                { text: "Vazgeç", style: "cancel" },
                {
                    text: "SİL VE SIFIRLA",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            console.log("Silme işlemi başlatılıyor...");
                            let rawId: string | null = null;
                            if (Platform.OS === "android") rawId = Application.getAndroidId();
                            else rawId = await Application.getIosIdForVendorAsync();

                            if (rawId) {
                                const targetId = String(rawId).replace(/[^a-zA-Z0-9]/g, "_");
                                console.log("Hedef ID (Silinecek):", targetId);
                                const userDocRef = doc(db, "users", targetId);
                                await deleteDoc(userDocRef);
                                console.log("✅ Firebase'den silindi.");
                            }
                            await new Promise((resolve) => setTimeout(resolve, 500));
                        } catch (error) {
                            console.log("Firebase silme hatası:", error);
                            Alert.alert(
                                "Hata",
                                "Sunucudan silinemedi, ancak yerel veriler temizlenecek."
                            );
                        }

                        try {
                            console.log("Yerel veri temizleniyor...");
                            const keys = await AsyncStorage.getAllKeys();
                            if (keys.length > 0) await AsyncStorage.multiRemove(keys);
                            console.log(
                                "✅ Yerel veri temizlendi, uygulama yeniden başlatılıyor."
                            );
                            await Updates.reloadAsync();
                        } catch (e) {
                            console.log("Yerel silme hatası (Önemsiz):", e);
                            await Updates.reloadAsync();
                        }
                    },
                },
            ]
        );
    };

    const handleGPSToggle = async (value: boolean) => {
        if (value) {
            const permitted = await PermissionManager.askLocation();
            if (permitted) {
                await AsyncStorage.setItem("settings_gps", "true");
                setUseGPS(true);
                refreshData();
            }
        } else {
            await AsyncStorage.setItem("settings_gps", "false");
            setUseGPS(false);
            setModalVisible(true);
        }
    };

    const handleCitySelect = async (selection: {
        country: string;
        city: string;
    }) => {
        const success = await setManualLocation(selection.country, selection.city);
        if (success) setUseGPS(false);
    };

    const handleManualCityPress = () => {
        if (useGPS) {
            Alert.alert(
                "GPS Açık",
                "Manuel şehir seçimi yapabilmek için önce 'Otomatik Konum (GPS)' seçeneğini kapatmalısınız.",
                [{ text: "Tamam", style: "default" }]
            );
        } else {
            setModalVisible(true);
        }
    };

    const handleFooterTap = () => {
        const newCount = tapCount + 1;
        setTapCount(newCount);
        if (tapTimer.current) clearTimeout(tapTimer.current);
        tapTimer.current = setTimeout(() => {
            setTapCount(0);
        }, 1500);
        if (newCount === 7) {
            setTapCount(0);
            setShowCredits(true);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.overlay}>
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <Text style={styles.headerTitle}>Ayarlar</Text>
                    <Text style={{ color: "#FFF", fontSize: 12, marginTop: 4 }}>
                        ID: {getDeviceId()}
                    </Text>
                </View>
                <ScrollView
                    contentContainerStyle={{
                        paddingBottom: 120,
                        paddingHorizontal: 20,
                    }}
                >
                    <Text style={styles.sectionHeader}>KONUM</Text>
                    <View style={styles.card}>
                        <SettingRow
                            icon="location"
                            title="Otomatik Konum (GPS)"
                            subtitle={useGPS ? `Aktif: ${locationName}` : "Kapalı"}
                            isSwitch
                            value={useGPS}
                            onValueChange={handleGPSToggle}
                        />
                        <View style={styles.separator} />
                        <SettingRow
                            icon="map"
                            title="Şehir Değiştir"
                            subtitle={useGPS ? "GPS Aktifken devre dışı" : locationName}
                            onPress={handleManualCityPress}
                            disabled={useGPS}
                        />
                    </View>

                    <Text style={styles.sectionHeader}>BİLDİRİMLER</Text>
                    <View style={styles.card}>
                        <SettingRow
                            icon="moon"
                            title="İftar Vakti"
                            isSwitch
                            value={settings?.iftar}
                            onValueChange={() => toggleSetting("iftar")}
                        />
                        <View style={styles.separator} />
                        <SettingRow
                            icon="sunny"
                            title="Sahur Vakti"
                            isSwitch
                            value={settings?.sahur}
                            onValueChange={() => toggleSetting("sahur")}
                        />
                        <View style={styles.separator} />
                        <SettingRow
                            icon="musical-note"
                            title="Ezan Sesi"
                            isSwitch
                            value={settings?.ezan}
                            onValueChange={() => toggleSetting("ezan")}
                        />
                    </View>

                    <Text style={styles.sectionHeader}>UYGULAMA</Text>
                    <View style={styles.card}>
                        <SettingRow
                            icon="share-social"
                            title="Arkadaşlarınla Paylaş"
                            onPress={() =>
                                Share.share({
                                    message: "İmsakiye Pro'yu indir! En doğru vakitler cebinde.",
                                })
                            }
                        />

                        {/* GİZLİ ADMIN BUTONU (Sadece Adminler Görür) */}
                        {isAdmin && (
                            <>
                                <View style={styles.separator} />
                                <SettingRow
                                    icon="shield-checkmark"
                                    title="Admin Paneli"
                                    subtitle="Yetkili Girişi"
                                    onPress={() => navigation.navigate("AdminPanel")}
                                />
                            </>
                        )}

                        <View style={styles.separator} />
                        <SettingRow
                            icon="trash-outline"
                            title="Hesabı Sil / Sıfırla"
                            subtitle="Verileri temizle"
                            onPress={handleResetApp}
                        />
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleFooterTap}
                        style={styles.footer}
                    >
                        <Ionicons
                            name="laptop-outline"
                            size={14}
                            color={COLORS.textSecondary}
                            style={{ marginBottom: 4 }}
                        />
                        <Text style={styles.footerText}>
                            © 2026 Akdem Yazılım. All rights reserved.
                        </Text>
                        <Text
                            style={[
                                styles.footerText,
                                { fontSize: 10, marginTop: 2, fontStyle: "italic" },
                            ]}
                        >
                            Made in Turkiye 🇹🇷
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <CitySelectorModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSelect={handleCitySelect}
            />
            <CreditsModal
                visible={showCredits}
                onClose={() => setShowCredits(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    bgImage: { width: "100%", height: "100%" },
    overlay: { flex: 1, backgroundColor: "rgba(5, 20, 10, 0.85)" },
    header: { paddingHorizontal: 20, paddingBottom: 20 },
    headerTitle: { fontSize: 34, fontWeight: "bold", color: COLORS.white },
    sectionHeader: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 8,
        marginTop: 20,
        marginLeft: 10,
    },
    card: {
        backgroundColor: COLORS.headerBg,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: COLORS.separator,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        minHeight: 56,
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        paddingRight: 10,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: "rgba(212, 175, 55, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    rowTitle: { color: COLORS.white, fontSize: 16, fontWeight: "500" },
    rowSubtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
    separator: { height: 1, backgroundColor: COLORS.separator, marginLeft: 60 },
    footer: { alignItems: "center", marginTop: 40, paddingVertical: 10 },
    footerText: { color: COLORS.textSecondary, fontSize: 12 },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "center",
        alignItems: "center",
    },
    creditsContainer: {
        width: "80%",
        backgroundColor: COLORS.headerBg,
        borderRadius: 20,
        padding: 30,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    modalIconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(212, 175, 55, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    creditLabel: {
        color: COLORS.textSecondary,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 2,
        marginBottom: 5,
    },
    creditName: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    creditCompany: {
        color: COLORS.primary,
        fontSize: 22,
        fontWeight: "900",
        textAlign: "center",
        letterSpacing: 1,
    },
    creditDivider: {
        width: 40,
        height: 2,
        backgroundColor: COLORS.separator,
        marginVertical: 15,
    },
    creditVersion: {
        marginTop: 20,
        color: COLORS.textSecondary,
        fontSize: 10,
        opacity: 0.6,
    },
});
