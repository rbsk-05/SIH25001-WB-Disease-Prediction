// app/(tabs)/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Checkbox from 'expo-checkbox';
import { Picker } from '@react-native-picker/picker';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  getAuth,
  updatePassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig'; // your Firestore config
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';



const Tab = createBottomTabNavigator();

// ----- HEALTH DASHBOARD -----
function HealthDashboard() {
  const { t } = useTranslation();

  const [houseId, setHouseId] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [sanitation, setSanitation] = useState('');
  const [symptoms, setSymptoms] = useState<any>({});
  const [symptomSeverity, setSymptomSeverity] = useState<any>({});
  const [waterSources, setWaterSources] = useState([{ name: '', type: '' }]);

  const symptomList = [
    'diarrhea', 'fatigue', 'vomiting', 'fever',
    'jaundice', 'headache', 'loss_of_appetite', 'muscle_aches',
  ];

  const waterSourceTypes = [
    'deep_borehole', 'piped_protected', 'community_tank', 'shallow_well',
    'spring', 'river', 'pond', 'reservoir', 'canal', 'rooftop_rainwater', 'open_catchment',
  ];

  const SUBMISSIONS_KEY = 'health_submissions';
  const BACKEND_URL = 'http://172.16.8.28:5000/submit'; // replace with your IPv4

  // On mount: log cached count and set up network listener for auto-sync
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SUBMISSIONS_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        if (arr.length > 0) console.log(`⚠️ ${arr.length} cached health submissions found`);
      } catch (e) {
        console.error('Error reading cached submissions', e);
      }
    })();

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        console.log('📶 Network connected. Attempting to sync cached forms...');
        trySyncCachedSubmissions();
      }
    });

    return () => unsubscribe();
  }, []);

  // Toggle symptom checkbox
  const toggleSymptom = (symptom: string) => {
    setSymptoms({ ...symptoms, [symptom]: !symptoms[symptom] });
    if (!symptoms[symptom]) setSymptomSeverity({ ...symptomSeverity, [symptom]: '' });
  };

  // Handle water source changes
  const handleWaterSourceChange = (index: number, field: 'name' | 'type', value: string) => {
    const newSources = [...waterSources];
    newSources[index][field] = value;
    setWaterSources(newSources);
  };
  const addWaterSource = () => setWaterSources([...waterSources, { name: '', type: '' }]);

  // Cache form locally
  const cacheFormLocally = async (formData: any) => {
    try {
      const raw = await AsyncStorage.getItem(SUBMISSIONS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push({ ...formData, timestamp: new Date().toISOString(), synced: false });
      await AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(arr));
      console.log('✅ Cached form locally. Total cached:', arr.length);
    } catch (err) {
      console.error('Failed to cache form locally', err);
      throw err;
    }
  };

  // Sync all unsynced forms
  const trySyncCachedSubmissions = async () => {
    try {
      const raw = await AsyncStorage.getItem(SUBMISSIONS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const unsynced = arr.filter((item: any) => !item.synced);
      if (unsynced.length === 0) return;

      console.log(`🔄 Syncing ${unsynced.length} cached form(s)...`);

      for (const form of unsynced) {
        const response = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Form synced:', result);
          form.synced = true;
        } else {
          console.error('❌ Failed to sync form:', response.status);
        }
      }

      await AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(arr));
    } catch (err) {
      console.error('❌ Error syncing cached submissions:', err);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    const formData = { houseId, age, gender, sanitation, symptoms, symptomSeverity, waterSources };

    try {
      // Cache locally
      await cacheFormLocally(formData);

      const net = await NetInfo.fetch();
      if (net.isConnected) {
        console.log('📶 Device online. Sending to backend...');
        const response = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) console.error('❌ Backend returned error status:', response.status);
        else {
          const result = await response.json();
          console.log('✅ Backend response:', result);
          // Mark this form as synced locally
          const raw = await AsyncStorage.getItem(SUBMISSIONS_KEY);
          const arr = raw ? JSON.parse(raw) : [];
          arr[arr.length - 1].synced = true;
          await AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(arr));
        }
      } else {
        console.log('📴 Device offline. Data saved locally and will sync later.');
      }

      alert(t('messages.formSubmitted'));
    } catch (err) {
      console.error('❌ Error submitting form:', err);
      alert(t('errors.somethingWentWrong') || 'Failed to save form locally.');
    }
  };

  // --- Render form (unchanged) ---
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('health.title')}</Text>

      <Text style={styles.label}>{t('health.houseId')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('placeholders.houseId')}
        value={houseId}
        onChangeText={setHouseId}
      />

      <Text style={styles.label}>{t('health.age')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('placeholders.age')}
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
      />

      <Text style={styles.label}>{t('health.gender')}</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={gender} onValueChange={(val) => setGender(val)} style={styles.picker}>
          <Picker.Item label={t('placeholders.selectGender')} value="" />
          <Picker.Item label={t('gender.male')} value="male" />
          <Picker.Item label={t('gender.female')} value="female" />
          <Picker.Item label={t('gender.other')} value="other" />
        </Picker>
      </View>

      <Text style={styles.label}>{t('health.sanitation')}</Text>
      <View style={styles.radioGroup}>
        {['poor', 'good'].map((level) => (
          <TouchableOpacity key={level} style={styles.radioOption} onPress={() => setSanitation(level)}>
            <View style={styles.radioCircle}>{sanitation === level && <View style={styles.selectedRb} />}</View>
            <Text style={styles.radioText}>{t(`sanitation.${level}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('health.symptoms')}</Text>
      {symptomList.map((symptom) => (
        <View key={symptom} style={styles.symptomBlock}>
          <View style={styles.checkboxRow}>
            <Checkbox value={symptoms[symptom] || false} onValueChange={() => toggleSymptom(symptom)} />
            <Text style={styles.checkboxLabel}>{t(`symptoms.${symptom}`)}</Text>
          </View>

          {(symptom === 'diarrhea' || symptom === 'fatigue') && symptoms[symptom] && (
            <View style={styles.radioGroup}>
              {['mild', 'severe'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={styles.radioOption}
                  onPress={() => setSymptomSeverity({ ...symptomSeverity, [symptom]: level })}
                >
                  <View style={styles.radioCircle}>
                    {symptomSeverity[symptom] === level && <View style={styles.selectedRb} />}
                  </View>
                  <Text style={styles.radioText}>{t(`severity.${level}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}

      <Text style={styles.label}>{t('health.waterSources')}</Text>
      {waterSources.map((source, index) => (
        <View key={index} style={styles.waterSource}>
          <TextInput
            style={styles.input}
            placeholder={t('placeholders.waterSourceName')}
            value={source.name}
            onChangeText={(text) => handleWaterSourceChange(index, 'name', text)}
          />
          <View style={styles.dropdownWrapper}>
            <Picker
              selectedValue={source.type}
              style={styles.dropdown}
              onValueChange={(val) => handleWaterSourceChange(index, 'type', val)}
            >
              <Picker.Item label={t('placeholders.selectWaterSourceType')} value="" />
              {waterSourceTypes.map((type) => (
                <Picker.Item key={type} label={t(`waterSources.${type}`)} value={type} />
              ))}
            </Picker>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addWaterSource}>
        <Text style={styles.addButtonText}>+ {t('health.addWaterSource')}</Text>
      </TouchableOpacity>

      <Button title={t('buttons.submit')} onPress={handleSubmit} />
    </ScrollView>
  );
}



// ----- WATER DASHBOARD -----
function WaterDashboard() {
  const { t } = useTranslation();

  const [waterSourceName, setWaterSourceName] = useState('');
  const [waterSourceType, setWaterSourceType] = useState('');
  const [rainfall, setRainfall] = useState('');
  const [temperature, setTemperature] = useState('');
  const [dissolvedOxygen, setDissolvedOxygen] = useState('');
  const [chlorine, setChlorine] = useState('');
  const [month, setMonth] = useState('');
  const [fecalColiform, setFecalColiform] = useState('');
  const [season, setSeason] = useState('');
  const [ph, setPh] = useState('');
  const [turbidity, setTurbidity] = useState('');
  const [personsWithSymptoms, setPersonsWithSymptoms] = useState('');

  // New fields
  const [hardness, setHardness] = useState('');
  const [nitrate, setNitrate] = useState('');
  const [tds, setTds] = useState('');

  const waterSourceTypes = [
    'deep_borehole',
    'piped_protected',
    'community_tank',
    'shallow_well',
    'spring',
    'river',
    'pond',
    'reservoir',
    'canal',
    'rooftop_rainwater',
    'open_catchment',
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const seasons = ['Winter', 'Summer', 'Autumn', 'Rain'];

  const WATER_SUBMISSIONS_KEY = "waterForms"; // AsyncStorage key
const BACKEND_URL = "http://192.168.137.23:5000/water/submit";

const handleSubmit = async () => {
  const data = {
    waterSourceName,
    waterSourceType,
    rainfall,
    temperature,
    dissolvedOxygen,
    chlorine,
    month,
    fecalColiform,
    season,
    ph,
    turbidity,
    personsWithSymptoms,
    hardness,
    nitrate,
    tds,
  };

  try {
    const res = await fetch("http://192.168.137.23:5000/water/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      console.log("✅ Water form saved:", result);
      alert("Water form submitted successfully!");

      // Reset form fields
      setWaterSourceName(""); setWaterSourceType(""); setRainfall(""); setTemperature("");
      setDissolvedOxygen(""); setChlorine(""); setMonth(""); setFecalColiform("");
      setSeason(""); setPh(""); setTurbidity(""); setPersonsWithSymptoms("");
      setHardness(""); setNitrate(""); setTds("");
    } else {
      console.error("❌ Backend returned error status:", res.status);
      alert("Failed to submit water form. Try again.");
    }
  } catch (err) {
    console.error("❌ Error submitting water form:", err);
    alert("Error submitting water form. Check console for details.");
  }
};





  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("water.title")}</Text>

      <Text style={styles.label}>{t("water.waterSourceName")}</Text>
      <TextInput style={styles.input} placeholder={t("placeholders.waterSourceName")} value={waterSourceName} onChangeText={setWaterSourceName} />

      <Text style={styles.label}>{t("water.waterSourceType")}</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={waterSourceType} onValueChange={setWaterSourceType} style={styles.picker}>
          <Picker.Item label={t("placeholders.selectWaterSourceType")} value="" />
          {waterSourceTypes.map(type => <Picker.Item key={type} label={t(`waterSources.${type}`)} value={type} />)}
        </Picker>
      </View>

      {[
        { label: t("water.rainfall"), value: rainfall, setter: setRainfall },
        { label: t("water.temperature"), value: temperature, setter: setTemperature },
        { label: t("water.dissolvedOxygen"), value: dissolvedOxygen, setter: setDissolvedOxygen },
        { label: t("water.chlorine"), value: chlorine, setter: setChlorine },
        { label: t("water.fecalColiform"), value: fecalColiform, setter: setFecalColiform },
        { label: t("water.ph"), value: ph, setter: setPh },
        { label: t("water.turbidity"), value: turbidity, setter: setTurbidity },
        { label: t("water.personsWithSymptoms"), value: personsWithSymptoms, setter: setPersonsWithSymptoms },
        { label: t("water.hardness"), value: hardness, setter: setHardness },
        { label: t("water.nitrate"), value: nitrate, setter: setNitrate },
        { label: t("water.tds"), value: tds, setter: setTds },
      ].map(({ label, value, setter }) => (
        <React.Fragment key={label}>
          <Text style={styles.label}>{label}</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={value} onChangeText={setter} />
        </React.Fragment>
      ))}

      <Text style={styles.label}>{t("water.month")}</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={month} onValueChange={setMonth} style={styles.picker}>
          <Picker.Item label={t("placeholders.selectMonth")} value="" />
          {months.map(m => <Picker.Item key={m} label={t(`months.${m}`)} value={m} />)}
        </Picker>
      </View>

      <Text style={styles.label}>{t("water.season")}</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={season} onValueChange={setSeason} style={styles.picker}>
          <Picker.Item label={t("placeholders.selectSeason")} value="" />
          {seasons.map(s => <Picker.Item key={s} label={t(`seasons.${s}`)} value={s} />)}
        </Picker>
      </View>

      <Button title={t("buttons.submit")} onPress={handleSubmit} />
    </ScrollView>
  );
}


const stateDistrictMap: Record<string, string[]> = {
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat", "Ziro", "Bomdila"],
  "Assam": ["Guwahati", "Dispur", "Jorhat", "Silchar", "Dibrugarh"],
  "Manipur": ["Imphal", "Thoubal", "Churachandpur", "Bishnupur", "Senapati"],
  "Meghalaya": ["Shillong", "Tura", "Nongpoh", "Jowai", "Williamnagar"],
  "Mizoram": ["Aizawl", "Lunglei", "Serchhip", "Champhai", "Saiha"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Mon", "Tuensang"],
  "Sikkim": ["Gangtok", "Namchi", "Geyzing", "Mangan", "Ravangla"],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar", "Belonia"]
};
// ----- PROFILE DASHBOARD -----
function ProfileDashboard() {
  const { t } = useTranslation();
  const auth = getAuth();
  const user = auth.currentUser;

  const [email] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setState(data.state || "");
          setDistrict(data.district || "");
        }
      }
    };
    fetchUserData();
  }, []);

  const handleUpdateProfile = async () => {
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError(t("profile.enterCurrentPassword"));
      return;
    }

    try {
      if (user) {
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);

        if (newPassword || confirmPassword) {
          if (newPassword !== confirmPassword) {
            setError(t("profile.passwordMismatch"));
            return;
          }
          await updatePassword(user, newPassword);
          setNewPassword("");
          setConfirmPassword("");
        }

        await updateDoc(doc(db, "users", user.uid), { state, district });
        setSuccess(t("profile.updateSuccess"));
        setCurrentPassword("");
      }
    } catch (err: any) {
      setError(err.message || t("profile.updateFailed"));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login");
    } catch (err: any) {
      setError(err.message || t("profile.logoutFailed"));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("profile.title")}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      {/* Email */}
      <Text style={styles.label}>{t("profile.email")}</Text>
      <TextInput
        style={styles.input}
        value={email}
        editable={false}
        placeholder={t("profile.email")}
      />

      {/* Location */}
      <Text style={styles.sectionTitle}>{t("profile.location")}</Text>

      <Text style={styles.label}>{t("profile.state")}</Text>
      <Picker
        selectedValue={state}
        onValueChange={(val) => {
          setState(val);
          setDistrict("");
        }}
        style={styles.picker}
      >
        <Picker.Item label={t("profile.selectState")} value="" />
        {Object.keys(stateDistrictMap).map((s) => (
          <Picker.Item key={s} label={t(`states.${s}`) || s} value={s} />
        ))}
      </Picker>

      <Text style={styles.label}>{t("profile.district")}</Text>
      <Picker
        selectedValue={district}
        onValueChange={setDistrict}
        style={styles.picker}
      >
        <Picker.Item label={t("profile.selectDistrict")} value="" />
        {state &&
          stateDistrictMap[state].map((d) => (
            <Picker.Item key={d} label={t(`districts.${state}.${d}`) || d} value={d} />
          ))}
      </Picker>

      {/* Password */}
      <Text style={styles.sectionTitle}>{t("profile.resetPassword")}</Text>

      <Text style={styles.label}>{t("profile.currentPassword")}</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder={t("profile.enterCurrentPassword")}
      />

      <Text style={styles.label}>{t("profile.newPassword")}</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder={t("profile.enterNewPassword")}
      />

      <Text style={styles.label}>{t("profile.confirmPassword")}</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder={t("profile.confirmNewPassword")}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
        <Text style={styles.saveButtonText}>{t("profile.saveChanges")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t("profile.logout")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


// ----- EXPORT TAB NAVIGATOR (NO NavigationContainer!) -----
export default function DashboardTabs() {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);

  // Toggle between English and Hindi
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    setLanguage(newLang);
  };

  return (
    <>
      {/* Language toggle at the top */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 10, backgroundColor: '#fff' }}>
        <Button
          title={language === 'en' ? 'हिन्दी' : 'English'}
          onPress={toggleLanguage}
        />
      </View>

      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let iconName: any;
            if (route.name === 'Health') iconName = 'heart-outline';
            else if (route.name === 'Water') iconName = 'water-outline';
            else if (route.name === 'Profile') iconName = 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { height: 60, paddingBottom: 5 },
        })}
      >
        <Tab.Screen name="Health" component={HealthDashboard} />
        <Tab.Screen name="Water" component={WaterDashboard} />
        <Tab.Screen name="Profile" component={ProfileDashboard} />
      </Tab.Navigator>
    </>
  );
}


