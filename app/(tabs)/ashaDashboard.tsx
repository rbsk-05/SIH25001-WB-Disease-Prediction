// app/(tabs)/Dashboard.tsx
import React, { useState } from 'react';
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


const Tab = createBottomTabNavigator();

// ----- HEALTH DASHBOARD -----
function HealthDashboard() {
  const [houseId, setHouseId] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [sanitation, setSanitation] = useState('');
  const [symptoms, setSymptoms] = useState<any>({});
  const [symptomSeverity, setSymptomSeverity] = useState<any>({});
  const [waterSources, setWaterSources] = useState([{ name: '', type: '' }]);

  const symptomList = [
    'Diarrhea ',
    'Fatigue ',
    'Vomiting ',
    'Fever ',
    'Jaundice ',
    'Headache ',
    'Loss of Appetite ',
    'Muscle Aches ',
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

  const handleWaterSourceChange = (
  index: number,
  field: "name" | "type",  // restrict to known keys
  value: string
) => {
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
    alert('Form Submitted Successfully!');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Health Data Collection</Text>

      <Text style={styles.label}>House ID</Text>
      <TextInput style={styles.input} placeholder="Enter House ID" value={houseId} onChangeText={setHouseId} />

      <Text style={styles.label}>Age</Text>
      <TextInput style={styles.input} placeholder="Enter Age" keyboardType="numeric" value={age} onChangeText={setAge} />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={gender} onValueChange={(itemValue) => setGender(itemValue)} style={styles.picker}>
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>

      <Text style={styles.label}>Sanitation Level</Text>
      <View style={styles.radioGroup}>
        {['Poor ', 'Good '].map((level) => (
          <TouchableOpacity key={level} style={styles.radioOption} onPress={() => setSanitation(level)}>
            <View style={styles.radioCircle}>{sanitation === level && <View style={styles.selectedRb} />}</View>
            <Text style={styles.radioText}>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Symptoms</Text>
      {symptomList.map((symptom) => (
        <View key={symptom} style={styles.symptomBlock}>
          <View style={styles.checkboxRow}>
            <Checkbox value={symptoms[symptom] || false} onValueChange={() => toggleSymptom(symptom)} />
            <Text style={styles.checkboxLabel}>{symptom}</Text>
          </View>

          {(symptom === 'Diarrhea ' || symptom === 'Fatigue ') && symptoms[symptom] && (
            <View style={styles.radioGroup}>
              {['Mild ', 'Severe '].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={styles.radioOption}
                  onPress={() => setSymptomSeverity({ ...symptomSeverity, [symptom]: level })}
                >
                  <View style={styles.radioCircle}>{symptomSeverity[symptom] === level && <View style={styles.selectedRb} />}</View>
                  <Text style={styles.radioText}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}

      <Text style={styles.label}>Water Sources</Text>
      {waterSources.map((source, index) => (
        <View key={index} style={styles.waterSource}>
          <TextInput
            style={styles.input}
            placeholder="Water Source Name"
            value={source.name}
            onChangeText={(text) => handleWaterSourceChange(index, 'name', text)}
          />
          <View style={styles.dropdownWrapper}>
            <Picker
              selectedValue={source.type}
              style={styles.dropdown}
              onValueChange={(itemValue) => handleWaterSourceChange(index, 'type', itemValue)}
            >
              <Picker.Item label="Select Water Source Type" value="" />
              {waterSourceTypes.map((type) => (
                <Picker.Item key={type} label={type} value={type} />
              ))}
            </Picker>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addWaterSource}>
        <Text style={styles.addButtonText}>+ Add Water Source</Text>
      </TouchableOpacity>

      <Button title="Submit" onPress={handleSubmit} />
    </ScrollView>
  );
}

// ----- WATER DASHBOARD -----
// ---------- WATER DASHBOARD ----------
function WaterDashboard() {
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
    alert('Water Data Submitted Successfully!');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Water Quality Data Collection</Text>

      <Text style={styles.label}>Water Source Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Water Source Name"
        value={waterSourceName}
        onChangeText={setWaterSourceName}
      />

      <Text style={styles.label}>Water Source Type</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={waterSourceType}
          onValueChange={(itemValue) => setWaterSourceType(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Water Source Type" value="" />
          {waterSourceTypes.map((type) => (
            <Picker.Item key={type} label={type} value={type} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Rainfall (24hrs in mm)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Rainfall"
        keyboardType="numeric"
        value={rainfall}
        onChangeText={setRainfall}
      />

      <Text style={styles.label}>Temperature (°C)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Temperature"
        keyboardType="numeric"
        value={temperature}
        onChangeText={setTemperature}
      />

      <Text style={styles.label}>Dissolved Oxygen (mg/L)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Dissolved Oxygen"
        keyboardType="numeric"
        value={dissolvedOxygen}
        onChangeText={setDissolvedOxygen}
      />

      <Text style={styles.label}>Chlorine (mg/L)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Chlorine"
        keyboardType="numeric"
        value={chlorine}
        onChangeText={setChlorine}
      />

      <Text style={styles.label}>Month</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={month}
          onValueChange={(itemValue) => setMonth(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Month" value="" />
          {months.map((m) => (
            <Picker.Item key={m} label={m} value={m} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Fecal Coliform (MPN)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Fecal Coliform"
        keyboardType="numeric"
        value={fecalColiform}
        onChangeText={setFecalColiform}
      />

      <Text style={styles.label}>Season</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={season}
          onValueChange={(itemValue) => setSeason(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Season" value="" />
          {seasons.map((s) => (
            <Picker.Item key={s} label={s} value={s} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>pH</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter pH"
        keyboardType="numeric"
        value={ph}
        onChangeText={setPh}
      />

      <Text style={styles.label}>Turbidity (NTU)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Turbidity"
        keyboardType="numeric"
        value={turbidity}
        onChangeText={setTurbidity}
      />

      <Text style={styles.label}>Number of Persons with Symptoms</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Number of Persons"
        keyboardType="numeric"
        value={personsWithSymptoms}
        onChangeText={setPersonsWithSymptoms}
      />

      <Button title="Submit" onPress={handleSubmit} />
    </ScrollView>
  );
}



// ----- PROFILE DASHBOARD -----
function ProfileDashboard() {
  const auth = getAuth();
  const user = auth.currentUser;

  const [email] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ Password reset with verification
  const handlePasswordReset = async () => {
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match!");
      return;
    }

    try {
      if (user && currentPassword) {
        const credential = EmailAuthProvider.credential(
          user.email!,
          currentPassword
        );

        // First re-authenticate with current password
        await reauthenticateWithCredential(user, credential);

        // Then update password
        await updatePassword(user, newPassword);

        setSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError("Please enter your current password.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    }
  };

  // ✅ Logout and redirect to login
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login"); // 👈 Your login file
    } catch (err: any) {
      setError(err.message || "Logout failed.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {/* Show messages */}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      {/* Email */}
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} editable={false} />

      {/* Reset Password */}
      <Text style={styles.sectionTitle}>Reset Password</Text>

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

      <TouchableOpacity style={styles.saveButton} onPress={handlePasswordReset}>
        <Text style={styles.saveButtonText}>Reset Password</Text>
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
