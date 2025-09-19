import "../src/i18n"; // ✅ must be first
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export default function Index() {
  const router = useRouter();
  const { t, i18n } = useTranslation(); // ✅ use i18n from hook (reactive)

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "hi" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <View style={styles.container}>
      {/* 🌐 Language Toggle (top-right) */}
      <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
        <Text style={styles.langButtonText}>
          {/* 👇 Always show the OTHER language in its own script */}
          {i18n.language === "en" ? "हिंदी" : "English"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t("welcome")}</Text>
      <Text style={styles.subtitle}>{t("appSubtitle")}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/auth/login")}
      >
        <Text style={styles.buttonText}>{t("goToLogin")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#555",
    marginBottom: 40,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  langButton: {
    position: "absolute",
    top: 40,
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    backgroundColor: "#fff",
  },
  langButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
});
