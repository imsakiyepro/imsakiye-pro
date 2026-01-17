import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const widthBaseScale = SCREEN_WIDTH / 375;
const heightBaseScale = SCREEN_HEIGHT / 812;

function normalize(size: number, based = "width") {
    const newSize =
        based === "height" ? size * heightBaseScale : size * widthBaseScale;
    if (PixelRatio.get() >= 3) {
        return newSize - 0.5; // Yüksek çözünürlüklü ekranlar için hafif düzeltme
    }
    return newSize - 1; // Diğerleri için
}

// Genişlik Yüzdesi (Width Percentage)
const wp = (percentage: number) => {
    return (SCREEN_WIDTH * percentage) / 100;
};

// Yükseklik Yüzdesi (Height Percentage)
const hp = (percentage: number) => {
    return (SCREEN_HEIGHT * percentage) / 100;
};

// Responsive Font (Cihazın font büyüklüğüne göre patlamayı önler)
const rf = (size: number) => {
    return normalize(size, "width");
};

export { wp, hp, rf, SCREEN_WIDTH, SCREEN_HEIGHT };
