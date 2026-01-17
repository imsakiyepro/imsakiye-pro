// src/utils/dateHelpers.ts
import { PrayerTimes } from "../types"; // Types dosyanızdan import edin

// Bugünün Tarihi (Hicri/Miladi)
export const getFormattedDate = () => {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    }).format(new Date());
  } catch {
    return new Date().toLocaleDateString();
  }
};

export const getHijriDateString = () => {
  try {
    return new Intl.DateTimeFormat("tr-TR-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  } catch {
    return "Hicri Takvim";
  }
};

// Geri Sayım Mantığı
export const calculateNextPrayer = (prayerTimes: any[]) => {
  if (!prayerTimes || prayerTimes.length === 0) return null;

  const now = new Date();
  let nextP = null;
  let found = false;

  // 1. Bugünün vakitlerini kontrol et
  for (const p of prayerTimes) {
    const [h, m] = p.time.split(":").map(Number);
    const pDate = new Date();
    pDate.setHours(h, m, 0, 0);

    if (pDate > now) {
      nextP = { ...p, targetDate: pDate };
      found = true;
      break;
    }
  }

  // 2. Bugün bittiyse (Yatsı sonrası), hedef Yarın İmsak
  if (!found) {
    const imsak = prayerTimes[0];
    const [h, m] = imsak.time.split(":").map(Number);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(h, m, 0, 0);
    nextP = { ...imsak, targetDate: tomorrow };
  }

  return nextP;
};

export const formatTimeLeft = (targetDate: Date) => {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) return "00:00:00";

  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  return `${h < 10 ? "0" + h : h}:${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s
    }`;
};
