export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string; // Dinamik erişim için
}

export interface CalendarDayData {
  id: number;
  day: string;
  weekday: string;
  dateFull: string;
  imsak: string;
  gunes: string;
  ogle: string;
  ikindi: string;
  aksam: string;
  yatsi: string;
  specialText: string | null;
  specialType: "religious" | "national" | null;
  isToday: boolean;
}

export interface LocationData {
  lat: number;
  lon: number;
  city?: string;
  country?: string;
}
