import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import { router } from "expo-router";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState("asha");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Welcome back!</Text>
        <Text style={styles.text}>You are logged in as: {user.email}</Text>
        <Text style={styles.text}>User type: {userType}</Text>
        <Button title="Go to Dashboard" onPress={() => router.push("/(tabs)/explore")} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Smart Health Monitoring</Text>
      <Text style={styles.text}>Select your role:</Text>

      <View style={styles.dropdown}>
        <Picker
          selectedValue={userType}
          onValueChange={(value) => setUserType(value)}
        >
          <Picker.Item label="ASHA Worker" value="asha" />
          <Picker.Item label="Government Official" value="official" />
          <Picker.Item label="Community Member" value="community" />
        </Picker>
      </View>

      <View style={styles.buttonRow}>
        <Button title="Login" onPress={() => router.push("/auth/login")} />
        <Button title="Register" onPress={() => router.push("/auth/register")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // clean white
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 15,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  dropdown: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonRow: {
    marginTop: 20,
    width: "60%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
});
