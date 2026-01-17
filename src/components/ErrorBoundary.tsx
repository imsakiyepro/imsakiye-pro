import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Global Error Boundary
 * Uygulamanın herhangi bir yerinde JS hatası olursa çökmeyi engeller
 * ve kullanıcıya şık bir hata ekranı gösterir.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Hata servisine (Sentry, Crashlytics vb.) burada loglanabilir.
        console.error("Uygulama Hatası (Sentry'ye gönderilmeli):", error, errorInfo);
    }

    handleRestart = async () => {
        // Uygulamayı yeniden başlatmayı dener
        try {
            await Updates.reloadAsync();
        } catch (e) {
            // Expo Updates çalışmazsa (dev modunda) state'i sıfırlarız
            this.setState({ hasError: false, error: null });
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Ionicons name="warning-outline" size={80} color="#D4AF37" />
                    <Text style={styles.title}>Bir Sorun Oluştu</Text>
                    <Text style={styles.message}>
                        Uygulama beklenmedik bir hatayla karşılaştı.
                    </Text>
                    <Text style={styles.technicalError}>
                        {this.state.error?.toString()}
                    </Text>

                    <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
                        <Ionicons
                            name="refresh"
                            size={20}
                            color="#000"
                            style={{ marginRight: 8 }}
                        />
                        <Text style={styles.buttonText}>YENİDEN BAŞLAT</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#05140A",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        marginTop: 20,
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        color: "#ccc",
        textAlign: "center",
        marginBottom: 10,
    },
    technicalError: {
        fontSize: 10,
        color: "#666",
        textAlign: "center",
        marginBottom: 40,
        fontStyle: "italic",
        paddingHorizontal: 20,
    },
    button: {
        flexDirection: "row",
        backgroundColor: "#D4AF37",
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    buttonText: {
        color: "#000",
        fontWeight: "bold",
        fontSize: 14,
    },
});

export default ErrorBoundary;
