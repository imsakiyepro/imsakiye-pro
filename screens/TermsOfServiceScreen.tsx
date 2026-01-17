import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../src/constants/theme';

export default function TermsOfServiceScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kullanım Şartları</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.lastUpdated}>Son Güncelleme: 17 Ocak 2026</Text>

                <Text style={styles.sectionTitle}>1. Kabul ve Onay</Text>
                <Text style={styles.paragraph}>
                    İmsakiye Pro uygulamasını indirerek, kurarak veya kullanarak bu Kullanım Şartlarını kabul etmiş sayılırsınız.
                </Text>

                <Text style={styles.sectionTitle}>2. Hizmet Tanımı</Text>
                <Text style={styles.paragraph}>• Namaz vakitlerinin gösterilmesi</Text>
                <Text style={styles.paragraph}>• Kıble yönü bulma</Text>
                <Text style={styles.paragraph}>• Namaz takibi ve istatistikleri</Text>
                <Text style={styles.paragraph}>• Kazaya kalan namaz sayacı</Text>
                <Text style={styles.paragraph}>• Zikirmatik</Text>
                <Text style={styles.paragraph}>• İslami içerikler ve dualar</Text>

                <Text style={styles.sectionTitle}>3. Sorumluluk Reddi</Text>

                <Text style={styles.warningBox}>⚠️ ÖNEMLİ UYARI</Text>
                <Text style={styles.paragraph}>
                    Uygulamamızda gösterilen namaz vakitleri, bilimsel hesaplama yöntemleri kullanılarak belirlenmiştir. Ancak:
                </Text>
                <Text style={styles.paragraph}>
                    • Vakitler <Text style={styles.boldText}>yaklaşık değerlerdir</Text> ve bölgeden bölgeye değişiklik gösterebilir.
                </Text>
                <Text style={styles.paragraph}>
                    • Kesin vakit bilgisi için <Text style={styles.boldText}>yerel cami veya Diyanet İşleri Başkanlığı'na danışmanız önerilir.</Text>
                </Text>
                <Text style={styles.paragraph}>
                    • Özellikle kritik durumlar (oruç tutma, imsak vakti vb.) için resmi kaynaklardan teyit alınması tavsiye edilir.
                </Text>

                <Text style={styles.subsectionTitle}>SORUMLULUK</Text>
                <Text style={styles.paragraph}>
                    Namaz vakitlerinin yanlış hesaplanması veya teknik aksaklıklar nedeniyle oluşabilecek ibadet eksikliklerinden veya herhangi bir zarardan uygulama geliştiricileri sorumlu tutulamaz.
                </Text>

                <Text style={styles.sectionTitle}>4. Kabul Edilemez Kullanım</Text>
                <Text style={styles.paragraph}>Aşağıdaki faaliyetler kesinlikle yasaktır:</Text>
                <Text style={styles.paragraph}>• Uygulamayı tersine mühendislik yapmak</Text>
                <Text style={styles.paragraph}>• Otomatik scriptler veya botlar kullanmak</Text>
                <Text style={styles.paragraph}>• Kaynak kodunu kopyalamak</Text>
                <Text style={styles.paragraph}>• Kötü amaçlı yazılım dağıtmak</Text>

                <Text style={styles.sectionTitle}>5. Fikri Mülkiyet Hakları</Text>
                <Text style={styles.paragraph}>
                    Uygulamanın tüm içeriği (kod, tasarım, görseller, logolar) telif hakkı ile korunmaktadır ve UMUT DEMİRCİ'ye aittir.
                </Text>
                <Text style={styles.paragraph}>
                    Size verilen lisans <Text style={styles.boldText}>devredilemez, sınırlıdır ve iptal edilebilir</Text>.
                </Text>

                <Text style={styles.sectionTitle}>6. Hesap Silme ve Veri Yönetimi</Text>
                <Text style={styles.paragraph}>
                    <Text style={styles.boldText}>Tüm Verileri Sil:</Text> Ayarlar {">"} Hesabı Sil/Sıfırla
                </Text>
                <Text style={styles.paragraph}>
                    <Text style={styles.boldText}>Uygulamayı Kaldır:</Text> Uygulamayı telefonunuzdan sildiğinizde tüm yerel veriler otomatik silinir.
                </Text>

                <Text style={styles.sectionTitle}>7. Hizmet Değişiklikleri</Text>
                <Text style={styles.paragraph}>
                    Uygulama geliştiricileri, herhangi bir zamanda uygulamayı güncelleme, değiştirme veya hizmeti durdurma hakkını saklı tutar.
                </Text>

                <Text style={styles.sectionTitle}>8. Garanti Reddi</Text>
                <Text style={styles.disclaimerBox}>
                    UYGULAMA "OLDUĞU GİBİ" VE "MEVCUT OLDUĞU ŞEKİLDE" SUNULMAKTADIR. HİÇBİR AÇIK VEYA ZIMNİ GARANTİ VERİLMEMEKTEDİR.
                </Text>

                <Text style={styles.sectionTitle}>9. Sorumluluk Sınırlaması</Text>
                <Text style={styles.paragraph}>
                    Yasal olarak izin verilen azami ölçüde, uygulama geliştiricileri:
                </Text>
                <Text style={styles.paragraph}>• Dolaylı, arızi veya cezai zararlardan sorumlu değildir</Text>
                <Text style={styles.paragraph}>• Veri kaybından sorumlu değildir</Text>
                <Text style={styles.paragraph}>• Uygulama kullanımı nedeniyle oluşan ibadet eksikliklerinden sorumlu değildir</Text>

                <Text style={styles.sectionTitle}>10. Uygulanacak Hukuk</Text>
                <Text style={styles.paragraph}>
                    Bu Kullanım Şartları, Türkiye Cumhuriyeti yasalarına tabidir. Anlaşmazlıklar durumunda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
                </Text>

                <Text style={styles.sectionTitle}>11. İletişim</Text>
                <Text style={styles.paragraph}>E-posta: umtdmrcix@gmail.com</Text>

                <Text style={styles.footer}>Yürürlük Tarihi: 17 Ocak 2026 • Version: 1.0</Text>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#05140A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: '#FFF',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    lastUpdated: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 20,
        fontFamily: FONTS.regular,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.primary,
        marginTop: 24,
        marginBottom: 12,
    },
    subsectionTitle: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: '#FFF',
        marginTop: 16,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 14,
        fontFamily: FONTS.regular,
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 22,
        marginBottom: 12,
    },
    boldText: {
        fontFamily: FONTS.bold,
        color: '#FFF',
    },
    warningBox: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginVertical: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B6B',
    },
    disclaimerBox: {
        fontSize: 13,
        fontFamily: FONTS.bold,
        color: '#FFF',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        padding: 16,
        borderRadius: 8,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
        textAlign: 'center',
    },
    footer: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 32,
        textAlign: 'center',
        fontFamily: FONTS.regular,
    },
});
