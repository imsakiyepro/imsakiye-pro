import { db } from "./firebaseConfig";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import * as Device from "expo-device";
import * as Application from "expo-application";
import NetInfo from "@react-native-community/netinfo"; // 👈 Eklendi
import { Platform } from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
const PLATFORM_NAME = Device.osName || Platform.OS;

interface CloudUserData {
  lat: number;
  lon: number;
  country?: string | null;
  city?: string | null;
  district?: string | null;
}

// 1. CİHAZ ID ALMA YARDIMCISI
export const getDeviceId = async () => {
  let uniqueId: string | null = null;
  if (Platform.OS === "android") {
    uniqueId = Application.getAndroidId();
  } else {
    uniqueId = await Application.getIosIdForVendorAsync();
  }
  return uniqueId ? String(uniqueId).replace(/[^a-zA-Z0-9]/g, "_") : null;
};

// 2. MEVCUT KULLANICI ADMIN MI?
export const checkIsAdmin = async (): Promise<boolean> => {
  try {
    const deviceId = await getDeviceId();
    if (!deviceId) return false;

    const userRef = doc(db, "users", deviceId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.role === "admin"; // Sadece 'admin' ise true döner
    }
    return false;
  } catch (error) {
    console.error("Admin kontrol hatası:", error);
    return false;
  }
};



// 3. BAŞKASINI ADMIN YAP (Sadece Adminler Kullanabilir)
export const promoteUserToAdmin = async (
  targetDeviceId: string,
  makeAdmin: boolean = true
) => {
  try {
    // Önce işlemi yapan kişi admin mi diye tekrar kontrol edelim (Güvenlik)
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) throw new Error("Yetkisiz işlem!");

    const targetRef = doc(db, "users", targetDeviceId);

    // Hedef var mı?
    const targetSnap = await getDoc(targetRef);
    if (!targetSnap.exists()) {
      throw new Error("Bu ID'ye sahip kullanıcı bulunamadı.");
    }

    await updateDoc(targetRef, {
      role: makeAdmin ? "admin" : "user",
      promotedAt: serverTimestamp(),
      promotedBy: await getDeviceId(), // Kimin yetki verdiğini loglayalım
    });

    return true;
  } catch (error: any) {
    throw new Error(error.message || "İşlem başarısız.");
  }
};

// 4. STANDART SENKRONİZASYON (Değişmedi, sadece ID alma mantığı ortaklaştı)
export const syncUserToCloud = async (data: CloudUserData): Promise<void> => {
  if (!db) return;

  try {
    // 🌐 İNTERNET KONTROLÜ
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      // İnternet yoksa sessizce çık, hata fırlatma.
      // Opsiyonel: Kuyruğa atılabilir ama şimdilik "görmezden gel" stratejisi.
      console.warn("Offline mod: Firebase senkronizasyonu atlandı.");
      return;
    }

    const safeDeviceId = await getDeviceId();
    if (!safeDeviceId) return;

    const userRef = doc(db, "users", safeDeviceId);

    // DİKKAT: Burada 'role' alanına dokunmuyoruz.
    // Eğer kullanıcı zaten admin ise, konumu güncellenince adminliği gitmesin.
    const payload = {
      location: {
        latitude: data.lat,
        longitude: data.lon,
        addressText: `${data.city || ""}, ${data.country || ""} (${data.district || ""
          })`,
      },
      address: {
        country: data.country || "Bilinmiyor",
        city: data.city || "Bilinmiyor",
        district: data.district || "",
      },
      lastActive: serverTimestamp(),
      platform: PLATFORM_NAME,
      deviceModel: Device.modelName || "Generic Device",
      isGPS: true,
      deviceId: safeDeviceId,
    };

    await setDoc(userRef, payload, { merge: true });
  } catch (error) {
    console.error("Firebase Sync Hatası:", error);
  }
};

// Tarih parametresi eklendi (scheduledDate)
// Tarih parametresi eklendi (scheduledDate) ve displayType
export const sendGlobalNotification = async (
  title: string,
  body: string,
  scheduledDate: Date,
  displayType: "modal" | "banner" = "modal" // Varsayılan: modal (eski usül kart)
) => {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) throw new Error("Yetkisiz işlem!");

    await addDoc(collection(db, "global_notifications"), {
      title: title,
      body: body,
      sentAt: Timestamp.now(), // Kayıt tarihi
      scheduledAt: Timestamp.fromDate(scheduledDate), // Gösterim tarihi
      sentBy: await getDeviceId(),
      type: "general",
      displayType: displayType, // 'modal' | 'banner'
    });

    return true;
  } catch (error: any) {
    console.error("Hata:", error);
    throw new Error(error.message || "Bildirim gönderilemedi.");
  }
};
