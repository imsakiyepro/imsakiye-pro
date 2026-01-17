import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  ActivityIndicator,
  ListRenderItem,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
// Yolun doğru olduğundan emin ol

export const COLORS = {
  primary: "#D4AF37", // Gold
  background: "#000000",
  white: "#FFFFFF",
  textSecondary: "#94A3B8",
  rowEven: "rgba(255,255,255,0.02)",
  todayBg: "rgba(212,175,55,0.2)",
  todayBorder: "#D4AF37",
  holidayText: "#F59E0B",
  nationalText: "#EF4444",
  activeColumnText: "#D4AF37",
  headerBg: "rgba(0,0,0,0.3)",
  separator: "rgba(255,255,255,0.1)",
};

const { height } = Dimensions.get("window");

// TÜRKİYE'NİN 81 İLİ (Statik Liste - Type: string[])
const CITIES: string[] = [
  "Adana",
  "Adıyaman",
  "Afyonkarahisar",
  "Ağrı",
  "Amasya",
  "Ankara",
  "Antalya",
  "Artvin",
  "Aydın",
  "Balıkesir",
  "Bilecik",
  "Bingöl",
  "Bitlis",
  "Bolu",
  "Burdur",
  "Bursa",
  "Çanakkale",
  "Çankırı",
  "Çorum",
  "Denizli",
  "Diyarbakır",
  "Edirne",
  "Elazığ",
  "Erzincan",
  "Erzurum",
  "Eskişehir",
  "Gaziantep",
  "Giresun",
  "Gümüşhane",
  "Hakkari",
  "Hatay",
  "Isparta",
  "Mersin",
  "İstanbul",
  "İzmir",
  "Kars",
  "Kastamonu",
  "Kayseri",
  "Kırklareli",
  "Kırşehir",
  "Kocaeli",
  "Konya",
  "Kütahya",
  "Malatya",
  "Manisa",
  "Kahramanmaraş",
  "Mardin",
  "Muğla",
  "Muş",
  "Nevşehir",
  "Niğde",
  "Ordu",
  "Rize",
  "Sakarya",
  "Samsun",
  "Siirt",
  "Sinop",
  "Sivas",
  "Tekirdağ",
  "Tokat",
  "Trabzon",
  "Tunceli",
  "Şanlıurfa",
  "Uşak",
  "Van",
  "Yozgat",
  "Zonguldak",
  "Aksaray",
  "Bayburt",
  "Karaman",
  "Kırıkkale",
  "Batman",
  "Şırnak",
  "Bartın",
  "Ardahan",
  "Iğdır",
  "Yalova",
  "Karabük",
  "Kilis",
  "Osmaniye",
  "Düzce",
];

// PROPS INTERFACE TANIMI
interface CitySelectorModalProps {
  visible: boolean;
  onClose: () => void;
  // Promise<void> | void diyerek hem async hem sync fonksiyonları kabul ediyoruz
  onSelect: (data: { country: string; city: string }) => Promise<void> | void;
}

export default function CitySelectorModal({
  visible,
  onClose,
  onSelect,
}: CitySelectorModalProps) {
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // ARAMA FİLTRESİ (Memoized)
  const filteredCities = useMemo(() => {
    if (!search) return CITIES;
    return CITIES.filter((c) =>
      c.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr"))
    );
  }, [search]);

  const handleSelect = async (city: string) => {
    setLoading(true);
    // API uyumluluğu için country: "Turkey" sabit gönderiyoruz
    await onSelect({ country: "Turkey", city });
    setLoading(false);
    setSearch("");
    onClose();
  };

  const renderItem: ListRenderItem<string> = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <Ionicons
        name="location-outline"
        size={20}
        color={COLORS.primary}
        style={{ marginRight: 12 }}
      />
      <Text style={styles.itemText}>{item}</Text>
      <Ionicons
        name="chevron-forward"
        size={16}
        color="rgba(255,255,255,0.3)"
        style={{ marginLeft: "auto" }}
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose} // Android geri tuşu için gerekli
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Şehir Seçimi</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="rgba(255,255,255,0.5)"
              style={{ marginRight: 10 }}
            />
            <TextInput
              placeholder="Şehir ara..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.input}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
          </View>

          {/* LİSTE */}
          {loading ? (
            <View style={{ flex: 1, justifyContent: "center" }}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text
                style={{
                  textAlign: "center",
                  color: "#FFF",
                  marginTop: 10,
                }}
              >
                Konum ayarlanıyor...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={15}
              ListEmptyComponent={
                <Text
                  style={{
                    textAlign: "center",
                    color: "rgba(255,255,255,0.5)",
                    marginTop: 20,
                  }}
                >
                  Şehir bulunamadı.
                </Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  container: {
    height: height * 0.85,
    backgroundColor: "#05140A", // Koyu Tema (Store-Ready Görünüm)
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40, // iPhone alt çubuğu için pay
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeBtn: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    color: "#FFF",
    fontSize: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  itemText: {
    color: "#FFF",
    fontSize: 16,
  },
});
