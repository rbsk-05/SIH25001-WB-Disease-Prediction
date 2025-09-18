import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GovHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, Government Official!</Text>
      <Text style={styles.subtitle}>You can now view reports and track outbreaks in your district.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 15 },
  subtitle: { fontSize: 16, color: '#000', textAlign: 'center' },
});
