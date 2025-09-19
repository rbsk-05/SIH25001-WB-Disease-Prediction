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
    'diarrhea',
    'fatigue',
    'vomiting',
    'fever',
    'jaundice',
    'headache',
    'loss_of_appetite',
    'muscle_aches',
  ];

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

  const toggleSymptom = (symptom: string) => {
    setSymptoms({ ...symptoms, [symptom]: !symptoms[symptom] });
    if (!symptoms[symptom]) setSymptomSeverity({ ...symptomSeverity, [symptom]: '' });
  };

  const handleWaterSourceChange = (index: number, field: 'name' | 'type', value: string) => {
    const newSources = [...waterSources];
    newSources[index][field] = value;
    setWaterSources(newSources);
  };

  const addWaterSource = () => setWaterSources([...waterSources, { name: '', type: '' }]);

  const handleSubmit = () => {
    const formData = {
      houseId,
      age,
      gender,
      sanitation,
      symptoms,
      symptomSeverity,
      waterSources,
    };
    console.log('Form submitted:', formData);
    alert(t('messages.formSubmitted'));
  };

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

  const handleSubmit = () => {
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
    };
    console.log('Water data submitted:', data);
    alert(t('messages.formSubmitted'));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('water.title')}</Text>

      <Text style={styles.label}>{t('water.waterSourceName')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('placeholders.waterSourceName')}
        value={waterSourceName}
        onChangeText={setWaterSourceName}
      />

      <Text style={styles.label}>{t('water.waterSourceType')}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={waterSourceType}
          onValueChange={(val) => setWaterSourceType(val)}
          style={styles.picker}
        >
          <Picker.Item label={t('placeholders.selectWaterSourceType')} value="" />
          {waterSourceTypes.map((type) => (
            <Picker.Item key={type} label={t(`waterSources.${type}`)} value={type} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>{t('water.rainfall')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('placeholders.rainfall')}
        keyboardType="numeric"
        value={rainfall}
        onChangeText={setRainfall}
      />

      <Text style={styles.label}>{t('water.temperature')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('placeholders.temperature')}
        keyboardType="numeric"
        value={temperature}
        onChangeText={setTemperature}
      />

      <Text style={styles.label}>{t('water.dissolvedOxygen')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('placeholders.dissolvedOxygen')}
        keyboardType="numeric"
        value={dissolvedOxygen}
        onChangeText={setDissolvedOxygen}
      />

      <Text style={styles.label}>{t('water.chlorine')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('placeholders.chlorine')}
        keyboardType="numeric"
        value={chlorine}
        onChangeText={setChlorine}
      />

      <Text style={styles.label}>{t('water.month')}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={month}
          onValueChange={(val) => setMonth(val)}
          style={styles.picker}
        >
          <Picker.Item label={t('placeholders.selectMonth')} value="" />
          {months.map((m) => (
            <Picker.Item key={m} label={t(`months.${m}`)} value={m} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>{t('water.fecalColiform')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('placeholders.fecalColiform')}
        keyboardType="numeric"
        value={fecalColiform}
        onChangeText={setFecalColiform}
      />

      <Text style={styles.label}>{t('water.season')}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={season}
          onValueChange={(val) => setSeason(val)}
          style={styles.picker}
        >
          <Picker.Item label={t('placeholders.selectSeason')} value="" />
          {seasons.map((s) => (
            <Picker.Item key={s} label={t(`seasons.${s}`)} value={s} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>{t('water.ph')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('placeholders.ph')}
        keyboardType="numeric"
        value={ph}
        onChangeText={setPh}
      />

      <Text style={styles.label}>{t('water.turbidity')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('placeholders.turbidity')}
        keyboardType="numeric"
        value={turbidity}
        onChangeText={setTurbidity}
      />

      <Text style={styles.label}>{t('water.personsWithSymptoms')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('placeholders.personsWithSymptoms')}
        keyboardType="numeric"
        value={personsWithSymptoms}
        onChangeText={setPersonsWithSymptoms}
      />

      <Button title={t('buttons.submit')} onPress={handleSubmit} />
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

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setState(data.state || "");
          setDistrict(data.district || "");
        }
      }
    };
    fetchUserData();
  }, []);

  // Update password and/or state/district with verification
  const handleUpdateProfile = async () => {
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Please enter your current password to confirm changes.");
      return;
    }

    try {
      if (user) {
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update password if entered
        if (newPassword || confirmPassword) {
          if (newPassword !== confirmPassword) {
            setError("New passwords do not match!");
            return;
          }
          await updatePassword(user, newPassword);
          setNewPassword("");
          setConfirmPassword("");
        }

        // Update state and district
        await updateDoc(doc(db, 'users', user.uid), {
          state,
          district,
        });

        setSuccess("Profile updated successfully!");
        setCurrentPassword("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login");
    } catch (err: any) {
      setError(err.message || "Logout failed.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      {/* Email */}
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} editable={false} />

      {/* State & District Dropdown */}
      <Text style={styles.sectionTitle}>Location</Text>

      <Text style={styles.label}>State</Text>
      <Picker selectedValue={state} onValueChange={(val) => {
        setState(val);
        setDistrict(""); // Reset district on state change
      }} style={styles.picker}>
        <Picker.Item label="Select State" value="" />
        {Object.keys(stateDistrictMap).map((s) => (
          <Picker.Item key={s} label={s} value={s} />
        ))}
      </Picker>

      <Text style={styles.label}>District</Text>
      <Picker selectedValue={district} onValueChange={setDistrict} style={styles.picker}>
        <Picker.Item label="Select District" value="" />
        {state && stateDistrictMap[state].map((d) => (
          <Picker.Item key={d} label={d} value={d} />
        ))}
      </Picker>

      {/* Password Section */}
      <Text style={styles.sectionTitle}>Reset Password (Optional)</Text>

      <Text style={styles.label}>Current Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder="Enter current password"
      />

      <Text style={styles.label}>New Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="Enter new password"
      />

      <Text style={styles.label}>Confirm New Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm new password"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ----- EXPORT TAB NAVIGATOR (NO NavigationContainer!) -----
export default function DashboardTabs() {
  return (
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
