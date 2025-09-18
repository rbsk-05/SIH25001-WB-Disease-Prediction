// app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { router } from 'expo-router';

export default function Index() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // User not found in Firestore → log out and go to login
            await auth.signOut();
            router.replace('/auth/login');
            return;
          }

          const userData = userDoc.data();
          const role = userData?.role;
          const isVerified = userData?.isVerified;

          if (!isVerified) {
            // Not verified → go to login
            router.replace('/auth/login');
            return;
          }

          // Role-based routing
          if (role === 'asha_worker') {
            router.replace('/tabs/index'); // ASHA Worker Dashboard
          } else if (role === 'gov_official') {
            router.replace('/tabs/index'); // Government Official Dashboard
          } else {
            router.replace('/auth/login'); // Invalid role
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          router.replace('/auth/login');
        }
      } else {
        // No user logged in → go to login
        router.replace('/auth/login');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Checking authentication...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 15,
    fontSize: 16,
    color: '#000',
  },
});
