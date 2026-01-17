import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Alert, Linking } from "react-native";

export const PermissionManager = {
  // --- KONUM İZNİ ---
  askLocation: async (): Promise<boolean> => {
    try {
      const { status: existingStatus } =
        await Location.getForegroundPermissionsAsync();
      if (existingStatus === "granted") return true;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") return true;

      Alert.alert(
        "Konum İzni",
        "Namaz vakitlerini bulunduğunuz yere göre doğru hesaplayabilmek için lütfen konum izni verin. İzin vermek tamamen isteğe bağlıdır; manuel olarak da şehir seçebilirsiniz.",
        [
          { text: "Vazgeç", style: "cancel" },
          { text: "Ayarlara Git", onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    } catch (e) {
      console.warn("Location Permission Error:", e);
      return false;
    }
  },

  // --- BİLDİRİM İZNİ ---
  askNotification: async (): Promise<boolean> => {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      if (existingStatus === "granted") return true;

      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") return true;

      Alert.alert(
        "Bildirim İzni",
        "Namaz vakitleri geldiğinde size hatırlatabilmemiz için lütfen bildirim izni verin. İzin vermek tamamen isteğe bağlıdır.",
        [
          { text: "Vazgeç", style: "cancel" },
          { text: "Ayarlara Git", onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    } catch (e) {
      console.warn("Notification Permission Error:", e);
      return false;
    }
  },

  // --- DURUM KONTROLÜ ---


  checkStatus: async () => {
    const { status: loc } = await Location.getForegroundPermissionsAsync();
    const { status: not } = await Notifications.getPermissionsAsync();
    return {
      location: loc === "granted",
      notification: not === "granted",
    };
  },
};