// ----- STYLES (same as before) -----
const styles = StyleSheet.create({
  container: { paddingTop: 20, paddingBottom: 100, paddingHorizontal: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 15 },
  radioGroup: { flexDirection: 'row', marginBottom: 15 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginRight: 20, marginBottom: 8, flexShrink: 1 },
  radioCircle: { height: 18, width: 18, borderRadius: 9, borderWidth: 2, borderColor: '#007AFF', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  selectedRb: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#007AFF' },
  radioText: { fontSize: 15, flexShrink: 1 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  checkboxLabel: { marginLeft: 8, fontSize: 15 },
  symptomBlock: { marginBottom: 12 },
  waterSource: { marginBottom: 15 },
  dropdownWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginTop: 6 },
  dropdown: { height: 50, width: '100%' },
  addButton: { marginBottom: 20, padding: 10, backgroundColor: '#007AFF', borderRadius: 5, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, overflow: 'hidden', marginBottom: 15 },
  picker: { height: 50, width: '100%', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18 },
  sectionTitle: {
  fontSize: 18,
  fontWeight: "700",
  marginTop: 20,
  marginBottom: 10,
},
saveButton: {
  backgroundColor: "#007AFF",
  padding: 12,
  borderRadius: 6,
  alignItems: "center",
  marginTop: 10,
},
saveButtonText: { color: "#fff", fontWeight: "bold" },
logoutButton: {
  marginTop: 30,
  padding: 12,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: "red",
  alignItems: "center",
},
logoutText: { color: "red", fontWeight: "bold" },  error: { color: "red", marginBottom: 15, textAlign: "center" },
  success: { color: "green", marginBottom: 15, textAlign: "center" }

});
