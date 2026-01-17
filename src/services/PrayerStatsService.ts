import { db } from "./firebaseConfig";
import {
    doc,
    setDoc,
    updateDoc,
    increment,
    onSnapshot,
} from "firebase/firestore";

interface DailyStats {
    [key: string]: number; // "İmsak": 120, "Öğle": 500 etc.
}

/**
 * Bu günün tarihi için string ID döner (YYYY-MM-DD olarak)
 * Örn: 2026-01-17
 */
const getTodayId = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const PrayerStatsService = {
    /**
     * Bir vakit için "Kılındı" sayısını 1 artırır.
     * Eğer o günün dokümanı yoksa oluşturur.
     */
    incrementCount: async (prayerName: string) => {
        try {
            const todayId = getTodayId();
            const docRef = doc(db, "daily_stats", todayId);

            // setDoc({ ... }, { merge: true }) kullanarak atomik artış yapıyoruz.
            // Eğer doküman yoksa oluşur, varsa sadece ilgili alan artar.
            await setDoc(
                docRef,
                {
                    [prayerName]: increment(1),
                },
                { merge: true }
            );
        } catch (error) {
            console.warn("Stats increment error:", error);
        }
    },

    /**
     * Bir vakit için "Kılındı" sayısını 1 azaltır.
     */
    decrementCount: async (prayerName: string) => {
        try {
            const todayId = getTodayId();
            const docRef = doc(db, "daily_stats", todayId);

            await updateDoc(docRef, {
                [prayerName]: increment(-1),
            });
        } catch (error) {
            console.warn("Stats decrement error:", error);
        }
    },

    /**
     * Bu günün istatistiklerini canlı dinler.
     */
    listenToTodayStats: (callback: (stats: DailyStats) => void) => {
        const todayId = getTodayId();
        const docRef = doc(db, "daily_stats", todayId);

        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data() as DailyStats);
            } else {
                callback({});
            }
        });
    },
};
