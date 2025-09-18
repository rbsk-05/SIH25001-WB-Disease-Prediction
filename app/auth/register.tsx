import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db, storage } from '../../firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'asha_worker' | 'gov_official'>('asha_worker');
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickCertificate = async () => {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });

  if ('uri' in result) {
    // Success result
    setCertificate(result);
  }
};

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('⚠️ Please fill all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('⚠️ Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      // Create Firebase Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      let certUrl = '';
      if (certificate) {
        const fileRef = ref(storage, `certificates/${uid}_${certificate.name}`);
        const fileData = await fetch(certificate.uri);
        const fileBlob = await fileData.blob();
        await uploadBytes(fileRef, fileBlob);
        certUrl = await getDownloadURL(fileRef);
      }

      await setDoc(doc(db, 'users', uid), {
        fullName,
        email,
        role,
        certificateUrl: certUrl,
        isVerified: false,
      });

      setError(null);
      alert('✅ Registered successfully! Waiting for verification.');
      router.replace('/auth/login');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('⚠️ This email is already registered. Please login.');
      } else {
        setError(err.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter your name" placeholderTextColor="#888" />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter your email" placeholderTextColor="#888" autoCapitalize="none" keyboardType="email-address" />

      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Enter password" placeholderTextColor="#888" secureTextEntry />

      <Text style={styles.label}>Confirm Password</Text>
      <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" placeholderTextColor="#888" secureTextEntry />

      <Text style={styles.label}>Role</Text>
      <Picker selectedValue={role} onValueChange={(val) => setRole(val)} style={styles.picker}>
        <Picker.Item label="ASHA Worker" value="asha_worker" />
        <Picker.Item label="Government Official" value="gov_official" />
      </Picker>

      <TouchableOpacity style={styles.certificateButton} onPress={pickCertificate}>
        <Text style={styles.certificateButtonText}>
          {certificate ? '📄 Certificate Selected' : 'Upload Certificate (optional)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.registerText}>
                Registered?
              </Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#000' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 15, color: '#000', backgroundColor: '#fff' },
  label: { fontSize: 16, marginBottom: 5, color: '#000' },
  errorText: { color: 'red', marginBottom: 15, textAlign: 'center' },
  picker: { marginBottom: 15 },
  certificateButton: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  certificateButtonText: { color: '#000' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  registerText: { color: '#007AFF', marginTop: 15, textAlign: 'center', textDecorationLine: 'underline' },
});
