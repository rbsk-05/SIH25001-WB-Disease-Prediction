import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';  // ✅ import

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { t } = useTranslation(); // ✅ hook

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t("errorFillFields"));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        setError(t("errorNotFound"));
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const { role, state, district } = userData;

      if (!state || !district) {
        setError(t("errorFillFields"));
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem('user_info', JSON.stringify({ uid, role, state, district }));

      if (role === 'asha_worker') {
        router.replace('/(tabs)/ashaDashboard');
      } else if (role === 'gov_official') {
        router.replace('/(tabs)/govDashboard');
      } else {
        setError('Invalid user role.');
      }

    } catch (err: any) {
      console.log('Login error:', err);
      if (err.code === 'auth/user-not-found') {
        setError(t("errorNotFound"));
      } else if (err.code === 'auth/wrong-password') {
        setError(t("errorWrongPassword"));
      } else if (err.code === 'auth/invalid-email') {
        setError(t("errorInvalidEmail"));
      } else {
        setError(err.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("login")}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>{t("email")}</Text>
      <TextInput
        style={styles.input}
        placeholder={t("enterEmail")}
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>{t("password")}</Text>
      <TextInput
        style={styles.input}
        placeholder={t("enterPassword")}
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#888"
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t("loginBtn")}</Text>}
      </TouchableOpacity>

      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text style={styles.registerText}>
            {t("newUser")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#000' },
  label: { fontSize: 16, marginBottom: 5, color: '#000', fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 15, color: '#000', backgroundColor: '#fff' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  registerText: { color: '#007AFF', marginTop: 15, textAlign: 'center', textDecorationLine: 'underline' },
  error: { color: 'red', marginBottom: 15, textAlign: 'center' },
});
