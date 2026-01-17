import React, { useState, useRef, useContext } from "react"; // useContext eklendi
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Animated,
    Dimensions,
    TouchableOpacity,
    ImageBackground,
    StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// 👇 BU SATIRI EKLE (Permissions Context'i import et)
import { Permissions } from "../src/context/Permissions";

const { width, height } = Dimensions.get("window");

const COLORS = {
    primary: "#D4AF37",
    white: "#FFFFFF",
    textGrey: "#A0A0A0",
    bg: "#000000",
};

// --- SLIDE VERİLERİ ---
const SLIDES = [
    {
        id: "1",
        title: "Huzurlu Bir İbadet",
        description:
            "En doğru namaz vakitleri, sade ve premium bir arayüzle cebinizde.",
        icon: "moon",
    },
    {
        id: "2",
        title: "Hassas Konum",
        description:
            "Vakitlerin tam doğruluğu ve Kıble pusulası için konum iznine ihtiyacımız var.",
        icon: "location",
    },
    {
        id: "3",
        title: "Vaktinde Hatırlatma",
        description:
            "Ezan ve İftar vakitlerini kaçırmamanız için bildirimleri açmanızı öneririz.",
        icon: "notifications",
    },
    {
        id: "4",
        title: "Premium Araçlar",
        description:
            "Kıble Bulucu, Zikirmatik ve İmsakiye Takvimi ile tam donanımlı asistanınız.",
        icon: "apps",
    },
];

// --- SAYFA GÖSTERGESİ (DOTS) ---
const Paginator = ({ data, scrollX }: any) => {
    return (
        <View style={styles.paginatorContainer}>
            {data.map((_: any, i: number) => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [10, 20, 10],
                    extrapolate: "clamp",
                });

                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: "clamp",
                });

                return (
                    <Animated.View
                        key={i.toString()}
                        style={[styles.dot, { width: dotWidth, opacity }]}
                    />
                );
            })}
        </View>
    );
};

export default function OnboardingScreen() {
    const navigation = useNavigation<any>();
    // 👇 CONTEXT'İ ÇAĞIR
    const context = useContext(Permissions);

    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);

    // --- KAYDIRMA MANTIĞI ---
    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    // --- BİTİRME FONKSİYONU (GÜNCELLENDİ) ---
    const handleFinish = async () => {
        try {
            // 1. Önce izinleri sor (Sırayla Konum -> Bildirim çıkacak)
            if (context) {
                await context.requestInitialPermissions();
            }

            // 2. Kullanıcı onboarding'i gördü olarak işaretle
            await AsyncStorage.setItem("@onboarding_completed", "true");

            // 3. Ana uygulamaya geç (Stack'i sıfırlayarak geri gelmeyi engelle)
            navigation.reset({
                index: 0,
                routes: [{ name: "TabNavigator" }],
            });
        } catch (err) {
            console.log(err);
        }
    };

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            handleFinish();
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ImageBackground
                source={require("../assets/mosque-bg.png")}
                style={styles.bgImage}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.95)"]}
                    style={styles.gradientOverlay}
                />

                {/* --- LİSTE --- */}
                <View style={{ flex: 3 }}>
                    <FlatList
                        ref={slidesRef}
                        data={SLIDES}
                        renderItem={({ item }) => (
                            <View style={styles.slide}>
                                <View style={styles.iconContainer}>
                                    <LinearGradient
                                        colors={[
                                            "rgba(212, 175, 55, 0.1)",
                                            "rgba(212, 175, 55, 0.05)",
                                        ]}
                                        style={styles.iconCircle}
                                    >
                                        <Ionicons
                                            name={item.icon as any}
                                            size={80}
                                            color={COLORS.primary}
                                        />
                                    </LinearGradient>
                                </View>
                                <Text style={styles.title}>{item.title}</Text>
                                <Text style={styles.description}>{item.description}</Text>
                            </View>
                        )}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        pagingEnabled
                        bounces={false}
                        keyExtractor={(item) => item.id}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                            { useNativeDriver: false }
                        )}
                        onViewableItemsChanged={viewableItemsChanged}
                        viewabilityConfig={viewConfig}
                    />
                </View>

                {/* --- ALT KISIM --- */}
                <View style={styles.footer}>
                    <Paginator data={SLIDES} scrollX={scrollX} />

                    <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
                        <LinearGradient
                            colors={[COLORS.primary, "#B38728"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.button}
                        >
                            <Text style={styles.buttonText}>
                                {currentIndex === SLIDES.length - 1 ? "BAŞLAYALIM" : "İLERLE"}
                            </Text>
                            {currentIndex !== SLIDES.length - 1 && (
                                <Ionicons
                                    name="arrow-forward"
                                    size={20}
                                    color="#000"
                                    style={{ marginLeft: 10 }}
                                />
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    bgImage: { flex: 1, width: "100%", height: "100%" },
    gradientOverlay: { ...StyleSheet.absoluteFillObject },

    slide: {
        width: width,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
    },
    iconContainer: {
        marginBottom: 40,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    iconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(212, 175, 55, 0.3)",
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: COLORS.white,
        textAlign: "center",
        marginBottom: 15,
        letterSpacing: 1,
    },
    description: {
        fontSize: 16,
        color: COLORS.textGrey,
        textAlign: "center",
        lineHeight: 24,
        paddingHorizontal: 10,
    },

    footer: {
        flex: 1,
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 50,
    },
    paginatorContainer: {
        flexDirection: "row",
        height: 64,
        justifyContent: "center",
        alignItems: "center",
    },
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginHorizontal: 8,
    },
    button: {
        flexDirection: "row",
        height: 60,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonText: {
        color: "#000",
        fontSize: 16,
        fontWeight: "bold",
        letterSpacing: 1,
    },
});
