import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import { db } from "./firebaseConfig";

export const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND_NOTIFICATION_TASK";

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
    try {
        console.log("🔄 Arka plan bildirimi kontrol ediliyor...");

        const now = new Date();
        // Gelecek 24 saat içindeki bildirimleri kontrol et
        // (Çok ileri tarihlileri her seferinde çekmeye gerek yok, günlük çeksin yeter)
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const q = query(
            collection(db, "global_notifications"),
            where("scheduledAt", ">", Timestamp.fromDate(now)),
            where("scheduledAt", "<=", Timestamp.fromDate(next24Hours)),
            orderBy("scheduledAt", "asc")
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log("📭 Yeni planlanacak bildirim yok.");
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const scheduledIdsStr = await AsyncStorage.getItem("scheduled_notif_ids");
        const scheduledIds = scheduledIdsStr ? JSON.parse(scheduledIdsStr) : [];
        let updatedIds = [...scheduledIds];
        let hasNewData = false;

        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            const docId = doc.id;

            // Zaten zamanlandıysa atla
            if (scheduledIds.includes(docId)) continue;

            const scheduledTime = data.scheduledAt.toDate();

            // Local Notification Planla
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: data.title,
                    body: data.body,
                    sound: true,
                    data: { displayType: data.displayType },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: scheduledTime,
                },
            });

            console.log(`✅ Arka planda zamanlandı: ${data.title}`);
            updatedIds.push(docId);
            hasNewData = true;
        }

        if (hasNewData) {
            await AsyncStorage.setItem("scheduled_notif_ids", JSON.stringify(updatedIds));
            return BackgroundFetch.BackgroundFetchResult.NewData;
        }

        return BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (error) {
        console.error("❌ Arka plan görevi hatası:", error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

// Görevi Kaydetme Fonksiyonu
export const registerBackgroundTask = async () => {
    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
        if (!isRegistered) {
            await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
                minimumInterval: 60 * 15, // En az 15 dakikada bir (iOS kısıtlamaları nedeniyle değişebilir)
                stopOnTerminate: false, // Uygulama tamamen kapatılsa bile çalışmaya çalışır (Android)
                startOnBoot: true, // Telefon yeniden başlatılınca başlar (Android)
            });
            console.log("✅ Arka plan görevi başarıyla kaydedildi.");
        } else {
            console.log("ℹ️ Arka plan görevi zaten kayıtlı.");
        }
    } catch (err: any) {
        if (err?.message?.includes("Info.plist")) {
            console.warn(
                "⚠️ [GELİŞTİRİCİ UYARISI] Background Fetch bu cihazda/simülatörde yapılandırılmamış.\n" +
                "👉 Bu normaldir. 'Expo Go' veya eski bir 'Dev Client' kullanıyorsanız bu hatayı alırsınız.\n" +
                "✅ Production Build aldığınızda veya Native Rebuild yaptığınızda bu hata düzelecektir."
            );
        } else {
            console.error("Task Register Error:", err);
        }
    }
};
