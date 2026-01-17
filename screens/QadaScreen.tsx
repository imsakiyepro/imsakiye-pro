import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
    Outfit_800ExtraBold,
} from "@expo-google-fonts/outfit";

const { width } = Dimensions.get("window");

const COLORS = {
    primary: "#D4AF37", // Gold
    secondary: "#10B981", // Green
    darkBg: "#05140A",
    cardBg: "rgba(255, 255, 255, 0.05)",
    text: "#E2E8F0",
    textDim: "#94A3B8",
};

const FONTS = {
    regular: "Outfit_400Regular",
    medium: "Outfit_500Medium",
    bold: "Outfit_700Bold",
    extraBold: "Outfit_800ExtraBold",
};

const PRAYER_types = [
    { id: "sabah", label: "Sabah", limit: 2 }, // 2 rekat farz (kaza için farzlar esas alınır)
    { id: "ogle", label: "Öğle", limit: 4 }, // 4 rekat farz
    { id: "ikindi", label: "İkindi", limit: 4 }, // 4 rekat farz
    { id: "aksam", label: "Akşam", limit: 3 }, // 3 rekat farz
    { id: "yatsi", label: "Yatsı", limit: 4 }, // 4 rekat farz
    { id: "vitir", label: "Vitir", limit: 3 }, // 3 rekat vacip
];

export default function QadaScreen({ navigation }: any) {
    const [qadaStats, setQadaStats] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const stored = await AsyncStorage.getItem("qada_stats");
            if (stored) {
                setQadaStats(JSON.parse(stored));
            } else {
                // Initialize with 0
                const initial: any = {};
                PRAYER_types.forEach((p) => (initial[p.id] = 0));
                setQadaStats(initial);
            }
        } catch (e) {
            console.log("Error loading qada stats", e);
        } finally {
            setLoading(false);
        }
    };

    const saveStats = async (newStats: any) => {
        try {
            setQadaStats(newStats);
            await AsyncStorage.setItem("qada_stats", JSON.stringify(newStats));
        } catch (e) {
            console.log("Error saving qada stats", e);
        }
    };

    const adjustCount = (id: string, delta: number) => {
        const current = qadaStats[id] || 0;
        const neWValue = Math.max(0, current + delta);
        saveStats({ ...qadaStats, [id]: neWValue });
    };

    const renderCounter = (item: any) => {
        const count = qadaStats[item.id] || 0;
        return (
            <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.prayerTitle}>{item.label}</Text>
                    <Text style={styles.rekatBadge}>{item.limit} Rekat</Text>
                </View>

                <View style={styles.counterContainer}>
                    <TouchableOpacity
                        style={[styles.btn, styles.btnMinus]}
                        onPress={() => adjustCount(item.id, -1)}
                    >
                        <Ionicons name="remove" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.countDisplay}>
                        <Text style={styles.countText}>{count}</Text>
                        <Text style={styles.countLabel}>KAZA</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, styles.btnPlus]}
                        onPress={() => adjustCount(item.id, 1)}
                    >
                        <Ionicons name="add" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={[COLORS.darkBg, "#0f172a"]}
                style={styles.background}
            />

            <SafeAreaView style={{ flex: 1 }}>
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Kaza Takibi</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.gridContainer}>
                        {PRAYER_types.map(renderCounter)}
                    </View>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
                        <Text style={styles.infoText}>
                            Kaza namazı borçlarınızı buradan takip edebilirsiniz. "Kaza" sayısı borçlu olduğunuz namaz sayısını gösterir. Kıldıkça düşürebilirsiniz.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.darkBg,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.1)",
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: FONTS.bold,
        color: "#FFF",
    },
    scrollContent: {
        padding: 20,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    prayerTitle: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
    },
    rekatBadge: {
        fontSize: 10,
        fontFamily: FONTS.medium,
        color: COLORS.textDim,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    btn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnMinus: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    btnPlus: {
        backgroundColor: COLORS.primary,
    },
    countDisplay: {
        alignItems: 'center',
    },
    countText: {
        fontSize: 24,
        fontFamily: FONTS.bold,
        color: "#FFF",
    },
    countLabel: {
        fontSize: 8,
        fontFamily: FONTS.medium,
        color: COLORS.textDim,
        marginTop: 2,
    },
    infoBox: {
        marginTop: 20,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        fontFamily: FONTS.regular,
        color: COLORS.text,
        lineHeight: 20,
    },
});
