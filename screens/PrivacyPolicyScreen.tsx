import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../src/constants/theme';

export default function PrivacyPolicyScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.lastUpdated}>Son Güncelleme: 17 Ocak 2026</Text>

                <Text style={styles.sectionTitle}>1. Genel Bilgiler</Text>
                <Text style={styles.paragraph}>
                    İmsakiye Pro ("Uygulama"), kullanıcılarına namaz vakitlerini gösterme, kıble yönü bulma ve diğer İslami içerikler sunma hizmeti vermektedir. Bu Gizlilik Politikası, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında hazırlanmış olup, uygulamayı kullanırken kişisel verilerinizin nasıl toplandığını, işlendiğini ve korunduğunu açıklamaktadır.
                </Text>

                <Text style={styles.boldText}>Veri Sorumlusu Bilgileri:</Text>
                <Text style={styles.paragraph}>• Ad/Unvan: UMUT DEMİRCİ</Text>
                <Text style={styles.paragraph}>• E-posta: umtdmrcix@gmail.com</Text>

                <Text style={styles.sectionTitle}>2. Toplanan Kişisel Veriler</Text>

                <Text style={styles.subsectionTitle}>2.1 Konum Verileri</Text>
                <Text style={styles.paragraph}>
                    <Text style={styles.boldText}>Toplanan Veri:</Text> GPS koordinatları (enlem/boylam)
                </Text>
                <Text style={styles.paragraph}>
                    <Text style={styles.boldText}>Amaç:</Text> Bulunduğunuz konuma özel namaz vakitlerini hesaplamak, Kıble yönünü belirlemek ve yakındaki camileri göstermek.
                </Text>
                <Text style={styles.paragraph}>
                    <Text style={styles.boldText}>İşleme Süresi:</Text> Konum verisi sadece vakit hesaplaması sırasında kullanılır ve <Text style={styles.boldText}>hiçbir sunucuya gönderilmez</Text>. Sadece cihazınızda yerel olarak işlenir.
                </Text>

                <Text style={styles.subsectionTitle}>2.2 İstatistiksel Veriler (Anonim)</Text>
                <Text style={styles.paragraph}>
                    <Text style={styles.boldText}>Toplanan Veri:</Text> Kılınan namaz sayıları (toplam, namaz türüne göre)
                </Text>
                <Text style={styles.paragraph}>
                    <Text style={styles.boldText}>Amaç:</Text> Global kullanıcı istatistiklerini göstermek ("X kişi bugün sabah namazını kıldı" gibi)
                </Text>
                <Text style={styles.paragraph}>
                    İstatistikler Firebase Firestore'da anonim olarak saklanır. Herhangi bir kullanıcı kimliği ile ilişkilendirilmez.
                </Text>

                <Text style={styles.subsectionTitle}>2.3 Bildirim İzni</Text>
                <Text style={styles.paragraph}>
                    <Text style={styles.boldText}>Amaç:</Text> Namaz vakti hatırlatmaları ve uygulama içi duyurular göndermek.
                </Text>

                <Text style={styles.subsectionTitle}>2.4 Yerel Veriler (Cihazda Saklanan)</Text>
                <Text style={styles.paragraph}>
                    Aşağıdaki veriler <Text style={styles.boldText}>sadece cihazınızda</Text> saklanır ve asla sunucuya gönderilmez:
                </Text>
                <Text style={styles.paragraph}>• Kılınan namazlarınızın listesi (günlük takip)</Text>
                <Text style={styles.paragraph}>• Kazaya kalan namaz sayıları</Text>
                <Text style={styles.paragraph}>• Uygulama ayarlarınız</Text>
                <Text style={styles.paragraph}>• Şehir seçiminiz</Text>

                <Text style={styles.sectionTitle}>3. Kullanıcı Hakları (KVKK Madde 11)</Text>
                <Text style={styles.paragraph}>KVKK kapsamında aşağıdaki haklara sahipsiniz:</Text>
                <Text style={styles.paragraph}>• Bilgi Talep Etme: Kişisel verilerinizin işlenip işlenmediğini öğrenme</Text>
                <Text style={styles.paragraph}>• Erişim Hakkı: İşlenen verilerinize erişim talep etme</Text>
                <Text style={styles.paragraph}>• Düzeltme Hakkı: Yanlış/eksik verilerin düzeltilmesini isteme</Text>
                <Text style={styles.paragraph}>• Silme Hakkı: Verilerinizin silinmesini talep etme</Text>
                <Text style={styles.paragraph}>• İtiraz Hakkı: Kişisel verilerinizin işlenmesine itiraz etme</Text>

                <Text style={styles.paragraph}>
                    <Text style={styles.boldText}>Başvuru:</Text> umtdmrcix@gmail.com
                </Text>
                <Text style={styles.paragraph}>
                    <Text style={styles.boldText}>Yanıt Süresi:</Text> En geç 30 gün
                </Text>

                <Text style={styles.sectionTitle}>4. Veri Güvenliği</Text>
                <Text style={styles.paragraph}>• Şifreleme: Tüm Firebase bağlantıları SSL/TLS ile şifrelenir</Text>
                <Text style={styles.paragraph}>• Minimizasyon: Sadece gerekli veriler toplanır</Text>
                <Text style={styles.paragraph}>• Yerel İşleme: Hassas veriler sadece cihazınızda işlenir</Text>

                <Text style={styles.sectionTitle}>5. Üçüncü Taraf Hizmetler</Text>
                <Text style={styles.paragraph}>
                    <Text style={styles.boldText}>Firebase (Google LLC)</Text>
                </Text>
                <Text style={styles.paragraph}>Hizmet: Cloud Firestore, Cloud Messaging, Analytics</Text>
                <Text style={styles.paragraph}>Gizlilik: firebase.google.com/support/privacy</Text>

                <Text style={styles.sectionTitle}>6. İletişim</Text>
                <Text style={styles.paragraph}>E-posta: umtdmrcix@gmail.com</Text>
                <Text style={styles.paragraph}>Veri Sorumlusu: UMUT DEMİRCİ</Text>

                <Text style={styles.footer}>Yürürlük Tarihi: 17 Ocak 2026</Text>

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
    footer: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 32,
        textAlign: 'center',
        fontFamily: FONTS.regular,
    },
});
