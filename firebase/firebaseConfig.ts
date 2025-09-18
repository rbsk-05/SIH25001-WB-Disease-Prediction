import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 

const firebaseConfig = {
  apiKey: "AIzaSyC6pNVgbv6KLkeKg19W_9co8FPztkbemrc",
  authDomain: "sih-wb.firebaseapp.com",
  projectId: "sih-wb",
  storageBucket: "sih-wb.firebasestorage.app",
  messagingSenderId: "765350824746",
  appId: "1:765350824746:web:49701da869723d2bcb2c53",
  measurementId: "G-S29YXVKMF4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);