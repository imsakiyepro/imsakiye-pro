# Gizlilik Politikası

**Son Güncelleme:** 17 Ocak 2026

## 1. Genel Bilgiler

İmsakiye Pro ("Uygulama"), kullanıcılarına namaz vakitlerini gösterme, kıble yönü bulma ve diğer İslami içerikler sunma hizmeti vermektedir. Bu Gizlilik Politikası, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında hazırlanmış olup, uygulamayı kullanırken kişisel verilerinizin nasıl toplandığını, işlendiğini ve korunduğunu açıklamaktadır.

**Veri Sorumlusu Bilgileri:**
- **Ad/Unvan:** UMUT DEMİRCİ
- **E-posta:** umtdmrcix@gmail.com

## 2. Toplanan Kişisel Veriler

### 2.1 Konum Verileri
**Toplanan Veri:** GPS koordinatları (enlem/boylam)

**Amaç:** Bulunduğunuz konuma özel namaz vakitlerini hesaplamak, Kıble yönünü belirlemek ve yakındaki camileri göstermek.

**Hukuki Dayanak:** KVKK Madde 5/2(f) - Veri sorumlusunun meşru menfaatleri (uygulamanın temel işlevselliği)

**İşleme Süresi:** Konum verisi sadece vakit hesaplaması sırasında kullanılır ve **hiçbir sunucuya gönderilmez**. Sadece cihazınızda yerel olarak işlenir.

**Paylaşım:** Üçüncü taraflarla paylaşılmaz.

### 2.2 İstatistiksel Veriler (Anonim)
**Toplanan Veri:** Kılınan namaz sayıları (toplam, namaz türüne göre)

**Amaç:** Global kullanıcı istatistiklerini göstermek ("X kişi bugün sabah namazını kıldı" gibi)

**Hukuki Dayanak:** KVKK Madde 5/2(a) - Açık rıza (uygulamayı kullanarak kabul edilir)

**İşleme Süresi:** İstatistikler Firebase Firestore'da anonim olarak saklanır. Herhangi bir kullanıcı kimliği ile ilişkilendirilmez.

**Paylaşım:** Firebase (Google Cloud) sunucularında saklanır. Kullanıcı kimliği içermediği için kişisel veri niteliğinde değildir.

### 2.3 Bildirim İzni
**Toplanan Veri:** Cihaz bildirim token'ı

**Amaç:** Namaz vakti hatırlatmaları ve uygulama içi duyurular göndermek.

**Hukuki Dayanak:** KVKK Madde 5/2(f) - Meşru menfaat (kullanıcı deneyimini iyileştirme)

**İşleme Süresi:** Token, Firebase Cloud Messaging (FCM) sistemi tarafından saklanır.

**Paylaşım:** Google Firebase hizmeti ile paylaşılır (bildirim gönderimi için teknik gereklilik).

### 2.4 Yerel Veriler (Cihazda Saklanan)
Aşağıdaki veriler **sadece cihazınızda** saklanır ve asla sunucuya gönderilmez:
- Kılınan namazlarınızın listesi (günlük takip)
- Kazaya kalan namaz sayıları
- Uygulama ayarlarınız (bildirim tercihleri, tema, vb.)
- Şehir seçiminiz

**Silme:** Uygulamayı sildiğinizde tüm yerel veriler otomatik olarak silinir.

## 3. Kullanıcı Hakları (KVKK Madde 11)

KVKK kapsamında aşağıdaki haklara sahipsiniz:

- **Bilgi Talep Etme:** Kişisel verilerinizin işlenip işlenmediğini öğrenme
- **Erişim Hakkı:** İşlenen verilerinize erişim talep etme
- **Düzeltme Hakkı:** Yanlış/eksik verilerin düzeltilmesini isteme
- **Silme Hakkı:** Verilerinizin silinmesini talep etme
- **İtiraz Hakkı:** Kişisel verilerinizin işlenmesine itiraz etme

**Başvuru Yöntemi:** umtdmrcix@gmail.com adresine yazılı olarak başvurabilirsiniz.

**Yanıt Süresi:** Başvurularınız en geç 30 gün içinde yanıtlanacaktır (KVKK Madde 13).

## 4. Veri Güvenliği

Kişisel verilerinizin güvenliğini sağlamak için aşağıdaki önlemler alınmıştır:

- **Şifreleme:** Tüm Firebase bağlantıları SSL/TLS ile şifrelenir
- **Minimizasyon:** Sadece gerekli veriler toplanır
- **Yerel İşleme:** Hassas veriler (konum, namaz takibi) sadece cihazınızda işlenir
- **Erişim Kontrolü:** Firebase veri tabanına sadece yetkili personel erişebilir

## 5. Çerezler ve İzleme Teknolojileri

Bu uygulama **web çerezi kullanmaz**. Ancak Firebase Analytics tarafından sağlanan anonim kullanım istatistikleri toplanabilir (örn: uygulama açılma sayısı, ekran görüntülemeleri).

## 6. Üçüncü Taraf Hizmetler

Uygulamada kullanılan üçüncü taraf hizmetler:

### 6.1 Firebase (Google LLC)
- **Hizmet:** Cloud Firestore (veritabanı), Cloud Messaging (bildirimler), Analytics
- **Veri İşleme Yeri:** AB/ABD (Google veri merkezleri)
- **Gizlilik Politikası:** https://firebase.google.com/support/privacy

### 6.2 Expo Services
- **Hizmet:** Uygulama güncellemeleri
- **Gizlilik Politikası:** https://expo.dev/privacy

## 7. Çocukların Gizliliği

Uygulamamız 13 yaş altı çocukların kişisel verilerini bilerek toplamaz. Ebeveynler, çocuklarının uygulamayı kullanımını denetlemelidir.

## 8. Değişiklikler

Bu Gizlilik Politikası gerektiğinde güncellenebilir. Önemli değişiklikler olduğunda, uygulama içi bildirim ile kullanıcılar bilgilendirilecektir.

## 9. İletişim

Gizlilik politikası ile ilgili sorularınız için:
- **E-posta:** umtdmrcix@gmail.com
- **Veri Sorumlusu:** UMUT DEMİRCİ

## 10. Yasal Uyarı

Bu Gizlilik Politikası, 6698 sayılı Kişisel Verilerin Korunması Kanunu ve ilgili mevzuat hükümlerine uygun olarak hazırlanmıştır. Uygulamayı kullanarak bu politikayı kabul etmiş sayılırsınız.

---

**Yürürlük Tarihi:** 17 Ocak 2026
