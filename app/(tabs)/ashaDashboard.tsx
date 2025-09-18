// app/tabs/ashaDashboard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ASHADashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome, ASHA Worker!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 22, color: '#000' },
});
