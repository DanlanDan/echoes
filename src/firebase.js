import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAR_Xd-5hyEZ1R5IialgWU8rZrLmiFYjfo",
  authDomain: "echoes-a2697.firebaseapp.com",
  projectId: "echoes-a2697",
  storageBucket: "echoes-a2697.firebasestorage.app",
  messagingSenderId: "883654479012",
  appId: "1:883654479012:web:16c44b0d43f9daf0ad6a31",
  measurementId: "G-B9W1LELEXR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// --- THIS IS THE CRITICAL PART ---
// We explicitly export these so App.jsx can use them!
export const auth = getAuth(app);
export const db = getFirestore(app);