import { calculateNextPrayer } from "../dateHelper";

describe("calculateNextPrayer", () => {
    const mockPrayerTimes = [
        { name: "İmsak", time: "05:00" },
        { name: "Güneş", time: "06:30" },
        { name: "Öğle", time: "13:00" },
        { name: "İkindi", time: "16:30" },
        { name: "Akşam", time: "19:00" },
        { name: "Yatsı", time: "20:30" },
    ];

    beforeAll(() => {
        // Mock system time if needed, but the function uses new Date() internally.
        // We should strictly mock Date to test effectively.
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it("should return the next prayer if within the same day", () => {
        // Set time to 14:00 (After Dhuhr, before Asr)
        const mockDate = new Date();
        mockDate.setHours(14, 0, 0, 0);
        jest.setSystemTime(mockDate);

        const next = calculateNextPrayer(mockPrayerTimes);
        expect(next).toBeDefined();
        expect(next?.name).toBe("İkindi");
        expect(next?.time).toBe("16:30");
    });

    it("should return Fajr of tomorrow if after Isha (Yatsı)", () => {
        // Set time to 21:00 (After Isha)
        const mockDate = new Date();
        mockDate.setHours(21, 0, 0, 0);
        jest.setSystemTime(mockDate);

        const next = calculateNextPrayer(mockPrayerTimes);
        expect(next).toBeDefined();
        expect(next?.name).toBe("İmsak");
        expect(next?.time).toBe("05:00");

        // Validate that the target date is tomorrow
        const targetDate = next?.targetDate as Date;
        expect(targetDate.getDate()).not.toBe(mockDate.getDate());
        expect(targetDate.getTime()).toBeGreaterThan(mockDate.getTime());
    });

    it("should return Fajr of today if before Fajr", () => {
        // Set time to 04:00 (Before Fajr)
        const mockDate = new Date();
        mockDate.setHours(4, 0, 0, 0);
        jest.setSystemTime(mockDate);

        const next = calculateNextPrayer(mockPrayerTimes);
        expect(next).toBeDefined();
        expect(next?.name).toBe("İmsak");
        expect(next?.time).toBe("05:00");

        // Should be today
        const targetDate = next?.targetDate as Date;
        expect(targetDate.getDate()).toBe(mockDate.getDate());
    });

    it("should return null if prayer times array is empty", () => {
        expect(calculateNextPrayer([])).toBeNull();
    });
});
