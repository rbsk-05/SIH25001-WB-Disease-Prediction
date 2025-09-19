import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db, storage } from '../../firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next'; // ✅ i18n hook

// ✅ Type for northeastern states and districts
type StateType = {
  [key in
    | "Arunachal Pradesh"
    | "Assam"
    | "Manipur"
    | "Meghalaya"
    | "Mizoram"
    | "Nagaland"
    | "Sikkim"
    | "Tripura"]: string[];
};

const STATES: StateType = {
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat", "Ziro", "Bomdila"],
  Assam: ["Guwahati", "Dispur", "Jorhat", "Tezpur", "Silchar"],
  Manipur: ["Imphal", "Thoubal", "Churachandpur", "Bishnupur", "Ukhrul"],
  Meghalaya: ["Shillong", "Tura", "Jowai", "Nongstoin", "Nongpoh"],
  Mizoram: ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib"],
  Nagaland: ["Kohima", "Dimapur", "Mokokchung", "Mon", "Tuensang"],
  Sikkim: ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Pelling"],
  Tripura: ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar", "Amarpur"],
};

export default function RegisterScreen() {
  const { t } = useTranslation(); // ✅ translation hook

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'asha_worker' | 'gov_official'>('asha_worker');
  const [certificate, setCertificate] = useState<any>(null);
  const [state, setState] = useState<keyof StateType>("Assam");
  const [district, setDistrict] = useState<string>(STATES["Assam"][0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickCertificate = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if ('uri' in result) setCertificate(result);
  };

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password || !confirmPassword || !state || !district) {
      setError(t('errors.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    setError(null);
    setLoading(true);
    try {
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
        phone,
        role,
        state,
        district,
        certificateUrl: certUrl,
        isVerified: false,
      });

      setError(null);
      alert(t('messages.registrationSuccess'));
      router.replace('/auth/login');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError(t('errors.emailExists'));
      } else {
        setError(err.message || t('errors.somethingWentWrong'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('register.title')}</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.label}>{t('register.fullName')}</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder={t('placeholders.name')}
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>{t('register.email')}</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder={t('placeholders.email')}
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>{t('register.phone')}</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder={t('placeholders.phone')}
        placeholderTextColor="#888"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>{t('register.password')}</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder={t('placeholders.password')}
        placeholderTextColor="#888"
        secureTextEntry
      />

      <Text style={styles.label}>{t('register.confirmPassword')}</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder={t('placeholders.confirmPassword')}
        placeholderTextColor="#888"
        secureTextEntry
      />

      <Text style={styles.label}>{t('register.role')}</Text>
      <Picker selectedValue={role} onValueChange={(val) => setRole(val)} style={styles.picker}>
        <Picker.Item label={t('roles.ashaWorker')} value="asha_worker" />
        <Picker.Item label={t('roles.govOfficial')} value="gov_official" />
      </Picker>

      <Text style={styles.label}>{t('register.state')}</Text>
<Picker
  selectedValue={state}
  onValueChange={(val) => {
    setState(val as keyof StateType);
    setDistrict(STATES[val as keyof StateType][0]);
  }}
  style={styles.picker}
>
  {Object.keys(STATES).map((s) => (
    <Picker.Item
      key={s}
      label={t(`states.${s.replace(/\s+/g, '')}`)} // ✅ Translated state name
      value={s}
    />
  ))}
</Picker>

<Text style={styles.label}>{t('register.district')}</Text>
<Picker
  selectedValue={district}
  onValueChange={(val) => setDistrict(val)}
  style={styles.picker}
>
  {(STATES[state] || []).map((d) => (
    <Picker.Item
      key={d}
      label={t(`districts.${state.replace(/\s+/g, '')}.${d}`)} // ✅ Translated district name
      value={d}
    />
  ))}
</Picker>


      <TouchableOpacity style={styles.certificateButton} onPress={pickCertificate}>
        <Text style={styles.certificateButtonText}>
          {certificate ? t('register.certificateSelected') : t('register.uploadCertificate')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('register.button')}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/login')}>
        <Text style={styles.registerText}>{t('register.alreadyRegistered')}</Text>
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
