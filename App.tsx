import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import * as Font from "expo-font";
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from "@expo-google-fonts/outfit";

import { NavigationContainer } from "@react-navigation/native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

import { PermissionsProvider } from "./src/context/Permissions";
import HomeScreen from "./screens/HomeScreen";
import CalendarScreen from "./screens/CalendarScreen";
import SettingsScreen from "./screens/SettingsScreen";
import KibleScreen from "./screens/KibleScreen";
import ZikirmatikScreen from "./screens/ZikirmatikScreen";
import OnboardingScreen from "./screens/OnBoardingScreen";
import DeveloperTestScreen from "./screens/DeveloperTestScreen";
// 👇 EKLENDİ: Admin Panelini import et
// 👇 EKLENDİ: Admin Panelini import et
import AdminPanelScreen from "./screens/AdminPanelScreen";
import QadaScreen from "./screens/QadaScreen"; // New Import
import PrivacyPolicyScreen from "./screens/PrivacyPolicyScreen";
import TermsOfServiceScreen from "./screens/TermsOfServiceScreen";
import { registerBackgroundTask } from "./src/services/backgroundTask";

const { width } = Dimensions.get("window");

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

const COLORS = {
  goldStart: "#F3E5AB",
  goldMid: "#D4AF37",
  goldEnd: "#996515",
  darkBg: "#05140A",
  inactive: "#64748B",
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="KibleScreen" component={KibleScreen} />
      <Stack.Screen name="ZikirmatikScreen" component={ZikirmatikScreen} />
      <Stack.Screen name="QadaScreen" component={QadaScreen} />
    </Stack.Navigator>
  );
}

function MyCustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.tabContainer}>
      <View style={[styles.tabBarMain, { paddingBottom: insets.bottom }]}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented)
              navigation.navigate(route.name);
          };

          if (route.name === "HomeStack") {
            return (
              <View
                key={index}
                style={styles.centerButtonContainer}
                pointerEvents="box-none"
              >
                <TouchableOpacity
                  onPress={onPress}
                  activeOpacity={0.9}
                  style={styles.centerButtonWrapper}
                >
                  <LinearGradient
                    colors={[COLORS.goldStart, COLORS.goldMid, COLORS.goldEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.centerButtonGradient}
                  >
                    <Ionicons
                      name={isFocused ? "grid" : "grid-outline"}
                      size={32}
                      color="#05140A"
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          }

          let iconName: any;
          if (route.name === "CalendarScreen")
            iconName = isFocused ? "calendar" : "calendar-outline";
          else if (route.name === "SettingsScreen")
            iconName = isFocused ? "settings-sharp" : "settings-outline";

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.sideButton}
            >
              <Ionicons
                name={iconName}
                size={26}
                color={isFocused ? COLORS.goldMid : COLORS.inactive}
              />
              {isFocused && <View style={styles.activeLine} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="HomeStack"
      tabBarPosition="bottom"
      tabBar={(props) => <MyCustomTabBar {...props} />}
      screenOptions={{ swipeEnabled: true }}
    >
      <Tab.Screen name="CalendarScreen" component={CalendarScreen} />
      <Tab.Screen name="HomeStack" component={HomeStack} />
      <Tab.Screen name="SettingsScreen" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

import * as SplashScreen from "expo-splash-screen";

// Splash Screen'in otomatik kapanmasını engelle
SplashScreen.preventAutoHideAsync();

import ErrorBoundary from "./src/components/ErrorBoundary";

function AppNavigation() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [viewedOnboarding, setViewedOnboarding] = useState(false);

  // 👇 EKLENDİ: Font Yükleme
  // 👇 EKLENDİ: Font Yükleme
  // import * as Font from "expo-font";
  // import {
  //   Outfit_400Regular,
  //   Outfit_500Medium,
  //   Outfit_700Bold,
  //   Outfit_800ExtraBold,
  // } from "@expo-google-fonts/outfit";

  useEffect(() => {
    async function prepare() {
      try {
        // Fontları Yükle
        await Font.loadAsync({
          Outfit_400Regular,
          Outfit_500Medium,
          Outfit_700Bold,
          Outfit_800ExtraBold,
        });

        // Fontlar, Assets, API call vb. burada yapılabilir.
        // Şimdilik sadece Onboarding kontrolü yapıyoruz.
        await checkOnboarding();

        // Arka plan görevini kaydet
        await registerBackgroundTask();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const checkOnboarding = async () => {
    try {
      const value = await AsyncStorage.getItem("@onboarding_completed");
      if (value !== null) {
        setViewedOnboarding(true);
      }
    } catch (err) {
      console.log("Error @checkOnboarding: ", err);
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Uygulama hazır olduğunda Splash Screen'i gizle
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <PermissionsProvider>
        <NavigationContainer>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {!viewedOnboarding && (
              <RootStack.Screen
                name="Onboarding"
                component={OnboardingScreen}
              />
            )}

            <RootStack.Screen
              name="TabNavigator"
              component={MainTabNavigator}
            />

            {/* Geliştirici Test Ekranı */}
            {__DEV__ && (
              <RootStack.Screen
                name="DeveloperTest"
                component={DeveloperTestScreen}
                options={{
                  presentation: "modal",
                  headerShown: true,
                  title: "Geliştirici Paneli",
                  headerStyle: { backgroundColor: "#1e293b" },
                  headerTintColor: "#fff",
                }}
              />
            )}

            {/* 👇 BURASI EKLENDİ: Admin Panelini Sisteme Tanıttık */}
            <RootStack.Screen
              name="AdminPanel" // SettingsScreen'de bu ismi kullanmalısın
              component={AdminPanelScreen}
              options={{
                presentation: "card",
                headerShown: true,
                title: "Yönetici Paneli",
                headerStyle: { backgroundColor: "#0f172a" },
                headerTintColor: "#D4AF37",
              }}
            />

            {/* Legal Document Screens */}
            <RootStack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="TermsOfService"
              component={TermsOfServiceScreen}
              options={{ headerShown: false }}
            />
          </RootStack.Navigator>
        </NavigationContainer>
      </PermissionsProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppNavigation />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  tabContainer: { position: "absolute", bottom: 0, width: "100%", zIndex: 999 },
  tabBarMain: {
    flexDirection: "row",
    width: "100%",
    height: 85,
    backgroundColor: COLORS.darkBg,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  sideButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
  },
  activeLine: {
    width: 20,
    height: 3,
    backgroundColor: COLORS.goldMid,
    borderRadius: 2,
    marginTop: 6,
    shadowColor: COLORS.goldMid,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  centerButtonContainer: {
    top: -40,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: 80,
  },
  centerButtonWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    shadowColor: COLORS.goldMid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    backgroundColor: "#000",
  },
  centerButtonGradient: {
    flex: 1,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: COLORS.darkBg,
  },
});
